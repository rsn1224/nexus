# NEXUS v2 — Stitch デザイン全面採用 実装仕様書

> **担当:** Cascade（実装） → Claude Code（レビュー）
> **ベースデザイン:** Google Stitch 生成 HTML（MONITOR Wing + HISTORY Wing）
> **方針:** Stitch 出力のビジュアルを 100% 再現する

---

## 1. カラーパレット変更

### `src/index.css` @theme 更新

```css
@theme {
  /* ─── NEXUS v2: Razer HUD ─────────────────────── */
  --color-base-950: #010102;
  --color-base-900: #030305;
  --color-base-800: #080808;
  --color-base-700: #0f0f12;
  --color-base-600: #1a1a1e;
  --color-base-500: #2d2d33;

  /* Razer Green — メインアクセント */
  --color-accent-600: #2fa822;
  --color-accent-500: #44D62C;
  --color-accent-400: #5ee048;
  --color-accent-300: #88ec78;

  /* Warm: ニュートラルライト */
  --color-warm-600: #8899aa;
  --color-warm-500: #c8d8e8;
  --color-warm-400: #ddeaf4;
  --color-warm-300: #eef5ff;

  /* Warning/Amber — 黄色警告 */
  --color-purple-600: #c87800;
  --color-purple-500: #FFD700;
  --color-purple-400: #fbbf24;
  --color-purple-300: #fde68a;

  /* Info: Cyan/Teal — 情報 */
  --color-info-600: #0099cc;
  --color-info-500: #00f0ff;
  --color-info-400: #60f8ff;

  /* Semantic */
  --color-danger-600: #cc1111;
  --color-danger-500: #FF3131;
  --color-danger-200: #fecaca;

  --color-warning-600: #c87800;
  --color-warning-500: #FFD700;
  --color-warning-200: #fde68a;

  --color-success-600: #2fa822;
  --color-success-500: #44D62C;
  --color-success-200: #bbf7d0;

  /* Text */
  --color-text-primary: #e5e1e7;
  --color-text-secondary: #a8b8b9;
  --color-text-muted: #566070;

  --color-border-subtle: #1a1a1e;
  --color-border-active: #44D62C;

  /* Typography */
  --font-sans: "Inter", "Noto Sans JP", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Inter", ui-monospace, monospace;
}
```

### 新規 CSS クラス追加

```css
/* ─── Piano Surface Card（Stitch デザイン） ───── */
.piano-surface {
  background: linear-gradient(145deg, #080808 0%, #010101 100%);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.03);
  border: 0.5px solid rgba(68, 214, 44, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.piano-surface:hover {
  border-color: rgba(68, 214, 44, 0.4);
}

/* ─── Circuit Grid Background ──────────────────── */
.circuit-bg {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(68, 214, 44, 0.03) 1px,
    transparent 0
  );
  background-size: 40px 40px;
}

/* ─── Scanline Overlay ─────────────────────────── */
.scanline-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.08) 50%);
  background-size: 100% 3px;
  pointer-events: none;
  z-index: 100;
  opacity: 0.15;
}

/* ─── Scanning Bar ─────────────────────────────── */
.scanning-bar {
  position: fixed;
  top: -100px; left: 0;
  width: 100%; height: 1px;
  background: linear-gradient(to right, transparent, rgba(68,214,44,0.3), transparent);
  box-shadow: 0 0 20px rgba(68,214,44,0.5);
  animation: scan 15s linear infinite;
  pointer-events: none;
  z-index: 101;
}
@keyframes scan {
  0% { top: -2px; opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { top: 100vh; opacity: 0; }
}

/* ─── Glow Effects ─────────────────────────────── */
.bloom-razer {
  filter: drop-shadow(0 0 10px rgba(68, 214, 44, 0.9));
}
.bloom-red {
  filter: drop-shadow(0 0 10px rgba(255, 49, 49, 0.8));
}

/* ─── Pulse Node ───────────────────────────────── */
.pulse-node {
  animation: pulse-node 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse-node {
  0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 4px rgba(68,214,44,0.5); }
  50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 12px rgba(68,214,44,1); }
}

/* ─── Glitch Hover ─────────────────────────────── */
.hover-glitch:hover {
  animation: glitch-anim 0.2s infinite;
}
@keyframes glitch-anim {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, -2px); }
  80% { transform: translate(1px, 2px); }
  100% { transform: translate(0); }
}

/* ─── Progress Flow ────────────────────────────── */
.progress-flow {
  background: linear-gradient(90deg, transparent 0%, #44D62C 50%, transparent 100%);
  background-size: 200% 100%;
  animation: flow 4s linear infinite;
}
@keyframes flow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── HUD Button Sweep ─────────────────────────── */
.hud-btn-sweep {
  position: absolute;
  top: 0; left: 0;
  width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(68,214,44,0.3), transparent);
  pointer-events: none;
  animation: sweep 3s linear infinite;
}
@keyframes sweep {
  0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.4; }
  100% { transform: translateX(250%) skewX(-15deg); opacity: 0; }
}
```

---

## 2. サイドバー変更（48px → 264px）

### Shell.tsx 書き換え

