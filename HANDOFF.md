# nexus — HANDOFF.md

> **Cascade ↔ Claude Code 引き継ぎログ**
> ステータス: `pending` → `in-progress` → `review` → `done`
> UI 実装時は必ず [`DESIGN.md`](DESIGN.md) を参照すること
> 設計詳細は [`docs/reviews/`](docs/reviews/) を参照すること

---

## 現在のステータス

| 項目 | 状態 |
|------|------|
| ベースライン（T1-T10） | ✅ 完了 |
| オーバーホール（OH1-OH8, OH-B3, OH-E1〜E4） | ✅ 完了 |
| 再構築 Phase 0 | ✅ 完了 |
| 再構築 Phase 1 | ✅ 完了 |
| 再構築 Phase 2 | ✅ 完了 |
| 再構築 Phase 4 | ✅ 完了 |
| 再構築 Phase 5 | ✅ 完了 |
| 再構築 Phase 3 | ✅ 完了 |
| 再構築 Phase 6 | ✅ 完了（6A: useShallow, 6B: React.lazy, 6C: useEffect, 6D: 型安全化） |
| 再構築 Phase 7 | ✅ 完了（7A: UIテスト, 7B: E2E, 7C: Rustテスト, 7D: ipconfig日本語+keyring） |
| ゲーム強化 Phase 8a | ✅ 完了（8a-A〜D: 型定義・CRUD・コマンド・FE + テスト40件） |
| ゲーム強化 Phase 8b | ✅ 完了（8b-A〜C: CPU affinity FFI・Level 2/3 boost・UI + テスト30件） |
| ゲーム強化 Phase 9b-A | ✅ 完了（タイマーリゾリューション FFI + サービス + コマンド） |
| ゲーム強化 Phase 9b-B | ✅ 完了（タイマーリゾリューション UI: WinoptTab + ProfileTab） |
| ゲーム強化 Phase 9b-C | ✅ 完了（ETW フレームタイム監視 + FrameTimeCard/Graph UI） |
| ゲーム強化 Phase 10 | ✅ 完了（GameReadinessScore 再設計 + 3軸スコア + 推奨リスト） |
| OH-B1 リアルタイムプロセスリスト | ✅ 完了（ProcessTab: フィルタ・ソート・アクション行・KILL確認Modal・FFI優先度設定） |
| OH-B2 NVIDIA GPU 使用率 | ✅ 完了（nvml-wrapper: GPU使用率・VRAM・温度 + PowerShell フォールバック） |
| OH-B4 全設定リバート | ✅ 完了（revert_all_settings + cleanup_app_data + SettingsWing MAINTENANCE セクション） |
| Design Refresh R1 | ✅ 完了（ディレクトリ名変更・FpsTimelineGraph cyan・ErrorBoundary log・visitedWings） |
| Design Refresh R2 | ✅ 完了（HomeWing 3-section: HeroSection/ActionRow/TimelineSection、27行、store直参照なし） |
| Design Refresh R3 | ✅ 完了（フック抽出3本・SettingsWing分離・assertNever・孤立ファイル削除） |
| Design Refresh R4 | ✅ 完了（キーボードショートカット・セッションタブ・JSX 200行以内分割） |
| Design Refresh R5 | ✅ 完了（バンドル最適化・PerformanceTimelineCard分割・assertNever適用・テスト拡充） |
| v2.1 Phase 1 | ✅ 完了（navigation 型定義 + NavStore 基盤: SubpageEntry / WingNavState / WingId per-Wing states） |
| v2.1 Phase 2 | ✅ 完了（activeWing 同期 + Escape 優先チェーン: Modal isOpen → popSubpage 順序） |
| v2.1 Phase 3 | ✅ 完了（Modal wire-up: openModal/closeModal カウンター + WingHeader breadcrumbs） |
| v2.1 Phase 4 | ✅ 完了（ProfileTab サブページ化 + SettingsWing/NetoptWing TabBar NavStore 統合） |
| v2.1 P4.5 | ✅ 完了（残存 Wing ヘッダーラベル全撤去: 5 Wings + テスト 2 件削除） |
| v2.2 Phase 2 | ✅ 完了（コンポーネント分割 Phase 2: 6ファイル、WatchdogRuleModal 本実装化含む） |
| v2.2 Phase 3-A | ✅ 完了（コンポーネント分割 Phase 3-A: 6ファイル → 14サブコンポーネント） |
| v2.2 Phase 3-B | ✅ 完了（Store ロジック → lib/ 抽出: 4ストア） |
| v2.2 Phase 3-C | ✅ 完了（gameReadiness/localAi ディレクトリ化） |
| v2.2 Phase 4 | ✅ 完了（UnifiedEmitter: 4タスク → 1タスク統合、28c7ca7） |
| **v3.0 Phase 1** | ✅ 完了（ワークフロー基盤構築: TESTING.md + BACKEND.md + 3 lint スクリプト + CI 更新） |

**最新コミット:** v3.0 Phase 1 作業中（ベース: `28c7ca7`）
**テスト:** TS 542 + Rust 230+ all green（Phase 1 はコード変更なし、テスト数不変）

---

## 再構築フェーズ（Phase 0〜7）完了サマリー

> 詳細な実装指示は `git log` で確認可能。
> レビュー根拠: `docs/reviews/frontend-review.md` / `docs/reviews/backend-review.md`

### Phase 0: クリティカルバグ修正

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `c4a71e3` + `3c0ccf4`

修正内容: useLauncherStore 型エラー / useScriptStore isRunning バグ / pulse.rs Mutex 中 sleep / get_storage_info 二重登録 / run_boost 動作不明確

---

### Phase 1: セキュリティ基盤

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `39a2e5b`

修正内容: PowerShell インジェクション対策 / CSP ポリシー厳格化 / capabilities コマンド別 permission / 入力バリデーション / 保護プロセスリスト統合（constants.rs）

