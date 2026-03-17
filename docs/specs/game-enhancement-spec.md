# ゲーム特化強化 — 実装仕様書

> **作成日:** 2026-03-18
> **対象フェーズ:** Phase 8a / 8b / 9a / 9b / 10
> **前提:** Phase 0〜7 完了（4層アーキテクチャ・Tauri v2 イベントシステム稼働済み）

---

## 1. 概要

### 目的

nexus を「ゲーム起動 → 自動最適化 → 終了時リバート」を一貫して担うゲーム特化ツールへ進化させる。

### スコープ

| フェーズ | 内容 | 工数 |
|---------|------|------|
| **Phase 8a** | ゲームプロファイル基盤・起動検出・Level 1 ブースト | 2〜3週間 |
| **Phase 8b** | CPUアフィニティ・段階的ブースト再設計（Level 2/3） | 2〜3週間 |
| **Phase 9a** | フレームタイム監視（ETWベース）| 2〜3週間 |
| **Phase 9b** | タイマーリゾリューション・ネットワーク強化 | 1〜2週間 |
| **Phase 10** | 高度な可視化・GameReadinessScore 再設計 | 1〜2週間 |

**総工数見積もり:** 約 8〜13 週間（Phase 8a から逐次着手）

### 前提条件

- Phase 0〜7 完了（特に Phase 4 の 4層アーキテクチャ・Phase 5 のイベントシステム必須）
- `run_boost` の `is_simulation: true` を Phase 8a で実装に置き換える
- `services/boost.rs` が存在しないため Phase 8a で新規作成する（commands 層のロジックを移動）

### 既存 Phase との関係

```
Phase 0〜7 (再構築基盤)
    └─ 完了
           ↓
    Phase 8a → 8b → 9a → 9b → 10
    （ゲーム特化強化・本仕様書の対象）
```

---

## 2. 新規 Rust 型定義

すべての型は `src-tauri/src/types/game.rs`（新規）に定義し、`src-tauri/src/lib.rs` から `pub mod types;` として公開する。

### 2.1 GameProfile

```rust
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

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
    pub processes_to_suspend: Vec<String>,

    /// ゲーム起動時に終了するプロセス名リスト（Level 2 ブースト）
    pub processes_to_kill: Vec<String>,

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
```

### 2.2 ProcessPriority

```rust
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
}
```

### 2.3 PowerPlan

```rust
/// Windows 電源プラン GUID。
/// powercfg /setactive {guid} で切り替える。
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum PowerPlan {
    /// 電源プランを変更しない
    #[default]
    Unchanged,
    /// 高パフォーマンス（381b4222-f694-41f0-9685-ff5bb260df2e）
    HighPerformance,
    /// 究極のパフォーマンス（e9a42b02-d5df-448d-aa00-03f14749eb61）
    /// ⚠️ 一部 OEM 機では使用不可
    UltimatePerformance,
    /// バランス（381b4222-f694-41f0-9685-ff5bb260df2e）に戻す
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
```

### 2.4 BoostLevel

```rust
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
```

### 2.5 CpuTopology

```rust
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
    /// Intel 12世代以降専用。非対応の場合は全コアを含む
    pub p_cores: Vec<usize>,

    /// E-Core（Efficiency Core）の論理コアインデックスリスト
    /// Intel 12世代以降専用。非対応の場合は空
    pub e_cores: Vec<usize>,

    /// AMD CCD（Core Chiplet Die）ごとのコアグループ
    /// AMD Ryzen 専用。非対応の場合は空
    pub ccd_groups: Vec<Vec<usize>>,

    /// ハイパースレッディング（SMT）が有効か
    pub hyperthreading_enabled: bool,

    /// CPU 製造メーカー（"GenuineIntel" / "AuthenticAMD" 等）
    pub vendor_id: String,

    /// CPU ブランド名（例: "Intel Core i9-13900K"）
    pub brand: String,
}
```

### 2.6 GameLaunchEvent / GameExitEvent

