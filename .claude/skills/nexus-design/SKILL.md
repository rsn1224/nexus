---
name: nexus-design
description: >
  nexus UI 実装規約（v4）。Tailwind v4 + CSS 変数デザインシステム。
  カラーパレット・タイポグラフィ・コンポーネント構造テンプレート。
  Use when user says "コンポーネント作成", "UI 実装", "view 追加",
  "デザイン", "スタイル修正", or creates/edits files in src/components/ or src/components/views/.
  Do NOT use for Rust backend or test-only changes.
---

# nexus UI 実装規約（v4）

コンポーネント・View 作成・編集時に必ずこの規約に従うこと。

## 絶対ルール

- **Tailwind className** を使う。`style={{ }}` インラインスタイル禁止
- CSS 変数は `src/index.css` の `@theme` 定義のみ使用（ハードコード色禁止）
- `nx-*` クラス禁止（廃止済み）
- 装飾禁止: グロー・グラデーション・シャドウ・アニメーション
  - 例外: border spinner の `animate-spin` のみ許可
- `border-radius` は `rounded`（4px）に統一

## デザイントークン（v4）

→ 全変数一覧: references/color-tokens.md

```
背景（6段階）: bg-base-950 / bg-base-900 / bg-base-800 / bg-base-700 / bg-base-600 / bg-base-500
アクセント: text-accent-500 / border-accent-500 / bg-accent-500   ← Cyan #06b6d4 のみ
セマンティック: success-500 / warning-500 / danger-500
テキスト: text-primary / text-secondary / text-muted
ボーダー: border-border-subtle / border-border-active
```

## タイポグラフィ

| 用途 | クラス |
|------|--------|
| KPI 数字 | `text-[24px] font-bold` |
| セクション見出し | `text-[11px] tracking-[0.15em] uppercase font-bold` |
| 本文 | `text-[12px] font-normal` |
| ラベル | `text-[10px] tracking-[0.12em] font-semibold` |
| ボタン | `text-[11px] tracking-[0.1em] uppercase font-semibold` |

## コンポーネント構造テンプレート → references/components.md

## ボタン・状態表示・動的スタイル → references/patterns.md
