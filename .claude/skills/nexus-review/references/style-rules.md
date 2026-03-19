# スタイル詳細ルール

## エラーバナー

```tsx
{error && (
  <div className="px-4 py-2 bg-base-800 border-b border-danger-600 font-[var(--font-mono)] text-[11px] text-danger-500">
    ERROR: {error}
  </div>
)}
```

## テーブル

- `border-collapse` は `className="border-collapse"` で指定
- `<thead>` に `sticky top-0 bg-[var(--color-base-800)]`
- 行に `border-b border-[var(--color-border-subtle)]`
- `key={index}` 不使用 → ユニーク ID を使う

## UX

- `window.alert` / `window.confirm` 不使用
- catch で何もしない禁止（エラーを必ず表示）
- ポーリング系は unmount 時に `clearInterval`
- 重いソート・フィルタリングに `useMemo`