```rust
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
}
```

### 2.7 ProfileApplyResult

```rust
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
```

### 2.8 TimerResolutionState（Phase 9b 向け）

```rust
/// タイマーリゾリューションの現在状態
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerResolutionState {
    /// 現在の最小分解能（単位: 100ns）
    pub current_100ns: u32,

    /// nexus が設定した値（None = 未設定）
    pub nexus_requested_100ns: Option<u32>,

    /// Windows デフォルト値（通常 156250 = 15.625ms）
    pub default_100ns: u32,
}
```

---

## 3. 新規 Tauri コマンド一覧

### 3.1 Phase 8a コマンド

| コマンド名 | 引数 | 戻り値 | 説明 |
|-----------|------|--------|------|
| `list_game_profiles` | なし | `Vec<GameProfile>` | 全プロファイル一覧取得 |
| `get_game_profile` | `id: String` | `Option<GameProfile>` | 指定プロファイル取得 |
| `save_game_profile` | `profile: GameProfile` | `GameProfile` | 作成・更新（id 自動生成） |
| `delete_game_profile` | `id: String` | `()` | プロファイル削除 |
| `apply_game_profile` | `id: String` | `ProfileApplyResult` | プロファイル手動適用 |
| `revert_game_profile` | `profile_id: Option<String>` | `()` | リバート（None = 最後に適用したものを戻す） |
| `get_cpu_topology` | なし | `CpuTopology` | CPU トポロジー取得 |
| `start_game_monitor` | なし | `()` | ゲーム起動監視開始（WMI） |
| `stop_game_monitor` | なし | `()` | ゲーム起動監視停止 |

### 3.2 Phase 8b コマンド

| コマンド名 | 引数 | 戻り値 | 説明 |
|-----------|------|--------|------|
| `set_process_affinity` | `pid: u32, cores: Vec<usize>` | `()` | プロセスのコアアフィニティ設定 |
| `get_process_affinity` | `pid: u32` | `Vec<usize>` | 現在のアフィニティ取得 |
| `run_boost_level` | `level: BoostLevel, profile_id: Option<String>` | `BoostResult` | 段階的ブースト実行 |

### 3.3 Phase 9b コマンド

| コマンド名 | 引数 | 戻り値 | 説明 |
|-----------|------|--------|------|
| `set_timer_resolution` | `resolution_100ns: u32` | `TimerResolutionState` | タイマーリゾリューション設定 |
| `restore_timer_resolution` | なし | `()` | デフォルト値にリバート |
| `get_timer_resolution` | なし | `TimerResolutionState` | 現在の設定取得 |

### 3.4 capabilities/default.json への追加 permission

```json
{
  "permissions": [
    // 既存 ...
    "fs:allow-read-dir",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-create-dir",
    "path:allow-app-data-dir"
  ]
}
```

---

## 4. 新規/変更ファイル一覧

### Phase 8a

