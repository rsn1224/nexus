//! Watchdog ルール・イベントの型定義

use serde::{Deserialize, Serialize};

// ─── WATCHDOG (δ-3) ────────────────────────────────────────────────────────

/// Watchdog ルール定義
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchdogRule {
    /// ルール一意 ID
    pub id: String,
    /// ルール名（ユーザー定義）
    pub name: String,
    /// 有効/無効
    pub enabled: bool,
    /// 条件（AND 結合）
    pub conditions: Vec<WatchdogCondition>,
    /// アクション
    pub action: WatchdogAction,
    /// 対象プロセスフィルタ（空 = 全プロセス）
    pub process_filter: ProcessFilter,
    /// 紐付けプロファイル ID（None = グローバルルール）
    pub profile_id: Option<String>,
    /// クールダウン秒数（同一プロセスに対するアクションの再実行間隔）
    pub cooldown_secs: u32,
    /// 最終実行タイムスタンプ
    pub last_triggered_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchdogCondition {
    pub metric: WatchdogMetric,
    pub operator: WatchdogOperator,
    pub threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WatchdogMetric {
    CpuPercent,
    MemoryMb,
    DiskReadKb,
    DiskWriteKb,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WatchdogOperator {
    GreaterThan,
    LessThan,
    Equals,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WatchdogAction {
    /// 優先度を変更
    SetPriority { level: String },
    /// アフィニティを変更
    SetAffinity { cores: Vec<u32> },
    /// サスペンド
    Suspend,
    /// 終了（要確認設定）
    Terminate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessFilter {
    /// プロセス名の包含リスト（空 = 全プロセス）
    pub include_names: Vec<String>,
    /// プロセス名の除外リスト
    pub exclude_names: Vec<String>,
    // 保護プロセスは常に除外（constants::PROTECTED_PROCESSES）
    // この設定はコード側で強制。ユーザーが上書き不可
}

/// Watchdog イベントログ
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchdogEvent {
    pub timestamp: u64,
    pub rule_id: String,
    pub rule_name: String,
    pub process_name: String,
    pub pid: u32,
    pub action_taken: String,
    pub metric_value: f64,
    pub threshold: f64,
    pub success: bool,
    pub detail: String,
}