```
レイアウト:
┌────────────────────────────────────────────────┐
│  TitleBar (h-16, 固定上部)                      │
├──────────┬─────────────────────────────────────┤
│ Sidebar  │  Main Content                       │
│ (w-64)   │  (flex-1, overflow-y-auto)          │
│          │                                     │
│ SYSTEM   │                                     │
│ STATUS   │                                     │
│ ─────    │                                     │
│ CORE     │                                     │
│ ARSENAL  │                                     │
│ TACTICS  │                                     │
│ NETWORK  │                                     │
│ LOGS     │                                     │
│ ─────    │                                     │
│ [SYNC]   │                                     │
│ DIAG     │                                     │
│ EMER     │                                     │
└──────────┴─────────────────────────────────────┘
```

### Wing ID マッピング

| 旧 WingId | 新 WingId | サイドバーラベル | アイコン (Material Symbols) |
|-----------|-----------|----------------|---------------------------|
| dashboard | core | CORE / コア | grid_view |
| gaming | arsenal | ARSENAL / 兵装 | swords |
| monitor | tactics | TACTICS / 戦術 | strategy |
| history | logs | LOGS / 履歴 | terminal |
| settings | settings | DIAG / 診断 | build_circle |

### サイドバーデザイン詳細

- 背景: `bg-[#030305]/98 backdrop-blur-3xl`
- 幅: `w-64` (256px)
- ボーダー: `border-r border-white/[0.03]`
- 上部: SYSTEM STATUS パネル（小さいグリーンパルスドット + "稼働状況: OPTIMAL"）
- ナビ項目: `text-[10px] font-black tracking-[0.3em] uppercase`
- アクティブ: `bg-[#44D62C]/10 text-[#44D62C] border-r border-[#44D62C]` + progress-flow ボトムライン
- 非アクティブ: `text-white/30 hover:text-[#44D62C] hover:bg-[#44D62C]/5`
- 下部: NEURAL SYNC ボタン + DIAG / EMER リンク

---

## 3. TitleBar 変更

```
レイアウト:
┌────────────────────────────────────────────────────────┐
│ NEXUS V2 (Razer green, bloom) │ NAV tabs │ Icons │ Avatar │
└────────────────────────────────────────────────────────┘
```

- 高さ: `h-16`
- 左: `NEXUS V2` テキスト (2xl, font-black, tracking-tighter, text-[#44D62C], bloom-razer)
- 右: sensors アイコン (blink) + notifications + settings (rotate-gear) + avatar

---

## 4. ボトムステータスバー（新規追加）

```
┌──────────────────────────────────────────────────┐
│ CPU: 22.4% │ RAM: 4.2GB │ NET: 1.2GBPS │ TEMP: 42°C │
└──────────────────────────────────────────────────┘
```

- 高さ: `h-10`
- 固定下部
- リアルタイムデータを pulse イベントから取得
- アクティブ項目に bloom-razer

---

## 5. 共通コンポーネントスタイル

### カード
- `card-glass` → `piano-surface` に全面置換
- ホバー時: ボーダーが `rgba(68,214,44,0.4)` に変化
- 左端に 3-4px のアクセントバー（accent-500）

### ラベル・ヘッダー
- `text-[9px] font-black tracking-[0.3em] uppercase text-[#44D62C]`
- サブテキスト: `text-[8px] text-white/20 tracking-[0.2em] uppercase`

### ボタン
- プライマリ: `bg-[#44D62C]/5 border border-[#44D62C]/30 text-[#44D62C] font-black text-[9px] tracking-[0.4em] uppercase` + hud-btn-sweep オーバーレイ
- ステータスバッジ: `text-[8px] px-3 py-1.5 border font-black uppercase tracking-[0.3em]`

### テーブル
- ヘッダー: `bg-black/60 text-white/30 text-[8px] tracking-[0.4em] uppercase font-black`
- 行ホバー: `hover:bg-[#44D62C]/5`
- 行高: `h-20`

### プログレスバー
- 高さ: `h-1` または `h-[2px]`
- 背景: `bg-white/[0.03]`
- フィル: `bg-[#44D62C]` + `shadow-[0_0_10px_#44D62C]`

---

## 6. フォント設定

### package.json 依存追加

```bash
npm install @fontsource-variable/inter @fontsource/noto-sans-jp
```

### index.css import 更新

```css
@import "@fontsource-variable/inter";
@import "@fontsource/noto-sans-jp/400.css";
@import "@fontsource/noto-sans-jp/700.css";
```

B612 Mono の import は削除。

---

## 7. `design-tokens.ts` 更新

Stitch デザインに合わせて全トークンを更新。Wing マッピングも新 Wing 名に変更。

---

## 8. 品質ゲート

```
✅ tsc --noEmit — ゼロエラー
✅ vitest run — 全テスト通過
✅ npm run check — Biome クリーン
✅ 全ファイル 200 行以下
✅ scanline overlay + scanning bar が表示される
✅ サイドバーが 264px で 5 Wing + SYNC + DIAG + EMER を表示
✅ ボトムバーが CPU/RAM/NET/TEMP を表示
```

---

*End of design overhaul spec*