| ファイルパス | 新規/変更 | 概要 |
|------------|---------|------|
| `src-tauri/src/types/game.rs` | 新規 | §2 の全型定義 |
| `src-tauri/src/types/mod.rs` | 新規 | `pub mod game;` |
| `src-tauri/src/services/profile.rs` | 新規 | プロファイル CRUD・JSON 保存 |
| `src-tauri/src/services/boost.rs` | 新規 | boost ロジック commands 層から移動 |
| `src-tauri/src/services/game_monitor.rs` | 新規 | WMI イベント監視・フォールバックポーリング |
| `src-tauri/src/infra/wmi_watcher.rs` | 新規 | WMI Win32_ProcessStartTrace FFI |
| `src-tauri/src/infra/process_control.rs` | 新規 | NtSuspendProcess / NtResumeProcess FFI |
| `src-tauri/src/infra/power_plan.rs` | 新規 | powercfg コマンドラッパー |
| `src-tauri/src/commands/profile.rs` | 新規 | プロファイル系コマンドハンドラ（薄い層） |
| `src-tauri/src/commands/boost.rs` | 変更 | is_simulation 削除・services/boost に委譲 |
| `src-tauri/src/state.rs` | 変更 | `GameMonitorState`（監視スレッドハンドル）追加 |
| `src-tauri/src/lib.rs` | 変更 | profile コマンド登録・ゲーム監視 emitter 追加 |
| `src-tauri/src/error.rs` | 変更 | `Profile(String)`, `GameMonitor(String)` バリアント追加 |
| `src-tauri/Cargo.toml` | 変更 | `windows-sys 0.59` 追加（WMI・Win32 API FFI） |
| `src/types/index.ts` | 変更 | §10.1 の TypeScript 型追加 |
| `src/stores/useGameProfileStore.ts` | 新規 | プロファイル管理ストア |
| `src/stores/useBoostStore.ts` | 変更 | BoostLevel 対応・ProfileApplyResult 対応 |
| `src/stores/useLauncherStore.ts` | 変更 | `activeProfileId` 状態追加 |
| `src/components/launcher/ProfileBadge.tsx` | 新規 | ゲームカードのプロファイル適用バッジ |
| `src/components/boost/ProfileTab.tsx` | 新規 | プロファイル管理タブ UI |

### Phase 8b

| ファイルパス | 新規/変更 | 概要 |
|------------|---------|------|
| `src-tauri/src/infra/cpu_affinity.rs` | 新規 | SetProcessAffinityMask・GetLogicalProcessorInformationEx FFI |
| `src-tauri/src/services/cpu_topology.rs` | 新規 | P/E-Core 判別・CCD 検出ロジック |
| `src-tauri/src/commands/ops.rs` | 変更 | `set_process_affinity`, `get_process_affinity` 追加 |
| `src/components/boost/AffinityPanel.tsx` | 新規 | コアアフィニティ設定UI |

### Phase 9a（設計のみ・実装なし）

| ファイルパス | 新規/変更 | 概要 |
|------------|---------|------|
| `src-tauri/src/infra/etw_watcher.rs` | 新規（予定） | ETW フレームタイムイベント監視 |
| `src-tauri/src/services/frame_time.rs` | 新規（予定） | 0.1%/1% low 計算 |
| `src/components/home/FrameTimeGraph.tsx` | 新規（予定） | リアルタイムグラフ |

### Phase 9b

| ファイルパス | 新規/変更 | 概要 |
|------------|---------|------|
| `src-tauri/src/infra/timer_resolution.rs` | 新規 | ntdll.dll NtSetTimerResolution FFI |
| `src-tauri/src/services/timer.rs` | 新規 | タイマーリゾリューション管理ロジック |
| `src-tauri/src/commands/system.rs` | 新規 | timer 系コマンドハンドラ |

---

## 5. データフロー図

### 5.1 ゲーム起動 → プロファイル適用 → 終了 → リバート

```
[ユーザー] LauncherWing でゲーム起動ボタン押下
    │
    ▼
[FE] useLauncherStore.launchGame(appId)
    ├─ invoke('apply_game_profile', { id: profileId })
    │       │
    │       ▼
    │   [BE] commands/profile.rs::apply_game_profile()
    │       └─ services/profile.rs::apply()
    │           ├─ infra/power_plan.rs::switch(plan)
    │           ├─ infra/process_control.rs::suspend_list(procs)
    │           └─ リバート用スナップショットを AppState に保存
    │
    ├─ emit('nexus://profile-applied', ProfileApplyResult)
    │       └─ [FE] useGameProfileStore が受信 → UI 更新
    │
    └─ invoke('launch_game', { appId })
            └─ Steam protocol 起動

[BE] game_monitor（WMI / フォールバックポーリング）
    ├─ ゲームプロセス起動を検知
    │   └─ emit('nexus://game-launched', GameLaunchEvent)
    │           └─ [FE] useGameProfileStore が受信 → ステータス更新
    │
    └─ ゲームプロセス終了を検知
        ├─ services/profile.rs::revert()
        │   ├─ 保存済みスナップショットから電源プランを復元
        │   └─ 一時停止プロセスを再開（NtResumeProcess）
        └─ emit('nexus://game-exited', GameExitEvent)
                └─ [FE] useGameProfileStore が受信 → プレイ時間記録・UI 更新
```

