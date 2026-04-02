# スタイル詳細ルール（v4）

## エラーバナー

```tsx
{error && (
  <div className="px-3 py-2 bg-base-800 border-b border-danger-500 text-[11px] text-danger-500">
    {error}
  </div>
)}
```

## カード

```tsx
<div className="bg-base-800 border border-border-subtle rounded p-3">
  ...
</div>
```

## テーブル

- `<thead>` に `sticky top-0 bg-base-900`
- 行に `border-b border-border-subtle`
- `key={index}` 不使用 → ユニーク ID を使う

## UX

- `window.alert` / `window.confirm` 不使用
- catch で何もしない禁止（エラーを必ず表示）
- ポーリング系は unmount 時に `clearInterval`
- 重いソート・フィルタリングに `useMemo`

## 存在しない CSS 変数（使用禁止）

```
--color-background
--color-primary-*
--color-surface
--color-border（末尾なし — border-subtle / border-active を使う）
bg-base-1000 / bg-base-400（範囲外）
```
