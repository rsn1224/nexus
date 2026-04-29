# nexus UI-SPEC — デザイン仕様（Single Source of Truth）

> **コード実体:** `src/design-tokens.ts` (TS SSOT) | `src/index.css @theme` (CSS)
> **ルール詳細:** `.claude/skills/nexus-design/SKILL.md`
> 値を変更するときは `design-tokens.ts` と `index.css @theme` を**必ず両方**更新すること。

---

## 1. デザイン原則

**ゲーム前の30秒ルーティン。** 開く → 状態確認 → 最適化 → 閉じる。常駐しない。

1. **30秒ルール** — 起動から最適化完了まで30秒以内
2. **1画面完結** — スクロール不要、遷移なし
3. **数字が主役** — Grafana 的な情報密度、装飾ゼロ

---

## 2. カラートークン

### 背景（6段階、深い順）

| Tailwind クラス | CSS 変数 | 値 | 用途 |
|----------------|---------|-----|------|
| `bg-base-950` | `--color-base-950` | `#05060b` | 最深背景 |
| `bg-base-900` | `--color-base-900` | `#08090f` | メイン背景 |
| `bg-base-800` | `--color-base-800` | `#0d0e17` | **カード背景**（標準） |
| `bg-base-700` | `--color-base-700` | `#12131e` | サブカード背景 |
| `bg-base-600` | `--color-base-600` | `#191a28` | ホバー背景 |
| `bg-base-500` | `--color-base-500` | `#202235` | 選択状態 |

### アクセント（Cyan 単色）

| Tailwind クラス | CSS 変数 | 値 | 用途 |
|----------------|---------|-----|------|
| `*-accent-600` | `--color-accent-600` | `#0891b2` | アクセント dark |
| `*-accent-500` | `--color-accent-500` | `#06b6d4` | **標準アクセント**（見出し・アイコン） |
| `*-accent-400` | `--color-accent-400` | `#22d3ee` | KPI 数値・強調 |

### セマンティック

| Tailwind クラス | 値 | 用途 |
|----------------|-----|------|
| `*-success-500` | `#22c55e` | 正常・成功 |
| `*-warning-500` | `#f59e0b` | 警告 |
| `*-danger-500` | `#ef4444` | 危険・エラー |

### テキスト

| Tailwind クラス | 値 | 用途 |
|----------------|-----|------|
| `text-text-primary` | `#e2e8f0` | メインテキスト |
| `text-text-secondary` | `#94a3b8` | 補助テキスト |
| `text-text-muted` | `#64748b` | ラベル・非活性 |

### ボーダー

| Tailwind クラス | 値 | 用途 |
|----------------|-----|------|
| `border-border-subtle` | `rgba(34,211,238,0.12)` | 通常ボーダー |
| `border-border-active` | `rgba(34,211,238,0.20)` | アクティブ・フォーカス |

---

## 3. タイポグラフィ

| 用途 | Tailwind クラス | フォント |
|------|----------------|---------|
| KPI 数字 | `text-[24px] font-bold font-mono text-accent-400` | JetBrains Mono |
| KPI ラベル | `text-[9px] font-bold tracking-[0.2em] uppercase text-text-muted` | JetBrains Mono |
| セクション見出し | `text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500` | Inter |
| 本文 | `text-[12px] font-normal` | JetBrains Mono |
| ラベル | `text-[10px] font-semibold tracking-[0.12em]` | JetBrains Mono |
| ボタン | `text-[11px] font-semibold tracking-[0.1em] uppercase` | Inter |

**ルール:** `text-[Npx]` の任意値は上記の値のみ許可。`font-[N]` は normal/medium/semibold/bold のみ。

---

## 4. スペーシング・レイアウト

| 項目 | 値 | Tailwind クラス |
|------|-----|----------------|
| border-radius | 4px | `rounded` |
| カード padding | 12px | `p-3` |
| セクション gap | 16px | `gap-4` |
| カード内 gap | 8px | `gap-2` |
| 要素内 gap | 6px | `gap-1.5` |

**画面構成:** Main 1画面（スクロール不要）+ スライドパネル 2枚（Settings / History）

---

## 5. コンポーネントカタログ

### セクションカード（標準）

```tsx
<div className="bg-base-800 border border-border-subtle rounded p-3">
  <div className="text-[11px] font-bold text-accent-500 tracking-[0.15em] uppercase mb-3">
    SECTION TITLE
  </div>
  <div className="text-[12px] text-text-primary">
    {/* コンテンツ */}
  </div>
</div>
```

### KPI アイテム