### 5.2 新規 Tauri イベント

| イベント名 | 発火元 | ペイロード型 | 説明 |
|-----------|-------|------------|------|
| `nexus://game-launched` | `game_monitor.rs` | `GameLaunchEvent` | ゲーム起動検出時 |
| `nexus://game-exited` | `game_monitor.rs` | `GameExitEvent` | ゲーム終了検出時 |
| `nexus://profile-applied` | `services/profile.rs` | `ProfileApplyResult` | プロファイル適用完了時 |
| `nexus://profile-reverted` | `services/profile.rs` | `{ profileId: string }` | リバート完了時 |

### 5.3 既存イベント（変更なし）

| イベント名 | 間隔 | 継続利用 |
|-----------|-----|---------|
| `nexus://pulse` | 2秒 | ✅ |
| `nexus://ops` | 3秒 | ✅ |
| `nexus://hardware` | 5秒 | ✅ |

---

## 6. 段階的ブースト仕様

### 6.1 ブーストレベル定義

| Level | 名称 | 操作内容 | リスク |
|-------|------|---------|--------|
| **Level 0** | なし | 何もしない | なし |
| **Level 1** | ソフト | バックグラウンドプロセスを一時停止（NtSuspendProcess） | 低（再開可能） |
| **Level 2** | ミディアム | Level 1 + 電源プラン切替（Ultimate Performance） + CPU アフィニティ再配置 | 中 |
| **Level 3** | ハード | Level 2 + 不要プロセス終了 + Nagle 無効化 | 高（終了は不可逆） |

### 6.2 Level 1 実装方針（Phase 8a）

```rust
// services/boost.rs
pub fn apply_level1(
    profile: &GameProfile,
    state: &State<'_, SharedState>,
) -> Result<ProfileApplyResult, AppError> {
    let mut result = ProfileApplyResult::new(&profile.id);

    for proc_name in &profile.processes_to_suspend {
        let pids = find_process_pids(state, proc_name)?;
        for pid in &pids {
            infra::process_control::suspend_process(*pid)?;
            result.suspended_pids.push(*pid);
            result.applied.push(format!("一時停止: {} (PID: {})", proc_name, pid));
        }
    }

    // リバート用にスナップショット保存
    state.lock()?.revert_snapshot = Some(result.clone());
    Ok(result)
}
```

**実装対象の Windows API（infra/process_control.rs）:**
```rust
// ntdll.dll から動的リンク
extern "system" {
    fn NtSuspendProcess(process_handle: HANDLE) -> NTSTATUS;
    fn NtResumeProcess(process_handle: HANDLE) -> NTSTATUS;
}
```

### 6.3 Level 2 実装方針（Phase 8b）

- 電源プランは `infra/power_plan.rs::switch(PowerPlan::UltimatePerformance)` で適用
- 切替前の GUID を `ProfileApplyResult.prev_power_plan` に保存（リバート用）
- CPU アフィニティ再配置: バックグラウンドプロセスを E-Core / CCD1 に追い出す

### 6.4 Level 3 実装方針（Phase 8b）

- `profile.processes_to_kill` に登録されたプロセスを `TerminateProcess()` で終了
- 保護プロセスリスト（`constants.rs::PROTECTED_PROCESSES`）は絶対に終了しない
- Level 3 は「確認ダイアログ付き」で実行（不可逆のため）

### 6.5 リバート保証の仕組み

```rust
// AppState に追加するリバートスナップショット
pub struct RevertSnapshot {
    pub profile_id: String,
    pub prev_power_plan_guid: Option<String>,
    pub suspended_pids: Vec<u32>,
    pub prev_affinities: Vec<(u32, usize)>, // (pid, affinity_mask)
    pub created_at: u64,
}
```

