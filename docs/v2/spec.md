# NEXUS v2 — 確定版 spec.md

> Version: 2.0.0
> Status: Confirmed (Claude Code 突合チェック済み)
> Base Commit: feature/v2-optimize-core
> Last Updated: 2026-03-20

---

## 1. プロダクト定義

### 1.1 ビジョン

「AI がシステム状態を横断的に読み取り、今すぐ実行できる最適化をワンクリックで提案・適用する」
Windows ゲーミング PC 向けデスクトップアプリ。

### 1.2 コアバリュー

ユーザーに知識を要求しない。
AI が「何をすべきか」を判断し、ユーザーは「やるかやらないか」だけ決める。

### 1.3 技術スタック

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Shell     | Tauri v2                         |
| Backend   | Rust (async / tokio)             |
| Frontend  | React 19 + TypeScript 5 strict   |
| Styling   | Tailwind CSS v4                  |
| AI        | Perplexity Sonar API (`ai` command proxy) |
| State     | Zustand                          |
| Test (FE) | Vitest + Stryker (mutation)      |
| Test (BE) | cargo test                       |
| Lint      | Biome                            |

### 1.4 デザイントークン

| Token             | Value              |
| ----------------- | ------------------ |
| Accent            | Cyan `#06B6D4`     |
| Background        | Jet Black `#0C0C10`|
| Surface           | `#14141A`          |
| Surface Elevated  | `#1C1C24`          |
| Border Subtle     | `#2A2A36`          |
| Text Primary      | `#F0F0F5`          |
| Text Secondary    | `#8888A0`          |
| Warning           | Amber `#F59E0B`    |
| Error             | Red `#EF4444`      |
| Success           | Green `#22C55E`    |
| Font              | B612 / B612 Mono   |
| Border Radius     | 4px                |
| Sidebar Width     | 48px (icon-only)   |

---

## 2. 競合差別化 — やらないこと（Non-Goals）

| 機能               | 競合                          | 理由                        |
| ------------------ | ----------------------------- | -------------------------- |
| ファン制御          | FanControl / HWiNFO           | ハードウェア依存が強すぎる   |
| GPU オーバークロック | NVIDIA App / MSI Afterburner  | ドライバ直接操作は危険       |
| ゲームライブラリ管理 | Steam / Xbox App              | プラットフォーム固有API依存  |
| FPS オーバーレイ    | NVIDIA App / Steam Overlay    | 描画フック不要な設計方針     |
| Windows Update 実行 | Windows Settings              | OS操作の範囲外              |

---

## 3. 既存 Rust コマンド — 流用資産

### 3.1 残すコマンド（突合チェック済み）

