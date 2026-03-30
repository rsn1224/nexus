//! スタンバイメモリクリーナー本体

use std::process::Command;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tracing::{error, info, warn};

use crate::error::AppError;

use super::types::{MemoryCleanerConfig, MemoryCleanupResult};

/// スタンバイメモリクリーナー
#[derive(Clone)]
pub struct MemoryCleaner {
    config: MemoryCleanerConfig,
    is_running: bool,
    cancellation_token: Option<tokio_util::sync::CancellationToken>,
}

impl MemoryCleaner {
    pub fn new(config: MemoryCleanerConfig) -> Self {
        Self {
            config,
            is_running: false,
            cancellation_token: None,
        }
    }

    /// 設定を更新
    pub fn update_config(&mut self, config: MemoryCleanerConfig) {
        self.config = config;
    }

    /// 現在の設定を取得
    pub fn get_config(&self) -> &MemoryCleanerConfig {
        &self.config
    }

    /// 自動クリーニングを開始
    pub async fn start_auto_cleanup(&mut self, app: AppHandle) -> Result<(), AppError> {
        if self.is_running {
            return Ok(());
        }

        self.is_running = true;
        let token = tokio_util::sync::CancellationToken::new();
        self.cancellation_token = Some(token.clone());

        let config = self.config.clone();
        let app_clone = app.clone();

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(config.interval_seconds));

            loop {
                tokio::select! {
                    _ = interval.tick() => {
                        if !config.enabled {
                            continue;
                        }

                        if let Ok(should_cleanup) = Self::should_cleanup_memory(config.threshold_mb) {
                            if should_cleanup {
                                match Self::cleanup_standby_lists().await {
                                    Ok(result) => {
                                        info!("メモリ自動クリーニング実行: {}MB解放",
                                            result.freed_mb.unwrap_or(0));

                                        if let Err(e) = app_clone.emit("nexus://memory-cleanup-result", &result) {
                                            error!("メモリクリーニング結果の送信に失敗: {}", e);
                                        }
                                    }
                                    Err(e) => {
                                        warn!("メモリクリーニング失敗: {}", e);

                                        let error_result = MemoryCleanupResult {
                                            success: false,
                                            freed_mb: None,
                                            error: Some(e.to_string()),
                                            timestamp: std::time::SystemTime::now()
                                                .duration_since(std::time::UNIX_EPOCH)
                                                .unwrap_or_default()
                                                .as_secs(),
                                        };

                                        if let Err(e) = app_clone.emit("nexus://memory-cleanup-result", &error_result) {
                                            error!("メモリクリーニングエラーの送信に失敗: {}", e);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    _ = token.cancelled() => {
                        info!("メモリ自動クリーニングがキャンセルされました");
                        break;
                    }
                }
            }
        });

        info!(
            "メモリ自動クリーニングを開始 ({}秒間隔)",
            config.interval_seconds
        );
        Ok(())
    }

    /// 自動クリーニングを停止
    pub fn stop_auto_cleanup(&mut self) {
        if let Some(token) = &self.cancellation_token {
            token.cancel();
        }
        self.is_running = false;
        self.cancellation_token = None;
        info!("メモリ自動クリーニングを停止");
    }

    /// 手動メモリクリーニングを実行
    pub async fn manual_cleanup() -> Result<MemoryCleanupResult, AppError> {
        Self::cleanup_standby_lists().await
    }

    /// 空きメモリが閾値以下かチェック
    fn should_cleanup_memory(threshold_mb: u64) -> Result<bool, AppError> {
        let output = Command::new("powershell")
            .args([
                "-Command",
                "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object -ExpandProperty FreePhysicalMemory"
            ])
            .output()
            .map_err(|e| AppError::Command(format!("PowerShell実行エラー: {}", e)))?;

        if !output.status.success() {
            return Err(AppError::Command("空きメモリ取得失敗".to_string()));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);

        if let Ok(free_kb) = stdout.trim().parse::<u64>() {
            let free_mb = free_kb / 1024;
            return Ok(free_mb <= threshold_mb);
        }

        Err(AppError::Command("空きメモリの解析に失敗".to_string()))
    }

    /// スタンバイリストをクリーニング
    async fn cleanup_standby_lists() -> Result<MemoryCleanupResult, AppError> {
        let start_time = std::time::SystemTime::now();
        let start_memory = Self::get_available_memory()?;

        let result = Command::new("powershell")
            .args([
                "-Command",
                "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices;
                public class Memory {
                    [DllImport(\"psapi.dll\")]
                    public static extern int EmptyWorkingSet(IntPtr hProcess);
                    [DllImport(\"kernel32.dll\")]
                    public static extern IntPtr GetCurrentProcess();
                }
                [Memory]::EmptyWorkingSet([Memory]::GetCurrentProcess());'",
            ])
            .output()
            .map_err(|e| AppError::Command(format!("PowerShell実行エラー: {}", e)))?;

        let end_memory = Self::get_available_memory()?;
        let freed_mb = if end_memory > start_memory {
            Some(end_memory - start_memory)
        } else {
            None
        };

        let timestamp = start_time
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Ok(MemoryCleanupResult {
            success: result.status.success(),
            freed_mb,
            error: if result.status.success() {
                None
            } else {
                Some(String::from_utf8_lossy(&result.stderr).to_string())
            },
            timestamp,
        })
    }

    /// 利用可能なメモリを取得（MB）
    #[cfg(windows)]
    fn get_available_memory() -> Result<u64, AppError> {
        let output = Command::new("powershell")
            .args([
                "-Command",
                "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object -ExpandProperty FreePhysicalMemory"
            ])
            .output()
            .map_err(|e| AppError::Command(format!("PowerShell実行エラー: {}", e)))?;

        if !output.status.success() {
            return Err(AppError::Command("空きメモリ取得失敗".to_string()));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);

        if let Ok(free_kb) = stdout.trim().parse::<u64>() {
            return Ok(free_kb / 1024);
        }

        Err(AppError::Command("空きメモリの解析に失敗".to_string()))
    }

    #[cfg(not(windows))]
    fn get_available_memory() -> Result<u64, AppError> {
        Err(AppError::Command("Windows 専用機能です".to_string()))
    }
}
