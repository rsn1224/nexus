# NEXUS バックエンド（Rust）アーキテクチャガイド

> **バージョン:** v3.0（Phase 4 最終版）
> **最終更新:** 2026-03-19
> **対象コミット:** `4db28f4` 以降

---

## 目次

1. [4 層アーキテクチャ](#1-4-層アーキテクチャ)
2. [ディレクトリ構造](#2-ディレクトリ構造)
3. [UnifiedEmitter](#3-unifiedemitter)
4. [状態管理](#4-状態管理)
5. [エラーハンドリング](#5-エラーハンドリング)
6. [コマンド一覧](#6-コマンド一覧)
7. [サービス一覧](#7-サービス一覧)
8. [インフラ層](#8-インフラ層)
9. [規約](#9-規約)

---

## 1. 4 層アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│  commands/    Tauri IPC ハンドラ（薄いレイヤー）  │
│              ↓ 呼び出しのみ                       │
├─────────────────────────────────────────────────┤
│  services/   ビジネスロジック（テスト可能）        │
│              ↓ 外部 I/O が必要なとき              │
├─────────────────────────────────────────────────┤
│  infra/      外部システム接続                     │
│              PowerShell, Registry, FFI, ETW       │
├─────────────────────────────────────────────────┤
│  parsers/    データパーサー                       │
│              VDF, ipconfig, ログ                   │
└─────────────────────────────────────────────────┘
```

### 依存方向ルール（逆方向禁止）

```
commands → services → infra/parsers
```

- `commands/` にビジネスロジックを書かない。`services/` に委譲する
- `services/` は外部 I/O を直接呼ばない。`infra/` を通す
- `infra/` と `parsers/` は相互に依存しない
- `commands/` が `infra/` を直接呼ぶことは禁止（`services/` を経由）

---

## 2. ディレクトリ構造

```
src-tauri/src/
├── commands/           ← Tauri #[tauri::command] ハンドラ
│   ├── mod.rs
│   ├── ai.rs           (471 行) AI 分析コマンド
│   ├── app_settings.rs (144 行) アプリ設定
│   ├── boost.rs        (214 行) ブーストコマンド
│   ├── bottleneck.rs            ボトルネック解析
│   ├── cleanup.rs               クリーンアップ・リバート
│   ├── core_parking.rs          コアパーキング
│   ├── frame_time.rs            フレームタイム監視
│   ├── hardware.rs     (309 行) ハードウェア情報
│   ├── health_check.rs          ヘルスチェック
│   ├── launcher.rs     (216 行) ゲームランチャー
│   ├── launcher_settings.rs     ランチャー設定
│   ├── log.rs          (414 行) ログコマンド
│   ├── memory.rs                メモリクリーナー
│   ├── netopt.rs       (517 行) ネットワーク最適化
│   ├── ops.rs                   プロセス管理
│   ├── profile.rs      (239 行) ゲームプロファイル
│   ├── pulse.rs                 リソーススナップショット
│   ├── script.rs       (290 行) スクリプト実行
│   ├── session.rs      (163 行) セッション管理
│   ├── storage.rs      (446 行) ストレージ
│   ├── timer.rs                 タイマーリゾリューション
│   ├── watchdog.rs     (306 行) ウォッチドッグ
│   ├── windows_settings.rs (522 行) Windows 設定
│   └── winopt.rs       (527 行) Windows 最適化
│
├── services/           ← ビジネスロジック
│   ├── mod.rs
│   ├── boost.rs        (611 行) ブーストエンジン
│   ├── cleanup.rs      (311 行) リバートスナップショット管理
│   ├── core_parking.rs          コアパーキング状態
│   ├── cpu_topology.rs (311 行) CPU トポロジー検出
│   ├── credentials.rs           資格情報管理
│   ├── frame_time.rs   (227 行) ETW フレームタイム
│   ├── game_monitor.rs (174 行) ゲーム起動/終了検知
│   ├── hardware.rs     (197 行) ハードウェア情報サービス
│   ├── health_check.rs (384 行) システムヘルスチェック
│   ├── memory_cleaner.rs (322 行) メモリ自動クリーン
│   ├── network_monitor.rs (316 行) ネットワーク監視
│   ├── network_tuning.rs (384 行) ネットワークチューニング
│   ├── power_estimator.rs (354 行) 電力消費推定
│   ├── process.rs      (182 行) プロセス情報
│   ├── profile.rs      (404 行) ゲームプロファイル管理
│   ├── session_store.rs (414 行) セッション永続化
│   ├── settings_advisor.rs (335 行) 設定アドバイザー
│   ├── system_monitor.rs (140 行) システム監視
│   ├── thermal_monitor.rs (183 行) 温度監視
│   ├── timer.rs        (155 行) タイマー管理
│   └── watchdog.rs     (645 行) ウォッチドッグエンジン
│
├── infra/              ← 外部システム接続（FFI, PowerShell, Registry）
│   ├── mod.rs
│   ├── cpu_affinity.rs (226 行) CPU アフィニティ FFI
│   ├── etw.rs          (217 行) ETW（Event Tracing for Windows）
│   ├── gpu.rs          (140 行) NVIDIA GPU 情報（nvml-wrapper）
│   ├── power_plan.rs   (455 行) 電源プラン管理
│   ├── powershell.rs            PowerShell ヘルパー
│   ├── process_control.rs (460 行) プロセス制御 FFI
│   ├── registry.rs              レジストリアクセス
│   └── timer_resolution.rs (193 行) タイマーリゾリューション FFI
│
├── parsers/            ← データパーサー
│   ├── mod.rs
│   ├── ipconfig.rs     (287 行) ipconfig 出力パーサー
│   ├── log_parser.rs            ログパーサー
│   └── vdf.rs                   Steam VDF パーサー
│
├── emitters/           ← イベントエミッター
│   ├── mod.rs
│   └── unified_emitter.rs (455 行) 統合エミッター
│
├── types/              ← Rust 型定義
│   ├── mod.rs
│   └── game.rs         (667 行) ゲーム関連型
│
├── constants.rs                 定数・設定値
├── error.rs            (140 行) AppError 定義
├── lib.rs              (351 行) アプリケーションエントリ
├── main.rs                      main 関数
└── state.rs            (89 行)  共有状態定義
```

---

## 3. UnifiedEmitter

### 概要

v2.2 Phase 4 で 4 つの独立エミッター（pulse, ops, hardware, game_monitor）を
1 つの統合エミッターに集約。1 秒ベースループで tick ベースのスケジューリングを行う。

### ファイル

`src-tauri/src/emitters/unified_emitter.rs`（455 行）

### タイミング設計

```
Base loop: 1 秒
  tick % 2 == 0 → Pulse emit    (2 秒間隔)
  tick % 3 == 0 → Ops emit      (3 秒間隔) + game_monitor チェック
  tick % 5 == 0 → Hardware emit  (5 秒間隔) + thermal alert チェック
```

### CPU リフレッシュパターン

```
[1] CPU 1回目: sys.refresh_cpu_all() + sys.refresh_memory()
    → ロック取得・即解放（他コマンドをブロックしない）
[2] 200ms 待機（ロック外 — デルタ計算に必要な最小待機時間）
[3] CPU 2回目: sys.refresh_cpu_all() → デルタ計算可能に
```

この 2 段階リフレッシュは `sysinfo` の CPU 使用率計算に必要。
1 回のリフレッシュでは前回との差分がなく、正確な CPU 使用率が得られない。

### イベント一覧

| イベント名 | ペイロード | 間隔 | 用途 |
|-----------|-----------|------|------|
| `nexus://pulse` | `ResourceSnapshot` | 2 秒 | CPU/メモリ/ディスク/ネットワーク概要 |
| `nexus://ops` | `Vec<SystemProcess>` | 3 秒 | プロセスリスト（上位 100） |
| `nexus://hardware` | `HardwareInfo` | 5 秒 | ハードウェア詳細情報 |
| `nexus://thermal-alert` | `ThermalAlert` | 不定 | 温度アラート（状態変化時のみ） |

### Thermal Alert ロジック

- `ThermalState` を `LazyLock<Mutex<>>` で保持（スタティック変数）
- アラート状態が変化したとき、または最後の送信から 30 秒経過したときに emit
- 温度が正常に戻った場合、`Normal` レベルのアラートを送信
- CPU/GPU それぞれ独立にアラートレベルを判定

### Game Monitor 統合

- v2.2 以前: `game_monitor` は独立した spawn タスク
- v2.2 以降: `unified_emitter` の ops tick（3 秒）内で `check_once()` を呼び出し
- `active_games: HashMap<u32, ActiveGame>` を `start()` 関数内でローカル管理

---

## 4. 状態管理

### AppState（`state.rs`）

アプリケーション全体で共有するシステム情報。`Mutex<AppState>` として Tauri の
`manage()` で登録。

```rust
pub struct AppState {
    pub sys: System,              // sysinfo::System（唯一のインスタンス）
    pub networks: Networks,       // ネットワーク情報
    pub last_disk_read: u64,      // ディスク I/O デルタ用
    pub last_disk_write: u64,
    pub revert_snapshot: Option<RevertSnapshot>,  // ゲームプロファイルリバート用
    pub game_monitor_active: bool,
    pub timer_resolution_requested: Option<u32>,
    pub frame_time_session: Option<FrameTimeSession>,
    pub cpu_topology: Option<CpuTopology>,    // キャッシュ
    pub gpu_static: Option<GpuStaticInfo>,    // キャッシュ
    pub memory_cleaner: MemoryCleaner,
    pub polling_mode: PollingMode,
}
```

**重要ルール:**
- `System::new_all()` を各コマンドで直接呼び出すことは禁止
- `AppState.sys` が唯一の `System` インスタンス
- ロック保持時間は最小限にする（UnifiedEmitter が 1 秒ループで使用するため）

### WatchdogState

```rust
pub type WatchdogState = Arc<Mutex<WatchdogEngine>>;
```

- ウォッチドッグエンジンの状態を保持
- `lib.rs` の `setup` で初期化、ディスクからルールをロード

---

## 5. エラーハンドリング

### AppError（`error.rs`）

`thiserror` による自動実装。全コマンドの戻り値は `Result<T, AppError>`。

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    // ... その他のバリアント
}
```

**ルール:**
- `unwrap()` は本番コードで禁止（テストコードでは理由コメント付きで許可）
- 新しいエラーパターンは `AppError` にバリアントを追加
- フロントエンドへのエラーは plain object としてシリアライズされる（Tauri v2 仕様）

---

## 6. コマンド一覧

### AI

| コマンド | 引数 | 戻り値 | 説明 |
|---------|------|--------|------|
| `get_optimization_suggestions` | state, api_key | suggestions | AI 最適化提案 |
| `test_api_key` | api_key | bool | API キー検証 |
| `analyze_bottleneck_ai` | state, api_key | analysis | ボトルネック AI 分析 |

### Hardware / Power

| コマンド | 説明 |
|---------|------|
| `get_hardware_info` | ハードウェア情報取得 |
| `get_power_estimate` | 現在の電力消費推定 |
| `get_monthly_cost_estimate` | 月間電気代推定 |
| `set_eco_mode` | エコモード ON/OFF |
| `get_eco_mode_config` / `save_eco_mode_config` | エコモード設定 |

### Boost

| コマンド | 説明 |
|---------|------|
| `run_boost` | ブースト実行（レベル 1-3） |

### Game Profiles

| コマンド | 説明 |
|---------|------|
| `list_game_profiles` / `get_game_profile` | プロファイル取得 |
| `save_game_profile` / `delete_game_profile` | プロファイル CRUD |
| `apply_game_profile` / `revert_game_profile` | 適用/リバート |
| `start_game_monitor` / `stop_game_monitor` | ゲーム監視 ON/OFF |
| `get_cpu_topology` | CPU トポロジー情報 |
| `set_process_affinity` / `get_process_affinity` | CPU アフィニティ |
| `get_current_power_plan` | 現在の電源プラン |
| `get_suspend_candidates` | サスペンド候補プロセス |
| `export_game_profile` / `import_game_profile` | インポート/エクスポート |

### Process Management

| コマンド | 説明 |
|---------|------|
| `list_processes` | プロセスリスト |
| `kill_process` | プロセス終了 |
| `set_process_priority` | 優先度設定 |
| `get_ai_suggestions` | AI プロセス提案 |

### Windows Optimization（Windows のみ）

| コマンド | 説明 |
|---------|------|
| `get_win_settings` / `apply_win_setting` / `revert_win_setting` | Windows 設定 |
| `get_net_settings` / `apply_net_setting` / `revert_net_setting` | ネットワーク設定 |
| `flush_dns_cache` | DNS キャッシュフラッシュ |
| `get_windows_settings` | Windows 設定一括取得 |
| `set_power_plan` / `toggle_game_mode` / etc. | 個別 Windows 設定 |
| `get_settings_advice` / `apply_recommendation` | 設定アドバイザー |

### Network

| コマンド | 説明 |
|---------|------|
| `get_network_adapters` / `get_current_dns` / `set_dns` / `ping_host` | 基本ネットワーク |
| `get_tcp_tuning_state` | TCP チューニング状態 |
| `set_nagle_disabled` / `set_delayed_ack_disabled` / etc. | TCP 個別設定 |
| `apply_gaming_network_preset` / `reset_network_defaults` | プリセット |
| `measure_network_quality` | ネットワーク品質測定 |

### Storage

| コマンド | 説明 |
|---------|------|
| `get_storage_info` | ストレージ情報 |
| `cleanup_temp_files` / `cleanup_recycle_bin` / `cleanup_system_cache` | 個別クリーンアップ |
| `run_full_cleanup` | フルクリーンアップ |
| `analyze_disk_usage` | ディスク使用状況分析 |

### Log / Session / Watchdog / Script

| グループ | コマンド数 | 主な操作 |
|---------|-----------|---------|
| Log | 4 | 取得、分析、エクスポート |
| Session | 5 | CRUD、比較、メモ更新 |
| Watchdog | 6 | ルール CRUD、イベント取得、プリセット |
| Script | 6 | CRUD、実行、ログ管理 |
| Memory | 5 | 設定、手動/自動クリーンアップ |
| Cleanup | 2 | 全設定リバート、アプリデータ削除 |
| App Settings | 2 | 取得、保存 |
| Core Parking | 2 | 状態取得、設定 |
| Timer | 3 | 取得、設定、復元 |
| Frame Time | 3 | 開始、停止、状態取得 |

---

## 7. サービス一覧

| サービス | ファイル | 責務 |
|---------|---------|------|
| boost | `services/boost.rs` | ブーストエンジン（レベル 1-3 の最適化チェーン） |
| cleanup | `services/cleanup.rs` | リバートスナップショット管理 |
| core_parking | `services/core_parking.rs` | CPU コアパーキング状態管理 |
| cpu_topology | `services/cpu_topology.rs` | P-Core/E-Core 検出、コア間距離計算 |
| frame_time | `services/frame_time.rs` | ETW によるフレームタイム監視 |
| game_monitor | `services/game_monitor.rs` | ゲーム起動/終了の自動検知 |
| hardware | `services/hardware.rs` | GPU 情報取得（NVML）、CPU 温度 |
| health_check | `services/health_check.rs` | システムヘルスチェック |
| memory_cleaner | `services/memory_cleaner.rs` | メモリ自動クリーンアップ |
| network_monitor | `services/network_monitor.rs` | ネットワーク監視 |
| network_tuning | `services/network_tuning.rs` | TCP/DNS チューニング |
| power_estimator | `services/power_estimator.rs` | TDP ベースの電力消費推定 |
| process | `services/process.rs` | プロセス情報サービス |
| profile | `services/profile.rs` | ゲームプロファイル永続化・適用ロジック |
| session_store | `services/session_store.rs` | セッション永続化（JSON ファイル） |
| settings_advisor | `services/settings_advisor.rs` | Windows 設定の推奨値計算 |
| system_monitor | `services/system_monitor.rs` | システム監視 |
| thermal_monitor | `services/thermal_monitor.rs` | 温度監視・アラート生成 |
| timer | `services/timer.rs` | タイマーリゾリューション管理 |
| watchdog | `services/watchdog.rs` | プロセスウォッチドッグエンジン |

---

## 8. インフラ層

| モジュール | 責務 | 外部依存 |
|-----------|------|---------|
| `cpu_affinity.rs` | CPU アフィニティ設定 | Windows API（FFI） |
| `etw.rs` | Event Tracing for Windows | Windows API（FFI） |
| `gpu.rs` | NVIDIA GPU 情報 | `nvml-wrapper` |
| `power_plan.rs` | 電源プラン管理 | PowerShell |
| `powershell.rs` | PowerShell 実行ヘルパー | `std::process::Command` |
| `process_control.rs` | プロセス優先度・サスペンド・Kill | Windows API（FFI） |
| `registry.rs` | レジストリ読み書き | `winreg` |
| `timer_resolution.rs` | タイマーリゾリューション | `ntdll.dll`（FFI） |

### セキュリティルール

- PowerShell コマンド構築に `format!` + ユーザー入力を直接使用禁止
- `infra/powershell.rs` のヘルパー関数を経由すること
- レジストリ変更時は必ずリバート用スナップショットを保存

---

## 9. 規約

### Rust コーディング規約

- `cargo clippy -- -D warnings` + `cargo fmt` を全コミットで通す
- `unwrap()` は本番コードで禁止（テストは理由コメント付きで許可）
- `unsafe` は原則禁止（使用時はコメントで理由を明記）
- ロギング: `tracing` クレート（`info!` / `warn!` / `error!` / `debug!`）
- `println!` / `eprintln!` は本番コードで禁止

### ファイルサイズ

- 目標: 300 行以下（現在 25 ファイルが超過 — v3.1 で段階対処）
- Rust は単一責務ファイルが多く、無理な分割は破壊リスクが高いため慎重に対処

### テスト

- `services/` レイヤーにユニットテストを集中
- `#[cfg(test)] mod tests` パターン
- 現在 233+ テスト
- カバレッジ目標: 80%+

### 新コマンド追加チェックリスト

```
□ commands/*.rs に #[tauri::command] 関数を追加
□ services/*.rs にビジネスロジックを実装
□ lib.rs の build_invoke_handler() に登録（Windows + non-Windows 両方）
□ error.rs に必要なエラーバリアントを追加
□ capabilities/default.json に権限を追加（必要な場合）
□ フロントエンドの型定義を types/index.ts に追加
□ テストを追加
```
