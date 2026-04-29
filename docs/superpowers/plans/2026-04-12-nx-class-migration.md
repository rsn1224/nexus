# nx-* Class Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5ファイルに残る廃止済み `nx-*` クラスを Tailwind v4 className に完全移行し、`nexus.css` の `@import` を削除する。

**Architecture:** 各ファイルを独立して移行する（ファイル間の依存なし）。複合コンポーネントクラス（nx-tog）は既存の `Toggle` UI コンポーネントに置き換え。range input のようにTailwind では `::webkit-slider-thumb` 等の疑似要素をスタイルできない箇所のみ `index.css` にユーティリティクラスを追加する。

**Tech Stack:** React 19 + Tailwind v4 + TypeScript 5 + Biome v2 + Vitest

---

## ファイル一覧

| 操作 | ファイル | 変更内容 |
|------|---------|---------|
| Modify | `src/components/views/MonitorView.tsx` | `nx-card nx-corner-marks` / `nx-section-lbl` / `nx-card` / `nx-s-row` → Tailwind、MetricChart color → `NEXUS_TOKENS` |
| Modify | `src/components/optimize/OptimizeSection.tsx` | `nx-card nx-corner-marks` → Tailwind、`style={{ width }}` → CSS カスタムプロパティ |
| Modify | `src/components/Main.tsx` | `nx-tabs` / `nx-tab` / `nx-tab--active` / `nx-overlay` / `nx-panel` / `nx-panel-hd` / `nx-panel-ttl` / `nx-panel-x` → Tailwind |
| Modify | `src/components/views/BoostView.tsx` | `nx-section-lbl` / `nx-preset-card` / `nx-tag` / `nx-card` / `nx-s-row` / `nx-s-lbl` / `nx-s-sub` / `nx-slider` → Tailwind + `.styled-range` CSS |
| Modify | `src/components/panels/QuickPanels.tsx` | `nx-s-row` / `nx-s-lbl` / `nx-s-sub` / `nx-tog` → Toggle コンポーネント、旧 CSS 変数 (`--t-3`, `--c-border` 等) → デザイントークン |
| Modify | `src/index.css` | `.styled-range` ユーティリティ追加、`@import "./styles/nexus.css"` 削除 |

---

## nx-* クラス対応表

| nx クラス | Tailwind 置換 |
|----------|--------------|
| `nx-card` | `bg-base-800 border border-border-subtle rounded p-3` |
| `nx-corner-marks` | 削除（装飾禁止原則） |
| `nx-section-lbl` | `text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2` |
| `nx-s-row` | `flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0` |
| `nx-s-lbl` | `text-[11px] text-text-secondary tracking-[0.04em]` |
| `nx-s-sub` | `text-[10px] text-text-muted mt-0.5` |
| `nx-tabs` | `flex gap-px bg-base-900 border border-border-subtle rounded p-0.5` |
| `nx-tab` | `flex-1 py-1.5 px-2 text-[10px] font-bold tracking-[0.12em] uppercase text-text-muted bg-transparent rounded-sm cursor-pointer transition-colors hover:text-text-secondary hover:bg-white/[0.04]` |
| `nx-tab--active` | `!text-accent-400 !bg-accent-500/10` を付加 |
| `nx-overlay` | `fixed inset-0 bg-base-950/70 backdrop-blur-sm z-40 cursor-default` |
| `nx-panel` | `absolute bg-base-700 border border-border-subtle rounded z-50` |
| `nx-panel-hd` | `flex items-center justify-between px-3.5 pt-2.5 pb-2 border-b border-border-subtle` |
| `nx-panel-ttl` | `text-[10px] font-bold tracking-[0.2em] uppercase text-accent-500` |
| `nx-panel-x` | `flex items-center justify-center w-5 h-5 text-text-muted rounded transition-colors hover:text-text-primary hover:bg-white/[0.06]` |
| `nx-preset-card` | `flex-1 px-3 py-2.5 bg-base-700 border border-white/[0.07] rounded cursor-pointer transition-colors hover:border-border-active hover:bg-base-600 text-left` |
| `nx-preset-card--active` | `!border-border-active !bg-accent-500/10` を付加 |
| `nx-tag nx-tag--cyan` | `inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em] uppercase rounded-sm text-accent-400 bg-accent-500/10 border border-border-subtle` |
| `nx-tog` | `Toggle` コンポーネント（`src/components/ui/Toggle.tsx`）に置き換え |
| `nx-slider` | `w-full styled-range` （index.css に `.styled-range` を定義） |