---

### Phase 2: ドキュメント・設定整合

**ステータス:** ✅ 完了（2026-03-18）

修正内容: 未使用クレート削除（regex, walkdir 等）/ WatcherState + notify 削除 / tokio features 最小化 / styles.ts 削除

---

### Phase 3: フロントエンド基盤強化

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `d5e3920`（+ 複数）

修正内容: useSettingsStore 統合 / useShallow 導入 / 共通コンポーネント（ErrorBanner, LoadingState 等） / HomeWing・LogWing 分割 / パフォーマンス改善

---

### Phase 4: バックエンド再設計

**ステータス:** ✅ 完了（2026-03-18）

修正内容: 4層アーキテクチャ（commands/services/infra/parsers）/ System インスタンス共有 / 重い同期コマンドの async 化 / AppError 拡張 / winreg クレート導入

---

### Phase 5: Tauri v2 フル活用

**ステータス:** ✅ 完了（2026-03-18）

修正内容: ポーリング → Tauri イベントシステム移行（pulse:snapshot/ops:processes/hw:info）/ tauri-plugin-shell 導入 / capabilities 拡充

---

### Phase 6: React 19 / Zustand v5 活用

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `a537058`（6A）, `e8c4d07`（6C）, 他

修正内容: use() + Suspense / useActionState / useOptimistic / React.lazy + code splitting / Rust edition 2024 移行

---

### Phase 7: 品質仕上げ

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `4f5b86d`（7A）, `4ea7c7d`（7B）, `6dd0396`（7C）, `add6906`（7D）

修正内容: 共通 UI コンポーネントテスト / E2E テスト拡充（Playwright 17件）/ services/ Rust ユニットテスト / ipconfig 日本語ロケール対応 / keyring API キー暗号化

---

## ゲーム強化フェーズ（Phase 8〜10）完了サマリー

### Phase 8a: ゲームプロファイル基盤

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `b7d236f`（8a-A）, `bdbdbe7`（8a-B）, `0b80de0`（8a-C）, `cd0a829`（8a-D）

主要ファイル: `types/game.rs`, `services/profile.rs`, `services/game_monitor.rs`, `commands/profile.rs`, `infra/process_control.rs`, `src/stores/useGameProfileStore.ts`, `src/components/boost/ProfileTab.tsx`

実装内容: ゲームプロファイル CRUD（JSON保存）/ WMI ゲーム起動検出 / Level 1 ブースト（NtSuspendProcess FFI）/ 自動リバート / Tauri イベント / ProfileTab UI

---

### Phase 8b: CPU アフィニティ・段階的ブースト再設計

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `b4ea0b1`（8b-A+B）, `571ffa1`（8b-C）

主要ファイル: `infra/cpu_affinity.rs`, `services/cpu_topology.rs`, `services/boost.rs`, `commands/profile.rs`, `src/components/boost/AffinityPanel.tsx`

実装内容: CPU トポロジー検出（P/E-Core）/ CPU アフィニティ設定 FFI / Level 2（電源プラン + アフィニティ）/ Level 3（不要プロセス終了）

---

### Phase 9b: タイマーリゾリューション + UI

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `39fc0b4`（9b-A）, `9bb53e4`（9b-B）

主要ファイル: `infra/timer_resolution.rs`, `services/timer.rs`, `commands/timer.rs`, `src/stores/useTimerStore.ts`, `src/components/boost/TimerSection.tsx`

実装内容: NtSetTimerResolution FFI / AppState 統合 / WinoptTab + ProfileTab UI

---

### Phase 9b-C: ETW フレームタイム監視

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `e3b5791`

主要ファイル: `infra/etw.rs`, `services/frame_time.rs`, `commands/frame_time.rs`, `src/stores/useFrameTimeStore.ts`, `src/components/home/FrameTimeCard.tsx`, `src/components/home/FrameTimeGraph.tsx`

実装内容: ferrisetw ETW セッション / フレームタイム統計計算 / リアルタイム emit 1秒間隔

---

### Phase 10: GameReadinessScore 再設計

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `3d40cfb`

主要ファイル: `src/lib/gameReadiness.ts`, `src/components/home/GameReadinessPanel.tsx`, `src/components/home/ReadinessGauge.tsx`, `src/components/home/RecommendationList.tsx`

実装内容: 3軸スコア（リソース/最適化/パフォーマンス）/ Canvas 円弧ゲージ / 優先度付き推奨リスト / HomeWing 統合

---

## OH-B 系完了サマリー

### OH-B1: リアルタイムプロセスリスト

**コミット:** `b31d538`

ProcessTab 全面リファクタ: テーブル + ソート + フィルタ / アクション行（Kill + Priority）/ Win32 FFI SetPriorityClass / ProcessPriority enum 拡張（Idle/BelowNormal 追加）

---

### OH-B2: NVIDIA GPU 使用率

**コミット:** `a6effef`

nvml-wrapper 0.10 導入 / infra/gpu.rs（NVML クエリ + PowerShell フォールバック）/ HomeWing VRAM表示改善 / SystemStatusCard GPU% 行追加

---

### OH-B4: 全設定リバート + アンインストールフロー

**コミット:** `51918a2`

services/cleanup.rs（revert_all/cleanup_app_data）/ credentials.rs delete_api_key / SettingsWing MAINTENANCE セクション（確認モーダル + 結果表示）

---

---

### OH-B6: テストカバレッジ拡張（v1.0 品質基盤）

**ステータス:** ✅ 完了（2026-05-18）

