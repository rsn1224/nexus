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

**最新コミット:** `2d8de58`
**テスト:** TS 498 unit + Rust clean

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
