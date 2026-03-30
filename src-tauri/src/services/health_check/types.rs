//! ヘルスチェック型定義

use serde::{Deserialize, Serialize};

/// ヘルスチェック結果の重要度
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum HealthSeverity {
    Ok,
    Warning,
    Critical,
}

/// 個別チェック項目の結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckItem {
    pub id: String,
    pub label: String,
    pub severity: HealthSeverity,
    pub message: String,
    pub fix_action: Option<HealthFixAction>,
}

/// 修正アクション
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthFixAction {
    /// アクション ID（フロントエンドでディスパッチ用）
    pub id: String,
    /// ボタンラベル
    pub label: String,
}

/// ヘルスチェック全体の結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckResult {
    pub items: Vec<HealthCheckItem>,
    pub overall: HealthSeverity,
    pub timestamp: u64,
}

/// ヘルスチェック入力（フロントエンドから渡す）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckInput {
    pub disk_free_gb: f32,
    pub disk_total_gb: f32,
    pub cpu_temp_c: Option<f32>,
    pub gpu_temp_c: Option<f32>,
    pub mem_used_mb: u64,
    pub mem_total_mb: u64,
    pub heavy_processes: Vec<HeavyProcess>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeavyProcess {
    pub name: String,
    pub cpu_percent: f32,
    #[allow(dead_code)]
    pub mem_mb: u64,
}