| Command | ファイル | 関数シグネチャ | 所属 Wing |
|---------|---------|--------------|-----------|
| pulse | pulse.rs | `get_resource_snapshot(state) -> ResourceSnapshot` | MONITOR |
| hardware | hardware.rs | `get_hardware_info(state) -> HardwareInfo` | MONITOR / DASHBOARD |
| hardware | hardware.rs | `get_power_estimate(state) -> PowerEstimate` | MONITOR |
| hardware | hardware.rs | `get_monthly_cost_estimate(config, hours) -> MonthlyCostEstimate` | GAMING |
| hardware | hardware.rs | `set_eco_mode(enabled, config) -> ()` | GAMING |
| hardware | hardware.rs | `get_eco_mode_config(app) -> EcoModeConfig` | GAMING |
| hardware | hardware.rs | `save_eco_mode_config(app, config) -> ()` | GAMING |
| bottleneck | bottleneck.rs | `analyze_bottleneck(request) -> BottleneckResult` | DASHBOARD (AI入力) |
| boost | boost.rs | `run_boost(threshold_percent) -> BoostResult` | GAMING |
| winopt | winopt.rs | `get_win_settings() -> Vec<WinSetting>` | GAMING |
| winopt | winopt.rs | `apply_win_setting(id) -> ()` | GAMING |
| winopt | winopt.rs | `revert_win_setting(id) -> ()` | GAMING |
| winopt | winopt.rs | `get_net_settings() -> Vec<WinSetting>` | GAMING |
| winopt | winopt.rs | `flush_dns_cache() -> String` | GAMING |
| winopt | winopt.rs | `apply_net_setting(id) -> ()` | GAMING |
| winopt | winopt.rs | `revert_net_setting(id) -> ()` | GAMING |
| netopt | netopt.rs | `get_network_adapters() -> Vec<NetworkAdapter>` | GAMING |
| netopt | netopt.rs | `get_current_dns() -> Vec<String>` | GAMING |
| netopt | netopt.rs | `set_dns(adapter, primary, secondary) -> ()` | GAMING |
| netopt | netopt.rs | `ping_host(target) -> PingResult` | GAMING |
| netopt | netopt.rs | `get_tcp_tuning_state() -> TcpTuningState` | GAMING |
| netopt | netopt.rs | `set_nagle_disabled(disabled) -> ()` | GAMING |
| netopt | netopt.rs | `set_delayed_ack_disabled(disabled) -> ()` | GAMING |
| netopt | netopt.rs | `set_network_throttling(index) -> ()` | GAMING |
| netopt | netopt.rs | `set_qos_reserved_bandwidth(percent) -> ()` | GAMING |
| netopt | netopt.rs | `set_tcp_auto_tuning(level) -> ()` | GAMING |
| netopt | netopt.rs | `apply_gaming_network_preset() -> TcpTuningState` | GAMING |
| netopt | netopt.rs | `reset_network_defaults() -> TcpTuningState` | GAMING |
| netopt | netopt.rs | `measure_network_quality(target, count) -> NetworkQualitySnapshot` | GAMING |
| windows_settings | windows_settings.rs | `get_windows_settings() -> WindowsSettings` | DASHBOARD (AI入力) |
| windows_settings | windows_settings.rs | `set_power_plan(plan) -> ()` | GAMING |
| windows_settings | windows_settings.rs | `toggle_game_mode() -> bool` | GAMING |
| windows_settings | windows_settings.rs | `toggle_fullscreen_optimization() -> bool` | GAMING |
| windows_settings | windows_settings.rs | `toggle_hardware_gpu_scheduling() -> bool` | GAMING |
| windows_settings | windows_settings.rs | `set_visual_effects(effect) -> ()` | GAMING |
| windows_settings | windows_settings.rs | `get_settings_advice() -> AdvisorResult` | DASHBOARD |
| windows_settings | windows_settings.rs | `apply_recommendation(setting_id) -> ()` | DASHBOARD |
| memory | memory.rs | `get_memory_cleaner_config(state) -> MemoryCleanerConfig` | GAMING |
| memory | memory.rs | `update_memory_cleaner_config(config, state) -> ()` | GAMING |
| memory | memory.rs | `manual_memory_cleanup(app) -> MemoryCleanupResult` | GAMING |
| memory | memory.rs | `start_auto_memory_cleanup(app, state) -> ()` | GAMING |
| memory | memory.rs | `stop_auto_memory_cleanup(state) -> ()` | GAMING |
| core_parking | core_parking.rs | `get_core_parking_state() -> CoreParkingState` | GAMING |
| core_parking | core_parking.rs | `set_core_parking(min_cores_percent) -> ()` | GAMING |
| timer | timer.rs | `get_timer_resolution(state) -> TimerResolutionState` | GAMING |
| timer | timer.rs | `set_timer_resolution(state, resolution_100ns) -> TimerResolutionState` | GAMING |
| timer | timer.rs | `restore_timer_resolution(state) -> ()` | GAMING |
| ai | ai.rs | `get_optimization_suggestions(process_names) -> Vec<String>` | DASHBOARD |
| ai | ai.rs | `test_api_key() -> bool` | SETTINGS |
| ai | ai.rs | `analyze_bottleneck_ai(request) -> AiBottleneckResponse` | DASHBOARD |
| session | session.rs | `list_sessions(app) -> Vec<SessionListItem>` | HISTORY |
| session | session.rs | `get_session(app, session_id) -> SavedFrameTimeSession` | HISTORY |
| session | session.rs | `delete_session(app, session_id) -> ()` | HISTORY |
| session | session.rs | `compare_sessions(app, a_id, b_id) -> SessionComparisonResult` | HISTORY |
| session | session.rs | `update_session_note(app, session_id, note) -> ()` | HISTORY |
| app_settings | app_settings.rs | `get_app_settings(app) -> AppSettings` | SETTINGS |
| app_settings | app_settings.rs | `save_app_settings(app, settings) -> ()` | SETTINGS |
| ops | ops.rs | `list_processes(state) -> Vec<SystemProcess>` | GAMING / MONITOR |
| ops | ops.rs | `kill_process(state, pid) -> String` | GAMING |
| ops | ops.rs | `set_process_priority(pid, priority) -> String` | GAMING |
| ops | ops.rs | `get_ai_suggestions(state) -> Vec<String>` | DASHBOARD |
| health_check | health_check.rs | `run_health_check(input) -> HealthCheckResult` | DASHBOARD |
| frame_time | frame_time.rs | `start_frame_time_monitor(app, state, pid, process_name) -> FrameTimeMonitorState` | MONITOR |
| frame_time | frame_time.rs | `stop_frame_time_monitor(state) -> FrameTimeMonitorState` | MONITOR |
| frame_time | frame_time.rs | `get_frame_time_status(state) -> FrameTimeMonitorState` | MONITOR |
| cleanup | cleanup.rs | `revert_all_settings(state) -> RevertAllResult` | GAMING |

