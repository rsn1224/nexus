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
| **v3.0 Phase 1** | ✅ 完了（ワークフロー基盤構築: TESTING.md + BACKEND.md + 3 lint スクリプト + CI 更新、`212b958`） |
| **v3.0 Phase 2** | ✅ 完了（2A: assertNever→lib/assert.ts, 2B: types 前半9分割, 2C: types 後半8分割, 2D: index.ts re-exportのみ化） |
| **v3.0 Phase 3** | ✅ 完了（3-1〜3-7: Store ロジック→lib/ 抽出 + セレクター→hooks/ 移動 + check-file-size.mjs strict 昇格） |
| **v3.0 Phase 4** | ✅ 完了（ドキュメント最終更新 + progressWidth ヘルパー + ミューテーション閾値 + リリース） |
| **v3.0.1 Phase 1** | ✅ 完了（subscribe リーク修正 + alert→ErrorBanner + 確認ダイアログ: MaintenanceTab/ProfileTab） |
| **v3.0.1 Phase 2** | ✅ 完了（10 Store サイレント catch 撲滅 + log.error 統一） |
| **v3.0.1 Phase 3** | ✅ 完了（aria-label 7コンポーネント + useFocusTrap Modal フォーカストラップ） |
| **v3.0.1 Phase 4** | ✅ 完了（ErrorBoundary name prop + BoostWing/HardwareWing/LauncherWing/SettingsWing 適用） |
| **Design Refresh v2** | ✅ 完了（Phase 1-8: カラー拡張・glass card・タイポグラフィ・KpiCard・グラフグロー・サイドバー・GameCard・モーション） |
| **v3.1 オンボーディング Phase 1** | 🔵 pending（Cascade 実装待ち） |
| **NEXUS v2 Phase 1: クリーンアップ** | ✅ 完了（8 Rust コマンド削除 + FE 削除 + 5 Wing 化） |
| **NEXUS v2 Phase 2: lib/ 純粋関数** | ✅ 完了（healthScore.ts + suggestionEngine.ts） |
| **NEXUS v2 Phase 3: Store 実装** | ✅ 完了（useHealthStore + useOptimizeStore + useAiStore + useHistoryStore） |
| **NEXUS v2 Phase 5: DASHBOARD Wing** | ✅ 完了（DashboardWing + HealthScoreBar + SuggestionCard/List + AppliedBadgeRow） |
| **NEXUS v2 Phase 6: GAMING Wing** | ✅ 完了（GamingWing + 7 panels） |
| **NEXUS v2 Phase 7: MONITOR Wing** | ✅ 完了（MonitorWing + MetricCard + TimelineGraph） |
| **NEXUS v2 Phase 8: HISTORY Wing** | ✅ 完了（HistoryWing + SessionList + TrendChart） |
| **NEXUS v2 Phase 10: UT** | ✅ 完了（healthScore.test + suggestionEngine.test + useHealthStore.test + useOptimizeStore.test） |
| **NEXUS v2 WingId リネーム** | ✅ 完了（dashboard→core, gaming→arsenal, monitor→tactics, history→logs） |
| **NEXUS v2 Stitch デザイン実装** | 🔵 pending（Cascade 実装待ち） |

**最新コミット:** `9b21268`（Stitch デザイン WingId 変更 + 仕様書）
**ブランチ:** `feature/v2-optimize-core`
**テスト:** TS 650 all green（biome + typecheck + vitest all pass）

---

## NEXUS v2 Stitch デザイン全面採用 — Cascade 向け実装指示

> **ステータス:** `pending`
> **ブランチ:** `feature/v2-optimize-core`
> **デザイン仕様:** [`docs/v2/design-overhaul-spec.md`](docs/v2/design-overhaul-spec.md)
> **参考画像:** Stitch 生成の 6 画面スクリーンショット（ユーザー確認済み）
> **方針:** Razer HUD 美学を全面適用。Stitch 出力のビジュアルを忠実に再現する。

### AI 開発ルール（必ず遵守）

```
1. 全ファイル 200 行以下（TS/TSX）
2. console.log / any 型 禁止
3. 各 Phase 後に vitest run + tsc --noEmit + npm run check を実行
4. 既存テストを壊さないこと
5. カラー値は index.css @theme のみで管理（ハードコード禁止）
```

### 必読ファイル

```
docs/v2/design-overhaul-spec.md  — 全デザイン仕様（カラー・CSS・レイアウト）
src/index.css                    — 現在の @theme（ここを書き換える）
src/design-tokens.ts             — トークン定義（index.css と同期）
```

---

### Phase D-1: CSS 基盤（index.css + design-tokens.ts）

**目的:** Razer HUD カラーパレット + 新 CSS クラス全面適用

1. `src/index.css` の `@theme` を `design-overhaul-spec.md §1` のカラーに全面置換
2. 以下の新 CSS クラスを追加:
   - `.piano-surface` — Stitch の glass panel カード（gradient + green border）
   - `.circuit-bg` — ドットグリッド背景（40px 間隔、green 0.03 opacity）
   - `.scanline-overlay` — スキャンライン効果（fixed、pointer-events: none）
   - `.scanning-bar` — 水平スキャンバー（15s アニメーション）
   - `.bloom-razer` — green glow drop-shadow
   - `.bloom-red` — red glow drop-shadow
   - `.pulse-node` — 3s パルスアニメーション
   - `.hover-glitch` — ホバー時グリッチエフェクト
   - `.progress-flow` — 流れるプログレスバー
   - `.hud-btn-sweep` — ボタンスウィープエフェクト
3. 旧 `.card-glass` / `.card-glass-elevated` は `.piano-surface` に統合（後方互換で残す）
4. `.glow-cyan` → `.glow-green` にリネーム（Razer Green 対応）
5. scrollbar を green テーマに更新
6. `::selection` を green に更新
7. `src/design-tokens.ts` を新カラーに同期

**フォント変更:**
```css
@import "@fontsource-variable/inter";
@import "@fontsource/noto-sans-jp/400.css";
@import "@fontsource/noto-sans-jp/700.css";
/* B612 Mono の import を削除 */
```

**品質チェック:** `tsc --noEmit` + `vitest run` + `npm run check`

---

### Phase D-2: Shell レイアウト変更（サイドバー 264px 化）

**目的:** 48px アイコンサイドバー → 264px テキスト付き展開型サイドバー

**Shell.tsx 書き換え:**

```
新レイアウト:
┌──────────────────────────────────────────┐
│ TitleBar (h-16)                           │
├──────────┬───────────────────────────────┤
│ Sidebar  │ Main Content                  │
│ (w-64)   │ (circuit-bg)                  │
│          │                               │
│ ┌──────┐ │                               │
│ │STATUS│ │                               │
│ └──────┘ │                               │
│ CORE     │                               │
│ ARSENAL  │                               │
│ TACTICS  │                               │
│ NETWORK  │                               │
│ LOGS     │                               │
│ ──────── │                               │
│ [SYNC]   │                               │
│ DIAG     │                               │
│ EMER     │                               │
├──────────┴───────────────────────────────┤
│ BottomBar (h-10): CPU | RAM | NET | TEMP │
└──────────────────────────────────────────┘
```

**サイドバー仕様（Stitch HISTORY Wing を参考）:**

