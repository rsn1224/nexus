---
description: nexus デザインシステム（Cyan 単色アクセント、カラー/タイポグラフィ/レイアウト規約）
globs: "src/**/*.{ts,tsx,css}"
---

# nexus デザインシステム

**SSOT: `src/design-tokens.ts` | CSS 実体: `src/index.css` @theme**
値を変更するときは **両方** 更新すること。詳細は [DESIGN.md](../../DESIGN.md) を参照。

⚠️ `nexus.css` 由来の `nx-` プレフィックスクラス（`nx-panel`, `nx-card` 等）は**廃止済み**。
新規コードでの使用禁止。既存コードも見つけ次第 Tailwind className へ移行すること。

## カラー（ダークモード専用、Cyan 単色アクセント）

- 背景: `base-950` から `base-500`（6段階）
- テキスト: `text-primary` / `text-secondary` / `text-muted`
- アクセント: `accent-500` (#06b6d4 Cyan) | 唯一のアクセントカラー
- セマンティック: `success-500` / `warning-500` / `danger-500`

## タイポグラフィ

| 用途 | サイズ | ウェイト |
| ------ | -------- | ------- |
| KPI 数字 | `text-[24px]` | `font-bold` |
| セクション見出し | `text-[11px] tracking-[0.15em] uppercase` | `font-bold` |
| 本文 | `text-[12px]` | `font-normal` |
| ラベル | `text-[10px] tracking-[0.12em]` | `font-semibold` |
| ボタン | `text-[11px] tracking-[0.1em] uppercase` | `font-semibold` |

## レイアウト

- `border-radius: 4px` 統一
- カード: `bg-base-800 border border-border-subtle rounded`
- 装飾: **なし**（グロー・グラデーション・シャドウ・アニメーション禁止）
- 例外: `animate-spin` は border spinner パターン（`border + border-t-transparent + rounded-full`）限定で許可