### 3.2 削除するコマンド

| Command | ファイル | 関数数 | 削除理由 |
|---------|---------|--------|---------|
| launcher | launcher.rs | 2 | Non-Goal（ゲームライブラリ管理） |
| launcher_settings | launcher_settings.rs | 3 | 上記に依存 |
| profile | profile.rs | 14 | Wing 統合により不要（提案ベースに移行） |
| watchdog | watchdog.rs | 6 | v2 では AI 提案が監視を代替 |
| script | script.rs | 6 | セキュリティリスク |
| storage | storage.rs | 8 | Non-Goal（PCManager 領域） |
| log | log.rs | 4 | SETTINGS に簡易ログのみ残す |
| cleanup (一部) | cleanup.rs | 1 | `cleanup_app_data` のみ削除、`revert_all_settings` は残す |

---

## 4. Wing 構成（ADR-005）

```
┌──────────────────────────────────────────────────┐
│  SIDEBAR (48px, icon-only)                        │
│                                                    │
│  ⊙  DASHBOARD   ← デフォルト表示                   │
│  ⚡ GAMING                                        │
│  📊 MONITOR                                       │
│  📋 HISTORY                                       │
│  ⚙  SETTINGS                                     │
└──────────────────────────────────────────────────┘
```

### 4.1 DASHBOARD Wing

**目的**: AI 提案一覧・ヘルススコア・ワンクリック最適化

#### Health Score アルゴリズム（ADR-003）

| 要素 | 最大ポイント | 判定基準 |
|------|-----------|---------|
| Game Mode ON | 15 | `gameModeEnabled === true` |
| 高パフォーマンス電源 | 15 | `powerPlanHighPerf === true` |
| Timer Resolution | 10 | `timerResolutionLow === true` |
| Nagle 無効 | 10 | `nagleDisabled === true` |
| 視覚効果 OFF | 10 | `visualEffectsOff === true` |
| CPU 温度正常 | 10 | `cpuTemp < 80` (段階的減点) |
| GPU 温度正常 | 10 | `gpuTemp < 85` (段階的減点) |
| MEM 使用率正常 | 10 | `memUsageRatio < 0.8` (段階的減点) |
| ボトルネック無し | 10 | `bottleneckRatio < 0.3` (段階的減点) |
| **合計** | **100** | |

**Grade 判定**: S: 90-100 / A: 80-89 / B: 60-79 / C: 40-59 / D: 0-39

#### Suggestion ルール一覧（ルールベース — AI 不要で動作）

