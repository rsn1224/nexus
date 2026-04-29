---
description: Figma → コード変換ルール（nexus/ プロジェクト固有、Cyan 単色アクセント）
globs: "src/**/*.{ts,tsx,css}"
---

# Figma → コード変換ルール（nexus/ プロジェクト固有）

> `figma-implement-design` スキルを使う際は、このファイルのルールを**全て適用**すること。

---

## 1. 色/トークン変換

### 基本規則

- Figma の hex/RGB 値をコードに hardcode 禁止
- 必ず `src/index.css` の CSS 変数を使う

### CSS 変数対応表

| セマンティクス | CSS 変数 | 実値 |
|--------------|---------|------|
| 最暗背景 | `--color-base-950` | `#020617` |
| ダーク背景 | `--color-base-900` | `#0f172a` |
| コンテナ背景 | `--color-base-800` | `#1e293b` |
| カード背景 | `--color-base-700` | `#334155` |
| ボーダー暗 | `--color-base-600` | `#475569` |
| ボーダー明 | `--color-base-500` | `#64748b` |
| アクセント暗 | `--color-accent-600` | `#0891b2` |
| アクセント標準 | `--color-accent-500` | `#06b6d4` |
| アクセント明 | `--color-accent-400` | `#22d3ee` |
| 成功 | `--color-success-500` | `#22c55e` |
| 警告 | `--color-warning-500` | `#f59e0b` |
| 危険 | `--color-danger-500` | `#ef4444` |
| 主要テキスト | `--color-text-primary` | `#e2e8f0` |
| 補助テキスト | `--color-text-secondary` | `#94a3b8` |
| ミュートテキスト | `--color-text-muted` | `#64748b` |
| ボーダー（サブティル） | `--color-border-subtle` | `rgba(34,211,238,0.12)` |
| ボーダー（アクティブ） | `--color-border-active` | `rgba(34,211,238,0.2)` |

### Tailwind での使い方

```tsx
// CSS 変数は Tailwind クラス経由で参照
<div className="bg-base-900 text-text-primary border border-border-subtle">
<button className="bg-accent-500 text-base-950 hover:bg-accent-400">
```

---

## 2. Auto Layout → CSS 変換

| Figma 制約 | Tailwind / CSS |
|-----------|----------------|
| FIXED W/H | `w-[Npx]` / `h-[Npx]`（4px グリッドなら整数クラス優先） |
| HUG contents | `w-fit h-fit` |
| FILL container | `flex-1` または `w-full` |
| Horizontal + gap | `flex flex-row gap-{N}` |
| Vertical + gap | `flex flex-col gap-{N}` |

---

## 3. コンポーネントマッピング

| Figma コンポーネント | コード実装 |
|--------------------|-----------|
| Button (Primary) | `<Button variant="primary">` |
| Button (Ghost) | `<Button variant="ghost">` |
| Button (Danger) | `<Button variant="danger">` |
| Button (Secondary) | `<Button variant="secondary">` |
| StatCard | `<StatCard label="..." value="..." />` |
| Toggle | `<Toggle />` |
| Card / Panel | `<Card>` または Tailwind で直接実装 |

> `src/components/ui/` に存在するコンポーネントを優先する。独自 div 実装は最後の手段。

---

## 4. インタラクション状態

### フォーカスパターン（nexus 固有）

```tsx
// nexus 固有のフォーカスリング（ring-[3px] ではない）
'focus:ring-2 focus:ring-accent-500 focus:ring-opacity-50 focus:outline-none'
```

### 状態別実装

| 状態 | 実装方法 |
|------|---------|
| Hover | `hover:bg-accent-500/10 hover:border-border-active` |
| Active | `active:scale-95` |
| Disabled | `disabled:pointer-events-none disabled:opacity-40` |
| Focus | `focus:ring-2 focus:ring-accent-500 focus:ring-opacity-50 focus:outline-none` |

---

## 5. アニメーション制約

**許可:** `box-shadow 150ms ease` のみ（= Tailwind の `transition-shadow duration-150`）

**禁止:**
- `width`, `height`, `margin` のアニメーション（CPU レイアウト再計算）
- `transform: scale` 以外のアニメーション（装飾目的の回転・移動等）
- アニメーション時間 150ms 超

```tsx
// OK
<div className="transition-shadow duration-150 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.4)]">

// NG
<div className="transition-all duration-300 hover:w-64">
```

---

## 6. 実装後チェックリスト

- [ ] `--color-base-*` / `--color-accent-*` の CSS 変数のみ使用（hex hardcode なし）
- [ ] Button は `variant` prop 経由（独自 div 禁止）
- [ ] フォーカスリングは `focus:ring-2 focus:ring-accent-500 focus:ring-opacity-50`
- [ ] アニメーションは `transition-shadow duration-150` のみ
- [ ] `pnpm exec tsc --noEmit` エラーなし
- [ ] `pnpm exec biome check --write src/` エラーなし
