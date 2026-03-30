//! ゲームプロファイル・列挙型の型定義
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

    /// ゲーム中にコアパーキングを無効化するか
    #[serde(default)]
    pub core_parking_disabled: bool,

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

// ─── SharedProfile ────────────────────────────────────────────────────────────

/// コミュニティ共有用プロファイル。
/// マシン固有の情報（exe_path / id / プレイ統計）を除いた設定のみを保持する。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SharedProfile {
    /// フォーマットバージョン（後方互換チェック用）
    pub version: u32,
    /// プロファイル表示名
    pub display_name: String,
    /// ゲーム CPU コアのインデックスリスト
    pub cpu_affinity_game: Option<Vec<usize>>,
    /// バックグラウンドプロセス追い出し先コア
    pub cpu_affinity_background: Option<Vec<usize>>,
    /// プロセス優先度
    pub process_priority: ProcessPriority,
    /// 電源プラン
    pub power_plan: PowerPlan,
    /// サスペンド対象プロセス名
    pub processes_to_suspend: Vec<String>,
    /// 終了対象プロセス名
    pub processes_to_kill: Vec<String>,
    /// 自動サスペンド有効
    pub auto_suspend_enabled: bool,
    /// タイマーリゾリューション（100ns 単位）
    pub timer_resolution_100ns: Option<u32>,
    /// ブーストレベル
    pub boost_level: BoostLevel,
    /// ゲーム中にコアパーキングを無効化するか
    pub core_parking_disabled: bool,
    /// エクスポート日時（Unix ms）
    pub exported_at: u64,
}

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
            core_parking_disabled: false,
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
