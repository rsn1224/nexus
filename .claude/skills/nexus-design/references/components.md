# コンポーネント構造テンプレート（v4）

## セクションカード（基本構造）

```tsx
<div className="bg-base-800 border border-border-subtle rounded p-3">
  {/* セクション見出し */}
  <div className="text-[11px] font-bold text-accent-500 tracking-[0.15em] uppercase mb-3">
    SECTION TITLE
  </div>
  {/* コンテンツ */}
  <div className="text-[12px] text-primary">
    ...
  </div>
</div>
```

## KPI グリッドアイテム

```tsx
<div className="flex flex-col gap-1">
  <span className="text-[10px] tracking-[0.12em] font-semibold text-muted uppercase">
    CPU
  </span>
  <span className="text-[24px] font-bold text-primary font-mono">
    {Math.round(cpu)}%
  </span>
</div>
```

## エラーバナー

```tsx
{error && (
  <div className="px-3 py-2 bg-base-800 border-b border-danger-500 text-[11px] text-danger-500">
    {error}
  </div>
)}
```

## ローディング（border spinner パターン — animate-spin はこの形のみ許可）

```tsx
{isLoading && (
  <div className="flex items-center justify-center h-[80px]">
    <div className="w-4 h-4 rounded-full border border-border-subtle border-t-accent-500 animate-spin" />
  </div>
)}
```

## スライドパネル（SlidePanel コンポーネントを使う）

```tsx
import { SlidePanel } from "@/components/ui/SlidePanel";

<SlidePanel isOpen={isOpen} onClose={onClose} title="PANEL TITLE">
  ...
</SlidePanel>
```