---

## Task 1: MonitorView.tsx 移行

**Files:**
- Modify: `src/components/views/MonitorView.tsx`

- [ ] **Step 1: nx-* 残存確認**

```bash
grep -n "nx-" src/components/views/MonitorView.tsx
```

Expected output (3箇所):
```
27:    <div className="nx-card nx-corner-marks flex items-center gap-3 py-2">
74:      <div className="nx-section-lbl">REALTIME METRICS</div>
112:          <div className="nx-card flex flex-col gap-2">
135:    <div className="nx-s-row">
```

- [ ] **Step 2: ChartRow・MetricChart カラーを NEXUS_TOKENS に更新**

`src/components/views/MonitorView.tsx` の先頭 import に追加:
```tsx
import { NEXUS_TOKENS } from '../../design-tokens';
```

`ChartRowProps.color` は `string` のまま維持。`MonitorView` 内の `ChartRow` 呼び出しを更新:

```tsx
// 変更前
color="var(--c)"
// 変更後
color={NEXUS_TOKENS.color.accent[400]}

// 変更前
color="var(--nx-success)"
// 変更後
color={NEXUS_TOKENS.color.success[500]}

// 変更前
color="var(--nx-warning)"
// 変更後
color={NEXUS_TOKENS.color.warning[500]}

// 変更前
color="rgba(139,92,246,1)"
// 変更後
color={NEXUS_TOKENS.color.text.secondary}
```

- [ ] **Step 3: nx-* クラスを Tailwind に置換**

`ChartRow` コンポーネントの div:
```tsx
// 変更前
<div className="nx-card nx-corner-marks flex items-center gap-3 py-2">
// 変更後
<div className="bg-base-800 border border-border-subtle rounded flex items-center gap-3 py-2">
```

セクションラベル 2箇所:
```tsx
// 変更前
<div className="nx-section-lbl">REALTIME METRICS</div>
// 変更後
<div className="text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2">REALTIME METRICS</div>

// 変更前
<div className="nx-section-lbl mt-2">HARDWARE</div>
// 変更後
<div className="text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2 mt-2">HARDWARE</div>
```

ハードウェアカード:
```tsx
// 変更前
<div className="nx-card flex flex-col gap-2">
// 変更後
<div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-2">
```

`HwRow` コンポーネントの div:
```tsx
// 変更前
<div className="nx-s-row">
// 変更後
<div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
```

- [ ] **Step 4: 型チェック・lint 確認**

```bash
cd /c/dev/nexus && pnpm typecheck 2>&1 | tail -5
```
Expected: エラーなし（空出力）

```bash
pnpm check 2>&1 | tail -5
```
Expected: `Found 0 errors. 1 info.`（スキーマバージョン info のみ）

- [ ] **Step 5: nx-* 残存なし確認**

```bash
grep -n "nx-" src/components/views/MonitorView.tsx
```
Expected: 出力なし（0行）

- [ ] **Step 6: コミット**

```bash
git add src/components/views/MonitorView.tsx
git commit -m "refactor(ui): migrate MonitorView from nx-* to Tailwind v4 classes"
```

---

## Task 2: OptimizeSection.tsx 移行

**Files:**
- Modify: `src/components/optimize/OptimizeSection.tsx`

- [ ] **Step 1: nx-* 残存確認**

```bash
grep -n "nx-" src/components/optimize/OptimizeSection.tsx
```

Expected output:
```
117:          <div className="nx-card nx-corner-marks flex flex-col gap-1.5 py-2.5">
```

- [ ] **Step 2: nx-card・nx-corner-marks 置換 + progress bar inline style 修正**

```tsx
// 変更前（117行目周辺）
<div className="nx-card nx-corner-marks flex flex-col gap-1.5 py-2.5">

// 変更後
<div className="bg-base-800 border border-border-subtle rounded flex flex-col gap-1.5 py-2.5">
```

