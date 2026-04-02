# スタイルパターン（v4）

## ボタン

```tsx
// 標準ボタン
<button
  type="button"
  className="text-[11px] tracking-[0.1em] uppercase font-semibold px-3 py-1 border border-border-subtle text-secondary hover:border-accent-500 hover:text-accent-500 rounded transition-colors"
>
  ACTION
</button>

// プライマリ（アクセント）ボタン
<button
  type="button"
  className="text-[11px] tracking-[0.1em] uppercase font-semibold px-3 py-1 border border-accent-500 text-accent-500 hover:bg-accent-500/10 rounded transition-colors"
>
  APPLY
</button>

// 危険ボタン
<button
  type="button"
  className="text-[11px] tracking-[0.1em] uppercase font-semibold px-3 py-1 border border-danger-500 text-danger-500 hover:bg-danger-500/10 rounded transition-colors"
>
  REVERT
</button>

// disabled 状態
<button
  type="button"
  disabled={isLoading}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
```

## 動的クラス（条件付き）

```tsx
// OK: cn() で条件 className
import { cn } from "@/lib/cn";

<div className={cn(
  "text-[12px] font-mono",
  value >= 80 ? "text-danger-500" : value >= 50 ? "text-warning-500" : "text-success-500"
)}>
  {Math.round(value)}%
</div>

// NG: インラインスタイル
style={{ color: 'var(--color-accent-500)' }}
```

## 空・ローディング状態

```tsx
// 空状態
<div className="flex items-center justify-center h-[80px] text-[11px] text-muted tracking-[0.1em]">
  NO DATA
</div>

// ローディング（border spinner のみ許可）
<div className="w-4 h-4 rounded-full border border-border-subtle border-t-accent-500 animate-spin" />
```

## hover はTailwind ユーティリティを使う

```tsx
// OK: Tailwind hover: ユーティリティ
<div className="text-secondary hover:text-primary transition-colors">

// NG: インラインスタイル変更
style={{ color: isHovered ? ... : ... }}
```
