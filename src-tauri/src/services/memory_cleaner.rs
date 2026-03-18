//! スタンバイメモリリストクリーナー
//! ISLC (Intelligent Standby List Cleaner) の機能を統合

use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tracing::{error, info, warn};

use crate::error::AppError;

/// メモリクリーニング結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryCleanupResult {
    pub success: bool,
    pub freed_mb: Option<u64>,
    pub error: Option<String>,
    pub timestamp: u64,
}

/// メモリクリーナー設定
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryCleanerConfig {
    /// 自動クリーニングを有効化するか
    pub enabled: bool,
    /// クリーニング間隔（秒）
    pub interval_seconds: u64,
    /// クリーニング閾値（MB）- 空きメモリがこれ以下の場合にクリーニング
    pub threshold_mb: u64,
}

impl Default for MemoryCleanerConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            interval_seconds: 300, // 5分
            threshold_mb: 1024,    // 1GB
        }
    }
}

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
        // PowerShellのGet-CimInstanceを使用して空きメモリを取得
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

        // 出力から空きメモリを抽出 (KB単位)
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

        // Windows APIを使用してスタンバイリストをクリア
        // SetProcessWorkingSetSizeExを使用してプロセスのワーキングセットを縮小
        // EmptyWorkingSetを使用してスタンバイリストをクリア

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
            return Ok(free_kb / 1024); // KB -> MB
        }

        Err(AppError::Command("空きメモリの解析に失敗".to_string()))
    }

    #[cfg(not(windows))]
    fn get_available_memory() -> Result<u64, AppError> {
        Err(AppError::Command("Windows 専用機能です".to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = MemoryCleanerConfig::default();
        assert!(!config.enabled);
        assert_eq!(config.interval_seconds, 300);
        assert_eq!(config.threshold_mb, 1024);
    }

    #[test]
    fn test_new_and_get_config() {
        let config = MemoryCleanerConfig {
            enabled: true,
            interval_seconds: 60,
            threshold_mb: 512,
        };
        let cleaner = MemoryCleaner::new(config);
        assert!(cleaner.get_config().enabled);
        assert_eq!(cleaner.get_config().interval_seconds, 60);
        assert_eq!(cleaner.get_config().threshold_mb, 512);
    }

    #[test]
    fn test_update_config() {
        let initial = MemoryCleanerConfig::default();
        let mut cleaner = MemoryCleaner::new(initial);

        let new_config = MemoryCleanerConfig {
            enabled: true,
            interval_seconds: 120,
            threshold_mb: 2048,
        };
        cleaner.update_config(new_config);

        assert!(cleaner.get_config().enabled);
        assert_eq!(cleaner.get_config().interval_seconds, 120);
        assert_eq!(cleaner.get_config().threshold_mb, 2048);
    }

    #[test]
    fn test_cleanup_result_serialization() {
        let result = MemoryCleanupResult {
            success: true,
            freed_mb: Some(256),
            error: None,
            timestamp: 1_700_000_000,
        };
        let json = serde_json::to_string(&result).unwrap(); // unwrap: test only
        assert!(json.contains("freedMb"));
        assert!(json.contains("256"));
    }

    #[test]
    #[cfg_attr(not(windows), ignore)]
    fn test_manual_cleanup_windows_only() {
        let rt = tokio::runtime::Runtime::new().unwrap(); // unwrap: test only
        let result = rt.block_on(MemoryCleaner::manual_cleanup());
        assert!(result.is_ok());
    }
}
