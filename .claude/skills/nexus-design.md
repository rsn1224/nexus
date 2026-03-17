---
name: nexus-design
description: nexus UI実装規約。Wing作成・コンポーネント編集時に参照。Tailwindクラス・CSS変数・スタイルパターン・状態表示テンプレート。
---

# nexus UI 実装規約

新規 Wing 作成・既存 Wing 編集時に必ずこの規約に従うこと。

## 絶対ルール

- **Tailwind CSS変数クラス**（`className`）を使う。`style={{ }}` インラインスタイル禁止
- フォントは `font-[var(--font-mono)]` を全テキストに適用（例外なし）
- CSS `:hover` 禁止 → `useState` で isHovered を管理（またはTailwind `hover:` ユーティリティ）
- ハードコードカラー禁止 → 必ず CSS 変数クラスを使う

## 存在する CSS 変数のみ使う

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

❌ 存在しない変数: `--color-background` `--color-primary-*` `--color-surface` `--color-border`（末尾なし）`--color-warning-500`

## 色の意味（厳守）

| 用途 | Tailwind クラス |
|------|----------------|
| 管理・操作系ヘッダー | `text-(--color-accent-500)` |
| 監視・情報系ヘッダー | `text-cyan-500` |
| CPU < 20% | `text-cyan-500` |
| CPU 20–50% | `text-(--color-accent-500)` |
| CPU ≥ 50% | `text-danger-500` |
| エラーバナー | `bg-base-800 border-b border-danger-600 text-danger-500` |

## Wing 標準構造

```tsx
// 1. Wing header（固定）
<div className="px-4 py-[10px] border-b border-border-subtle flex-shrink-0">
  <span className="font-[var(--font-mono)] text-[11px] font-bold text-(--color-accent-500) tracking-[0.15em]">
    ▶ WING / SECTION
  </span>
</div>

// 2. エラーバナー（条件付き）
{error && (
  <div className="px-4 py-2 bg-base-800 border-b border-danger-600 font-[var(--font-mono)] text-[11px] text-danger-500">
    ERROR: {error}
  </div>
)}

// 3. スクロール可能コンテンツ
<div className="flex-1 overflow-y-auto p-4">
  ...
</div>
```

## ボタンスタイル

```tsx
// 標準
className="font-[var(--font-mono)] text-[10px] px-[10px] py-[2px] bg-transparent border border-border-subtle text-text-secondary cursor-pointer tracking-[0.1em]"

// プライマリ
className="... border-(--color-accent-500) text-(--color-accent-500)"

// 危険
className="... border-danger-600 text-danger-500"

// 確認中（2ステップ目）
className="... bg-danger-500 text-base-900"
```

## 状態表示テンプレート

```tsx
// loading
<div className="flex items-center justify-center h-[120px] font-[var(--font-mono)] text-[11px] text-text-muted tracking-[0.1em]">
  LOADING...
</div>

// empty
<div className="flex items-center justify-center h-[120px] font-[var(--font-mono)] text-[11px] text-text-muted tracking-[0.1em]">
  NO ENTRIES — PRESS + ADD
</div>
```

## 動的スタイル（条件付きクラス）

```tsx
// NG: インラインスタイル
style={{ color: isActive ? 'var(--color-cyan-500)' : 'var(--color-text-muted)' }}

// OK: 条件className
className={isActive ? 'text-cyan-500' : 'text-text-muted'}
```
