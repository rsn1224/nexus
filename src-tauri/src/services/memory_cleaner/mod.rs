//! スタンバイメモリリストクリーナー
//! ISLC (Intelligent Standby List Cleaner) の機能を統合

mod cleaner;
mod types;

pub use cleaner::*;
pub use types::*;

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
