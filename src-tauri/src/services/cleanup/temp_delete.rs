//! 一時ファイル削除機能

use crate::error::AppError;
use std::fs;
use std::path::PathBuf;
use tracing::{info, warn};

use super::temp_scan::{TEMP_DIRS, expand_env_path};
use super::types::CleanupResult;

/// 指定されたパスのファイルを削除する
pub fn delete_temp_files(paths: Vec<String>) -> Result<CleanupResult, AppError> {
    #[cfg(windows)]
    {
        info!(count = paths.len(), "delete_temp_files: 削除開始");

        let mut deleted_count = 0;
        let mut freed_mb = 0.0;
        let mut errors = Vec::new();

        for path_str in paths {
            let path = PathBuf::from(&path_str);

            // セキュリティチェック: TEMP_DIRS 配下のパスのみ許可
            let is_allowed = TEMP_DIRS.iter().any(|dir_pattern| {
                let base_dir = expand_env_path(dir_pattern);
                path.starts_with(&base_dir)
            });

            if !is_allowed {
                let error_msg = format!("Path outside allowed directories: {}", path_str);
                warn!("{}", error_msg);
                errors.push(error_msg);
                continue;
            }

            // ファイルサイズを記録
            let size_mb = match fs::metadata(&path) {
                Ok(metadata) => metadata.len() as f64 / 1024.0 / 1024.0,
                Err(_) => 0.0,
            };

            // 削除実行
            match fs::remove_file(&path) {
                Ok(()) => {
                    deleted_count += 1;
                    freed_mb += size_mb;
                    info!("Deleted file: {:?}", path);
                }
                Err(e) => {
                    let error_msg = format!("Failed to delete {}: {}", path_str, e);
                    warn!("{}", error_msg);
                    errors.push(error_msg);
                }
            }
        }

        info!(
            deleted_count = deleted_count,
            freed_mb = freed_mb,
            errors = errors.len(),
            "delete_temp_files: 削除完了"
        );

        Ok(CleanupResult {
            deleted_count,
            freed_mb,
            errors,
        })
    }
    #[cfg(not(windows))]
    {
        // Windows 以外では空の結果を返す
        Ok(CleanupResult {
            deleted_count: 0,
            freed_mb: 0.0,
            errors: vec!["Platform not supported".to_string()],
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::cleanup::types::*;

    #[test]
    fn test_cleanup_result_counts() {
        let result = CleanupResult {
            deleted_count: 5,
            freed_mb: 25.3,
            errors: vec!["Failed to delete locked file".to_string()],
        };

        assert_eq!(result.deleted_count, 5);
        assert_eq!(result.freed_mb, 25.3);
        assert_eq!(result.errors.len(), 1);
    }

    #[test]
    fn test_path_validation_rejects_outside_temp() {
        // TEMP_DIRS 以外のパスを渡した場合にエラーになることを確認
        let paths = vec![
            "C:\\Windows\\System32\\kernel32.dll".to_string(),
            "D:\\important\\data.txt".to_string(),
        ];

        let result = delete_temp_files(paths);

        assert!(result.is_ok());
        let cleanup_result = result.unwrap();
        assert_eq!(cleanup_result.deleted_count, 0);
        assert_eq!(cleanup_result.errors.len(), 2);
        assert!(cleanup_result.errors[0].contains("outside allowed directories"));
    }
}