| ID | 条件 | Priority | Title | Impact |
|----|------|----------|-------|--------|
| `game-mode` | `gameModeEnabled === false` | critical | Game Mode を有効にする | +15 pts |
| `power-plan` | `powerPlanHighPerf === false` | critical | 電源プランを高パフォーマンスに | +15 pts |
| `timer-res` | `timerResolutionLow === false` | recommended | Timer Resolution を 0.5ms に | +10 pts |
| `nagle` | `nagleDisabled === false` | recommended | Nagle アルゴリズムを無効化 | +10 pts |
| `visual-effects` | `visualEffectsOff === false` | recommended | 視覚効果をオフにする | +10 pts |
| `cpu-thermal` | `cpuTemp >= 80` | critical | CPU 温度が高い — 冷却確認 | 警告 |
| `gpu-thermal` | `gpuTemp >= 85` | critical | GPU 温度が高い — 冷却確認 | 警告 |
| `mem-pressure` | `memUsageRatio >= 0.8` | recommended | メモリ使用率が高い — 解放推奨 | +10 pts |
| `bottleneck` | `bottleneckRatio >= 0.3` | critical | ボトルネック検出 — 要確認 | 警告 |
| `heavy-process` | CPU 15%+ プロセス 3件以上 | recommended | 不要プロセスの優先度を下げる | 可変 |

#### Dashboard レイアウト