progress bar の inline style を CSS カスタムプロパティに変換:
```tsx
// 変更前（126-129行目）
<div
  className="h-full rounded transition-all duration-300 bg-accent-400"
  style={{ width: `${boostPct}%` } as React.CSSProperties}
/>

// 変更後
<div
  className="h-full rounded transition-[width] duration-300 bg-accent-400"
  style={{ '--progress-w': `${boostPct}%` } as React.CSSProperties}
/>
```

そして親 div に `w-(--progress-w)` を追加:
```tsx
// 変更後（完全）
<div
  className="h-full rounded transition-[width] duration-300 bg-accent-400 w-(--progress-w)"
  style={{ '--progress-w': `${boostPct}%` } as React.CSSProperties}
/>
```

- [ ] **Step 3: 型チェック確認**

```bash
cd /c/dev/nexus && pnpm typecheck 2>&1 | tail -5
```
Expected: エラーなし

- [ ] **Step 4: nx-* 残存なし確認**

```bash
grep -n "nx-" src/components/optimize/OptimizeSection.tsx
```
Expected: 出力なし

- [ ] **Step 5: コミット**

```bash
git add src/components/optimize/OptimizeSection.tsx
git commit -m "refactor(ui): migrate OptimizeSection from nx-* to Tailwind v4 classes"
```

---

## Task 3: Main.tsx 移行

**Files:**
- Modify: `src/components/Main.tsx`

- [ ] **Step 1: nx-* 残存確認**

```bash
grep -n "nx-" src/components/Main.tsx
```

Expected output (6箇所):
```
53:        <div className="nx-tabs shrink-0">
59:            className={`nx-tab${activeTab === tab ? ' nx-tab--active' : ''}`}
92:          className="nx-overlay"
96:          className="nx-panel bottom-[72px] left-4 right-4"
100:            <div className="nx-panel-hd">
101:              <span className="nx-panel-ttl">{PANEL_TITLES[activeQuickPanel]}</span>
104:              className="nx-panel-x"
```

- [ ] **Step 2: タブバーを Tailwind に置換**

```tsx
// 変更前
<div className="nx-tabs shrink-0">
  {TABS.map((tab) => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`nx-tab${activeTab === tab ? ' nx-tab--active' : ''}`}
    >
      {TAB_LABELS[tab]}
    </button>
  ))}
</div>

// 変更後
<div className="flex gap-px bg-base-900 border border-border-subtle rounded p-0.5 shrink-0">
  {TABS.map((tab) => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={[
        'flex-1 py-1.5 px-2 text-[10px] font-bold tracking-[0.12em] uppercase rounded-sm cursor-pointer transition-colors',
        activeTab === tab
          ? 'text-accent-400 bg-accent-500/10'
          : 'text-text-muted bg-transparent hover:text-text-secondary hover:bg-white/[0.04]',
      ].join(' ')}
    >
      {TAB_LABELS[tab]}
    </button>
  ))}
</div>
```

- [ ] **Step 3: フローティングパネル（overlay + panel）を Tailwind に置換**

```tsx
// 変更前
{activeQuickPanel && (
  <>
    <div
      className="nx-overlay"
      onClick={() => setActiveQuickPanel(null)}
      aria-hidden="true"
    />
    <div
      className="nx-panel bottom-[72px] left-4 right-4"
      role="dialog"
      aria-label={PANEL_TITLES[activeQuickPanel]}
    >
      <div className="nx-panel-hd">
        <span className="nx-panel-ttl">{PANEL_TITLES[activeQuickPanel]}</span>
        <button
          type="button"
          className="nx-panel-x"
          onClick={() => setActiveQuickPanel(null)}
          aria-label="パネルを閉じる"
        >
          <X size={12} />
        </button>
      </div>
      <QuickPanelContent panel={activeQuickPanel} />
    </div>
  </>
)}

// 変更後
{activeQuickPanel && (
  <>
    <div
      className="fixed inset-0 bg-base-950/70 backdrop-blur-sm z-40 cursor-default"
      onClick={() => setActiveQuickPanel(null)}
      aria-hidden="true"
    />
    <div
      className="absolute bg-base-700 border border-border-subtle rounded z-50 bottom-[72px] left-4 right-4"
      role="dialog"
      aria-label={PANEL_TITLES[activeQuickPanel]}
    >
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-2 border-b border-border-subtle">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent-500">
          {PANEL_TITLES[activeQuickPanel]}
        </span>
        <button
          type="button"
          className="flex items-center justify-center w-5 h-5 text-text-muted rounded transition-colors hover:text-text-primary hover:bg-white/[0.06]"
          onClick={() => setActiveQuickPanel(null)}
          aria-label="パネルを閉じる"
        >
          <X size={12} />
        </button>
      </div>
      <QuickPanelContent panel={activeQuickPanel} />
    </div>
  </>
)}
```

