//! 一時ファイルスキャン機能

use crate::error::AppError;
use std::fs;
use std::path::Path;
use tracing::{info, warn};

use super::types::{CleanupItem, CleanupScanResult};

/// スキャン対象ディレクトリ
pub(super) const TEMP_DIRS: &[&str] = &[
    "%TEMP%",                     // ユーザー一時フォルダ
    "%LOCALAPPDATA%\\Temp",       // ローカルアプリ一時
    "%WINDIR%\\Temp",             // Windows 一時
    "%LOCALAPPDATA%\\CrashDumps", // クラッシュダンプ
];

/// スキャン対象拡張子（安全に削除可能なもののみ）
pub(super) const SAFE_EXTENSIONS: &[&str] = &["tmp", "log", "bak", "old", "dmp", "etl"];

/// 環境変数を展開したパスを取得
pub(crate) fn expand_env_path(path: &str) -> std::path::PathBuf {
    #[cfg(windows)]
    {
        use std::env;
        env::var("TEMP")
            .map(|temp| {
                path.replace("%TEMP%", &temp)
                    .replace(
                        "%LOCALAPPDATA%",
                        &env::var("LOCALAPPDATA").unwrap_or_default(),
                    )
                    .replace("%WINDIR%", &env::var("WINDIR").unwrap_or_default())
            })
            .unwrap_or_else(|_| path.to_string())
            .into()
    }
    #[cfg(not(windows))]
    {
        // Windows 以外では空のパスを返す
        let _ = path;
        std::path::PathBuf::new()
    }
}

/// ファイルが削除可能かチェック
pub(super) fn is_deletable_file(path: &Path) -> bool {
    // 拡張子チェック
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        if !SAFE_EXTENSIONS.contains(&ext.to_lowercase().as_str()) {
            return false;
        }
    } else {
        return false;
    }

    let _ = path; // 未使用警告回避

    // TODO: Windows API の CreateFile で FILE_SHARE_READ で
    // 開けるかチェックする実装に置き換える
    false // 現時点では安全側に倒して false を返す
}

/// 一時ファイルをスキャンし、削除可能なファイル一覧を返す
pub fn scan_temp_files() -> Result<CleanupScanResult, AppError> {
    #[cfg(windows)]
    {
        info!("scan_temp_files: スキャン開始");

        let mut items = Vec::new();
        let mut dirs_scanned = 0;
        let mut files_found = 0;
        let mut total_size_mb = 0.0;

        for dir_pattern in TEMP_DIRS {
            let dir_path = expand_env_path(dir_pattern);

            if !dir_path.exists() {
                warn!("Directory not found: {:?}", dir_path);
                continue;
            }

            dirs_scanned += 1;

            // ディレクトリ内のファイルをスキャン
            match fs::read_dir(&dir_path) {
                Ok(entries) => {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_file() {
                            files_found += 1;

                            // ファイルサイズ取得
                            let size_mb = match fs::metadata(&path) {
                                Ok(metadata) => metadata.len() as f64 / 1024.0 / 1024.0,
                                Err(_) => 0.0,
                            };

                            // カテゴリ判定
                            let category = if path.to_string_lossy().contains("CrashDumps") {
                                "crash_dump"
                            } else if path.extension().and_then(|e| e.to_str()) == Some("log") {
                                "log"
                            } else {
                                "temp"
                            };

                            // 削除可能性チェック
                            let can_delete = is_deletable_file(&path);

                            if can_delete {
                                total_size_mb += size_mb;
                            }

                            items.push(CleanupItem {
                                path: path.to_string_lossy().to_string(),
                                size_mb,
                                category: category.to_string(),
                                can_delete,
                            });
                        }
                    }
                }
                Err(e) => {
                    warn!("Failed to read directory {:?}: {}", dir_path, e);
                }
            }
        }

        info!(
            dirs_scanned = dirs_scanned,
            files_found = files_found,
            total_size_mb = total_size_mb,
            deletable = items.iter().filter(|i| i.can_delete).count(),
            "scan_temp_files: スキャン完了"
        );

        Ok(CleanupScanResult {
            dirs_scanned,
            files_found,
            total_size_mb,
            items,
        })
    }
    #[cfg(not(windows))]
    {
        // Windows 以外では空の結果を返す
        Ok(CleanupScanResult {
            dirs_scanned: 0,
            files_found: 0,
            total_size_mb: 0.0,
            items: Vec::new(),
        })
    }
}