```
┌───────────────────────────────────────────────────┐
│  SYSTEM HEALTH: 72/100  [B]                        │
│  "3つの最適化で推定 +28 ポイント"                     │
│                                                     │
│  ┌─ CRITICAL ────────────────────────────────────┐ │
│  │ ⚡ Game Mode を有効にする        [適用] +15   │ │
│  │ ⚡ 電源プラン変更                [適用] +15   │ │
│  └───────────────────────────────────────────────┘ │
│  ┌─ RECOMMENDED ─────────────────────────────────┐ │
│  │ 💡 Nagle 無効化                  [適用] +10   │ │
│  │ 💡 Timer Resolution              [適用] +10   │ │
│  └───────────────────────────────────────────────┘ │
│  ┌─ APPLIED ─────────────────────────────────────┐ │
│  │ ✓ DNS: Cloudflare    ✓ 視覚効果: OFF          │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ SYSTEM STATUS ────┐  ┌─ QUICK STATS ────────┐ │
│  │ CPU 45%  62℃       │  │ Sessions Today: 3    │ │
│  │ GPU 30%  58℃       │  │ Last Optimized: 2h前 │ │
│  │ MEM 6.2/16 GB      │  │ AI Layer: ACTIVE     │ │
│  └────────────────────┘  └──────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### 4.2 GAMING Wing

**目的**: ゲーム最適化の詳細制御

#### セクション構成

| セクション | 対応コマンド | 内容 |
|-----------|------------|------|
| Optimize All | 全コマンド統合 | プリセット選択 + チェックリスト + [すべて適用] |
| Windows | winopt | GameMode, 視覚効果, 電源プラン |
| Process | boost + ops | プロセス優先度制御, 不要プロセス停止 |
| Network | netopt + winopt(net) | Nagle, DNS, TCP設定 |
| Memory | memory | Working Set トリム, 自動クリーンアップ |
| Timer | timer | Timer Resolution 設定 |
| CPU | core_parking | コアパーキング制御 |

#### Optimize Preset 定義

**Gaming Preset:**
| Step | Command | Risk | Default |
|------|---------|------|---------|
| Game Mode ON | `toggle_game_mode` | safe | ✓ |
| Power Plan → High Performance | `set_power_plan` | safe | ✓ |
| Visual Effects → Best Performance | `set_visual_effects` | safe | ✓ |
| Timer Resolution → 0.5ms | `set_timer_resolution` | safe | ✓ |
| Nagle → Disabled | `set_nagle_disabled` | medium | ✗ |
| Boost (不要プロセス停止) | `run_boost` | medium | ✗ |
| Core Parking → 0% | `set_core_parking` | medium | ✗ |
| Memory Cleanup | `manual_memory_cleanup` | safe | ✓ |

**Power Save Preset:**
| Step | Command | Risk | Default |
|------|---------|------|---------|
| Power Plan → Balanced | `set_power_plan` | safe | ✓ |
| Timer Resolution → Restore | `restore_timer_resolution` | safe | ✓ |
| Core Parking → Default | `set_core_parking` | safe | ✓ |

**Streaming Preset:**
| Step | Command | Risk | Default |
|------|---------|------|---------|
| Game Mode ON | `toggle_game_mode` | safe | ✓ |
| Power Plan → High Performance | `set_power_plan` | safe | ✓ |
| Timer Resolution → 1.0ms | `set_timer_resolution` | safe | ✓ |

### 4.3 MONITOR Wing

**目的**: リアルタイム監視（CPU/GPU/MEM/FPS）

- pulse イベント 500ms 間隔で受信（ADR-007）
- ローリングバッファ: 直近 120 サンプル（60秒分）保持
- グラフ描画: Canvas ベース（外部ライブラリ不要）
- Frame Time Monitor: frame_time.rs コマンドで FPS/フレームタイム計測

### 4.4 HISTORY Wing

**目的**: セッション履歴・パフォーマンストレンド

- session.rs の既存コマンドで CRUD
- 7日 / 30日 切り替えのトレンドグラフ
- セッション比較（compare_sessions）

### 4.5 SETTINGS Wing

**目的**: 最小限の設定画面

- API キー管理（テスト機能付き）
- AI 有効/無効
- パルス間隔設定
- 自動モニター開始
- 起動時設定（スタートアップ、トレイ最小化）
- 言語設定（日/英）

---

## 5. 状態管理ストア一覧

| Store | ファイル | 主要 State | 主要 Actions |
|-------|---------|-----------|-------------|
| useHealthStore | stores/useHealthStore.ts | healthScore, suggestions, appliedActions | recalculate, applySuggestion, rollbackSuggestion |
| useOptimizeStore | stores/useOptimizeStore.ts | activePreset, steps, stepEnabled, lastResult | selectPreset, applyPreset, rollbackPreset, runOptimizeAll |
| useAiStore | stores/useAiStore.ts | activeLayer, hasApiKey, lastAnalysis | detectLayer, analyze, testApiKey |
| useHistoryStore | stores/useHistoryStore.ts | sessions, selectedSession, trendRange | fetchSessions, selectSession, deleteSession |
| useMonitorStore | stores/useMonitorStore.ts | samples (CircularBuffer), latest | pushSample |
| useSettingsStore | stores/useSettingsStore.ts | settings (V2AppSettings) | load, save |
| useNavStore | stores/useNavStore.ts | activeWing (WingId) | setWing |

型定義: `src/stores/types/` に State + Actions のインターフェースを配置。

---

## 6. コンポーネントツリー

```
src/components/
├── ui/                        # 共通 UI コンポーネント
│   ├── Card.tsx
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── ProgressBar.tsx
│   ├── Toggle.tsx
│   └── ErrorBoundary.tsx
├── dashboard/
│   ├── DashboardWing.tsx      # エントリポイント
│   ├── HealthScoreBar.tsx     # スコア表示 + ラベル
│   ├── SuggestionList.tsx     # priority でグループ分けされたリスト
│   ├── SuggestionCard.tsx     # priority 別カード
│   ├── AppliedBadgeRow.tsx    # 適用済み一覧
│   ├── SystemStatusCard.tsx   # CPU/GPU/MEM ミニステータス
│   └── QuickStatsCard.tsx     # セッション統計
├── gaming/
│   ├── GamingWing.tsx         # エントリポイント + セクション切替
│   ├── OptimizeNowPanel.tsx   # プリセット選択 + チェックリスト
│   ├── OptimizationCard.tsx   # 統一カード UI（各最適化項目）
│   ├── WindowsSettingsPanel.tsx
│   ├── ProcessPanel.tsx
│   ├── NetworkPanel.tsx
│   ├── MemoryPanel.tsx
│   ├── TimerPanel.tsx
│   └── CpuPanel.tsx
├── monitor/
│   ├── MonitorWing.tsx
│   ├── MetricCard.tsx         # CPU/GPU/MEM/FPS 個別カード
│   ├── TimelineGraph.tsx      # 60s ローリングウィンドウ
│   └── FrameTimePanel.tsx     # フレームタイム監視
├── history/
│   ├── HistoryWing.tsx
│   ├── TrendChart.tsx         # 7d/30d トレンド
│   ├── SessionList.tsx
│   └── SessionDetail.tsx
├── settings/
│   └── SettingsWing.tsx       # フォーム 1 画面
└── layout/
    ├── Sidebar.tsx
    ├── Titlebar.tsx
    └── AppShell.tsx