```tsx
<div className="flex flex-col gap-1">
  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-text-muted">
    CPU
  </span>
  <span className="text-[24px] font-bold font-mono text-accent-400">
    {Math.round(cpu)}%
  </span>
</div>
```

### ローディング（border spinner — animate-spin はこの形のみ許可）

```tsx
{isLoading && (
  <div className="flex items-center justify-center h-[80px]">
    <div className="w-4 h-4 rounded-full border border-border-subtle border-t-accent-500 animate-spin" />
  </div>
)}
```

### エラーバナー

```tsx
{error && (
  <div className="px-3 py-2 bg-base-800 border-b border-danger-500 text-[11px] text-danger-500">
    {error}
  </div>
)}
```

### 空状態（empty state）

```tsx
{items.length === 0 && (
  <div className="flex items-center justify-center h-[60px] text-[11px] text-text-muted">
    NO DATA
  </div>
)}
```

### Button（既存 `src/components/ui/Button.tsx` を使う）

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md">OPTIMIZE</Button>
<Button variant="ghost" size="sm">CANCEL</Button>
<Button variant="danger" size="sm">REVERT</Button>
```

### SlidePanel（既存 `src/components/ui/SlidePanel.tsx` を使う）

```tsx
import { SlidePanel } from '@/components/ui/SlidePanel';

<SlidePanel isOpen={isOpen} onClose={onClose} title="SETTINGS">
  {/* パネルコンテンツ */}
</SlidePanel>
```

---

## 6. インタラクション原則

すべてのインタラクティブ要素は以下の4状態を実装すること:

| 状態 | 要件 |
|------|------|
| **default** | 通常表示 |
| **hover** | `border-border-active` または `bg-base-600` への変化 |
| **loading** | border spinner（`animate-spin` パターンのみ） |
| **error** | `text-danger-500` + エラーメッセージ表示 |
| **empty** | 空状態テキスト（"NO DATA" 等）を `text-text-muted` で表示 |

**hover の実装例:**
```tsx
<button className="border border-border-subtle hover:border-border-active rounded p-2 transition-colors">
```

**禁止:** グロー・グラデーション・スケール変化・フェードアニメーション

---

## 7. アクセシビリティ要件（最低限）

| 項目 | 要件 |
|------|------|
| コントラスト | `text-text-primary` on `bg-base-800` → 要確認（目標 4.5:1） |
| セクションラベル | `aria-label` または `<section>` タグを使用 |
| ボタン | `aria-label` 必須（アイコンのみの場合） |
| loading 状態 | `aria-busy="true"` |
| error 状態 | `role="alert"` |
| フォーカス | `:focus-visible` リングが見えること |

---

## 8. Do / Don't

### やってはいけないこと

```
❌ style={{ color: '#22d3ee' }}     → className="text-accent-400"
❌ style={{ ... }} インラインスタイル → Tailwind className で代替
❌ nx-* クラス（nx-card 等）        → 廃止済み。bg-base-800 等で代替
❌ text-black / text-white          → text-text-primary / text-text-secondary
❌ bg-black / bg-white              → bg-base-900 / bg-base-800
❌ shadow-lg / shadow-xl            → 禁止（装飾なし原則）
❌ bg-gradient-to-*                 → 禁止（OPTIMIZE ボタン除く）
❌ animate-* (spinner 以外)         → 禁止
❌ #xxxxxx ハードコード色            → デザイントークン CSS 変数を使用
❌ text-[任意px]（表外の値）         → タイポグラフィ表の値のみ許可
❌ console.log                      → log.info / log.warn / log.error
```

### やるべきこと

```
✅ bg-base-800 border border-border-subtle rounded  → 標準カード
✅ text-accent-500                                  → セクション見出し
✅ text-accent-400                                  → KPI 数値
✅ text-text-muted                                  → ラベル・非活性テキスト
✅ cn() ユーティリティ                               → 動的クラス結合
✅ loading / error / empty 状態を全て実装する
✅ aria-label / role="alert" 等のアクセシビリティ属性
```

---

## 移行状況

以下のファイルに廃止済み `nx-*` クラスが残存。見つけ次第 Tailwind className へ移行すること:

| ファイル | 状態 |
|---------|------|
| `src/components/system/KpiGrid.tsx` | ✅ 移行済み |
| `src/components/views/MonitorView.tsx` | ⚠️ 移行待ち |
| `src/components/views/BoostView.tsx` | ⚠️ 移行待ち |
| `src/components/Main.tsx` | ⚠️ 移行待ち |
| `src/components/optimize/OptimizeSection.tsx` | ⚠️ 移行待ち |
| `src/components/panels/QuickPanels.tsx` | ⚠️ 移行待ち |
