//! Cleanup 型定義

/// 一時ファイルスキャン結果
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupScanResult {
    pub dirs_scanned: usize,
    pub files_found: usize,
    pub total_size_mb: f64,
    pub items: Vec<CleanupItem>,
}

/// 個別クリーンアップ項目
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupItem {
    pub path: String,
    pub size_mb: f64,
    pub category: String, // "temp" / "crash_dump" / "log"
    pub can_delete: bool,
}

/// 削除実行結果
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupResult {
    pub deleted_count: usize,
    pub freed_mb: f64,
    pub errors: Vec<String>,
}

/// リバート結果の個別レポート
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RevertItem {
    pub category: String,
    pub label: String,
    pub success: bool,
    pub detail: String,
}

/// 全設定リバート結果
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RevertAllResult {
    pub items: Vec<RevertItem>,
    pub total: usize,
    pub success_count: usize,
    pub fail_count: usize,
}
