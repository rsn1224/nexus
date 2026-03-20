# Stitch UI リビルド仕様書 — Cascade 実装指示

**目的:** Google Stitch で生成した HTML デザインを忠実に再現し、NEXUS v2 の UI を一から作り直す。
**参照:** Stitch 生成 HTML を `docs/v2/stitch-generated.html` に保存。このファイルのレイアウト・クラス名・スタイリングを可能な限りそのまま移植すること。
**ブランチ:** `feature/v2-stitch-impl`

## 確定方針

| 項目 | 決定 |
|------|------|
| Primary accent | Razer Green (#44D62C) 維持。Stitch の Cyan (#00F0FF) 箇所を Green に置換 |
| ナビゲーション | デスクトップ: サイドバー(w-64)、モバイル: ボトムタブ |
| アイコン | Material Symbols Outlined (Google Fonts CDN) |
| データフォント | B612 Mono (Google Fonts CDN) |

## カラー置換ルール

```text
#00F0FF (Stitch cyan)   -> #44D62C (accent-500, Razer Green)
#FCEE0A (Stitch yellow) -> #FFD700 (warning-500)
#44D62C (Stitch green)  -> #44D62C (そのまま)
#B9CACB (Stitch muted)  -> #a8b8b9 (text-secondary)
#030305 (Stitch bg)     -> #030305 (base-900)
#353438 (Stitch surface) -> 既存 glass-panel 色を維持
```

## Wing マッピング

| Stitch ナビ | WingId | ラベル | Material Symbol |
|------------|--------|--------|-----------------|
| Dashboard | core | DASHBOARD | grid_view |
| Library | arsenal | ARSENAL | sports_esports |
| Friends | tactics | TACTICS | monitoring |
| Achievements | logs | LOGS | terminal |
| Store | settings | SETTINGS | settings |

## モバイル BottomTab マッピング

| Stitch | WingId | アイコン | ラベル |
|--------|--------|---------|--------|
| HUD | core | grid_view | HUD |
| PLAY | arsenal | sports_esports | PLAY |
| SQUAD | tactics | monitoring | MONITOR |
| GEAR | settings | settings | GEAR |

---

## Phase R-1: CSS + フォント基盤

### 1. index.html にフォント/アイコン CDN を追加

```html
<link href="https://fonts.googleapis.com/css2?family=B612+Mono&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

### 2. index.css に Stitch クラスを追加

既存クラスと競合しないよう注意。以下を追加:

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.bloom-border {
  box-shadow: 0 0 0 0.5px rgba(185, 202, 203, 0.15);
}

.ring-core {
  border: 2px solid rgba(68, 214, 44, 0.1);
  border-top-color: #44D62C;
  border-radius: 50%;
}
```

既存 `.glass-panel` を Stitch 版で上書き:

```css
.glass-panel {
  background: rgba(53, 52, 56, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

### 3. @theme に font-data を追加

```css
--font-data: "B612 Mono", monospace;
```

### 4. design-tokens.ts 同期

```ts
fontFamily: {
  sans: '"Inter", "Noto Sans JP", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  data: '"B612 Mono", monospace',
}
```

**品質ゲート:** tsc --noEmit + vitest run + npm run check

---

## Phase R-2: Shell + TitleBar + Sidebar + BottomTabBar

### ファイル一覧

| ファイル | アクション | 行数目安 |
|---------|-----------|---------|
| src/components/layout/TitleBar.tsx | 書き直し | 80行 |
| src/components/layout/Sidebar.tsx | 新規作成 | 120行 |
| src/components/layout/BottomTabBar.tsx | 新規作成 | 50行 |
| src/components/layout/Shell.tsx | 書き直し | 40行 |
| src/App.tsx | 修正(WingHeader削除) | 55行 |

### TitleBar.tsx 仕様

Stitch HTML の `<header>` を忠実に再現。

- 固定 top-0 w-full z-50 h-16
- bg-[#030305]/80 backdrop-blur-xl border-b-[0.5px] border-white/10
- 左: "NEXUS" text-2xl font-black tracking-tighter text-accent-500 drop-shadow-[0_0_8px_rgba(68,214,44,0.5)]
- 右: Material Symbols (notifications + settings) + Tauri window controls (min/max/close)
- 全体: data-tauri-drag-region 必須
- getCurrentWindow() で Tauri API 使用

### Sidebar.tsx 仕様

Stitch HTML の `<aside>` を忠実に再現。

Props: `{ activeWing: WingId; onWingChange: (wing: WingId) => void }`

- fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 z-40
- hidden md:flex flex-col (モバイルで非表示)
- bg-[#030305] border-r-[0.5px] border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.8)]

上部パネル:

- "SYSTEM STATUS" text-[10px] tracking-[0.2em] text-white/40 uppercase
- "SYSTEM" font-black text-xl text-warning-500 tracking-tighter
- ONLINE バッジ: text-[10px] bg-accent-500/20 text-accent-500 px-1.5 py-0.5 rounded-sm font-bold

ナビ項目 (5つ):

- Active: bg-accent-500/10 text-accent-500 border-r-2 border-accent-500 shadow-[inset_0_0_15px_rgba(68,214,44,0.1)]
- Inactive: text-white/60 hover:bg-white/5 hover:text-white
- 各項目: material-symbols-outlined アイコン + ラベル (text-xs uppercase tracking-wide)

下部:

- OPTIMIZE NOW ボタン: w-full py-3 bg-gradient-to-r from-[#88ec78] to-[#44D62C] text-[#030305] font-black text-xs tracking-widest uppercase rounded-sm hover:brightness-110

最下部:

- Support + Logout リンク (text-[10px] text-white/40 uppercase tracking-widest)

data-testid: sidebar / nav-{wingId}

### BottomTabBar.tsx 仕様

Stitch HTML の `<nav class="md:hidden">` を再現。

Props: `{ activeWing: WingId; onWingChange: (wing: WingId) => void }`

- fixed bottom-0 w-full z-50 h-16
- md:hidden (デスクトップで非表示)
- bg-[#030305]/90 backdrop-blur-2xl border-t-[0.5px] border-white/10

タブ構成:

- core: grid_view / HUD
- arsenal: sports_esports / PLAY
- tactics: monitoring / MONITOR
- settings: settings / GEAR

Active: text-accent-500, FILL 1
Inactive: text-white/60
各タブ: flex-col items-center space-y-1
ラベル: text-[8px] font-black tracking-widest uppercase

### Shell.tsx 仕様

```tsx
<div className="min-h-screen bg-[#030305]">
  <TitleBar />
  <Sidebar activeWing={activeWing} onWingChange={onWingChange} />
  <main className="md:ml-64 pt-20 pb-24 md:pb-10 px-4 md:px-10 min-h-screen">
    {children}
  </main>
  <BottomTabBar activeWing={activeWing} onWingChange={onWingChange} />
</div>
```

削除対象: scanline-overlay, scanning-bar, BottomStatusBar import

### App.tsx 修正

WingHeader の import と使用を削除。

**品質ゲート:** tsc --noEmit + vitest run + npm run check

---

## Phase R-3: DashboardWing (CORE) リビルド

### ファイル一覧

| ファイル | アクション | 行数目安 |
|---------|-----------|---------|
| src/components/dashboard/DashboardWing.tsx | 書き直し | 60行 |
| src/components/dashboard/RingCore.tsx | 新規作成 | 80行 |
| src/components/dashboard/TelemetryBentoCard.tsx | 新規作成 | 60行 |
| src/components/dashboard/StitchAiPanel.tsx | 新規作成 | 90行 |
| src/components/dashboard/FooterMetrics.tsx | 新規作成 | 40行 |

### RingCore.tsx 仕様

Props: `{ score: number; loading: boolean; statusLabel?: string }`
データソース: useHealthStore の healthScore

- flex flex-col items-center justify-center py-10 relative overflow-hidden
- 背景リング: absolute inset-0, w-[500px] h-[500px] rounded-full border border-accent-500/20 animate-pulse opacity-20
- 外リング: ring-core animate-[spin_10s_linear_infinite]
- 内リング: ring-core border-dashed opacity-30 animate-[spin_15s_linear_infinite_reverse]
- 中央 "Power Core": text-[10px] md:text-xs tracking-[0.3em] text-text-secondary uppercase
- スコア値: text-4xl md:text-6xl font-data font-bold text-accent-500
- ステータス: text-[8px] md:text-[10px] bg-accent-500/10 text-accent-500 px-2 py-0.5 mt-2 rounded-full uppercase

### TelemetryBentoCard.tsx 仕様

Props:

```ts
{
  icon: string;         // Material Symbol 名
  category: string;     // "Processor" / "Graphics" / "Memory"
  title: string;        // "CPU LOAD" / "GPU TEMP" / "RAM USAGE"
  value: string;        // "42" / "74" / "12.8"
  unit: string;         // "%" / "C" / "GB"
  barPercent: number;   // 0-100
  barColor: string;     // Tailwind class
  glowClass: string;    // glow class
  detail: string;       // "CORE_01: 4.2GHz"
  status: string;       // "OPTIMAL" / "HIGH LOAD" / "HEALTHY"
  statusColor: string;  // Tailwind text color
}
```

- glass-panel bloom-border p-6 relative overflow-hidden group
- 右上: material-symbols-outlined text-white/30 group-hover:{statusColor} transition-colors
- カテゴリ: text-[10px] tracking-widest text-white/60 uppercase
- タイトル: text-lg font-bold tracking-tight
- 値: text-4xl font-data
- 単位: text-xl font-data text-white/40
- プログレスバー: w-full bg-white/5 h-1 + 塗り (style={{ width }})
- フッター: flex justify-between text-[10px] font-data text-white/40

### StitchAiPanel.tsx 仕様

Props: `{ suggestions, onApply, onRollback, loading }`

- grid grid-cols-1 md:grid-cols-12 gap-6
- 左 md:col-span-8: glass-panel bloom-border, flex flex-col md:flex-row
  - 左1/3: bg-accent-500/5 p-8, AI アバター + "STITCH AI" + "Active Liaison"
  - 右2/3: p-8, タイムスタンプ + メッセージ + アクションボタン
- 右 md:col-span-4: glass-panel bloom-border bg-warning-500/5
  - "Critical Alert" バッジ + warning アイコン + 説明 + "RESOLVE NOW" ボタン

### FooterMetrics.tsx 仕様

- glass-panel bloom-border p-6 flex flex-col md:flex-row justify-between
- Session Time (font-data) + Network Link (font-data text-accent-500) + copyright

### DashboardWing.tsx 書き直し

RingCore + TelemetryBentoCard x3 + StitchAiPanel + FooterMetrics を配置。
既存の buildHealthInput() ロジックは維持。

**品質ゲート:** tsc --noEmit + vitest run + npm run check

---

## Phase R-4: クリーンアップ + 他 Wing Stitch 化

### 削除対象

- src/components/layout/BottomStatusBar.tsx
- src/components/layout/WingHeader.tsx
- src/components/layout/StatusBar.tsx
- src/components/dashboard/IntegrityRing.tsx (RingCore に置換)
- src/components/dashboard/HardwareTelemetry.tsx (TelemetryBentoCard に置換)
- src/components/dashboard/AiAdvisorLog.tsx (StitchAiPanel に置換)
- src/components/dashboard/HealthScoreBar.tsx (RingCore に統合)

### 他 Wing への Stitch 適用

各 Wing に glass-panel + bloom-border + font-data スタイルを適用。
Phase R-3 で確立したパターン (TelemetryBentoCard 等) を再利用。

---

## 全体品質ゲート

```text
tsc --noEmit -- 型エラーゼロ
npm run check -- Biome クリーン
vitest run -- 674件以上通過
全ファイル 200行以下
localhost:1420 で Stitch HTML と同等の見た目
サイドバー: デスクトップで表示、モバイルで非表示
ボトムタブ: モバイルで表示、デスクトップで非表示
Ring Core: 回転アニメーション動作
テレメトリカード: リアルタイムデータ表示
Tauri window controls: 最小化/最大化/閉じるが動作
```
