//! セッション記録の型定義

use serde::{Deserialize, Serialize};

// ─── Session Recording ────────────────────────────────────────────────────

/// 保存されたフレームタイムセッション
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedFrameTimeSession {
    /// セッション一意 ID
    pub id: String,
    /// 対象ゲームプロファイル ID（紐付け可能なら）
    pub profile_id: Option<String>,
    /// ゲーム名
    pub game_name: String,
    /// セッション開始タイムスタンプ（Unix ms）
    pub started_at: u64,
    /// セッション終了タイムスタンプ（Unix ms）
    pub ended_at: u64,
    /// プレイ時間（秒）
    pub play_secs: u64,
    /// 統計サマリ
    pub summary: SessionSummary,
    /// フレームタイム分布（パーセンタイル 0, 1, 5, 10, 25, 50, 75, 90, 95, 99, 99.9, 100）
    pub percentiles: Vec<PercentilePoint>,
    /// 時系列 FPS データ（1秒ごとのサンプル、最大 3600 個 = 1時間）
    pub fps_timeline: Vec<FpsTimelinePoint>,
    /// メモ（ユーザーが任意に追記可能）
    pub note: String,
    /// ハードウェア情報スナップショット（記録時点）
    pub hardware_snapshot: Option<HardwareSnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSummary {
    pub avg_fps: f64,
    pub pct_1_low: f64,
    pub pct_01_low: f64,
    pub total_stutter_count: u32,
    pub max_frame_time_ms: f64,
    pub min_fps: f64,
    pub total_frames: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PercentilePoint {
    /// パーセンタイル値（0.0 〜 100.0）
    pub percentile: f64,
    /// その時点のフレームタイム（ms）
    pub frame_time_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FpsTimelinePoint {
    /// セッション開始からの経過秒
    pub elapsed_secs: u32,
    /// その秒間の平均 FPS
    pub avg_fps: f64,
    /// 1% Low
    pub pct_1_low: f64,
    /// CPU 使用率（pulse データから）
    pub cpu_percent: Option<f32>,
    /// GPU 使用率（hardware データから）
    pub gpu_percent: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareSnapshot {
    pub cpu_name: String,
    pub gpu_name: Option<String>,
    pub mem_total_gb: f32,
    pub os_version: String,
}

/// セッション一覧用の軽量版
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionListItem {
    pub id: String,
    pub game_name: String,
    pub started_at: u64,
    pub ended_at: u64,
    pub summary: SessionSummary,
}