- [ ] **Step 4: 型チェック・lint 確認**

```bash
cd /c/dev/nexus && pnpm typecheck 2>&1 | tail -5 && pnpm check 2>&1 | tail -5
```
Expected: 両方エラーなし

- [ ] **Step 5: nx-* 残存なし確認**

```bash
grep -n "nx-" src/components/Main.tsx
```
Expected: 出力なし

- [ ] **Step 6: コミット**

```bash
git add src/components/Main.tsx
git commit -m "refactor(ui): migrate Main floating panel & tabs from nx-* to Tailwind v4"
```

---

## Task 4: BoostView.tsx 移行 + index.css styled-range 追加

**Files:**
- Modify: `src/components/views/BoostView.tsx`
- Modify: `src/index.css` (`.styled-range` ユーティリティ追加)

- [ ] **Step 1: nx-* 残存確認**

```bash
grep -n "nx-" src/components/views/BoostView.tsx
```

Expected output:
```
88:        <div className="nx-section-lbl">POWER PRESET</div>
97:            className={`nx-preset-card${isActive ? ' nx-preset-card--active' : ''}`}
108:                    <span className="nx-tag nx-tag--cyan">ACTIVE</span>
119:        <div className="nx-section-lbl">CPU PRIORITY</div>
120:          <div className="nx-card flex flex-col gap-3">
121:            <div className="nx-s-row">
122:              <div>
123:                <div className="nx-s-lbl">Process Priority</div>
124:                <div className="nx-s-sub">
138:            className="nx-slider"
145:        <div className="nx-section-lbl">MEMORY CLEANUP</div>
146:          <div className="nx-card">
147:            <div className="nx-s-row">
148:              <div>
149:                <div className="nx-s-lbl">Cleanup Frequency</div>
150:                <div className="nx-s-sub">
162:              className="nx-slider"
```

- [ ] **Step 2: index.css に `.styled-range` ユーティリティを追加**

`src/index.css` の末尾（`::selection` ブロックの後）に追加:

```css
/* ─── Range Input ─────────────────────────────────────────── */
/* Tailwind v4 は ::webkit-slider-thumb 疑似要素をスタイルできないため */
input[type="range"].styled-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  background: var(--color-base-500);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
input[type="range"].styled-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--color-accent-500);
  border-radius: 50%;
  cursor: pointer;
}
```

- [ ] **Step 3: BoostView.tsx の nx-* クラスを Tailwind に置換**

セクションラベル 3箇所:
```tsx
// 変更前
<div className="nx-section-lbl">POWER PRESET</div>
// 変更後
<div className="text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2">POWER PRESET</div>

// 変更前（CPU PRIORITY）
<div className="nx-section-lbl">CPU PRIORITY</div>
// 変更後
<div className="text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2">CPU PRIORITY</div>

// 変更前（MEMORY CLEANUP）
<div className="nx-section-lbl">MEMORY CLEANUP</div>
// 変更後
<div className="text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2">MEMORY CLEANUP</div>
```

プリセットカード:
```tsx
// 変更前
className={`nx-preset-card${isActive ? ' nx-preset-card--active' : ''}`}

// 変更後
className={[
  'flex-1 px-3 py-2.5 bg-base-700 border rounded cursor-pointer transition-colors text-left',
  isActive
    ? 'border-border-active bg-accent-500/10'
    : 'border-white/[0.07] hover:border-border-active hover:bg-base-600',
].join(' ')}
```

ACTIVE タグ:
```tsx
// 変更前
<span className="nx-tag nx-tag--cyan">ACTIVE</span>
// 変更後
<span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em] uppercase rounded-sm text-accent-400 bg-accent-500/10 border border-border-subtle">
  ACTIVE
</span>
```

