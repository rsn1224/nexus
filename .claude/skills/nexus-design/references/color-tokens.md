# CSS 変数一覧

## 存在する CSS 変数

```
背景:     bg-base-900 / bg-base-800 / bg-base-700 / bg-base-600 / bg-base-500
アクセント: text-(--color-accent-500) / border-(--color-accent-500)
シアン:   text-cyan-500 / border-cyan-500
危険:     text-danger-500 / border-danger-600
成功:     text-[var(--color-success-500)]
テキスト: text-text-primary / text-text-secondary / text-text-muted
ボーダー: border-border-subtle / border-border-active
フォント: font-[var(--font-mono)]
```

## 存在しない変数（使用禁止）

```
--color-background
--color-primary-*
--color-surface
--color-border（末尾なし — border-subtle / border-active を使う）
--color-warning-500
```

## 色の意味（厳守）

| 用途 | Tailwind クラス |
|------|----------------|
| 管理・操作系ヘッダー | `text-(--color-accent-500)` |
| 監視・情報系ヘッダー | `text-cyan-500` |
| CPU < 20% | `text-cyan-500` |
| CPU 20–50% | `text-(--color-accent-500)` |
| CPU ≥ 50% | `text-danger-500` |
| エラーバナー | `bg-base-800 border-b border-danger-600 text-danger-500` |
