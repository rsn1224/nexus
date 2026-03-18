//! ゲーム特化強化の型定義
//! 仕様: docs/specs/game-enhancement-spec.md §2

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

// ─── GameProfile ─────────────────────────────────────────────────────────────

/// ゲームごとの最適化プロファイル。
/// ゲーム起動時に自動適用され、終了時にリバートされる。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GameProfile {
    /// 一意識別子（Steam AppID の文字列表現、または exe パスのハッシュ）
    pub id: String,

    /// 表示名（ユーザー編集可）
    pub display_name: String,

    /// ゲーム実行ファイルの絶対パス
    pub exe_path: PathBuf,

    /// Steam AppID（Steam ゲームの場合のみ）
    pub steam_app_id: Option<u32>,

    /// ゲーム専有 CPU コアのインデックスリスト（0-indexed）
    /// None の場合はアフィニティ変更なし
    pub cpu_affinity_game: Option<Vec<usize>>,

    /// バックグラウンドプロセス追い出し先コアのインデックスリスト
    /// None の場合は追い出しなし
    pub cpu_affinity_background: Option<Vec<usize>>,

    /// ゲーム起動時に適用するプロセス優先度
    pub process_priority: ProcessPriority,

    /// ゲーム起動時に切り替える電源プラン
    pub power_plan: PowerPlan,

    /// ゲーム起動時に一時停止するプロセス名リスト（Level 1 ブースト）
    #[serde(default)]
    pub processes_to_suspend: Vec<String>,

    /// ゲーム起動時に終了するプロセス名リスト（Level 2 ブースト）
    #[serde(default)]
    pub processes_to_kill: Vec<String>,

    /// バックグラウンドプロセスの自動サスペンドを有効化するか
    #[serde(default)]
    pub auto_suspend_enabled: bool,

    /// タイマーリゾリューション設定（単位: 100ns, 5000 = 0.5ms）
    /// None の場合は変更なし
    pub timer_resolution_100ns: Option<u32>,

    /// ゲーム起動時に適用するブーストレベル
    pub boost_level: BoostLevel,

    /// 最終プレイ日時（Unix タイムスタンプ）
    pub last_played: Option<u64>,

    /// 累計プレイ時間（秒）
    pub total_play_secs: u64,

    /// プロファイル作成日時（Unix タイムスタンプ）
    pub created_at: u64,

    /// プロファイル最終更新日時（Unix タイムスタンプ）
    pub updated_at: u64,
}

// ─── ProcessPriority ─────────────────────────────────────────────────────────

/// Windows プロセス優先度クラス。
/// SetPriorityClass() で設定する値に対応する。
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum ProcessPriority {
    /// 通常優先度（NORMAL_PRIORITY_CLASS = 0x20）
    #[default]
    Normal,
    /// 高優先度（HIGH_PRIORITY_CLASS = 0x80）
    High,
    /// リアルタイム優先度（REALTIME_PRIORITY_CLASS = 0x100）
    /// ⚠️ システム安定性に影響する可能性あり。原則 High を推奨
    Realtime,
    /// 通常以上（ABOVE_NORMAL_PRIORITY_CLASS = 0x8000）
    AboveNormal,
    /// 低優先度（BELOW_NORMAL_PRIORITY_CLASS = 0x4000）
    BelowNormal,
    /// アイドル優先度（IDLE_PRIORITY_CLASS = 0x40）
    Idle,
}

// ─── PowerPlan ───────────────────────────────────────────────────────────────

/// Windows 電源プラン GUID。
/// powercfg /setactive {guid} で切り替える。
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum PowerPlan {
    /// 電源プランを変更しない
    #[default]
    Unchanged,
    /// 高パフォーマンス
    HighPerformance,
    /// 究極のパフォーマンス
    /// ⚠️ 一部 OEM 機では使用不可
    UltimatePerformance,
    /// バランスに戻す
    Balanced,
}

impl PowerPlan {
    /// 電源プラン GUID 文字列を返す（Unchanged は None）
    pub fn guid(&self) -> Option<&'static str> {
        match self {
            Self::HighPerformance => Some("8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"),
            Self::UltimatePerformance => Some("e9a42b02-d5df-448d-aa00-03f14749eb61"),
            Self::Balanced => Some("381b4222-f694-41f0-9685-ff5bb260df2e"),
            Self::Unchanged => None,
        }
    }
}

// ─── BoostLevel ──────────────────────────────────────────────────────────────