- ゲーム終了イベントで `services/profile.rs::revert()` が自動呼び出し
- nexus 強制終了時も `tauri::RunEvent::ExitRequested` でリバートを試みる
- リバート失敗時は `emit('nexus://profile-reverted', { success: false, error: "..." })` で FE に通知

---

## 7. CPU アフィニティ仕様

### 7.1 Windows API FFI 設計（infra/cpu_affinity.rs）

```rust
use windows_sys::Win32::System::Threading::{
    SetProcessAffinityMask,
    GetProcessAffinityMask,
    PROCESS_SET_INFORMATION,
    PROCESS_QUERY_INFORMATION,
    OpenProcess,
    CloseHandle,
};

/// プロセスのアフィニティマスクを設定する。
/// `cores`: 使用するコアのインデックスリスト（0-indexed）
pub fn set_affinity(pid: u32, cores: &[usize]) -> Result<(), AppError> {
    let mask: usize = cores.iter().fold(0usize, |acc, &core| acc | (1 << core));

    // SAFETY: Windows API 呼び出し。pid の有効性は呼び出し元が保証
    let result = unsafe {
        let handle = OpenProcess(
            PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION,
            0, // inherit = false
            pid,
        );
        if handle.is_null() {
            return Err(AppError::Process(format!("OpenProcess 失敗: PID {}", pid)));
        }
        let r = SetProcessAffinityMask(handle, mask);
        CloseHandle(handle);
        r
    };

    if result == 0 {
        return Err(AppError::Process(format!("SetProcessAffinityMask 失敗: PID {}", pid)));
    }
    Ok(())
}
```

### 7.2 CPU トポロジー検出ロジック（services/cpu_topology.rs）

```
GetLogicalProcessorInformationEx(RelationProcessorCore)
    │
    ├─ Intel の場合: PROCESSOR_CORE.Flags を確認
    │   ├─ LTP_PC_SMT (0x1) なし = E-Core（スレッドなし）
    │   └─ LTP_PC_SMT (0x1) あり = P-Core（HT 有）
    │
    └─ AMD の場合: NUMA Node との関連から CCD を判別
        └─ GetNumaNodeProcessorMaskEx でノード別コアを取得
```

**フォールバック:** `cpuid` 命令で Vendor ID 取得。Intel でも AMD でもない場合は
`CpuTopology { p_cores: 全コア, e_cores: [], ccd_groups: [] }` を返す。

### 7.3 子プロセス追従

ゲーム起動後に新たに起動した子プロセスにもアフィニティを適用するため:
- `game_monitor` の WMI 監視で `ParentProcessId` を確認
- ゲームの PID ツリーに属するプロセスに自動でアフィニティ適用

---

## 8. タイマーリゾリューション仕様（Phase 9b）

### 8.1 ntdll.dll FFI 定義（infra/timer_resolution.rs）

```rust
type NTSTATUS = i32;
const STATUS_SUCCESS: NTSTATUS = 0;

extern "system" {
    /// Windows タイマーリゾリューション設定。
    /// resolution: 100ns 単位（5000 = 0.5ms, 10000 = 1ms, 156250 = 15.625ms）
    /// set_resolution: TRUE で設定、FALSE でリバート
    /// current_resolution: 現在の実際の分解能を受け取る OUT パラメータ
    fn NtSetTimerResolution(
        desired_resolution: u32,
        set_resolution: u8,
        current_resolution: *mut u32,
    ) -> NTSTATUS;

    fn NtQueryTimerResolution(
        minimum_resolution: *mut u32,
        maximum_resolution: *mut u32,
        current_resolution: *mut u32,
    ) -> NTSTATUS;
}

pub fn set_resolution(resolution_100ns: u32) -> Result<TimerResolutionState, AppError> {
    let mut current = 0u32;
    let status = unsafe {
        NtSetTimerResolution(resolution_100ns, 1 /* TRUE */, &mut current)
    };
    if status != STATUS_SUCCESS {
        return Err(AppError::Process(
            format!("NtSetTimerResolution 失敗: NTSTATUS 0x{:08X}", status)
        ));
    }
    // ...
}
```