CPU PRIORITY カード:
```tsx
// 変更前
<div className="nx-card flex flex-col gap-3">
  <div className="nx-s-row">
    <div>
      <div className="nx-s-lbl">Process Priority</div>
      <div className="nx-s-sub">...</div>
    </div>
    ...
  </div>
  <input ... className="nx-slider" />
</div>

// 変更後
<div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-3">
  <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
    <div>
      <div className="text-[11px] text-text-secondary tracking-[0.04em]">Process Priority</div>
      <div className="text-[10px] text-text-muted mt-0.5">
        ゲームプロセスへの CPU 時間割り当て
        {/* TODO: replace with invoke('set_cpu_priority', { percent: cpuPriority }) */}
      </div>
    </div>
    <span className="text-[13px] font-bold text-accent-400">{cpuPriority}%</span>
  </div>
  <input
    type="range"
    min={0}
    max={100}
    step={5}
    value={cpuPriority}
    onChange={(e) => setCpuPriority(Number(e.target.value))}
    className="styled-range"
    aria-label="CPU 優先度"
  />
</div>
```

MEMORY CLEANUP カード:
```tsx
// 変更前
<div className="nx-card">
  <div className="nx-s-row">
    <div>
      <div className="nx-s-lbl">Cleanup Frequency</div>
      <div className="nx-s-sub">...</div>
    </div>
    ...
  </div>
  <div className="mt-2">
    <input ... className="nx-slider" />
  </div>
</div>

// 変更後
<div className="bg-base-800 border border-border-subtle rounded p-3">
  <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
    <div>
      <div className="text-[11px] text-text-secondary tracking-[0.04em]">Cleanup Frequency</div>
      <div className="text-[10px] text-text-muted mt-0.5">
        自動メモリ解放の頻度
        {/* TODO: replace with invoke('set_mem_cleanup_freq', { level: memFreq }) */}
      </div>
    </div>
    <span className="text-[13px] font-bold text-accent-400">
      {['OFF', '低', '中', '高', '最高'][memFreq] ?? '中'}
    </span>
  </div>
  <div className="mt-2">
    <input
      type="range"
      min={0}
      max={4}
      step={1}
      value={memFreq}
      onChange={(e) => setMemFreq(Number(e.target.value))}
      className="styled-range"
      aria-label="メモリクリア頻度"
    />
  </div>
</div>
```

- [ ] **Step 4: 型チェック・lint 確認**

```bash
cd /c/dev/nexus && pnpm typecheck 2>&1 | tail -5 && pnpm check 2>&1 | tail -5
```
Expected: 両方エラーなし

- [ ] **Step 5: nx-* 残存なし確認**

```bash
grep -n "nx-" src/components/views/BoostView.tsx
```
Expected: 出力なし

- [ ] **Step 6: コミット**

```bash
git add src/components/views/BoostView.tsx src/index.css
git commit -m "refactor(ui): migrate BoostView from nx-* to Tailwind v4, add styled-range CSS"
```

---

## Task 5: QuickPanels.tsx 移行

**Files:**
- Modify: `src/components/panels/QuickPanels.tsx`

- [ ] **Step 1: nx-* および旧 CSS 変数の残存確認**

```bash
grep -n "nx-\|--t-\|--c-\|--s-\|--nx-" src/components/panels/QuickPanels.tsx
```

Expected output（7箇所以上）:
```
28:    <div className="nx-s-row">
30:        <div className="nx-s-lbl">{label}</div>
31:        {sub && <div className="nx-s-sub">{sub}</div>}
41:        className={`nx-tog${disabled ? ' opacity-40 cursor-not-allowed' : ''}`}
99:          <div className="nx-s-row">
100:            <div className="nx-s-lbl">Game Profile</div>
101:            <span className="text-[10px] text-(--t-3)">Coming Soon</span>
125:          <div className="nx-s-row">
126:            <div className="nx-s-lbl">Visual Effects</div>
137:              vfx === v ? 'border-(--c-border) bg-(--c-bg) text-(--c)'
138:                        : 'border-transparent bg-(--s-4) text-(--t-3) hover:text-(--t-2)'
154:        <div className="nx-s-lbl">Memory Cleanup</div>
157:          className="px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase border-(--c-border) bg-(--c-bg) text-(--c) border transition-colors disabled:opacity-40"
163:          <div className="text-[10px] text-(--nx-success)">
```