**Zustand ストアテスト新規追加（7 ファイル）:**
- `useSessionStore.test.ts` — セッション CRUD・比較・ノート更新
- `useEcoModeStore.test.ts` — エコモード設定・電力/コスト推定
- `useWatchdogStore.test.ts` — ルール CRUD・イベント・プリセット
- `useWinoptStore.test.ts` — Windows/Net 設定 apply/revert・DNS フラッシュ
- `useScriptStore.test.ts` — スクリプト追加/削除/実行・ログ管理
- `useAppSettingsStore.test.ts` — 設定取得/保存/部分更新・エラー
- `useNavStore.test.ts` — ナビゲーション関数の登録と呼び出し

**Wing コンポーネントテスト新規追加（5 ファイル）:**
- `StorageWing.test.tsx` — ローディング/エラー/データ表示・クリーンアップ UI
- `NetoptWing.test.tsx` — アダプタ/DNS/Ping 表示・ユーザー操作
- `WindowsWing.test.tsx` — ローディング/POWER/GAMING/VISUAL セクション
- `LogWing.test.tsx` — フィルタ/アクション/ログ一覧/分析パネル
- `HardwareWing.test.tsx` — ローディング/エラー/ハードウェア情報/EcoMode パネル

**品質ゲート:** 53 テストファイル / 480 テスト全通過、typecheck クリーン、Biome クリーン

---

## 完了済みタスク（履歴）

> 詳細は git log で確認可能。以下は概要のみ。

| ID | 内容 | 完了日 |
|----|------|--------|
| T1-T10 | Shell サイドバー化・Wing 構成・Tailwind 化・テスト整備 | 2026-03-15 以前 |
| OH1 | PowerShell フラグ修正 | 2026-03-16 |
| OH2 | GPU 型定義・取得実装 | 2026-03-16 |
| OH3 | プロセス保護リスト | 2026-03-16 |
| OH4 | GPU UI + AI ルール追加 | 2026-03-16 |
| OH5 | styles.ts 新規作成 | 2026-03-16 |
| OH6 | 自動ブースト設定 | 2026-03-16 |
| OH7 | テスト追加（81件） | 2026-03-17 |
| OH8 | エラーハンドリング統一 | 2026-03-17 |
| OH-B3 | ゲームスコア実装 | 2026-03-17 |
| OH-B5 | ウィンドウ最小幅設定 | 2026-03-17 |
| OH-E1 | セキュリティ設定強化 | 2026-03-17 |
| OH-E2 | Tailwind CSS リファクタ | 2026-03-17 |
| OH-E3 | E2E テスト基盤 | 2026-03-17 |
| OH-E4 | 環境オーバーホール | 2026-03-18 |

---

## v3.0 Phase 1 — ワークフロー基盤構築

**ステータス:** ✅ 完了（2026-03-19）
**ベースコミット:** `28c7ca7`
**担当:** Claude Code（単独 — Cascade 担当なし）

### 実施内容

| # | タスク | 成果物 |
|---|--------|--------|
| 1 | テスト戦略ガイド作成 | `docs/TESTING.md` — テストピラミッド、エージェント分離ルール、テスト判定フロー、ミューテーションテスト運用 |
| 2 | バックエンドアーキテクチャガイド作成 | `docs/BACKEND.md` — 4 層アーキテクチャ、UnifiedEmitter 仕様、状態管理、コマンド一覧、サービス一覧 |
| 3 | ファイルサイズチェックスクリプト | `scripts/check-file-size.mjs` — TS/TSX 200 行超を検知（警告モード、8 ファイル超過検出） |
| 4 | アーキテクチャ適合テスト | `scripts/check-architecture.mjs` — Wing→Store 境界、lib/→store 禁止、ui/→store 禁止（警告モード、1 件検出: Modal→useModalStore） |
| 5 | インラインスタイルチェック | `scripts/check-inline-styles.mjs` — 許可リスト方式、9 箇所許可済み、違反ゼロ |
| 6 | CI 更新 | `.github/workflows/ci.yml` — 3 スクリプトを frontend ジョブに追加 |
| 7 | lint スクリプト統合 | `package.json` — `lint:filesize`, `lint:arch`, `lint:inline-styles` を `npm run lint` に追加 |
| 8 | HANDOFF.md 更新 | 本セクション |

### アーキテクチャチェック — 検出された実態

- **Wing→Store 境界:** 実態に合わせて `WING_STORE_MAP` を設定（home は多数の Wing データを集約表示するため広い参照が正当）
- **ui/→store 違反:** `Modal.tsx → useModalStore` 1 件（警告として維持、Phase 3 以降で対処判断）
- **lib/→store 違反:** なし

### ファイルサイズ超過 — 現状記録（8 ファイル）

| ファイル | 行数 | 対処フェーズ |
|----------|------|-------------|
| `types/index.ts` | 740 | Phase 2（分割） |
| `stores/useGameProfileStore.ts` | 313 | Phase 3（抽出） |
| `stores/useHardwareStore.ts` | 270 | Phase 3（抽出） |
| `stores/useNavStore.ts` | 247 | Phase 3（抽出） |
| `stores/useWindowsSettingsStore.ts` | 246 | Phase 3（抽出） |
| `stores/useLogStore.ts` | 240 | Phase 3（抽出） |
| `stores/useStorageStore.ts` | 232 | Phase 3（抽出） |
| `stores/useNetworkTuningStore.ts` | 212 | Phase 3（抽出） |

### 品質ゲート

```
✅ docs/TESTING.md がリポジトリに存在
✅ docs/BACKEND.md がリポジトリに存在
✅ 3 スクリプトが CI で実行される（警告モード）
✅ npm run lint が全通過（警告は exit 0）
✅ HANDOFF.md が v3.0 Phase 1 を反映
✅ テスト数: 542+ TS / 230+ Rust（減少なし — Phase 1 はコード変更なし）
```

---

## v2.2 実装仕様書（Claude Code Phase 1 出力 — 2026-03-19）