- 背景: `bg-[#030305]/98 backdrop-blur-3xl`
- 幅: `w-64`
- ボーダー: `border-r border-white/[0.03]`
- 上部パネル: SYSTEM STATUS（グリーンパルスドット + "稼働状況: OPTIMAL"）
- ナビ項目:
  - アイコン: Material Symbols Outlined（grid_view, swords, strategy, hub, terminal）
  - テキスト: `text-[10px] font-black tracking-[0.3em] uppercase`
  - 日英併記: "CORE / コア", "ARSENAL / 兵装", "TACTICS / 戦術", "NETWORK / 網", "LOGS / 履歴"
- アクティブ状態: `bg-[#44D62C]/10 text-[#44D62C] border-r-2 border-[#44D62C]` + `.progress-flow` ボトムライン
- 非アクティブ: `text-white/30 hover:text-[#44D62C] hover:bg-[#44D62C]/5`
- 下部: NEURAL SYNC ボタン + DIAG / EMER リンク

**Material Symbols の導入:**
```html
<!-- index.html に追加 -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

または `npm install material-symbols` で Tailwind 経由。

**scanline + scanning-bar の追加:**
Shell.tsx のルート要素内に:
```tsx
<div className="scanline-overlay" />
<div className="scanning-bar" />
```

---

### Phase D-3: TitleBar 変更

**目的:** カスタムタイトルバーを Stitch デザインに合わせる

**Stitch DASHBOARD を参考にした仕様:**

```
┌──────────────────────────────────────────────────┐
│ NEXUS_V2  │ CPU:44°C GPU:62°C │ DASHBOARD │ ⚙ ⏻ │
│ [WING名]  │                   │ TELEMETRY │      │
│           │                   │ TACTICAL  │      │
└──────────────────────────────────────────────────┘
```

- 左: `NEXUS_V2` (text-2xl, font-black, tracking-tighter, text-accent-500, bloom-razer)
- 左下: `[DASHBOARD_WING]` など現在の Wing 名（text-[9px], text-accent-500/60）
- 中央: CPU_TEMP + GPU_TEMP（リアルタイム、color-coded）
- 右ナビ: Wing 名タブ（アクティブに下線）
- 右端: settings (rotate-gear) + power (bloom-razer, pulse)
- 高さ: `h-16`
- 背景: `bg-[#030305]/95 backdrop-blur-3xl border-b border-white/[0.03]`

---

### Phase D-4: BottomBar（新規コンポーネント）

**ファイル:** `src/components/layout/BottomBar.tsx`

**Stitch MONITOR の下部バーを参考:**

```
┌─────────────────────────────────────────────────────┐
│ ⚙ CPU: 22.4% │ 📊 RAM: 4.2GB │ 🌐 NET: 1.2GBPS │ 🌡 TEMP: 42°C │
└─────────────────────────────────────────────────────┘
```

- 高さ: `h-10`
- 固定下部: `fixed bottom-0`
- 背景: `bg-black/98 backdrop-blur-xl border-t border-accent-500/20`
- 各項目: Material Symbol アイコン + ラベル（text-[9px], tracking-wider, uppercase）
- CPU は warning-yellow で強調、他は accent-500/50
- pulse イベントからリアルタイムデータ取得

---

### Phase D-5: CORE Wing（DASHBOARD）UI 実装

**Stitch DASHBOARD を再現:**

```
3 カラムレイアウト:
┌──────────┬──────────────┬──────────┐
│ CPU_FREQ │              │ ALERTS   │
│ MONITOR  │  SYSTEM      │ CRITICAL │
│          │  INTEGRITY   │          │
│ GPU_VRAM │  98% ゲージ  │ AI_ADVIS │
│ STATE    │              │ OR       │
│          │  OPTIMIZED   │          │
├──────────┴──────────────┴──────────┤
│ BOOST_MODE │ HEAP_FLUSH │ NET_SHIELD│
└────────────┴────────────┴──────────┘
```

**左カラム:**
- CPU_FREQ_MONITOR: 5.2 GHz + LOCKED バッジ + 棒グラフ（6本、green）
- LOAD: 32.4% / THREADS: 16/32
- GPU_VRAM_STATE: 98% UTIL + TURBO バッジ + プログレスバー
- JUNC_TEMP: 74°C / RPM_CTRL: 2450

**中央:**
- SYSTEM_INTEGRITY 円形ゲージ（SVG、98%、green glow）
- "OPTIMIZED" ステータス + green パルスドット
- UPTIME + STABILITY + THREAT_LVL + ENCRYPTION 情報

**右カラム:**
- SYSTEM_ALERTS (CRITICAL バッジ、red)
- アラートカード: UNAUTHORIZED_ACCESS + THERMAL_THRESHOLD
- AI_ADVISOR_STITCH: テキストアドバイス
- V-SYNC_OPTIMIZATION / BACKGROUND_KILLER タグ

**下部:**
- BOOST_MODE: ULTRA_PERFORMANCE（アイコン + テキスト）
- HEAP_FLUSH: 4.2 GB RECLAIMABLE
- NET_SHIELD: ACTIVE_FIREWALL
- CMD_ 入力欄（テキスト入力 + 送信ボタン）

---

### Phase D-6: ARSENAL Wing（GAMING）UI 実装

**Stitch GAMING を再現:**

- ヘッダー: "GAMING WING" + "すべて適用 / APPLY ALL" ボタン
- プリセットカード 3 枚: ゲーミング(ACTIVE) / パワーセーブ(STANDBY) / ストリーミング
- GPU 温度 / TEMP カード（右端）
- 最適化チェックリスト / CHECKLIST: チェックボックス + ステータスバッジ
- CORE_STABILITY_MONITOR: 98% ゲージ（小）

---

### Phase D-7: TACTICS Wing（MONITOR）UI 実装

**Stitch MONITOR を再現:**

- 安定性ゲージ（左、SVG 円形、98%）
- コア負荷分散バーチャート（右、12 本の縦棒、色分け: green/yellow/red）
- KPI 3 枚: 熱ステータス 42.8°C / 帯域幅 1.2gbps / ニューラル同期 0.99ms
- プロセステーブル: PID / MODULE NAME / STATUS / LOAD / MEMORY

---

### Phase D-8: LOGS Wing（HISTORY）UI 実装

**Stitch HISTORY を再現:**

- PERFORMANCE TREND チャート（SVG、7D/30D トグル）
- STITCH // TACTICAL AI パネル（右、yellow アクセント）
- SESSION TRANSACTION LOG テーブル

---

### Phase D-9: SETTINGS Wing UI 実装

**Stitch SETTINGS を再現:**

- UI カスタマイズ: ネオン発光強度スライダー
- AI AUTONOMY ALIGNMENT: トグル 2 件
- PREVIEW パネル 3 枚
- API キー設定: マスク入力 + SECURE バッジ
- ハードウェア構成ツリー: 4 枚 KPI カード

---

### 品質ゲート（全 Phase 共通）

```
✅ tsc --noEmit — ゼロエラー
✅ vitest run — 全テスト通過（650+）
✅ npm run check — Biome クリーン
✅ 全ファイル 200 行以下
✅ scanline overlay が表示される
✅ サイドバーが 264px で Wing 一覧を表示
✅ BottomBar が CPU/RAM/NET/TEMP を表示
✅ circuit-bg ドットグリッドが main content に表示
```

**コミット分割:**
- D-1: `style: Stitch デザイン Phase D-1 — Razer HUD カラー + CSS エフェクト`
- D-2: `refactor: Stitch デザイン Phase D-2 — 264px サイドバー + scanline`
- D-3: `refactor: Stitch デザイン Phase D-3 — TitleBar HUD 化`
- D-4: `feat: Stitch デザイン Phase D-4 — BottomBar リアルタイムステータス`
- D-5〜D-9: 各 Wing 実装（`feat: Stitch デザイン Phase D-N — WING名 Wing UI`）

---

## NEXUS v2 — Cascade 向け全 Phase 実装プロンプト

> **ステータス:** `pending` → Phase 1 から順次実装
> **ブランチ:** `feature/v2-optimize-core`
> **仕様書:** [`docs/v2/spec.md`](docs/v2/spec.md)
> **型定義:** [`src/types/v2.ts`](src/types/v2.ts)（**変更禁止**）
> **ストア型:** [`src/stores/types/`](src/stores/types/)（**変更禁止**）
> **v2 は完全な別プロダクト。** 現在の master（v3.x）とは独立して進める。

### AI 開発ルール（全 Phase 共通 — 必ず遵守）

```
1. テストが矛盾する場合（同じ入力に異なる期待値）は、実装を続けずに即停止して報告せよ
2. テストファイルの既存テストを書き換えてはならない。新規テスト追加のみ許可
3. リファクタリングフェーズでは既存コードの移動・分割のみ。新規ロジックの追加は禁止
4. 全ファイル 200 行以下（TS/TSX）。超過する場合は分割方針を報告して確認を取れ
5. spec.md に記載された期待動作と実装の結果が異なる場合、実装のバグとして報告せよ（テストを変えるな）
6. console.log / any 型 禁止
7. 各 Phase 後に vitest run + tsc --noEmit + npm run check を実行
```

### 必読ファイル（実装前に必ず読むこと）

```
docs/v2/spec.md          — 確定版仕様（Rust コマンドマッピング含む）
src/types/v2.ts          — v2 型定義（変更禁止）
src/stores/types/        — ストアインターフェース（変更禁止）
CLAUDE.md                — コード品質ルール
```

---

### Phase 1: クリーンアップ

**目的:** 削除対象の Rust コマンド + フロントエンドコンポーネントを削除し、Wing ID を 5 つに更新。

#### 1-A: Rust コマンド削除（8 ファイル + lib.rs 更新）

**削除対象ファイル:**

| ファイル | コマンド数 | 削除理由 |
|---------|----------|---------|
| `src-tauri/src/commands/launcher.rs` | 2 | Non-Goal |
| `src-tauri/src/commands/launcher_settings.rs` | 3 | Non-Goal |
| `src-tauri/src/commands/profile.rs` | 14 | 提案ベースに移行 |
| `src-tauri/src/commands/watchdog.rs` | 6 | AI 提案が代替 |
| `src-tauri/src/commands/script.rs` | 6 | セキュリティリスク |
| `src-tauri/src/commands/storage.rs` | 8 | Non-Goal |
| `src-tauri/src/commands/log.rs` | 4 | 簡易化 |
| `src-tauri/src/commands/cleanup.rs` | 1（`cleanup_app_data` のみ） | `revert_all_settings` は残す |

**lib.rs の更新:**
- `invoke_handler![]` から削除したコマンドの関数名を全て除去
- `cleanup.rs` の `revert_all_settings` は残す。`cleanup_app_data` のみ除去
- `mod` 宣言も対応する行を削除

**チェック:** `cargo check --manifest-path src-tauri/Cargo.toml`

#### 1-B: フロントエンド削除

**削除対象ディレクトリ:**

```
src/components/games/       — ディレクトリごと削除
src/components/log/         — ディレクトリごと削除
src/components/storage/     — ディレクトリごと削除
src/components/performance/ — ディレクトリごと削除（MonitorWing として再設計するため）
```

**削除対象ストア:**

```
src/stores/useLauncherStore.ts
src/stores/useScriptStore.ts
src/stores/useLogStore.ts
src/stores/useStorageStore.ts
src/stores/useWatchdogStore.ts
src/stores/useGameProfileStore.ts
src/stores/useSessionStore.ts
```

**削除対象 lib:**

```
src/lib/gameDetection.ts
src/lib/gameProfile.ts
src/lib/logFilter.ts
src/lib/storageCommands.ts
```

**削除対象 hooks:**

```
src/hooks/gameProfileHooks.ts
src/hooks/storageHooks.ts
```

**削除対象テスト:** 上記ストア・コンポーネントに対応するテストファイルも削除。

#### 1-C: WingId + Shell 更新

**`src/types/wing.ts` を更新:**

```typescript
// v1 の WingId を v2 に変更
export type WingId = 'dashboard' | 'gaming' | 'monitor' | 'history' | 'settings';
```

**注:** `src/types/v2.ts` にも `WingId` が定義されている。v1 の `wing.ts` を v2 の定義に合わせること。

**`src/components/layout/Shell.tsx` を更新:**
- サイドバーアイコン・ラベル・ショートカットを 5 Wing に変更
- 各 Wing のコンポーネント import を更新（新規 Wing コンポーネントはプレースホルダーで OK）

**`src/components/layout/Sidebar.tsx` を更新:**
- 5 Wing のアイコンとラベルのみ

**プレースホルダー Wing コンポーネント（5 ファイル新規作成）:**

```
src/wings/DashboardWing.tsx    — "DASHBOARD — Coming Soon"
src/wings/GamingWing.tsx       — "GAMING — Coming Soon"
src/wings/MonitorWing.tsx      — "MONITOR — Coming Soon"
src/wings/HistoryWing.tsx      — "HISTORY — Coming Soon"
src/wings/SettingsWing.tsx     — "SETTINGS — Coming Soon"
```

各ファイルは `memo()` でラップした最小コンポーネント（10 行以下）。

#### Phase 1 品質ゲート

```
✅ cargo check — Rust コンパイル通過
✅ tsc --noEmit — 型エラーゼロ
✅ npm run check — Biome クリーン
✅ vitest run — 残存テスト全通過（削除したテストは除く）
✅ Shell が 5 Wing で表示される
✅ 削除対象ファイルが全て git rm されている
```

**コミット:** `refactor: NEXUS v2 Phase 1 — クリーンアップ（8 Rust + FE コンポーネント削除 + 5 Wing 化）`

#### Phase 1 — Cascade 記入欄

**ステータス:** `done`

**実装内容:**

- **1-A (Rust):** `commands/launcher.rs`, `launcher_settings.rs`, `profile.rs`, `watchdog.rs`, `script.rs`, `storage.rs`, `log.rs` を削除。`cleanup.rs` から `cleanup_app_data` を除去、`revert_all_settings` を保持。`mod.rs` + `lib.rs` の `invoke_handler![]` を更新。
- **1-B (FE):** `src/components/games/`, `log/`, `storage/`, `performance/` を削除。ストア 7 本・lib 4 本・hooks 2 本・テスト群を削除。連鎖依存（`TcpTuningTab`, `WindowsSettingsTab`, `useProcessSort` 等）も修正。
- **1-C (Nav):** `src/types/wing.ts` の WingId を 5 Wing に更新。`navigation.ts` / `useNavStore.ts` / `Shell.tsx` / `WingHeader.tsx` / `App.tsx` / keyboard shortcuts を全更新。
- **1-D (Wings):** `src/wings/` に `DashboardWing.tsx`, `GamingWing.tsx`, `MonitorWing.tsx`, `HistoryWing.tsx` を新規作成（`memo()` プレースホルダー）。
- **追加修正:** `parsers/log_parser.rs` が削除済み `commands::log` を参照していたため `LogEntry`/`LogLevel` をローカル定義に変更。`NetoptWing.tsx` の WingId `'network'` → `'monitor'` に修正。

**品質ゲート結果:**

- ✅ `cargo check` — clean（pre-existing dead code warnings のみ）
- ✅ `tsc --noEmit` — clean
- ✅ `npm run check` (Biome) — clean
- ✅ `vitest run` — 510/510 tests passed（53 test files）

---

### Phase 2: 基盤（lib/ 純粋関数）

**目的:** `healthScore.ts` + `suggestionEngine.ts` を実装。spec.md §4.1 のアルゴリズムに従う。

#### 2-A: `src/lib/healthScore.ts`

- `src/types/v2.ts` の `HealthInput` → `HealthScore` を返す純粋関数
- spec.md の重み付け表どおりに実装
- Grade 判定: S/A/B/C/D（spec.md §4.1）
- `label` フィールド: 改善可能ポイント数を計算して生成
- **テスト:** `src/lib/healthScore.test.ts` — 境界値 (0,39,40,59,60,79,80,89,90,100) + 各因子のテスト

#### 2-B: `src/lib/suggestionEngine.ts`

- `HealthInput` + 追加情報 → `Suggestion[]` を返す純粋関数
- spec.md §4.1 の 10 ルールを全て実装
- 各 Suggestion に正確な `SuggestionAction`（invokeCommand + args）を含める
- **テスト:** `src/lib/suggestionEngine.test.ts` — 各ルール × 条件 true/false のペア

#### 2-C: `src/lib/constants.ts`

- マジックナンバーを全て定数化
  - `HEALTH_WEIGHTS`, `GRADE_THRESHOLDS`, `THERMAL_THRESHOLDS` 等
- healthScore.ts と suggestionEngine.ts がこのファイルの定数のみ参照

#### Phase 2 品質ゲート

```
✅ tsc --noEmit — 型エラーゼロ
✅ vitest run — 新規テスト含め全通過
✅ healthScore.test.ts — 境界値 10 ケース以上
✅ suggestionEngine.test.ts — 10 ルール × 2 = 20 ケース以上
✅ lib/ ファイルが stores/ を import していないこと
✅ 全ファイル 200 行以下
```

**コミット:** `feat: NEXUS v2 Phase 2 — healthScore + suggestionEngine 純粋関数`

---

### Phase 3: DASHBOARD Wing

**目的:** DASHBOARD Wing の UI 実装。spec.md §4.1 のレイアウトに従う。

- `src/stores/useHealthStore.ts` — `stores/types/healthStore.ts` のインターフェースを実装
- `src/stores/useAiStore.ts` — `stores/types/aiStore.ts` のインターフェースを実装
- `src/components/dashboard/` 以下のコンポーネント（spec.md §6 参照）
- Tauri invoke で `get_windows_settings` + `get_resource_snapshot` + `analyze_bottleneck` を呼び、HealthScore を計算
- SuggestionCard のワンクリック適用フロー

#### Phase 3 品質ゲート

```
✅ tsc --noEmit / vitest run / npm run check
✅ DASHBOARD Wing が Health Score + Suggestion リストを表示
✅ Suggestion の [適用] ボタンが invoke を正しく呼ぶ
✅ 全コンポーネント 200 行以下
✅ 全コンポーネント memo() でラップ
```

**コミット:** `feat: NEXUS v2 Phase 3 — DASHBOARD Wing（HealthScore + Suggestion + ワンクリック適用）`

---

### Phase 4: GAMING Wing

**目的:** GAMING Wing の UI 実装。spec.md §4.2 のセクション構成に従う。

- `src/stores/useOptimizeStore.ts` — `stores/types/optimizeStore.ts` のインターフェースを実装
- `src/components/gaming/` 以下のコンポーネント（spec.md §6 参照）
- Optimize All: 3 プリセット（Gaming/PowerSave/Streaming）の全ステップを順次 invoke
- 各セクション（Windows/Process/Network/Memory/Timer/CPU）の個別制御 UI

#### Phase 4 品質ゲート

```
✅ tsc --noEmit / vitest run / npm run check
✅ Optimize All が全ステップを順次実行
✅ 各セクションが対応 Rust コマンドを正しく invoke
✅ 全コンポーネント 200 行以下 + memo()
```

**コミット:** `feat: NEXUS v2 Phase 4 — GAMING Wing（Optimize All + 7 セクション）`

---

### Phase 5: AI 統合

**目的:** Perplexity Sonar API 統合 + Graceful Degradation（ADR-004）。

- `src/lib/aiAnalyzer.ts` — AI 分析リクエスト/レスポンス処理
- `useAiStore` の `analyze()` アクション実装
- API キーなし → Layer 2（ルールベース）で動作することを確認
- API エラー → Layer 2 にフォールバック

#### Phase 5 品質ゲート

```
✅ API キーなしで DASHBOARD が正常表示（ルールベースのみ）
✅ API キーありで AI 分析結果が Suggestion に反映
✅ ネットワークエラー時にフォールバックが機能
```

**コミット:** `feat: NEXUS v2 Phase 5 — AI 統合（Perplexity Sonar + Graceful Degradation）`

---

### Phase 6: MONITOR + HISTORY Wing

**目的:** リアルタイム監視 + セッション履歴。

- MONITOR: pulse イベント購読 + CircularBuffer(120) + Canvas グラフ + FrameTime
- HISTORY: session.rs CRUD + 7d/30d トレンド + セッション比較
- `src/stores/useHistoryStore.ts` — `stores/types/historyStore.ts` のインターフェースを実装

#### Phase 6 品質ゲート

```
✅ MONITOR が 500ms 更新でリアルタイムグラフ表示
✅ HISTORY がセッション一覧 + 詳細 + 比較を表示
✅ 全コンポーネント 200 行以下 + memo()
```

**コミット:** `feat: NEXUS v2 Phase 6 — MONITOR Wing + HISTORY Wing`

---

### Phase 7: SETTINGS + 統合テスト

**目的:** SETTINGS Wing + 全体結合テスト + Stryker。

- SETTINGS Wing: API キー管理 + アプリ設定（spec.md §4.5）
- lib/ の Stryker mutation テスト実行 → mutation score 70%+ 目標
- 全 Wing 間のナビゲーション確認

#### Phase 7 品質ゲート

```
✅ tsc --noEmit — ゼロエラー
✅ vitest run — 全テスト通過
✅ npm run check — Biome クリーン
✅ cargo clippy -- -D warnings — ゼロ
✅ cargo test — 全通過
✅ Stryker mutation score ≥ 70%（lib/ 対象）
✅ 全 Wing が正常に表示・遷移
✅ 全ファイル 200 行以下
```

**コミット:** `feat: NEXUS v2 Phase 7 — SETTINGS Wing + 統合テスト + Stryker`

---

## v3.1 オンボーディング Phase 1 -- Cascade 向け実装指示

> **ステータス:** `pending`
> **仕様書:** [`docs/specs/onboarding.spec.md`](docs/specs/onboarding.spec.md)
> **目的:** 初回起動時のウェルカムウィザード（4 ステップ）

### AI 開発ルール（全 Phase 共通）

```
1. テストが矛盾する場合は即停止して報告せよ
2. 既存テストの書き換え禁止（新規追加のみ）
3. 全ファイル 200 行以下
4. console.log / any 型 禁止
5. 各 Phase 後に vitest run + tsc --noEmit + npm run check を実行
```

---

### Phase 1-A: OnboardingWizard + WelcomeStep

**新規ファイル:**

- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/onboarding/WelcomeStep.tsx`

**OnboardingWizard.tsx（ステップ管理コンテナ）:**

```typescript
// ステップ定義
type OnboardingStep = 'welcome' | 'scan' | 'readiness' | 'complete';

// localStorage キー
const ONBOARDING_DONE_KEY = 'nexus:onboarding:done';

// ステップ管理 state
const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

// スキップ機能
const handleSkip = () => {
  localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  onComplete(); // App.tsx から渡される callback
};
```

レイアウト:

```tsx
<div className="fixed inset-0 z-50 bg-base-900 flex items-center justify-center">
  {/* ステップインジケーター（4 ドット） */}
  <div className="flex gap-2 mb-6">
    {STEPS.map((step, i) => (
      <div key={step} className={`w-2 h-2 rounded-full ${
        i < currentIndex ? 'bg-success-500'
        : i === currentIndex ? 'bg-accent-500'
        : 'bg-base-600'
      }`} />
    ))}
  </div>

  {/* ステップコンテンツ（card-glass max-w-lg） */}
  <div className="card-glass rounded-lg p-8 max-w-lg w-full wing-enter">
    {/* 各ステップコンポーネント */}
  </div>

  {/* スキップリンク */}
  <button type="button" onClick={handleSkip}
    className="font-mono text-[11px] text-text-muted hover:text-text-secondary mt-4">
    スキップ
  </button>
</div>
```

**WelcomeStep.tsx:**

- NEXUS ロゴ（`text-accent-500 text-2xl font-bold tracking-[0.2em]`）
- 紹介テキスト（`text-[12px] text-text-secondary`）: "Gaming PC をワンクリックで最適化。まずシステムをスキャンしましょう。"
- 「始める」ボタン（`Button variant="primary" fullWidth`）

**App.tsx 変更:**

```typescript
const [onboardingDone, setOnboardingDone] = useState(
  () => localStorage.getItem('nexus:onboarding:done') === 'true'
);

if (!onboardingDone) {
  return <OnboardingWizard onComplete={() => setOnboardingDone(true)} />;
}
// 既存の Shell レンダリング
```

---

### Phase 1-B: ScanStep

**新規ファイル:** `src/components/onboarding/ScanStep.tsx`

3 つのタスクを並行実行し、完了状態をリアルタイム表示:

```typescript
interface ScanTask {
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  errorMessage?: string;
}

// useEffect でマウント時に 3 タスクを Promise.allSettled で実行
const tasks: ScanTask[] = [
  { label: 'STEAM GAMES', status: 'pending' },
  { label: 'HARDWARE INFO', status: 'pending' },
  { label: 'APP SETTINGS', status: 'pending' },
];
```

各タスク表示:

```tsx
<div className="flex items-center gap-3">
  {/* ステータスアイコン */}
  <div className={`w-2 h-2 rounded-full ${
    task.status === 'done' ? 'bg-success-500'
    : task.status === 'running' ? 'bg-accent-500 animate-pulse'
    : task.status === 'error' ? 'bg-danger-500'
    : 'bg-base-600'
  }`} />
  <span className="font-mono text-[11px] text-text-primary tracking-wider">
    {task.label}
  </span>
  {task.status === 'error' && (
    <span className="font-mono text-[9px] text-danger-500">ERROR</span>
  )}
</div>
```

- 全タスク完了後に「次へ」ボタン有効化
- エラーがあってもブロックしない

---

### Phase 1-C: ReadinessSummaryStep + CompleteStep

**新規ファイル:**

- `src/components/onboarding/ReadinessSummaryStep.tsx`
- `src/components/onboarding/CompleteStep.tsx`

**ReadinessSummaryStep.tsx:**

- `ReadinessGauge` コンポーネント（`src/components/home/ReadinessGauge.tsx`）を再利用
- `RecommendationList` コンポーネント（`src/components/home/RecommendationList.tsx`）を再利用
- ScanStep で取得した HW データを props 経由で受け取り、`calcReadiness()` を呼び出す
- 表示: ゲージ + 3 軸スコアバー + 上位 3 件の推奨アクション

**CompleteStep.tsx:**

- チェックマークアイコン（`text-success-500 text-3xl`）
- "セットアップ完了" テキスト
- 「ダッシュボードへ」ボタン（`Button variant="primary" fullWidth`）
- ボタンクリックで `localStorage` にフラグ保存 + `onComplete()` 呼び出し

---

### Phase 1-D: テスト

**新規ファイル:** `src/components/onboarding/OnboardingWizard.test.tsx`

最低限のテストケース:

- localStorage 未設定で OnboardingWizard が表示される
- localStorage 設定済みで OnboardingWizard が表示されない（App.tsx レベル）
- Welcome ステップで「始める」をクリックすると Scan ステップに遷移
- スキップボタンで localStorage にフラグが保存される
- Complete ステップで「ダッシュボードへ」をクリックすると onComplete が呼ばれる

---

### 品質ゲート

```bash
npm run typecheck
npm run check
npm run lint
npm run test
node scripts/check-file-size.mjs --strict
```

全てクリア後にコミット: `feat: v3.1 onboarding Phase 1 -- 初回起動ウィザード`

---

## Design Refresh v2 -- Claude Code レビューフィードバック（Cascade 向け）

> **ステータス:** `review` → 5 観点チェック完了
> **対象コミット:** `dab34c7`（31 files changed, 1485 insertions）
> **判定:** ✅ **APPROVED** -- 以下の改善提案は任意（次回実装時に対応で OK）

### 1. アーキテクチャ / 構造

**✅ 良い点:**

- KpiCard を独立コンポーネントとして抽出（再利用性◎）
- HeroSection が 65 行まで削減（200 行制限を大幅にクリア）
- Card に `glass` / `glass-elevated` variant 追加 -- 既存 API を壊さず拡張

**⚠️ 改善提案:**

- `KpiCard.tsx:13` -- `spark` 値に `rgba()` ハードコードあり。SVG の `stroke` 属性は CSS 変数を直接参照できないため許容だが、将来的に `currentColor` + CSS custom property で置換可能
- `KpiCard.tsx:63` -- `hover:${glow}` のテンプレートリテラルは **Tailwind v4 の JIT で動的クラス生成不可**。実行時には効かない可能性あり → `data-color` 属性 + CSS セレクタ方式を検討

### 2. デザイン規約準拠（DESIGN.md v3）

**✅ 合格:**

- 色は全て CSS 変数経由（`text-warm-500`, `text-purple-500`, `text-info-500` 等）
- タイポグラフィ: `text-[11px] tracking-wider font-mono` パターン統一
- ALL CAPS 規約: ラベル・セクション見出し・ボタンテキストで遵守
- インラインスタイル: `progressWidth()` ヘルパーのみ（計算値の例外に該当）

**⚠️ 注意:**

- `Shell.tsx:86` -- サイドバーアクティブインジケーターに `glow-cyan` クラスを追加。控えめな光で良いが、色覚多様性ユーザーには形状（`w-[3px] h-5` バー）が主な識別手段であることを確認済み

### 3. パフォーマンス

**✅ 良い点:**

- `SparklineSvg` 内の `useMemo` で points 計算をメモ化
- `FrameTimeGraph` の Canvas 描画で `getComputedStyle` を `useEffect` 内に閉じ込め（レンダリングブロックなし）
- `card-glass` の `backdrop-filter: blur(12px)` -- GPU 合成レイヤーになるため高負荷だが、KPI カード 4 枚のみで許容範囲

**⚠️ 改善提案:**

- `FrameTimeGraph.tsx:69-71` -- 毎フレーム `getComputedStyle()` を 5 回呼んでいる。CSS 変数値は `useRef` にキャッシュして reflow を軽減可能

### 4. テスト / 品質

**✅ 合格:**

- 605 テスト全 green
- Biome lint 0 エラー
- typecheck 0 エラー
- ファイルサイズ制限（200 行）全コンポーネントクリア
- 既存テストファイルの Biome 問題（import 順序等）も同時修正済み

### 5. UX / アクセシビリティ

**✅ 良い点:**

- `KpiCard` SVG に `role="img"` + `aria-label` 付与
- GameCard の `aria-pressed={isFavorite}` -- トグルボタンの正しいパターン
- Modal に `modal-enter` アニメーション追加（`scale(0.95)` → `scale(1)`）-- 控えめで適切
- サイドバー tooltip に `card-glass-elevated` -- 視認性向上

**⚠️ 改善提案:**

- `GameCard.tsx:58` -- `bg-linear-to-t` は Tailwind v4 の正しいグラデーション記法だが、hover のオーバーレイにフォーカスインジケーターがないため、キーボードナビゲーションのとき視覚的変化が乏しい

---

### Cascade 向け次回実装のとき TODO（任意）

```
1. [ ] KpiCard hover glow -- テンプレートリテラル動的クラスを data 属性 + CSS に置換
2. [ ] FrameTimeGraph -- getComputedStyle キャッシュ化（useRef）
3. [ ] GameCard -- キーボードフォーカスのとき オーバーレイ表示
```

---

## v3.0.1 — 包括的バグ修正 + UX 改善（Cascade 向け実装指示）

> **ステータス:** ✅ 全 Phase 完了
> **ベースコミット:** `7d9a641`
> **コミット:** Phase ごとに 1 コミット（`fix: v3.0.1 Phase N — 概要`）

### AI 開発ルール（全 Phase 共通）

```
1. テストが矛盾する場合は即停止して報告せよ
2. 既存テストの書き換え禁止（新規追加のみ）
3. 全ファイル 200 行以下
4. console.log / any 型 禁止
5. 各 Phase 後に vitest run + tsc --noEmit + npm run lint を実行
```

---

### Phase 1: クリティカルバグ修正

**1-1. ActionRow subscribe リーク修正**

ファイル: `src/components/home/ActionRow.tsx`

問題: `useEffect` 内で `subscribe()` を呼んでいるが `unsubscribe()` クリーンアップがない。

修正: `useEventSubscription` を使用するか、クリーンアップを追加:
```typescript
useEffect(() => {
  subscribe();
  return () => { useOpsStore.getState().unsubscribe(); };
}, [subscribe]);
```

**1-2. alert() を ErrorBanner に置換**

ファイル: `src/hooks/useWatchdogRuleForm.ts:52`

問題: `alert('Rule name is required')` がネイティブ alert でアプリをブロック。

修正:
- `validationError: string | null` state を追加
- `alert()` → `setValidationError('...')` に置換
- WatchdogRuleModal 側で ErrorBanner 表示
- 入力変更時にクリア

DoD: `grep -r "alert(" src/ --include="*.ts" --include="*.tsx"` が 0 件

**1-3. 破壊的操作の確認ダイアログ追加**

(a) `src/components/settings/MaintenanceTab.tsx` — 全設定リバート
- `handleRevertAll` に確認ステップ追加（既存の「アプリデータ削除」確認 Modal と同様のパターン）

(b) `src/components/performance/ProfileTab.tsx` — プロファイル削除
- `handleDelete` に 2 段階確認追加（SessionTab の `deleteConfirmId` パターンを適用）

---

### Phase 2: Store エラーハンドリング統一

**対象 10 Store:**
useBoostStore, useBottleneckStore, useEcoModeStore, useFrameTimeStore, useLogStore, useModalStore, useNavStore, useScriptStore, useTimerStore, useWatchdogStore

**統一パターン:**
```typescript
} catch (err) {
  const msg = err instanceof Error ? err.message : '操作に失敗しました';
  log.error({ err }, 'storeName: 操作名失敗: %s', msg);
  set({ error: msg });
}
```

**必須修正:**
- `} catch {`（サイレント catch）を全て `} catch (err) {` に変更
- `log` import がない Store に `import log from '../lib/logger'` を追加

DoD:
- `grep "} catch {" src/` が 0 件
- `grep "} catch {" src/lib/` が 0 件

---

### Phase 3: アクセシビリティ改善

**3-1. ボタンの aria-label 追加:**

| ファイル | 対象 |
|---------|------|
| GameCard.tsx | お気に入り、LAUNCH |
| LauncherControls.tsx | スキャン、ソート |
| BottleneckCard.tsx | 分析開始/停止 |
| FrameTimeCard.tsx | START/STOP |
| PerformanceTimelineCard.tsx | タブ切替 |
| QuickActionsCard.tsx | アクション |
| RecommendationList.tsx | 適用 |

aria-label は日本語: `aria-label="お気に入りに追加"` 等

**3-2. Modal フォーカストラップ:**
- Tab キーで Modal 内フォーカスが循環するように
- `useKeyboardShortcuts.ts` と衝突しないこと

---

### Phase 4: ErrorBoundary 拡充

**改善対象:**
```
BoostWing → ErrorBoundary per tab
HardwareWing → ErrorBoundary per section (CpuSection, GpuSection, MemorySection, EcoModePanel)
LauncherWing → ErrorBoundary for game list
SettingsWing → ErrorBoundary per tab
```

ルール:
- fallback に Wing 名 + エラーメッセージ + 再試行ボタン
- 200 行超えないこと

---

### 品質ゲート（全 Phase）

```
✅ npm run typecheck — zero errors
✅ npm run lint — zero errors
✅ npm run test — all pass
✅ node scripts/check-file-size.mjs — all pass
✅ grep "console\.(log|debug)" src/ --include="*.ts" --include="*.tsx" -r — 0 件
✅ grep "} catch {" src/ — 0 件（Phase 2 以降）
✅ grep "alert(" src/ --include="*.ts" --include="*.tsx" — 0 件（Phase 1 以降）
```

---

## v3.0 Phase 3 — Store ロジック抽出（Cascade 向け実装指示）

> **ステータス:** ✅ 完了
> **前提:** Phase 2（`8e2252e`）完了。TS 542 + Rust 230+ all green。
> **目標:** 7 ストア全てを 200 行以下にする ← **達成済み**
> **コミット:** 1 ストア = 1 コミット（`refactor: v3.0 Phase 3-N — useXxxStore ロジックを lib/ に抽出`）

### AI 開発ルール（Cascade 必読）

```
1. テストが矛盾する場合は即停止して報告せよ
2. 既存テストファイルの既存テストケースを書き換えてはならない
3. リファクタリングでは既存コードの移動のみ。新規ロジック禁止
4. 1 ファイル 200 行以下。超過する場合は分割方針を報告
5. 各ストア抽出後に vitest run + tsc --noEmit を実行して確認
```

---

### 3-1: useNavStore.ts（247 行 → 目標 160 行）

**抽出先:** `src/lib/navigation.ts`（新規作成）

**移動するもの:**
- `WING_LABELS` 定数（10 行）
- `ALL_WING_IDS` 定数（10 行）
- `makeInitialWingStates()` 関数（7 行）
- `buildBreadcrumbs()` 関数（57 行）— 純粋関数、store 依存なし

**ストアに残すもの:**
- `navigate()`, `navigateTo()`, `setTab()`, `pushSubpage()`, `popSubpage()`, `clearSubpages()` — 全て `set()` を使用
- セレクター

**品質チェック:** `vitest run` + `tsc --noEmit`

---

### 3-2: useStorageStore.ts（232 行 → 目標 150 行）

**抽出先:** `src/lib/storageCommands.ts`（新規作成）

**移動するもの（Tauri invoke ラッパー 6 関数）:**
- `fetchStorageInfo()` → `async function fetchStorageInfo(): Promise<StorageInfo | null>`
- `cleanupTempFiles()` → `async function cleanupTempFiles(): Promise<number>`
- `cleanupRecycleBin()` → `async function cleanupRecycleBin(): Promise<number>`
- `cleanupSystemCache()` → `async function cleanupSystemCache(): Promise<number>`
- `runFullCleanup()` → `async function runFullCleanup(): Promise<CleanupResult>`
- `analyzeDiskUsage(driveName)` → `async function analyzeDiskUsage(driveName: string): Promise<string[]>`

**ストアに残すもの:**
- state 定義 + `set()` による状態更新
- セレクター + 既存 lib/storage.ts からの re-export

**品質チェック:** `vitest run` + `tsc --noEmit`

---

### 3-3: useWindowsSettingsStore.ts（246 行 → 目標 150 行）

**抽出先:** `src/lib/windowsSettingsCommands.ts`（新規作成）

**移動するもの（Tauri invoke ラッパー 9 関数）:**
- `fetchWindowsSettings()`: invoke + fallback to defaultWindowsSettings
- `setPowerPlan(plan)`: invoke + void
- `toggleGameMode()`: invoke → boolean
- `toggleFullscreenOptimization()`: invoke → boolean
- `toggleHardwareGpuScheduling()`: invoke → boolean
- `setVisualEffects(effect)`: invoke + void
- `fetchAdvisorResult()`: invoke → AdvisorResult
- `applyRecommendation(settingId)`: invoke + void
- `applyAllSafeRecommendations()`: invoke + void

**ストアに残すもの:**
- state 定義 + optimistic update ロジック（`set()` 使用）
- エラーハンドリング + セレクター

**品質チェック:** `vitest run` + `tsc --noEmit`

---

### 3-4: useLogStore.ts（239 行 → 目標 180 行）

**抽出先:** `src/lib/logFilter.ts`（新規作成）

**移動するもの（純粋フォーマッター 4 関数）:**
- `getLogLevelColor(level)`: LogLevel → Tailwind カラークラス
- `getLogLevelBgColor(level)`: LogLevel → Tailwind 背景クラス
- `formatTimestamp(timestamp)`: string → ja-JP フォーマット済み文字列
- `truncateMessage(message, maxLength?)`: 100 文字切り詰め

**追加抽出先:** `src/lib/logCommands.ts`（新規作成、オプション）
- `fetchSystemLogs()`, `fetchApplicationLogs()`, `analyzeLogs()`, `exportLogs()`

**ストアに残すもの:**
- state + フィルター setter + セレクター

**品質チェック:** `vitest run` + `tsc --noEmit`

---

### 3-5: useHardwareStore.ts（269 行 → 目標 200 行）

**抽出先:** `src/lib/hardwareFormatters.ts`（新規作成）

**移動するもの:**
- `defaultHardwareInfo` 定数（20 行）
- `formatUptime(seconds)`: 秒 → "Xd Xh Xm" 文字列（13 行）
- `createDiskProgressBar(usedGb, totalGb)`: プログレスバー文字列（7 行）
- `formatBootTime(bootTimeUnix)`: Unix タイムスタンプ → ja-JP 日時（9 行）
- `calculateMemUsagePercent(used, total)`: 使用率計算（2 行）

**ストアに残すもの:**
- `subscribe()` / `unsubscribe()` — Tauri イベントリスナー
- セレクター（lib からの再計算を呼び出し）

**品質チェック:** `vitest run` + `tsc --noEmit`

---

### 3-6: useGameProfileStore.ts（313 行 → 目標 200 行）

**抽出先:** `src/lib/gameProfile.ts`（既存ファイルに追加）

**移動するもの（Tauri invoke ラッパー）:**
- `fetchGameProfiles()`: invoke → GameProfile[]
- `saveGameProfile(profile)`: invoke → GameProfile
- `deleteGameProfile(id)`: invoke → void
- `applyGameProfile(id)`: invoke → ProfileApplyResult
- `revertGameProfile()`: invoke → void
- `getCpuTopology()`: invoke → CpuTopology | null
- `fetchCoreParking()`: invoke → CoreParkingState | null
- `setCoreParking(minCoresPercent)`: invoke → CoreParkingState | null
- `exportGameProfile(id)`: invoke → string | null
- `importGameProfile(json)`: invoke → GameProfile | null

**純粋ヘルパー:**
- `updateProfileInList(profile, profiles)`: プロファイルリスト内の更新/追加

**ストアに残すもの:**
- state + `setupListeners()` + セレクター

**品質チェック:** `vitest run` + `tsc --noEmit`

---

### 3-7: useNetworkTuningStore.ts（212 行 → 目標 150 行）

**抽出先:** `src/lib/networkTuning.ts`（新規作成）

**移動するもの（Tauri invoke ラッパー 9 関数）:**
- `fetchTcpTuningState()`: invoke → TcpTuningState
- `setNagleDisabled(disabled)`: invoke → void
- `setDelayedAckDisabled(disabled)`: invoke → void
- `setNetworkThrottling(index)`: invoke → void
- `setQosReservedBandwidth(percent)`: invoke → void
- `setTcpAutoTuning(level)`: invoke → void
- `applyGamingNetworkPreset()`: invoke → TcpTuningState
- `resetNetworkDefaults()`: invoke → TcpTuningState
- `measureNetworkQuality(target, count)`: invoke → NetworkQualitySnapshot

**ストアに残すもの:**
- state + optimistic update + セレクター

**品質チェック:** `vitest run` + `tsc --noEmit`

---

### 全ストア完了後（✅ 達成済み）

```
✅ 7 ストア全てが 200 行以下（useGameProfileStore.ts: 198行、他全て 200行以下）
✅ vitest run — 542 件 all green
✅ tsc --noEmit — 型エラーゼロ
✅ npm run check — Biome クリーン（5 files fixed）
✅ check-file-size.mjs — 常時エラーモードに昇格（STRICT_MODE = true）
```

### 作成・変更ファイル一覧

| ファイル | 変更内容 |
|---------|----------|
| `src/lib/navigation.ts` | 新規: WING_LABELS / ALL_WING_IDS / makeInitialWingStates / buildBreadcrumbs |
| `src/lib/storageCommands.ts` | 新規: fetchStorageInfo 等 6 invoke ラッパー |
| `src/lib/windowsSettingsCommands.ts` | 新規: fetchWindowsSettings 等 9 invoke ラッパー |
| `src/lib/logFilter.ts` | 新規: getLogLevelColor / getLogLevelBgColor / formatTimestamp / truncateMessage |
| `src/lib/hardwareFormatters.ts` | 新規: defaultHardwareInfo / formatUptime / createDiskProgressBar / formatBootTime / calculateMemUsagePercent |
| `src/lib/gameProfile.ts` | 追記: fetchGameProfiles 等 10 invoke ラッパー + updateProfileInList + setupGameListeners |
| `src/lib/networkTuning.ts` | 新規: fetchTcpTuningState 等 9 invoke ラッパー |
| `src/hooks/networkTuningHooks.ts` | 新規: useNetworkTuningState / useNetworkTuningActions |
| `src/hooks/hardwareHooks.ts` | 新規: useHardwareData |
| `src/hooks/storageHooks.ts` | 新規: useStorage |
| `src/hooks/windowsSettingsHooks.ts` | 新規: useWindowsSettings |
| `src/hooks/gameProfileHooks.ts` | 新規: useGameProfileState / useGameProfileActions |
| `src/types/storage.ts` | 追記: StorageStore interface |
| `src/types/settings.ts` | 追記: WindowsSettingsStore interface |
| `src/types/game.ts` | 追記: GameProfileState / GameProfileActions interface |
| `scripts/check-file-size.mjs` | 変更: STRICT_MODE を常時 true に昇格 |

---

## v3.0 Phase 2 — types 分割 + Stryker（Cascade 向け実装指示）

> **ステータス:** ✅ 完了（2026-03-19）
> **コミット:**
> 1. `b2bdaec` — `refactor: v3.0 Phase 2A — assertNever を lib/assert.ts に移動`
> 2. `25825e2` — `refactor: v3.0 Phase 2B — types/index.ts を 18 ドメインファイルに分割（前半）`
> 3. `84c42a0` — `refactor: v3.0 Phase 2C — types/index.ts を 18 ドメインファイルに分割（後半）`
> 4. `8e2252e` — `refactor: v3.0 Phase 2D — types/index.ts を re-export のみに書き換え`

### AI 開発ルール（Cascade 必読）

```
1. テストが矛盾する場合は即停止して報告せよ
2. 既存テストファイルの既存テストケースを書き換えてはならない
3. リファクタリングでは既存コードの移動のみ。新規ロジック禁止
4. 1 ファイル 200 行以下。超過する場合は分割方針を報告
5. spec.md と実装結果が異なる場合、実装のバグとして報告（テストを変えるな）
```

---

### 2A: assertNever を lib/assert.ts に移動

**作成するファイル `src/lib/assert.ts`:**

```typescript
/**
 * 網羅性チェック用ユーティリティ
 * switch/if-else の exhaustive check に使用する
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
```

**import 更新が必要なファイル（2 件）:**
- `src/lib/gameReadiness/index.ts` — `from '../../types'` → `from '../assert'`
- `src/lib/gameReadiness/scores.ts` — `from '../../types'` → `from '../assert'`

**types/index.ts の変更:**
- `assertNever` 関数定義を削除
- `export { assertNever } from '../lib/assert'` を追加（後方互換）

**品質チェック:** `vitest run` + `tsc --noEmit` 全通過

---

### 2B: types/index.ts 前半分割（9 ドメインファイル）

**ルール（厳守）:**
- 既存コードの import パスは変更しない（`import { X } from '../types'` がそのまま動くこと）
- 新規ファイルは `src/types/` に作成
- `src/types/navigation.ts` は変更しない
- 各サブフェーズ後に `vitest run` + `tsc --noEmit` を実行

**作成するファイルと収録型:**

| ファイル | 収録する型 |
|---------|-----------|
| `types/wing.ts` | WingId, WingStatus, FeedLevel, FeedEntry |
| `types/boost.ts` | BoostAction, BoostResult, ProcessPriorityLevel, BoostLevel |
| `types/script.ts` | ScriptEntry, ExecutionLog |
| `types/hardware.ts` | HardwareInfo, DiskInfo, CpuTopology, CoreParkingState, ThermalAlertLevel, ThermalAlert, CurrentPowerPlan |
| `types/storage.ts` | DriveInfo, DiskDrive, StorageInfo, CleanupResult |
| `types/network.ts` | NetworkAdapter, DnsPreset, PingResult, NetworkDevice, TrafficSnapshot, TcpAutoTuningLevel, TcpTuningState, NetworkQualitySnapshot |
| `types/settings.ts` | AppSettings, WindowsSettings, PowerPlan(enum), VisualEffects(enum), WinSetting |
| `types/advisor.ts` | SettingRecommendation, RecommendedValue, AdvisorResult, WindowsSettingsSnapshot |
| `types/power.ts` | PowerEstimate, EcoModeConfig, MonthlyCostEstimate, RevertItem, RevertAllResult |

**手順:**
1. 各ファイルに該当する型定義をカット＆ペースト
2. index.ts に `export * from './xxx'` を追加（元の型定義は削除）
3. `vitest run` + `tsc --noEmit` で確認

---

### 2C: types/index.ts 後半分割（9 ドメインファイル）

| ファイル | 収録する型 |
|---------|-----------|
| `types/log.ts` | LogLevel, LogEntry, LogAnalysis |
| `types/session.ts` | SessionSummary, FrameTimePercentile, FpsTimelinePoint, HardwareSnapshot, SavedFrameTimeSession, SessionListItem, SessionComparisonResult |
| `types/watchdog.ts` | WatchdogRule, WatchdogCondition, WatchdogMetric, WatchdogOperator, WatchdogAction, ProcessFilter, WatchdogEvent |
| `types/game.ts` | GameInfo, GameProfile, SharedProfile, PowerPlanType, ProfileApplyResult, GameLaunchEvent, GameExitEvent |
| `types/process.ts` | SystemProcess, AiSuggestion |
| `types/analysis.ts` | BottleneckType, BottleneckConfidence, BottleneckScores, BottleneckSuggestion, BottleneckResult, AiRecommendation, AiBottleneckResponse, HealthSeverity, HealthFixAction, HealthCheckItem, HealthCheckResult, HealthCheckInput, HeavyProcess |
| `types/performance.ts` | TimerResolutionState, FrameTimeSnapshot, FrameTimeMonitorState |
| `types/pulse.ts` | ResourceSnapshot |

**クロス依存（src/types/ 内）:**
- `types/game.ts` → `import type { ProcessPriorityLevel, BoostLevel } from './boost'`
- `types/hardware.ts` の `CpuTopology` は `types/game.ts` でも使用されるが、`types/hardware.ts` に定義を置き `game.ts` から import

**手順:** 2B と同じ

---

### 2D: types/index.ts を re-export のみに書き換え

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
export * from './performance';
export * from './pulse';
// assertNever は lib/assert.ts に移動済み — 後方互換のため再 export
export { assertNever } from '../lib/assert';
```

### 品質ゲート

```
✅ vitest run — 542 件以上
✅ tsc --noEmit — 型エラーゼロ
✅ npm run check — Biome クリーン
✅ npm run lint — 全通過
✅ types/index.ts が re-export のみ（型定義の実体ゼロ）
✅ assertNever が src/lib/assert.ts に存在
✅ import { X } from '../types' が全箇所で動作（後方互換）
```

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
