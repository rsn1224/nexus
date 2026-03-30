//! ゲームイベント・プロファイル適用結果・リバートスナップショットの型定義

use serde::{Deserialize, Serialize};

// ─── イベントペイロード ──────────────────────────────────────────────────────

/// ゲーム起動イベントのペイロード（Tauri イベントで emit）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameLaunchEvent {
    /// 起動したゲームの exe パス
    pub exe_path: String,
    /// 対応するプロファイル ID（存在する場合）
    pub profile_id: Option<String>,
    /// プロセス ID
    pub pid: u32,
    /// 起動検出時刻（Unix タイムスタンプ）
    pub detected_at: u64,
}

/// ゲーム終了イベントのペイロード（Tauri イベントで emit）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameExitEvent {
    /// 終了したゲームの exe パス
    pub exe_path: String,
    /// 適用していたプロファイル ID（存在する場合）
    pub profile_id: Option<String>,
    /// プレイ時間（秒）
    pub play_secs: u64,
    /// リバート成功可否
    pub revert_success: bool,
    /// フレームタイム統計（FrameTimeSession から取得）
    pub avg_fps: Option<f64>,
    pub percentile_1_low: Option<f64>,
    pub percentile_01_low: Option<f64>,
    pub stutter_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentPowerPlan {
    pub name: String,
    pub guid: String,
}

// ─── ProfileApplyResult ──────────────────────────────────────────────────────

/// プロファイル適用結果。
/// ゲーム起動時に返却され、FE に表示される。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileApplyResult {
    /// 適用したプロファイル ID
    pub profile_id: String,
    /// 適用に成功したアクションのリスト
    pub applied: Vec<String>,
    /// 失敗または警告があったアクションのリスト
    pub warnings: Vec<String>,
    /// 適用時刻（Unix タイムスタンプ）
    pub applied_at: u64,
    /// 電源プラン変更前の GUID（リバート用）
    pub prev_power_plan: Option<String>,
    /// 一時停止したプロセスの PID リスト（リバート用）
    pub suspended_pids: Vec<u32>,
    /// コアパーキング変更前の値（リバート用）
    pub prev_core_parking: Option<u32>,
}

impl ProfileApplyResult {
    /// 新規結果を作成
    pub fn new(profile_id: &str) -> Self {
        Self {
            profile_id: profile_id.to_string(),
            applied: Vec::new(),
            warnings: Vec::new(),
            applied_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            prev_power_plan: None,
            suspended_pids: Vec::new(),
            prev_core_parking: None,
        }
    }
}

// ─── RevertSnapshot ──────────────────────────────────────────────────────────

/// リバート用スナップショット。
/// プロファイル適用前の状態を保存し、ゲーム終了時に復元するために使用する。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RevertSnapshot {
    /// 適用したプロファイル ID
    pub profile_id: String,
    /// 変更前の電源プラン GUID
    pub prev_power_plan_guid: Option<String>,
    /// 一時停止したプロセスの PID リスト
    pub suspended_pids: Vec<u32>,
    /// 変更前のアフィニティ（Phase 8b で使用）: (pid, affinity_mask)
    pub prev_affinities: Vec<(u32, usize)>,
    /// コアパーキング変更前の値
    pub prev_core_parking: Option<u32>,
    /// スナップショット作成時刻（Unix タイムスタンプ）
    pub created_at: u64,
}

/// セッション比較結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionComparisonResult {
    pub session_a: super::session::SessionSummary,
    pub session_b: super::session::SessionSummary,
    /// 差分（B - A）。正の値 = 改善
    pub fps_delta_pct: f64,
    pub pct_1_low_delta_pct: f64,
    pub pct_01_low_delta_pct: f64,
    pub stutter_delta: i32,
    /// AI による自動サマリ（なければ空文字）
    pub auto_summary: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_profile_apply_result_new() {
        let result = ProfileApplyResult::new("test-id");
        assert_eq!(result.profile_id, "test-id");
        assert!(result.applied.is_empty());
        assert!(result.warnings.is_empty());
        assert!(result.suspended_pids.is_empty());
        assert!(result.prev_power_plan.is_none());
        assert!(result.applied_at > 0);
    }
}
