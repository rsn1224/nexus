# スタイルパターン

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