- [ ] **Step 2: ToggleRow コンポーネントを Toggle UI コンポーネント使用に書き換え**

ファイル先頭の import に追加:
```tsx
import { Toggle } from '../../components/ui/Toggle';
```

`ToggleRow` コンポーネントを置換:
```tsx
// 変更前
function ToggleRow({
  label,
  sub,
  value,
  disabled,
  onToggle,
}: {
  label: string;
  sub?: string;
  value: boolean;
  disabled?: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <div className="nx-s-row">
      <div>
        <div className="nx-s-lbl">{label}</div>
        {sub && <div className="nx-s-sub">{sub}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className={`nx-tog${disabled ? ' opacity-40 cursor-not-allowed' : ''}`}
        data-on={String(value)}
      />
    </div>
  );
}

// 変更後
function ToggleRow({
  label,
  sub,
  value,
  disabled,
  onToggle,
}: {
  label: string;
  sub?: string;
  value: boolean;
  disabled?: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
      <div>
        <div className="text-[11px] text-text-secondary tracking-[0.04em]">{label}</div>
        {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>}
      </div>
      <Toggle enabled={value} onToggle={onToggle} disabled={disabled} />
    </div>
  );
}
```

- [ ] **Step 3: game パネルの残存 nx-* と旧 CSS 変数を置換**

```tsx
// 変更前
<div className="nx-s-row">
  <div className="nx-s-lbl">Game Profile</div>
  <span className="text-[10px] text-(--t-3)">Coming Soon</span>
</div>

// 変更後
<div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
  <div className="text-[11px] text-text-secondary tracking-[0.04em]">Game Profile</div>
  <span className="text-[10px] text-text-muted">Coming Soon</span>
</div>
```

- [ ] **Step 4: security パネル（Visual Effects ボタン）の旧 CSS 変数を置換**

```tsx
// 変更前
<div className="nx-s-row">
  <div className="nx-s-lbl">Visual Effects</div>
</div>
<div className="flex gap-2">
  {(['BestPerformance', 'Balanced', 'BestAppearance'] as VisualEffects[]).map((v) => (
    <button
      key={v}
      type="button"
      onClick={() => handleVfx(v)}
      disabled={isLoading}
      className={[
        'flex-1 py-1.5 rounded text-[9px] font-bold tracking-widest uppercase transition-colors border',
        vfx === v
          ? 'border-(--c-border) bg-(--c-bg) text-(--c)'
          : 'border-transparent bg-(--s-4) text-(--t-3) hover:text-(--t-2)',
      ].join(' ')}
    >
      {v === 'BestPerformance' ? 'Perf' : v === 'Balanced' ? 'Bal' : 'Look'}
    </button>
  ))}
</div>

// 変更後
<div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
  <div className="text-[11px] text-text-secondary tracking-[0.04em]">Visual Effects</div>
</div>
<div className="flex gap-2">
  {(['BestPerformance', 'Balanced', 'BestAppearance'] as VisualEffects[]).map((v) => (
    <button
      key={v}
      type="button"
      onClick={() => handleVfx(v)}
      disabled={isLoading}
      className={[
        'flex-1 py-1.5 rounded text-[9px] font-bold tracking-widest uppercase transition-colors border',
        vfx === v
          ? 'border-border-active bg-accent-500/10 text-accent-400'
          : 'border-transparent bg-base-600 text-text-muted hover:text-text-secondary',
      ].join(' ')}
    >
      {v === 'BestPerformance' ? 'Perf' : v === 'Balanced' ? 'Bal' : 'Look'}
    </button>
  ))}
</div>
```

- [ ] **Step 5: modules パネル（Memory Cleanup）の旧 CSS 変数を置換**