> **前提:** v2.1 完了。最新コミット `6a4a7a5`。542 テスト全通過。
> **方針:** 機能追加なし・構造改善のみ。4 つの柱で負債を解消する。

---

### 柱 A — コンポーネント分割（200 行超の解消）

#### 事前調査で判明した修正事項

**WatchdogTab.tsx（321 行）— 実装状況の齟齬**

`WatchdogConditionsSection.tsx`・`WatchdogFilterSection.tsx`・`WatchdogRuleModal.tsx` の 3 ファイルが既にディレクトリに存在するが、**WatchdogTab.tsx はこれらを import していない**。
モーダル（lines 277-293）は "Rule modal implementation would go here" というスタブのまま。

→ Phase 2 での作業は「抽出」ではなく「既存ファイルを活用してスタブを本実装に差し替える」こと。
具体的には: `WatchdogRuleModal.tsx` を本実装し、`WatchdogConditionsSection.tsx` / `WatchdogFilterSection.tsx` を WatchdogRuleModal 内で使用する。WatchdogTab 本体は Modal 管理ステートのみに縮小する。

**パス訂正:**

| ファイル | 設計書の記載 | 正しいパス |
|---------|------------|-----------|
| EcoModePanel.tsx | `performance/` | `hardware/EcoModePanel.tsx` |
| SettingsAdvisorPanel.tsx | 記載なし | `settings/SettingsAdvisorPanel.tsx` |
| useNetworkTuningStore.ts | useNetworkTuningStore | `stores/useNetworkTuningStore.ts`（211行）+ `stores/useNetoptStore.ts`（別ストア）の2つが共存 |

**formatters の重複（抽出候補）:**

`fmtNum()` / `fmtDate()` / `fmtDuration()` / `formatTime()` が SessionTab・ProcessTab・NetoptWing に散在。
→ 分割時に `src/lib/formatters.ts` に統合する。

#### 承認済み分割計画

| ファイル | 行数 | 分割先 |
|---------|------|--------|
| WatchdogTab.tsx | 321 | WatchdogRuleModal.tsx（本実装化）+ WatchdogEventLog.tsx |
| EcoModePanel.tsx | 289 | PowerConsumptionDisplay.tsx + EcoModeToggle.tsx + CostEstimationPanel.tsx |
| SessionTab.tsx | 284 | SessionListView.tsx + SessionDetail.tsx + SessionCompareView.tsx + SummaryPanel.tsx |
| SettingsAdvisorPanel.tsx | 244 | AdvisorScoreCard.tsx + RecommendationList.tsx（既存か確認）+ AdvisorActions.tsx |
| NetoptWing.tsx | 239 | DnsTab.tsx（AdapterInfoPanel + DnsConfigPanel + PingPanel）+ Wing は TabBar のみ |
| ProcessTab.tsx | 236 | BoostResultsPanel.tsx + KillConfirmModal.tsx + formatters.ts 統合 |
| StorageWing.tsx | 235 | DriveList.tsx + CleanupPanel.tsx + CleanupResultsPanel.tsx |
| ProcessTable.tsx | 220 | ProcessRow.tsx（行コンポーネント）|
| Table.tsx (ui) | 219 | TablePagination.tsx + TableFilter.tsx |
| WindowsSettingsTab.tsx | 217 | PowerPlanSection.tsx + VisualEffectsSection.tsx + ServicesSection.tsx |
| HardwareWing.tsx | 208 | CpuSection.tsx + GpuSection.tsx + MemorySection.tsx |
| AffinityPanel.tsx | 201 | CoreSelector.tsx + AffinityPresets.tsx |

**Store ロジック抽出（4 対象）:**

| Store | 抽出先 |
|-------|-------|
| useGameProfileStore.ts（340行） | lib/gameProfile.ts（CRUD 純粋関数）|
| useStorageStore.ts（257行） | lib/storage.ts（スキャン・クリーンアップロジック）|
| useWindowsSettingsStore.ts（254行） | lib/windowsSettings.ts（設定適用ロジック）|
| useLauncherStore.ts（204行） | lib/gameDetection.ts（ゲーム検出ロジック）|

**注:** `useNavStore.ts` の `buildBreadcrumbs` は既に純粋関数として外部 export 済み。`lib/navigation.ts` への移動は任意（import パス変更コストと効果が釣り合うか検討すること）。

**Lib 分割（2 対象）:**

| Lib | 分割先 |
|-----|-------|
| gameReadiness.ts（357行） | lib/gameReadiness/scoring.ts + weights.ts + recommendations.ts |
| localAi.ts（232行） | lib/ai/prompts.ts + client.ts + types.ts |

---

### 柱 B — Rust エミッター統合（重要設計修正あり）

#### 現状確認済みの問題

```
現状のシステムコール重複（2 秒あたり概算）:

pulse_emitter (2s)    → refresh_cpu_all() ×2, refresh_memory, refresh_processes(All), networks.refresh
ops_emitter (3s)      → refresh_processes(All) ×1
hardware_emitter (5s) → refresh_cpu_all(), refresh_memory(), Disks::new_with_refreshed_list()
game_monitor (3s)     → refresh_processes() ×1（profile match のため独立実行）
```

#### ⚠️ 設計書の修正が必要な箇所: CPU 200ms ダブルリフレッシュパターン

`pulse_emitter.rs` は CPU 使用率の **差分計測** のため、以下のパターンを意図的に使用している:

```
1. Lock → refresh_cpu_all() → release (1回目)
2. sleep(200ms) ← ロックの外で待機（他コマンドを通す）
3. Lock → refresh_cpu_all() → compute delta → emit → release (2回目)
```

これは `sysinfo` の CPU 使用率計測の物理的要件（2 時点の差分が必要）。
**UnifiedEmitter の「1秒 tick」設計ではこのパターンを消化できない。**

#### 修正後の UnifiedEmitter 設計