### 8.2 ライフサイクル

```
ゲーム起動検出（game_monitor）
    └─ profile.timer_resolution_100ns が Some の場合
        └─ infra/timer_resolution::set_resolution(value)
                └─ 現在値を RevertSnapshot に保存

ゲーム終了検出（game_monitor）
    └─ infra/timer_resolution::restore()
            └─ NtSetTimerResolution(snapshot.prev_100ns, FALSE, &mut current)
```

### 8.3 エラーハンドリング

- Windows 11 22H2 以降: `NtSetTimerResolution` の効果がプロセスローカルに変更されている
  → `NtQueryTimerResolution` で実際に反映されたか確認し、未反映の場合は warning として記録
- 権限不足（STATUS_PRIVILEGE_NOT_HELD）: UAC 昇格なしでは 0.5ms 設定不可の場合あり
  → `TimerResolutionState.nexus_requested_100ns` に設定値を記録しつつ warning を返す

---

## 9. フレームタイム監視仕様（Phase 9a 向け・設計のみ）

> **⚠️ 注意:** 本セクションは設計のみ。実装は Phase 8 完了後に着手する。

### 9.1 ETW アプローチ概要

Windows ETW（Event Tracing for Windows）の `Microsoft-Windows-DXGI` プロバイダーが発行する
`PresentFrameStart` / `PresentFrameEnd` イベントを監視し、フレームタイムを計算する。

### 9.2 必要な crate（追加予定）

| crate | バージョン | 用途 |
|-------|-----------|------|
| `ferrisetw` | 最新版 | ETW トレースのRust バインディング |

**代替案:** `windows-sys` の ETW API を直接使用（依存追加なし）

### 9.3 0.1%/1% low の計算ロジック

```
frame_times: Vec<f64>  // 各フレームの時間 (ms)

avg_fps = 1000.0 / mean(frame_times)
pct_1_low = 1000.0 / percentile(frame_times, 99.0)   // 1% low
pct_01_low = 1000.0 / percentile(frame_times, 99.9)  // 0.1% low

// スタッター検出: 前フレームの2倍以上 = スタッター
stutters = frame_times.windows(2).filter(|w| w[1] > w[0] * 2.0).count()
```

### 9.4 アーキテクチャ（予定）

```
infra/etw_watcher.rs   ← ETW セッション管理・イベント受信
    └─ services/frame_time.rs ← パーセンタイル計算・スタッター検出
        └─ emitters/frame_emitter.rs ← 1秒ごとに nexus://frame-time emit
            └─ [FE] src/stores/useFrameTimeStore.ts
                └─ src/components/home/FrameTimeGraph.tsx
```

---

## 10. フロントエンド変更仕様

### 10.1 TypeScript 型定義（src/types/index.ts への追加）

```typescript
// ─── GAME PROFILE ────────────────────────────────────────────────────────────

export type ProcessPriority = 'normal' | 'high' | 'realtime' | 'aboveNormal';
export type PowerPlan = 'unchanged' | 'highPerformance' | 'ultimatePerformance' | 'balanced';
export type BoostLevel = 'none' | 'soft' | 'medium' | 'hard';

export interface GameProfile {
  id: string;
  displayName: string;
  exePath: string;
  steamAppId: number | null;
  cpuAffinityGame: number[] | null;
  cpuAffinityBackground: number[] | null;
  processPriority: ProcessPriority;
  powerPlan: PowerPlan;
  processesToSuspend: string[];
  processesToKill: string[];
  timerResolution100ns: number | null;
  boostLevel: BoostLevel;
  lastPlayed: number | null;
  totalPlaySecs: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileApplyResult {
  profileId: string;
  applied: string[];
  warnings: string[];
  appliedAt: number;
  prevPowerPlan: string | null;
  suspendedPids: number[];
}

export interface GameLaunchEvent {
  exePath: string;
  profileId: string | null;
  pid: number;
  detectedAt: number;
}

export interface GameExitEvent {
  exePath: string;
  profileId: string | null;
  playSecs: number;
  revertSuccess: boolean;
}

export interface CpuTopology {
  physicalCores: number;
  logicalCores: number;
  pCores: number[];
  eCores: number[];
  ccdGroups: number[][];
  hyperthreadingEnabled: boolean;
  vendorId: string;
  brand: string;
}
```