```

---

## 7. Tauri コマンド → UI アクション マッピング

| UI アクション | invoke コマンド | Wing |
|-------------|----------------|------|
| Health Score 算出 | `get_windows_settings` + `get_resource_snapshot` + `analyze_bottleneck` | DASHBOARD |
| Suggestion 適用 | SuggestionAction.invokeCommand に依存 | DASHBOARD |
| Optimize All | プリセット定義の全ステップを順次 invoke | GAMING |
| プロセス停止 | `kill_process` | GAMING |
| プロセス優先度変更 | `set_process_priority` | GAMING |
| DNS 変更 | `set_dns` | GAMING |
| Nagle 無効化 | `set_nagle_disabled` | GAMING |
| Timer 設定 | `set_timer_resolution` | GAMING |
| メモリクリーンアップ | `manual_memory_cleanup` | GAMING |
| コアパーキング | `set_core_parking` | GAMING |
| リアルタイム監視 | `get_resource_snapshot` (pulse event) | MONITOR |
| FPS 計測開始 | `start_frame_time_monitor` | MONITOR |
| セッション一覧 | `list_sessions` | HISTORY |
| API キーテスト | `test_api_key` | SETTINGS |
| 設定保存 | `save_app_settings` | SETTINGS |
| 全設定リバート | `revert_all_settings` | GAMING |

---

## 8. 品質基準

### 8.1 コード品質

| 項目 | 基準 |
|------|------|
| TypeScript | strict モード、`any` 禁止 |
| Lint エラー | ゼロ（Biome） |
| インラインスタイル | 禁止（Tailwind クラスのみ） |
| console.log | 禁止（本番コード） |
| コンポーネント | 全て `memo()` でラップ |
| 型定義 | `src/types/` に集約、コンポーネント内型定義禁止 |

### 8.2 テスト基準

| 対象 | ツール | 目標 |
|------|--------|------|
| lib/ 純粋関数 | Vitest | カバレッジ 90%+ |
| Stryker mutation | Stryker | mutation score 70%+ |
| Rust コマンド | cargo test | 各コマンド最低 5 ケース |
| 境界値テスト | Vitest | スコア境界 (0,39,40,59,60,79,80,89,90,100) |

### 8.3 パフォーマンス基準

| 項目 | 目標 |
|------|------|
| 起動時間 | < 2 秒 |
| pulse イベント遅延 | < 50ms |
| メモリ使用量 | < 100 MB |
| バンドルサイズ | < 15 MB |

---

## 9. 実装フェーズ

### Phase 1: クリーンアップ
- 削除対象 8 ファイル（Rust）+ 関連フロントエンドコンポーネント削除
- Wing ID を 5 つに更新
- `tsc --noEmit && cargo check` 通過

### Phase 2: 基盤
- `src/lib/healthScore.ts` + `src/lib/suggestionEngine.ts` 実装（純粋関数）
- 境界値テスト完備
- `src/types/v2.ts` の型を使用

### Phase 3: Dashboard
- Zustand ストア構築（useHealthStore, useAiStore）
- DASHBOARD Wing UI 実装
- ワンクリック適用フロー

### Phase 4: Gaming
- useOptimizeStore 構築
- GAMING Wing UI 実装（7 セクション）
- Optimize All ワンクリック

### Phase 5: AI 統合
- `src/lib/aiAnalyzer.ts` 実装
- Perplexity Sonar API 統合
- Graceful Degradation テスト（ADR-004）

### Phase 6: Monitor + History
- pulse イベント購読 + ローリングバッファ（ADR-007）
- リアルタイムグラフ描画
- セッション記録・一覧・トレンド表示

### Phase 7: Settings + 統合テスト
- SETTINGS Wing
- 全体結合テスト
- Stryker mutation テスト実行
- CI 統合

---

## 10. Open Questions（回答済み）

| # | 質問 | 回答 |
|---|------|------|
| Q1 | frame_time.rs は MONITOR Wing に統合するか、削除するか？ | **統合**。MONITOR Wing の FrameTimePanel として活用。 |
| Q2 | セッション自動検出の精度 | v2.0 では手動開始。v2.1 で自動検出を検討。 |
| Q3 | Perplexity Sonar API のレート制限対応 | 1分間隔のデバウンス + キャッシュ。ADR-004 の Layer 2 フォールバック。 |
| Q4 | Windows 11 専用 API 活用 | v2.0 では使用しない。v2.1 で検討。 |
| Q5 | EcoMode の扱い | GAMING Wing の一セクションとして統合。 |

---

*End of confirmed spec.md*