```
UnifiedEmitter の基底ループ（tick = ~2s、pulse 間隔に合わせる）:

loop {
    // [1] CPU 1回目（ロック取得・解放）
    lock → refresh_cpu_all() → release

    // [2] 200ms 待機（ロックの外）
    sleep(200ms)

    // [3] CPU 2回目 + 全データ収集（ロック取得・解放）
    lock
      → refresh_cpu_all()          ← delta 計算
      → refresh_memory()
      → networks.refresh()
      → disk I/O delta 計算
    release

    // [4] pulse emit（毎ループ = 2s 相当）
    emit nexus://pulse

    // [5] ops tick（3s ごとに実行）
    if tick % 3 == 0 {
        lock → refresh_processes(All) → process list 作成 → release
        emit nexus://ops

        // game_monitor もここで処理（別タスクで独立ポーリング廃止）
        game_monitor::check_game_events(&process_list, ...)
    }

    // [6] hardware tick（5s ごとに実行）
    if tick % 5 == 0 {
        collect_hardware_info()     ← GPU + disk + thermal（ロック外 WMI 等）
        emit nexus://hardware
        check_thermal_alerts()
    }

    tick += 1;
    sleep(pulse_interval - 200ms)   ← 残り待機（Normal で ~1.8s）
}
```

**メリット:**
- `refresh_cpu_all()` が 2 回 / 2 秒に統一（現状 ~5 回 / 2 秒）
- `refresh_processes(All)` が 1 回 / 3 秒に統一（現状 ~2 回 / 3 秒）
- `game_monitor` がプロセスリストをキャッシュ共有（独立ポーリング廃止）
- Mutex ロックが単一タスクから順序保証

#### アダプティブポーリング（PollingMode）— 設計書のまま承認

```rust
enum PollingMode {
    Active,  // ゲーム実行中: pulse=1s+200ms, ops=2s, hardware=5s
    Normal,  // 通常: pulse=2s+200ms, ops=3s, hardware=5s
    Idle,    // アイドル(5分無操作): pulse=5s, ops=10s, hardware=30s
    EcoMode, // エコモード: pulse=5s, ops=10s, hardware=60s
}
```

**game_monitor との連携（修正版）:**
- game_monitor を独立タスクとして廃止し、`ops tick`（tick%3）内に統合
- `GameLaunchEvent` / `GameExitEvent` の emit は引き続き実施
- `PollingMode::Active` への遷移は ops tick 内のゲーム検出時に行う

#### 移行手順

```
1. emitters/unified_emitter.rs 新規作成
2. services/game_monitor.rs を「tick 内呼び出し関数」にリファクタ（ループは削除）
3. lib.rs: spawn 4 → 1（game_monitor の spawn も統合）
4. PollingMode + SharedState 更新（polling_mode フィールド追加）
5. フロントエンドへ nexus://polling-mode イベント emit
6. 旧 pulse_emitter / ops_emitter / hardware_emitter 削除
7. Rust テスト: 各モードでの emit 間隔・イベント名の検証
```

---

### 柱 C — types/index.ts 分割

#### 事前調査で確認済み

- 86 エクスポート（型 + 関数 1 件）、**循環依存ゼロ** ✅
- `assertNever()` 関数（line 737）は型定義ファイルに置くべきでない → `src/lib/assert.ts` に移動
- 既存の `types/navigation.ts` は変更不要

#### 承認済み分割マップ（修正版）

```
src/types/
├── index.ts         ← re-export のみ（後方互換維持）
├── wing.ts          ← WingId, WingStatus, FeedLevel, FeedEntry
├── boost.ts         ← BoostAction, BoostResult, ProcessPriorityLevel, BoostLevel
├── script.ts        ← ScriptEntry, ExecutionLog
├── hardware.ts      ← HardwareInfo, DiskInfo, CpuTopology, CoreParkingState, ThermalAlert, ThermalAlertLevel
├── storage.ts       ← DriveInfo, DiskDrive, StorageInfo, CleanupResult
├── network.ts       ← NetworkAdapter, DnsPreset, PingResult, NetworkDevice, TrafficSnapshot, TcpAutoTuningLevel, TcpTuningState, NetworkQualitySnapshot
├── settings.ts      ← AppSettings, WindowsSettings, PowerPlan, VisualEffects, WinSetting, CurrentPowerPlan
├── advisor.ts       ← SettingRecommendation, RecommendedValue, AdvisorResult, WindowsSettingsSnapshot
├── power.ts         ← PowerEstimate, EcoModeConfig, MonthlyCostEstimate, RevertItem, RevertAllResult
├── log.ts           ← LogLevel, LogEntry, LogAnalysis
├── session.ts       ← SessionSummary, FrameTimePercentile, FpsTimelinePoint, HardwareSnapshot, SavedFrameTimeSession, SessionListItem, SessionComparisonResult
├── watchdog.ts      ← WatchdogRule, WatchdogCondition, WatchdogMetric, WatchdogOperator, WatchdogAction, ProcessFilter, WatchdogEvent
├── game.ts          ← GameInfo, GameProfile, SharedProfile, PowerPlanType, ProfileApplyResult, GameLaunchEvent, GameExitEvent
├── process.ts       ← SystemProcess
├── analysis.ts      ← BottleneckType, BottleneckConfidence, BottleneckScores, BottleneckSuggestion, BottleneckResult, AiRecommendation, AiBottleneckResponse, HealthSeverity, HealthFixAction, HealthCheckItem, HealthCheckResult, HealthCheckInput, HeavyProcess
├── ai.ts            ← AiSuggestion
├── performance.ts   ← TimerResolutionState, FrameTimeSnapshot, FrameTimeMonitorState
├── pulse.ts         ← ResourceSnapshot
└── navigation.ts    ← 既存（変更なし）
```