### 10.2 新規ストア: useGameProfileStore.ts

```typescript
interface GameProfileStore {
  // 状態
  profiles: GameProfile[];
  activeProfileId: string | null;     // 現在適用中のプロファイル
  currentGameExe: string | null;      // 検出中のゲーム exe
  applyResult: ProfileApplyResult | null;
  isLoading: boolean;
  error: string | null;
  isMonitoring: boolean;              // WMI 監視中か

  // CRUD アクション
  loadProfiles: () => Promise<void>;
  saveProfile: (profile: GameProfile) => Promise<GameProfile>;
  deleteProfile: (id: string) => Promise<void>;

  // 適用・監視
  applyProfile: (id: string) => Promise<void>;
  revertProfile: () => Promise<void>;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;

  // イベントリスナー
  subscribe: () => void;       // nexus://game-launched / exited / profile-applied / reverted を listen
  unsubscribe: () => void;
  unlisten: (() => void) | null;
}
```

### 10.3 既存ストア変更

**useBoostStore.ts:**
- `runBoost(threshold?: number)` → `runBoost(level: BoostLevel, profileId?: string)`
- `lastResult: BoostResult | null` → `lastResult: ProfileApplyResult | null`

**useLauncherStore.ts:**
- `activeProfileId: string | null` 追加（ゲームカードにバッジ表示用）
- `launchGame` 内で `apply_game_profile` を呼ぶよう変更（現在の `run_boost` 直接呼び出しを置き換え）

### 10.4 新規/変更 Wing コンポーネント

| コンポーネント | 新規/変更 | 説明 |
|--------------|---------|------|
| `src/components/boost/ProfileTab.tsx` | 新規 | プロファイル一覧・CRUD・ブーストレベル設定 |
| `src/components/boost/BoostWing.tsx` | 変更 | 4つ目のタブ「PROFILES」追加 |
| `src/components/launcher/GameCard.tsx` | 変更 | プロファイル適用バッジ・GameLaunchEvent 連動 |
| `src/components/launcher/ProfileBadge.tsx` | 新規 | `PROFILE: {name}` バッジ（DESIGN.md 準拠） |
| `src/components/home/GameStatusCard.tsx` | 新規 | 現在プレイ中ゲーム + プロファイル適用状況 |

---

## 11. テスト戦略

### 11.1 Rust ユニットテスト（services/ レイヤー）

```rust
// src-tauri/src/services/profile.rs
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_save_and_load_profile() {
        // 一時ディレクトリにプロファイル保存・読み込みをテスト
    }

    #[test]
    fn test_profile_id_generation() {
        // Steam AppID / exe パスから一意 ID が生成されることを確認
    }
}
```

```rust
// src-tauri/src/services/boost.rs
#[cfg(test)]
mod tests {
    #[test]
    fn test_boost_level_ordering() {
        // BoostLevel::None < Soft < Medium < Hard であることを確認
    }

    #[test]
    fn test_protected_process_not_killed() {
        // PROTECTED_PROCESSES は Level 3 でも kill されないことを確認（モック）
    }
}
```

```rust
// src-tauri/src/services/cpu_topology.rs
#[cfg(test)]
mod tests {
    #[test]
    fn test_topology_fallback_non_intel_amd() {
        // ベンダー不明 CPU でも panic しないことを確認
    }
}
```