```tsx
// 変更前
<div className="nx-s-row">
  <div className="nx-s-lbl">Memory Cleanup</div>
  <button
    type="button"
    onClick={handleCleanup}
    disabled={isCleaning}
    className="px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase border-(--c-border) bg-(--c-bg) text-(--c) border transition-colors disabled:opacity-40"
  >
    {isCleaning ? '...' : 'RUN'}
  </button>
</div>
{lastResult?.freedMb !== null && lastResult?.freedMb !== undefined && (
  <div className="text-[10px] text-(--nx-success)">
    {lastResult.freedMb.toFixed(0)} MB freed
  </div>
)}

// 変更後
<div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
  <div className="text-[11px] text-text-secondary tracking-[0.04em]">Memory Cleanup</div>
  <button
    type="button"
    onClick={handleCleanup}
    disabled={isCleaning}
    className="px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase border border-border-active bg-accent-500/10 text-accent-400 transition-colors disabled:opacity-40"
  >
    {isCleaning ? '...' : 'RUN'}
  </button>
</div>
{lastResult?.freedMb !== null && lastResult?.freedMb !== undefined && (
  <div className="text-[10px] text-success-500">
    {lastResult.freedMb.toFixed(0)} MB freed
  </div>
)}
```

- [ ] **Step 6: 型チェック・lint 確認**

```bash
cd /c/dev/nexus && pnpm typecheck 2>&1 | tail -5 && pnpm check 2>&1 | tail -5
```
Expected: 両方エラーなし

- [ ] **Step 7: nx-* および旧 CSS 変数の残存なし確認**

```bash
grep -n "nx-\|--t-\|--c-\|--s-\|--nx-" src/components/panels/QuickPanels.tsx
```
Expected: 出力なし

- [ ] **Step 8: コミット**

```bash
git add src/components/panels/QuickPanels.tsx
git commit -m "refactor(ui): migrate QuickPanels from nx-* and legacy CSS vars to Tailwind v4"
```

---

## Task 6: nexus.css @import 削除・最終クリーンアップ

**Files:**
- Modify: `src/index.css`

前提条件: Task 1〜5 が全て完了し、プロジェクト全体で nx-* クラスが 0 になっていること。

- [ ] **Step 1: プロジェクト全体の nx-* 残存確認**

```bash
grep -rn "nx-" src/ --include="*.tsx" --include="*.ts"
```
Expected: 出力なし（0行）

- [ ] **Step 2: @import nexus.css を index.css から削除**

`src/index.css` の2行目:
```css
/* 変更前 */
@import "./styles/nexus.css";

/* 変更後: この行を削除する */
```

削除後の `src/index.css` 冒頭:
```css
@import "tailwindcss";
@import "@fontsource-variable/inter";
@import "@fontsource/noto-sans-jp/400.css";
@import "@fontsource/noto-sans-jp/700.css";
```

- [ ] **Step 3: 全チェック実行**

```bash
cd /c/dev/nexus && pnpm typecheck 2>&1 | tail -5
```
Expected: エラーなし

```bash
pnpm check 2>&1 | tail -5
```
Expected: `Found 0 errors. 1 info.`

```bash
pnpm test 2>&1 | tail -10
```
Expected: 全テスト PASS

- [ ] **Step 4: nexus.css 参照が残っていないか確認**

```bash
grep -rn "nexus.css\|nx-" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```
Expected: `src/styles/nexus.css` 自体のみ（`src/index.css` からの参照はなし）

- [ ] **Step 5: コミット**

```bash
git add src/index.css
git commit -m "chore(ui): remove nexus.css @import — nx-* migration complete"
```

---

## 既知の後続課題（このプランのスコープ外）

| 課題 | ファイル | 内容 |
|------|---------|------|
| TabBar.tsx デザイン違反 | `src/components/ui/TabBar.tsx` | `rounded-xl` / `shadow-sm` / `active:scale` が規約違反。Main.tsx では未使用だが将来の利用時に問題になる |
| Toggle.tsx glow エフェクト | `src/components/ui/Toggle.tsx` | `shadow-[0_0_6px_rgba(68,214,44,0.6)]` がデザイン規約（グロー禁止）に違反 |
| design-tokens.ts と index.css の値不一致 | `src/design-tokens.ts` / `src/index.css` | `base.*` / `border.*` の hex 値が両ファイルで異なる。次のデザインシステム整理で修正 |
| SectionLabel.tsx が accent-500 を使わない | `src/components/ui/SectionLabel.tsx` | `text-text-muted` を使っており UI-SPEC のセクション見出し仕様（`text-accent-500`）と不一致 |