**注:** `assertNever` は `src/lib/assert.ts` に移動。既存の `import { assertNever } from '../types'` は `import { assertNever } from '../lib/assert'` に変更が必要。

**移行ルール（再確認）:**
- `types/index.ts` は全ファイルを re-export（`import { HardwareInfo } from '../types'` が引き続き動作）
- 既存コードの import パスは変更しない（後方互換）
- 新規コードのみ直接パス使用

---

### 品質ゲート（全フェーズ共通）

```
✅ npm run test      — 542 件 + 新規（純増のみ）
✅ npm run typecheck — 型エラーゼロ
✅ npm run check     — Biome lint/format エラーゼロ
✅ cargo test        — Rust テスト全通過
✅ cargo clippy -- -D warnings — 警告ゼロ
```

**Phase 2-3 追加:**
```
✅ 各分割ファイル 200 行以下
✅ 新規コンポーネントに Props interface 定義あり
✅ barrel export (index.ts) を使用していない
```

**Phase 4 追加:**
```
✅ 旧エミッター 3 ファイル + game_monitor 独立ポーリングが削除されている
✅ emit イベント名が変更されていない（nexus://pulse, nexus://ops, nexus://hardware）
✅ 200ms CPU ダブルリフレッシュパターンが統合後も機能している
```

**Phase 5 追加:**
```
✅ types/index.ts が re-export のみ（型定義の実体なし）
✅ assertNever が lib/assert.ts に移動している
```

---

## v2.2 Phase 4 — UnifiedEmitter 実装指示（Cascade 向け）

> **ステータス:** ⏳ 実装待ち
> **前提:** Phase 3（16fc13f）完了。542 テスト全通過。
> **コミット:** `refactor: v2.2 Phase 4 — UnifiedEmitter（4タスク → 1タスク統合）`

### 概要

4 つの独立バックグラウンドタスクを `emitters/unified_emitter.rs` 1 ファイルに統合する。

```
現状（4タスク）:                    移行後（1タスク）:
pulse_emitter  (2s)  ┐              unified_emitter
ops_emitter    (3s)  ├─ spawn ×4 →  └─ 1s ベースループ
hardware_emitter(5s) │                  tick%2 → pulse
game_monitor   (3s)  ┘                  tick%3 → ops + game check
                                        tick%5 → hardware
```

### ⚠️ 設計書修正（HANDOFF.md 柱 B の誤りを訂正）

旧仕様は「ベースループ = 2s」だったため `tick%3 = 6s` になる誤りがあった。
**正しいベースループは 1 秒。** これにより:

| emit | 条件 | 間隔 |
|------|------|------|
| nexus://pulse | `tick % 2 == 0` | 2 秒 |
| nexus://ops + game_monitor | `tick % 3 == 0` | 3 秒 |
| nexus://hardware + thermal | `tick % 5 == 0` | 5 秒 |

### ファイル変更一覧

| 操作 | ファイル |
|------|---------|
| 新規作成 | `src-tauri/src/emitters/unified_emitter.rs` |
| 変更 | `src-tauri/src/emitters/mod.rs` |
| 変更 | `src-tauri/src/lib.rs`（spawn 4 → 1） |
| 変更 | `src-tauri/src/services/game_monitor.rs`（ループ削除 → `check_once` 関数化） |
| 変更 | `src-tauri/src/state.rs`（`polling_mode` フィールド追加） |
| **削除** | `src-tauri/src/emitters/pulse_emitter.rs` |
| **削除** | `src-tauri/src/emitters/ops_emitter.rs` |
| **削除** | `src-tauri/src/emitters/hardware_emitter.rs` |

### unified_emitter.rs — ループ設計（疑似コード）

```rust
pub async fn start(app: AppHandle) {
    const BASE_MS: u64 = 1000; // Normal モード（1秒ベース）
    let mut tick: u32 = 0;
    let state = app.state::<Mutex<AppState>>();
    let mut active_games: HashMap<u32, ActiveGame> = HashMap::new();

    loop {
        let cycle_start = tokio::time::Instant::now();
        tick = tick.wrapping_add(1);

        // ─── [1] CPU 1回目（ロック取得・即解放）─────────────────────
        {
            let mut s = state.lock().unwrap_or_else(|e| e.into_inner());
            s.sys.refresh_cpu_all();
            s.sys.refresh_memory();
        }

        // ─── [2] 200ms 待機（ロックの外 — 他コマンドを通す）─────────
        tokio::time::sleep(Duration::from_millis(200)).await;

        // ─── [3] CPU 2回目 + 共通データ収集 ─────────────────────────
        // pulse と ops の両方が必要なときのみ refresh_processes を呼ぶ
        let need_processes = (tick % 2 == 0) || (tick % 3 == 0);
        let snapshot_data = {
            let mut s = state.lock().unwrap_or_else(|e| e.into_inner());
            s.sys.refresh_cpu_all(); // ← delta 計算
            if need_processes {
                s.sys.refresh_processes(ProcessesToUpdate::All, true);
            }
            s.networks.refresh();
            collect_common_data(&mut s) // cpu%, mem, disk_io, net を返す
        };

        // ─── [4] Pulse emit（tick % 2 == 0 → 2 秒）──────────────────
        if tick % 2 == 0 {
            if let Err(e) = app.emit("nexus://pulse", &snapshot_data.pulse) {
                error!("unified_emitter: pulse 送信失敗: {}", e);
            }
        }

        // ─── [5] Ops + game_monitor（tick % 3 == 0 → 3 秒）──────────
        if tick % 3 == 0 {
            let process_list = collect_process_list(&state);
            if let Err(e) = app.emit("nexus://ops", &process_list) {
                error!("unified_emitter: ops 送信失敗: {}", e);
            }
            // game_monitor を「関数呼び出し」として統合（独立ループ廃止）
            game_monitor::check_once(&process_list, &app, &mut active_games, &state).await;
        }

        // ─── [6] Hardware + thermal（tick % 5 == 0 → 5 秒）──────────
        if tick % 5 == 0 {
            match collect_hardware_info(&app) {
                Ok(hw) => {
                    check_and_emit_thermal_alerts(&app, hw.cpu_temp_c, hw.gpu_temp_c);
                    if let Err(e) = app.emit("nexus://hardware", &hw) {
                        error!("unified_emitter: hardware 送信失敗: {}", e);
                    }
                }
                Err(e) => error!("unified_emitter: hardware 収集失敗: {}", e),
            }
        }

        // ─── [7] 残余 sleep（1 秒サイクルを維持）────────────────────
        let elapsed = cycle_start.elapsed();
        let remaining = Duration::from_millis(BASE_MS).saturating_sub(elapsed);
        if !remaining.is_zero() {
            tokio::time::sleep(remaining).await;
        }
    }
}
```