/// 段階的ブーストのレベル。
/// 数値が大きいほど積極的な最適化を行う。
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default, PartialOrd, Ord)]
#[serde(rename_all = "camelCase")]
pub enum BoostLevel {
    /// ブーストなし
    #[default]
    None,
    /// Level 1: ソフト（バックグラウンドプロセス一時停止のみ）
    Soft,
    /// Level 2: ミディアム（電源プラン切替 + CPUアフィニティ再配置）
    Medium,
    /// Level 3: ハード（不要プロセス強制終了 + ネットワーク帯域制限）
    Hard,
}

// ─── CpuTopology ─────────────────────────────────────────────────────────────

/// CPU トポロジー情報。
/// Intel 12世代以降の P-Core/E-Core 判別、AMD の CCD 判別に使用する。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CpuTopology {
    /// 物理コア総数
    pub physical_cores: usize,
    /// 論理コア（スレッド）総数
    pub logical_cores: usize,
    /// P-Core（Performance Core）の論理コアインデックスリスト
    pub p_cores: Vec<usize>,
    /// E-Core（Efficiency Core）の論理コアインデックスリスト
    pub e_cores: Vec<usize>,
    /// AMD CCD（Core Chiplet Die）ごとのコアグループ
    pub ccd_groups: Vec<Vec<usize>>,
    /// ハイパースレッディング（SMT）が有効か
    pub hyperthreading_enabled: bool,
    /// CPU 製造メーカー
    pub vendor_id: String,
    /// CPU ブランド名
    pub brand: String,
}

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
    /// スナップショット作成時刻（Unix タイムスタンプ）
    pub created_at: u64,
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_boost_level_ordering() {
        assert!(BoostLevel::None < BoostLevel::Soft);
        assert!(BoostLevel::Soft < BoostLevel::Medium);
        assert!(BoostLevel::Medium < BoostLevel::Hard);
    }

    #[test]
    fn test_boost_level_default() {
        assert_eq!(BoostLevel::default(), BoostLevel::None);
    }

    #[test]
    fn test_process_priority_default() {
        assert_eq!(ProcessPriority::default(), ProcessPriority::Normal);
    }

    #[test]
    fn test_power_plan_guid() {
        assert!(PowerPlan::Unchanged.guid().is_none());
        assert_eq!(
            PowerPlan::HighPerformance.guid(),
            Some("8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c")
        );
        assert_eq!(
            PowerPlan::UltimatePerformance.guid(),
            Some("e9a42b02-d5df-448d-aa00-03f14749eb61")
        );
        assert_eq!(
            PowerPlan::Balanced.guid(),
            Some("381b4222-f694-41f0-9685-ff5bb260df2e")
        );
    }

    #[test]
    fn test_power_plan_default() {
        assert_eq!(PowerPlan::default(), PowerPlan::Unchanged);
    }

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

    #[test]
    fn test_game_profile_serialization() {
        let profile = GameProfile {
            id: "test".to_string(),
            display_name: "テストゲーム".to_string(),
            exe_path: PathBuf::from("C:\\Games\\test.exe"),
            steam_app_id: Some(12345),
            cpu_affinity_game: None,
            cpu_affinity_background: None,
            process_priority: ProcessPriority::default(),
            power_plan: PowerPlan::default(),
            processes_to_suspend: vec![],
            processes_to_kill: vec![],
            timer_resolution_100ns: None,
            boost_level: BoostLevel::default(),
            auto_suspend_enabled: true,
            last_played: None,
            total_play_secs: 0,
            created_at: 1000,
            updated_at: 1000,
        };
        let json = serde_json::to_string(&profile);
        assert!(json.is_ok(), "GameProfile のシリアライズに失敗");
        let deserialized: Result<GameProfile, _> = serde_json::from_str(&json.unwrap());
        assert!(deserialized.is_ok(), "GameProfile のデシリアライズに失敗");
        assert_eq!(deserialized.unwrap(), profile);
    }

    #[test]
    fn test_cpu_topology_default_structure() {
        let topo = CpuTopology {
            physical_cores: 8,
            logical_cores: 16,
            p_cores: (0..8).collect(),
            e_cores: vec![],
            ccd_groups: vec![],
            hyperthreading_enabled: true,
            vendor_id: "GenuineIntel".to_string(),
            brand: "Intel Core i7-12700K".to_string(),
        };
        let json = serde_json::to_string(&topo);
        assert!(json.is_ok(), "CpuTopology のシリアライズに失敗");
    }
}

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

/// セッション比較結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionComparisonResult {
    pub session_a: SessionSummary,
    pub session_b: SessionSummary,
    /// 差分（B - A）。正の値 = 改善
    pub fps_delta_pct: f64,
    pub pct_1_low_delta_pct: f64,
    pub pct_01_low_delta_pct: f64,
    pub stutter_delta: i32,
    /// AI による自動サマリ（なければ空文字）
    pub auto_summary: String,
}
