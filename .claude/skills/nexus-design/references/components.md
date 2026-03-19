# コンポーネント別テンプレート

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
