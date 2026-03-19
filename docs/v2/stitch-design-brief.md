# NEXUS v2 — Google Stitch デザインブリーフ

以下を Google Stitch にそのままコピペしてください。

---

## プロンプト（Stitch に貼り付ける内容）

```
Design a Windows desktop application UI called "NEXUS" — an AI-powered gaming PC optimizer.

## App Overview
- Tauri v2 desktop app (Windows only)
- Dark theme only, cyberpunk/gaming aesthetic
- Fixed window: 1280×800 minimum
- Custom titlebar (32px height) with app name "NEXUS" + window controls
- Left sidebar (48px, icon-only) + main content area

## Color System
- Background: #06060a (near black with slight purple tint)
- Surface: #0a0a10 (cards/panels)
- Surface Elevated: #12121c (hover/elevated cards)
- Border: #1e1e2e (subtle borders)
- Accent (primary): #06b6d4 (cyan — used for active states, buttons, highlights)
- Warning: #f59e0b (amber — for thermal warnings, caution states)
- Error: #ef4444 (red — critical alerts)
- Success: #22c55e (green — optimal states, checkmarks)
- Text Primary: #e0e0ec (near white)
- Text Secondary: #9090aa (muted)
- Text Muted: #6b6b82 (labels, hints)

## Typography
- Sans: Inter Variable (UI text)
- Mono: B612 Mono (numbers, data, code)
- Scale: 12px (labels) / 14px (body) / 18px (section headers) / 24px (KPI numbers) / 30px (hero metrics)
- Labels and section headers are UPPERCASE with tracking-wider

## Card System
- Glass morphism: background rgba(10,10,16,0.8) + backdrop-blur(12px) + subtle border
- Border radius: 12px for cards, 8px for inner panels
- No drop shadows — use border glow on hover (cyan glow for accent items)
- 3 depth layers: L1 (page bg), L2 (card), L3 (inner panel within card)

## Layout Structure

### Sidebar (48px wide, left edge)
5 navigation icons, vertically centered:
1. ⊙ DASHBOARD (home icon) — default active
2. ⚡ GAMING (lightning bolt)
3. 📊 MONITOR (chart icon)
4. 📋 HISTORY (list icon)
5. ⚙ SETTINGS (gear icon)

Active indicator: 3px cyan bar on left edge + icon glow
Hover: tooltip appears to the right with Wing name + keyboard shortcut

### Custom Titlebar (32px)
- Left: "NEXUS" in cyan, bold, tracking-widest
- Right: minimize / maximize / close buttons (custom styled, not OS native)

---

## Screen 1: DASHBOARD Wing

The main screen. Shows system health score and AI-powered optimization suggestions.

### Layout (top to bottom):
1. **Health Score Bar** (h-14, full width)
   - Left: "SYSTEM HEALTH" label + large score number (e.g. "72/100") + grade badge ("B" in rounded pill)
   - Right: [OPTIMIZE NOW ▶] button (cyan, prominent)
   - Below score: subtitle text "3つの最適化で推定 +28 ポイント" (secondary color)

2. **Suggestion List** (scrollable, flex-grow)
   Grouped by priority:

   **CRITICAL section** (red/amber left border):
   - Card: "⚡ Game Mode を有効にする" — description text — [適用] button — "+15 pts" badge
   - Card: "⚡ 電源プランを高パフォーマンスに" — [適用] button — "+15 pts"

   **RECOMMENDED section** (cyan left border):
   - Card: "💡 Nagle アルゴリズムを無効化" — [適用] — "+10 pts"
   - Card: "💡 Timer Resolution を 0.5ms に" — [適用] — "+10 pts"
   - Card: "💡 視覚効果をオフにする" — [適用] — "+10 pts"

   Each suggestion card:
   - Left color bar (4px): red for critical, cyan for recommended
   - Title (14px, bold, primary color)
   - Reason text (12px, secondary color)
   - Right side: [適用] button + impact badge ("+15 pts" or "警告")
   - Applied state: checkmark + grayed out

3. **Applied Badge Row** (h-10, bottom)
   - Horizontal row of small badges: "✓ DNS: Cloudflare" "✓ 視覚効果: OFF" etc.
   - Green checkmark + text in muted color

4. **Bottom Row** (2 cards side by side):

   **System Status Card:**
   - CPU: 45% usage, 62℃ (with mini progress bar)
   - GPU: 30% usage, 58℃
   - MEM: 6.2 / 16 GB (39%)

   **Quick Stats Card:**
   - Sessions Today: 3
   - Last Optimized: 2h前
   - AI Layer: 🟢 ACTIVE (or 🟡 LOCAL or 🔴 OFFLINE)

---

## Screen 2: GAMING Wing

Detailed optimization controls organized in sections.

### Layout:
1. **Top: Optimize Now Panel** (full width card)
   - 3 preset buttons in a pill-shaped tab bar: [Gaming] [Power Save] [Streaming]
   - Below: checklist of optimization steps with toggles
   - Each step shows: checkbox + label + risk badge (SAFE in green, MEDIUM in amber)
   - Footer: [すべて適用] large cyan button

2. **Section tabs** (horizontal tab bar):
   Windows | Process | Network | Memory | Timer | CPU

3. **Section content** (varies by tab):
   Each section has optimization items in a unified card format:
   ```
   ┌────────────────────────────────────────────────┐
   │  [Icon]  Item Name                    [ON/OFF] │
   │  現在の状態: 無効                                │
   │  説明テキスト（1行）                             │
   │  推定効果: Health +10pts                        │
   └────────────────────────────────────────────────┘
   ```

---

## Screen 3: MONITOR Wing

Real-time system monitoring with live graphs.

### Layout:
1. **KPI Row** (4 metric cards in a row, h-24 each):
   - CPU: large percentage + temperature + mini sparkline
   - GPU: large percentage + temperature + mini sparkline
   - MEM: used/total GB + percentage bar
   - FPS: current FPS number + 1% Low value

2. **Timeline Graph** (large, takes remaining space):
   - Canvas-based line chart
   - 60-second rolling window
   - 3 overlaid lines: CPU% (cyan), GPU% (amber), FPS (green)
   - Dark grid background with subtle grid lines
   - Y-axis: 0-100%
   - X-axis: -60s to now

3. **Frame Time section** (bottom card):
   - Start/Stop monitoring button
   - Frame time stats when active

---

## Screen 4: HISTORY Wing

Session history and performance trends.

### Layout:
1. **Trend Chart** (top half):
   - Health Score trend over 7d or 30d (toggle)
   - Line chart with gradient fill below the line
   - Date labels on X-axis

2. **Session List** (bottom half, scrollable):
   Each session row:
   ```
   2026-03-19 21:00  │ 2h15m │ Score 72→88 │ +3 optimizations
   ```
   - Click to expand session details
   - Compare button between sessions

---

## Screen 5: SETTINGS Wing

Minimal settings form.

### Layout (single scrollable form):
- **AI Settings section:**
  - API Key input (masked) with [TEST] and [SAVE] buttons
  - AI enabled toggle

- **Monitor Settings:**
  - Pulse interval slider (500-5000ms)
  - Auto-start monitor toggle

- **General:**
  - Start with Windows toggle
  - Minimize to tray toggle
  - Language selector (日本語 / English)

---

## Design Principles
- Dense information display — this is a power tool, not a consumer app
- All numbers in monospace font (B612 Mono)
- Labels and headers in UPPERCASE with wide letter spacing
- Minimal whitespace — optimize for information density
- Glass morphism cards with subtle borders, no heavy shadows
- Cyan accent for interactive elements, amber for warnings, red for critical
- Animations: subtle fade-in for cards (200ms), scale(0.98) on button press
- Japanese UI text throughout (but English technical terms preserved)

## Interactions to Show
- Dashboard suggestion card: normal → hover (subtle glow) → clicked (applied state)
- Optimize Now button: normal → hover → active animation
- Sidebar: icon normal → hover (tooltip) → active (cyan bar + glow)
- Health Score: animated count-up on page load
```

---

## 使い方

1. https://stitch.withgoogle.com/ を開く
2. 上記の `プロンプト` セクション（```で囲まれた部分）をそのままコピー
3. Stitch のテキスト入力欄に貼り付けて生成

### 画面別に生成したい場合

- **DASHBOARD のみ:** "Design Screen 1: DASHBOARD Wing" 以降 + Color System + Typography をコピー
- **GAMING のみ:** "Design Screen 2: GAMING Wing" 以降 + 共通部分をコピー
- 以下同様

### 追加プロンプト（微調整用）

```
Make the cards use glassmorphism with very subtle frosted glass effect.
Use #06b6d4 cyan as the only accent color. No gradients.
All text should be in Japanese except technical terms.
The sidebar should feel like a gaming dashboard — minimal, dark, with subtle glow effects.
Show the app at 1440×900 resolution.
```
