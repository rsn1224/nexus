# NEXUS v2 — Stitch HTML から全 Wing を作り直す

**ブランチ:** `feature/v2-stitch-impl`
**担当:** Cascade（実装） → Claude Code（レビュー）

## 前提

`stitch-assets/` ディレクトリにローカル Stitch アセットがある:

| ファイル | 種類 | 対応 Wing |
|---------|------|----------|
| CORE_Wing_Ultimate_Gloss_HUD.html | HTML | core (Dashboard) |
| ARSENAL_Wing_Ultimate_Gloss_HUD.html | HTML | arsenal (Gaming) |
| CORE_Wing_Ultimate_Gloss_HUD.png | スクショ | core |
| ARSENAL_Wing_Ultimate_Gloss_HUD.png | スクショ | arsenal |
| DASHBOARD_NEXUS_v2_Mobile.png | スクショ | core (モバイル版) |
| DASHBOARD_Universal_HUD.png | スクショ | core (別バリエーション) |
| GAMING_NEXUS_v2_Mobile.png | スクショ | arsenal (モバイル版) |
| MONITOR_NEXUS_v2_Mobile.png | スクショ | tactics |
| SETTINGS_NEXUS_v2_Mobile.png | スクショ | settings |
| SETTINGS_Wing_Ultimate_Gloss_HUD_v3.png | スクショ | settings |
| Design_Tokens_Ultimate_Gloss_HUD.png | トークン参照 | 全体 |
| Component_Library_Ultimate_Gloss_HUD.png | コンポーネント参照 | 全体 |
| Inspect_Mode_Toggle_Switch_Details.png | Toggle 仕様 | 共通 UI |

---

## 現在の Wing 構成（変更禁止）

| WingId | コンポーネント | 用途 |
|--------|-------------|------|
| `core` | DashboardWing | System Health + テレメトリ + AI 提案 |
| `arsenal` | GamingWing | ゲーム最適化 + プロセス管理 |
| `tactics` | MonitorWing | リアルタイム監視 + KPI |
| `logs` | HistoryWing | セッション履歴 + トレンド |
| `settings` | SettingsWing | アプリ設定 + Windows 設定 |

**ファイル構造:**
```
src/wings/           → re-export のみ（1行ファイル）
src/components/
  dashboard/         → core Wing の実装
  gaming/            → arsenal Wing の実装
  monitor/           → tactics Wing の実装
  history/           → logs Wing の実装
  settings/          → settings Wing の実装
```

---

## Step 1: Stitch HTML の解析ルール

HTML ファイルを読み込んで以下の情報のみ抽出する。
**HTML をそのまま使わず、必ず Tailwind + React に変換する。**

### 抽出対象

1. レイアウト構造（grid/flex の方向・比率）
2. 色クラスまたはインライン color 値
3. フォントサイズ・ウェイト
4. padding / margin / gap の数値
5. border / box-shadow の値
6. コンポーネントの階層関係

### 無視する項目

- `<style>` タグ内の CSS（Tailwind に置き換え）
- Google Fonts の CDN リンク（既に Inter + B612 Mono をローカル設定済み）
- Stitch 固有のクラス名（`--sys-*` 変数等）
- JavaScript（Tauri + React に置き換え）

---

## Step 2: デザイントークン（確定値・変更禁止）

```text
bg:          #030305   → bg-base-900
surface:     #0f0f12   → bg-base-700
surface2:    #1a1a1e   → bg-base-600
border:      #1a1a1e   → border-border-subtle
green:       #44D62C   → text-accent-500 / bg-accent-500
red:         #EF4444   → text-danger-500
yellow:      #FFD700   → text-warning-500
cyan:        #00F0FF   → text-info-500
text:        #e5e1e7   → text-text-primary
muted:       #566070   → text-text-muted
secondary:   #a8b8b9   → text-text-secondary
fontSans:    Inter      → font-sans
fontData:    B612 Mono  → font-data
```

### カラー置換ルール（Stitch HTML → NEXUS）

```text
Stitch #00F0FF (cyan)  → #44D62C (accent-500, Razer Green)
Stitch #FCEE0A (yellow) → #FFD700 (warning-500)
Stitch #44D62C (green)  → そのまま維持
Stitch #B9CACB (muted)  → text-text-secondary
```

### CSS クラス対応表

```text
Stitch .glass-panel     → glass-panel（既存）
Stitch .bloom-border    → bloom-border（既存）
Stitch .ring-core       → ring-core（既存）
Stitch .font-data       → font-data（既存）
Stitch アイコン          → material-symbols-outlined（既存）
```

---

## Step 3: 各 Wing の実装指示

### CORE Wing (core = DashboardWing)

**参照:** `stitch-assets/CORE_Wing_Ultimate_Gloss_HUD.html` + `.png`