### game_monitor.rs リファクタ指示

`start_polling(app)` の**ループ本体のみ**を `check_once` として切り出す。ループ自体と `refresh_processes` 呼び出しは削除する。

```rust
// 追加する関数シグネチャ
pub async fn check_once(
    process_list: &[SystemProcess],
    app: &AppHandle,
    active_games: &mut HashMap<u32, ActiveGame>,
    state: &Mutex<AppState>,
) {
    // 既存の start_polling ループ内の「起動検出」「終了検出」ロジックをそのまま移植
    // プロセス一覧は引数 process_list を使う（refresh_processes は呼ばない）
    // GameLaunchEvent / GameExitEvent の emit はそのまま維持
    // game_monitor_active フラグのチェックは不要（unified_emitter が管理）
}

// start_polling は削除（lib.rs の spawn も削除する）
```

### state.rs 追加

```rust
// AppState に追加
pub polling_mode: PollingMode,

// 新規 enum（state.rs または unified_emitter.rs に定義）
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum PollingMode {
    Normal,  // 通常（1000ms ベース）
    Active,  // ゲーム実行中（将来実装）
}

impl Default for PollingMode {
    fn default() -> Self { PollingMode::Normal }
}
```

> **注:** PollingMode::Active/Idle/EcoMode の実装は Phase 4 ではスコープ外。`Normal` のみ実装し、フィールドは将来の拡張のために追加する。

### lib.rs 変更

```rust
// 変更前（4 spawn）:
tauri::async_runtime::spawn(async move { emitters::pulse_emitter::start(pulse_handle).await; });
tauri::async_runtime::spawn(async move { emitters::ops_emitter::start(ops_handle).await; });
tauri::async_runtime::spawn(async move { emitters::hardware_emitter::start(hw_handle).await; });
tauri::async_runtime::spawn(async move { game_monitor::start_polling(game_handle).await; });

// 変更後（1 spawn）:
tauri::async_runtime::spawn(async move {
    emitters::unified_emitter::start(handle.clone()).await;
});
info!("unified_emitter: 起動（base=1s, pulse=2s, ops=3s, hardware=5s）");
```

### 品質ゲート

```
✅ cargo test — Rust テスト全通過
✅ cargo clippy -- -D warnings — 警告ゼロ
✅ cargo fmt — フォーマット通過
✅ npm run test — TS 542 件以上
✅ npm run typecheck — 型エラーゼロ
✅ npm run check — Biome クリーン
✅ 旧エミッター 3 ファイル削除済み（git rm で記録）
✅ game_monitor の独立 spawn 削除済み
✅ emit イベント名変更なし（nexus://pulse, nexus://ops, nexus://hardware）
✅ nexus://game-launched, nexus://game-exited も変更なし
✅ 200ms CPU ダブルリフレッシュパターン維持
```

---

## v2.2 Phase 5 — types 分割 + assertNever + lint スクリプト（Cascade 向け）

> **ステータス:** ⏳ 実装待ち
> **前提:** Phase 4（28c7ca7）完了。TS 542 + Rust 230 all green。
> **コミット分割:**
> 1. `refactor: v2.2 Phase 5A — types/index.ts を 18 ドメインファイルに分割`
> 2. `refactor: v2.2 Phase 5B — assertNever を lib/assert.ts に移動`
> 3. `chore: v2.2 Phase 5C — lint スクリプト追加（check-component-size, check-inline-styles）`

---

### 5-A: types/index.ts 分割

**ルール（厳守）:**
- `types/index.ts` は最終的に `export * from './xxx'` の re-export のみにする（型定義の実体ゼロ）
- 既存コードの import パスは変更しない（`import { HardwareInfo } from '../types'` がそのまま動くこと）
- 新規ファイルは `src/types/` に作成し、barrel export（index.ts 中間ファイル）は作らない
- `src/types/navigation.ts` は変更しない

**作成するドメインファイルと収録型（正確な対応）:**

