//! フレームタイム・タイマーリゾリューションの型定義

use serde::{Deserialize, Serialize};

// ─── TimerResolutionState ────────────────────────────────────────────────────

/// タイマーリゾリューションの現在状態。
/// NtQueryTimerResolution / NtSetTimerResolution の結果を表す。
/// 単位: 100ns（5000 = 0.5ms, 10000 = 1ms, 156250 = 15.625ms）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerResolutionState {
    /// 現在のシステムタイマー分解能（100ns 単位）
    pub current_100ns: u32,

    /// nexus が要求した値（None = 未設定）
    pub nexus_requested_100ns: Option<u32>,

    /// Windows デフォルト値（通常 156250 = 15.625ms）
    pub default_100ns: u32,

    /// 最小分解能（ハードウェア上限、通常 5000 = 0.5ms）
    pub minimum_100ns: u32,

    /// 最大分解能（最も粗い、通常 156250 = 15.625ms）
    pub maximum_100ns: u32,
}

// ─── FrameTime ──────────────────────────────────────────────────────────────

/// 1秒ごとに emit されるフレームタイムスナップショット。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FrameTimeSnapshot {
    /// 対象プロセス ID
    pub pid: u32,
    /// 対象プロセス名
    pub process_name: String,
    /// 計測期間内の平均 FPS
    pub avg_fps: f64,
    /// 1% Low FPS（99パーセンタイルのフレームタイムから算出）
    pub pct_1_low: f64,
    /// 0.1% Low FPS（99.9パーセンタイルのフレームタイムから算出）
    pub pct_01_low: f64,
    /// 計測期間内のスタッター回数（前フレームの2倍以上）
    pub stutter_count: u32,
    /// 最新フレームタイム（ms）
    pub last_frame_time_ms: f64,
    /// 計測期間内のフレームタイム配列（ms, グラフ描画用, 最大300個）
    pub frame_times: Vec<f64>,
    /// タイムスタンプ（Unix ms）
    pub timestamp: u64,
}

/// フレームタイム監視の状態。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FrameTimeMonitorState {
    /// 停止中
    Stopped,
    /// 監視中（対象 PID）
    Monitoring { pid: u32, process_name: String },
    /// エラー
    Error { message: String },
}