**ファイル:** `src/components/dashboard/DashboardWing.tsx`（既に Phase R-3 で書き直し済み）

Stitch HTML の CORE Wing デザインを参考に、現在の DashboardWing を改善:

- システムステータスカード（CPU / GPU / TEMP / MEM） → 既存 TelemetryBentoCard を使用
- RingCore（ヘルススコア円形ゲージ）→ 既存を維持
- StitchAiPanel → 既存を維持
- **Stitch HTML の追加要素があれば反映**

data-testid: `wing-core`（Shell.tsx で自動付与、変更不要）

### ARSENAL Wing (arsenal = GamingWing)

**参照:** `stitch-assets/ARSENAL_Wing_Ultimate_Gloss_HUD.html` + `.png`

**ファイル:** `src/components/gaming/GamingWing.tsx`（書き直し）

Stitch HTML から再現すべき要素:

- デバイス／最適化プリセットカード
- トグルスイッチ（ToggleV2 を使用: `src/components/ui/ToggleV2.tsx`）
- 各種設定パネル（glass-panel bloom-border スタイル）
- プロセス管理テーブル（glass-panel 内）

実装ルール:

- 既存の gaming/ 配下のコンポーネントを活用（CpuPanel, TimerPanel, NetworkPanel 等）
- 新規コンポーネントが必要な場合は gaming/ 配下に作成
- 各コンポーネント 200行以下

### TACTICS Wing (tactics = MonitorWing)

**参照:** `stitch-assets/MONITOR_NEXUS_v2_Mobile.png`（HTML なし）

**ファイル:** `src/components/monitor/MonitorWing.tsx`（Stitch スタイル適用）

PNG を参考に:

- KPI メトリクスカード（CPU / GPU / MEM / FPS）→ 既存 MetricCard を glass-panel 化
- リアルタイムグラフ → 既存 TimelineGraph を維持
- コアロードチャート → 既存 CoreLoadChart を維持
- 全カードに glass-panel bloom-border を適用

### LOGS Wing (logs = HistoryWing)

**参照:** なし（既存デザインに glass-panel を適用）

**ファイル:** `src/components/history/HistoryWing.tsx`

- SessionList テーブルに glass-panel 適用
- TrendChart に glass-panel 適用
- font-data をデータ値に適用

### SETTINGS Wing (settings = SettingsWing)

**参照:** `stitch-assets/SETTINGS_Wing_Ultimate_Gloss_HUD_v3.png` + `SETTINGS_NEXUS_v2_Mobile.png`

**ファイル:** `src/components/settings/SettingsWing.tsx`

PNG を参考に:

- API キー入力フィールド（glass-panel 内）
- トグル設定（ToggleV2 使用）
- セクション分割（glass-panel bloom-border）

---

## Step 4: 共通 UI コンポーネントの Stitch 化

`stitch-assets/Component_Library_Ultimate_Gloss_HUD.png` と `Inspect_Mode_Toggle_Switch_Details.png` を参考に:

### ToggleV2 の確定仕様

```text
サイズ: 56 x 28px（Inspect 確定値）
ON:  bg-accent-500, shadow: 0 0 10px rgba(68,214,44,0.4)
OFF: bg-base-600
つまみ: 24px 丸, 白
アニメーション: 200ms ease
```

既存 `src/components/ui/ToggleV2.tsx` がこの仕様に合っているか確認し、差異があれば修正。

---

## Step 5: 実装前の準備

### .gitignore に追加

```text
sqlite_mcp_server.db
```

### stitch-assets/ を docs に移動

```bash
git mv stitch-assets/ docs/v2/stitch-assets/
```

---

## Step 6: 品質ゲート

```bash
npx tsc --noEmit              # 型エラーゼロ
npx biome check --write .     # Biome クリーン
npx vitest run                # 674件以上通過
# E2E（レイアウト変更後）
npx playwright test e2e/
```

### E2E テスト要件

Wing 遷移テストは `data-testid="nav-{wingId}"` ボタンのクリックで行う。
各 Wing のコンテンツは `data-testid="wing-{wingId}"` 内に描画される（Shell.tsx の main 要素）。

---

## コミット形式

```text
feat: CORE Wing Stitch 化 — glass-panel + font-data 適用
feat: ARSENAL Wing Stitch リビルド — HTML 参照 + ToggleV2 統合
style: TACTICS Wing Stitch 化 — MetricCard + glass-panel
style: LOGS Wing Stitch 化 — SessionList + TrendChart
style: SETTINGS Wing Stitch 化 — 設定パネル + ToggleV2
```

## 実行順序

```text
CORE → ARSENAL → TACTICS → LOGS → SETTINGS
```

CORE と ARSENAL は HTML があるため忠実再現。残りは PNG 参照 + 既存コンポーネントの Stitch 化。
