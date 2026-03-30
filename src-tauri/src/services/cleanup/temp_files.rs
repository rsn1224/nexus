//! 一時ファイルスキャン・削除機能（再エクスポート）

pub use super::temp_delete::delete_temp_files;
pub use super::temp_scan::*;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::cleanup::types::*;

    #[test]
    fn test_cleanup_scan_result_serialization() {
        let result = CleanupScanResult {
            dirs_scanned: 2,
            files_found: 10,
            total_size_mb: 125.5,
            items: vec![CleanupItem {
                path: "C:\\temp\\test.tmp".to_string(),
                size_mb: 1.5,
                category: "temp".to_string(),
                can_delete: true,
            }],
        };

        let json = serde_json::to_string(&result).expect("シリアライズ失敗");
        let deserialized: CleanupScanResult =
            serde_json::from_str(&json).expect("デシリアライズ失敗");

        assert_eq!(result.dirs_scanned, deserialized.dirs_scanned);
        assert_eq!(result.files_found, deserialized.files_found);
        assert_eq!(result.total_size_mb, deserialized.total_size_mb);
        assert_eq!(result.items.len(), deserialized.items.len());
    }

    #[test]
    fn test_expand_env_path_windows() {
        // Windows 環境変数展開のテスト
        let path = expand_env_path("%TEMP%\\test");

        #[cfg(windows)]
        {
            // 実際の環境変数が設定されている場合
            assert!(path.to_string_lossy().contains("test"));
        }

        #[cfg(not(windows))]
        {
            assert_eq!(path, std::path::PathBuf::new());
        }
    }

    #[test]
    fn test_safe_extensions() {
        use super::super::temp_scan::SAFE_EXTENSIONS;
        // 安全な拡張子リストのテスト
        assert!(SAFE_EXTENSIONS.contains(&"tmp"));
        assert!(SAFE_EXTENSIONS.contains(&"log"));
        assert!(SAFE_EXTENSIONS.contains(&"bak"));
        assert!(!SAFE_EXTENSIONS.contains(&"exe"));
        assert!(!SAFE_EXTENSIONS.contains(&"dll"));
    }
}
