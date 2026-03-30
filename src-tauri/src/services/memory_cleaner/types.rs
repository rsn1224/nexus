//! メモリクリーナーの型定義

use serde::{Deserialize, Serialize};

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
    /// クリーニング閾値（MB）
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