### 11.2 TypeScript ユニットテスト（ストア・ロジック）

```typescript
// src/stores/useGameProfileStore.test.ts
describe('useGameProfileStore', () => {
  it('プロファイル保存後に一覧に追加される', async () => { ... });
  it('activeProfileId はゲーム終了後に null に戻る', async () => { ... });
  it('nexus://game-exited イベントで revertProfile が呼ばれる', async () => { ... });
});
```

### 11.3 E2E シナリオ

```typescript
// e2e/game-profile.test.ts
test('プロファイル作成 → ゲーム起動 → リバート フロー', async ({ page }) => {
  // 1. BoostWing PROFILES タブを開く
  // 2. プロファイル作成（Level 1）
  // 3. LauncherWing でゲームを起動（Steam モック）
  // 4. nexus://game-launched イベントを手動 emit
  // 5. ProfileBadge が表示されることを確認
  // 6. nexus://game-exited イベントを手動 emit
  // 7. activeProfileId が null になることを確認
});
```

### 11.4 モック戦略（CI 環境向け）

| Windows API | モック方針 |
|------------|----------|
| `NtSuspendProcess` | `#[cfg(test)] fn suspend_process_mock(...)` で差し替え |
| `SetProcessAffinityMask` | feature flag `test-mock` でスタブ関数を使用 |
| WMI イベント | `game_monitor` に `MockEventSource` トレイトを実装 |
| `NtSetTimerResolution` | テストでは `STATUS_SUCCESS` を即時返すモック |

---

## 12. Cascade 実装プロンプト分割案

### 12.1 Phase 8a — Step A: 型定義・インフラ基盤

**入力ファイル:** `docs/specs/game-enhancement-spec.md`, `src-tauri/src/error.rs`, `src-tauri/Cargo.toml`
**出力ファイル:** `src-tauri/src/types/game.rs`, `src-tauri/src/infra/process_control.rs`, `src-tauri/src/infra/power_plan.rs`, `src-tauri/Cargo.toml`（windows-sys 追加）
**検証手順:** `cargo clippy -- -D warnings` エラー 0

### 12.2 Phase 8a — Step B: プロファイル CRUD サービス

**入力ファイル:** Step A 完了後のファイル群, `src-tauri/src/state.rs`
**出力ファイル:** `src-tauri/src/services/profile.rs`, `src-tauri/src/services/boost.rs`（既存 commands/boost.rs からロジック移動）
**検証手順:** `cargo test` の services テスト green

### 12.3 Phase 8a — Step C: コマンド登録 + イベント

**入力ファイル:** Step B 完了後のファイル群, `src-tauri/src/lib.rs`
**出力ファイル:** `src-tauri/src/commands/profile.rs`, `src-tauri/src/services/game_monitor.rs`, `src-tauri/src/infra/wmi_watcher.rs`, `src-tauri/src/lib.rs`
**検証手順:** `cargo build` エラー 0、`npm run tauri dev` でコマンド呼び出し動作確認

### 12.4 Phase 8a — Step D: フロントエンド

**入力ファイル:** Step C 完了後の BE, `src/types/index.ts`, `src/stores/useLauncherStore.ts`
**出力ファイル:** `src/stores/useGameProfileStore.ts`, `src/components/boost/ProfileTab.tsx`, `src/components/launcher/ProfileBadge.tsx`, `src/components/home/GameStatusCard.tsx`
**検証手順:** `npm run typecheck && npm run check && npm run test` 全 green

---

## 13. ROADMAP.md 更新案

`ROADMAP.md` に §「ゲーム特化強化計画（Phase 8〜10）」を追加する。
詳細は本仕様書 §1 の工数表、および `HANDOFF.md` Phase 8a セクションを参照。

```
依存関係図（更新版）:

Phase 0-7 完了
    └─ Phase 8a (3週) ─→ Phase 8b (3週)
                              └─ Phase 9a (3週)
                              └─ Phase 9b (2週)
                                      └─ Phase 10 (2週)
```
