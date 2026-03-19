---
name: nexus-design
description: >
  nexus UI 実装規約。THE DIVISION 2 タクティカル HUD デザインシステム。
  Tailwind CSS 変数クラス・カラーパレット・フォント・状態表示テンプレート。
  Use when user says "Wing 作成", "UI 実装", "コンポーネント編集",
  "デザイン", "スタイル修正", or creates/edits files in src/components/.
  Do NOT use for Rust backend or test-only changes.
---

# nexus UI 実装規約

新規 Wing 作成・既存 Wing 編集時に必ずこの規約に従うこと。

## 絶対ルール

- **Tailwind CSS変数クラス**（`className`）を使う。`style={{ }}` インラインスタイル禁止
- フォントは `font-[var(--font-mono)]` を全テキストに適用（例外なし）
- CSS `:hover` 禁止 → `useState` で isHovered を管理（またはTailwind `hover:` ユーティリティ）
- ハードコードカラー禁止 → 必ず CSS 変数クラスを使う

## CSS 変数（要約）

```
背景: bg-base-900 / bg-base-800 / bg-base-700 / bg-base-600 / bg-base-500
アクセント(orange): text-(--color-accent-500) / border-(--color-accent-500)
シアン: text-cyan-500 / border-cyan-500
危険: text-danger-500 / border-danger-600
成功: text-[var(--color-success-500)]
テキスト: text-text-primary / text-text-secondary / text-text-muted
ボーダー: border-border-subtle / border-border-active
フォント: font-[var(--font-mono)]
```

→ 全変数一覧 + 色の意味: references/color-tokens.md

## Wing 標準構造 → references/components.md

## ボタン・状態表示・動的スタイル → references/patterns.md