| ファイル | 収録する型・インターフェース |
|---------|---------------------------|
| `types/wing.ts` | WingId, WingStatus, FeedLevel, FeedEntry |
| `types/boost.ts` | BoostAction, BoostResult, ProcessPriorityLevel, BoostLevel |
| `types/script.ts` | ScriptEntry, ExecutionLog |
| `types/hardware.ts` | HardwareInfo, DiskInfo, CpuTopology, CoreParkingState, ThermalAlertLevel, ThermalAlert, CurrentPowerPlan |
| `types/storage.ts` | DriveInfo, DiskDrive, StorageInfo, CleanupResult |
| `types/network.ts` | NetworkAdapter, DnsPreset, PingResult, NetworkDevice, TrafficSnapshot, TcpAutoTuningLevel, TcpTuningState, NetworkQualitySnapshot |
| `types/settings.ts` | AppSettings, WindowsSettings, PowerPlan, VisualEffects, WinSetting |
| `types/advisor.ts` | SettingRecommendation, RecommendedValue, AdvisorResult, WindowsSettingsSnapshot |
| `types/power.ts` | PowerEstimate, EcoModeConfig, MonthlyCostEstimate, RevertItem, RevertAllResult |
| `types/log.ts` | LogLevel, LogEntry, LogAnalysis |
| `types/session.ts` | SessionSummary, FrameTimePercentile, FpsTimelinePoint, HardwareSnapshot, SavedFrameTimeSession, SessionListItem, SessionComparisonResult |
| `types/watchdog.ts` | WatchdogRule, WatchdogCondition, WatchdogMetric, WatchdogOperator, WatchdogAction, ProcessFilter, WatchdogEvent |
| `types/game.ts` | GameInfo, GameProfile, SharedProfile, PowerPlanType, ProfileApplyResult, GameLaunchEvent, GameExitEvent |
| `types/process.ts` | SystemProcess |
| `types/analysis.ts` | BottleneckType, BottleneckConfidence, BottleneckScores, BottleneckSuggestion, BottleneckResult, AiRecommendation, AiBottleneckResponse, HealthSeverity, HealthFixAction, HealthCheckItem, HealthCheckResult, HealthCheckInput, HeavyProcess |
| `types/ai.ts` | AiSuggestion |
| `types/performance.ts` | TimerResolutionState, FrameTimeSnapshot, FrameTimeMonitorState |
| `types/pulse.ts` | ResourceSnapshot |

**クロス依存（src/types/ 内での import）:**
- `types/game.ts` → `import type { ProcessPriorityLevel, BoostLevel } from './boost'`（GameProfile と SharedProfile が使用）

**types/index.ts の最終形:**

```typescript
// 後方互換 re-export — このファイルに型定義の実体を置かない
export * from './navigation';
export * from './wing';
export * from './boost';
export * from './script';
export * from './hardware';
export * from './storage';
export * from './network';
export * from './settings';
export * from './advisor';
export * from './power';
export * from './log';
export * from './session';
export * from './watchdog';
export * from './game';
export * from './process';
export * from './analysis';
export * from './ai';
export * from './performance';
export * from './pulse';
// assertNever は lib/assert.ts に移動済み — 後方互換のため再 export
export { assertNever } from '../lib/assert';
```

---

### 5-B: assertNever を lib/assert.ts に移動

**作成するファイル `src/lib/assert.ts`:**

```typescript
/**
 * 網羅性チェック用ユーティリティ
 * switch/if-else の exhaustive check に使用する
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
```

**import 更新が必要なファイル（2 件）:**
- `src/lib/gameReadiness/index.ts` — `from '../../types'` → `from '../assert'`
- `src/lib/gameReadiness/scores.ts` — `from '../../types'` → `from '../assert'`

（他ファイルは `from '../types'` 経由で引き続き動作するため変更不要）

---

### 5-C: lint スクリプト追加

**`scripts/check-component-size.mjs`:**

```javascript
#!/usr/bin/env node
// コンポーネント・ストア・lib ファイルの行数チェック（200行超を警告）
import { readdir, stat, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MAX_LINES = 200;
const SCAN_DIRS = ['src/components', 'src/stores', 'src/lib'];
const EXTENSIONS = new Set(['.tsx', '.ts']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(extname(entry.name))) yield full;
  }
}

let violations = 0;
for (const dir of SCAN_DIRS) {
  for await (const file of walk(dir)) {
    const content = await readFile(file, 'utf8');
    const lines = content.split('\n').length;
    if (lines > MAX_LINES) {
      console.error(`[size] ${file}: ${lines} lines (>${MAX_LINES})`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} file(s) exceed ${MAX_LINES} lines.`);
  process.exit(1);
}
console.log('✅ Component size check passed.');
```

**`scripts/check-inline-styles.mjs`:**

```javascript
#!/usr/bin/env node
// インラインスタイル使用箇所を検出（許可リスト外の新規追加を防止）
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

// 既存の許可済み箇所（ファイルパス:行番号 パターン、または "canvas" など用途別）
const ALLOWLIST_PATTERNS = [
  /canvas/i,        // canvas の width/height は必須
  /maxHeight/,      // Table.tsx の動的 maxHeight
  /column\.width/,  // Table.tsx の列幅
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (extname(entry.name) === '.tsx') yield full;
  }
}

let violations = 0;
for await (const file of walk('src/components')) {
  const content = await readFile(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('style={{')) continue;
    if (ALLOWLIST_PATTERNS.some(p => p.test(line))) continue;
    console.warn(`[inline-style] ${file}:${i + 1}: ${line.trim()}`);
    violations++;
  }
}

if (violations > 0) {
  console.warn(`\n${violations} non-allowlisted inline style(s) found.`);
  process.exit(1);
}
console.log('✅ Inline style check passed.');
```

> **注:** `check-inline-styles.mjs` は現在の動的 progress bar（width: ${pct}%）がすべて allowlist 外で引っかかるため、実行時に警告になる。スクリプト追加のみ行い、`package.json` の `check` スクリプトには組み込まない（CI 向け別途運用）。

**`package.json` に追加する scripts:**

```json
"check:size": "node scripts/check-component-size.mjs",
"check:styles": "node scripts/check-inline-styles.mjs"
```

---

### 品質ゲート

```
✅ npm run test  — TS 542 件以上
✅ npm run typecheck — 型エラーゼロ
✅ npm run check — Biome クリーン
✅ npm run check:size — 200行超ファイルゼロ（既存違反なし確認）
✅ types/index.ts が re-export のみ（実体ゼロ）
✅ assertNever が src/lib/assert.ts に存在する
✅ src/lib/gameReadiness/index.ts と scores.ts が lib/assert から import している
```
