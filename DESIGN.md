# DESIGN.md — nexus アプリケーション設計書 v2

> **目的:** Claude Code / Cascade が参照することで、実装・レビュー時のブレをゼロにする。
> 「どう見えるか」ではなく「どう実装するか」の粒度で書く。
>
> **最終更新:** 2026-03-19 (Phase R1)
> **旧バージョン:** `docs/archive/DESIGN_v1.md`

---

## Part 1 — デザイン原則

| # | 原則 | 意味 |
|---|------|------|
| P1 | **情報密度ファースト** | 1画面に最大の情報を詰める。余白は「意味のある区切り」にだけ使う |
| P2 | **アクション文脈の一致** | ボタンは「今できること」だけ表示。非活性なものは隠すか dim にする |
| P3 | **視覚的階層の明確化** | ラベル（dim）→ 値（明るい）→ アクション（アクセントカラー）の 3 階層を崩さない |
| P4 | **破壊的操作は 2 ステップ** | KILL / DEL など不可逆な操作は必ず確認ステップを挟む（3 秒タイムアウト付き） |
| P5 | **状態は常に可視** | loading / error / empty は必ず専用の表示を持つ。無音失敗禁止 |
| P6 | **全テキストはモノスペース** | UI 全体で `var(--font-mono)` を使う。フォントの揺らぎを排除する |
| P7 | **色は意味を持つ** | 装飾目的の色使い禁止。accent=主操作系、danger=警告、success=正常 |

---

## Part 2 — プロジェクト構造

### フロントエンド ディレクトリ

```
src/
├── components/
│   ├── home/         — ダッシュボード（HomeWing）
│   ├── performance/  — CPU 優先度最適化（BoostWing）
│   ├── games/        — ゲームランチャー（LauncherWing）
│   ├── network/      — ネットワーク最適化（NetoptWing）
│   ├── settings/     — アプリ設定 + Windows 設定（SettingsWing）
│   ├── hardware/     — CPU/GPU/RAM 監視（HardwareWing）
│   ├── storage/      — ストレージ監視（StorageWing）
│   ├── log/          — スクリプト実行ログ（LogWing）
│   ├── layout/       — Shell, TitleBar
│   ├── shared/       — AiPanel, PerplexityPanel
│   └── ui/           — 共通コンポーネント
├── stores/           — Zustand ストア
├── hooks/            — カスタムフック
├── lib/              — ユーティリティ（logger, gameReadiness 等）
├── services/         — 外部 API クライアント
└── types/            — 型定義（WingId 等）
```

### WingId 一覧

```typescript
export type WingId =
  | 'home'
  | 'performance'
  | 'games'
  | 'network'
  | 'settings'
  | 'hardware'
  | 'storage'
  | 'log';
```

### App.tsx パターン（mountedWings 廃止済み）

```tsx
// 全 Wing を常時レンダリング。inactive は hidden で非表示
{(Object.keys(WING_COMPONENTS) as WingId[]).map((wingId) => (
  <div
    key={wingId}
    className={wingId === activeWing ? 'flex flex-col h-full overflow-hidden' : 'hidden'}
  >
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <WingComponent />
      </Suspense>
    </ErrorBoundary>
  </div>
))}
```

---

## Part 3 — 配色ルール

### CSS 変数パレット

```css
/* ベース */
--color-base-950: #050508
--color-base-900: #0a0a0f
--color-base-800: #12121a
--color-base-700: #1a1a2e
--color-base-600: #1e2040

/* アクセント（主操作・ナビゲーション） */
--color-accent-500: #06b6d4   /* シアン */
--color-accent-400: #22d3ee

/* 危険 */
--color-danger-500: #ef4444
--color-danger-600: #b91c1c

/* 成功 */
--color-success-500: #22c55e

/* テキスト */
--color-text-primary:   #e2e8f0
--color-text-secondary: #94a3b8
--color-text-muted:     #475569

/* ボーダー */
--color-border-subtle: #1e293b
--color-border-active: #334155
```

### 色の意味マッピング（厳守）

| 状況 | クラス |
|------|--------|
| Wing ヘッダー・アクティブ UI | `text-accent-500` |
| エラーバナー | `bg-base-800 border-b border-danger-600 text-danger-500` |
| アクティブタブ下線 | `border-accent-500` |
| プライマリボタン | `bg-accent-500 text-base-950` |
| CPU / MEM 正常 | `text-success-500` |
| CPU / MEM 警告 | `text-accent-400` |
| CPU / MEM 危険 | `text-danger-500` |

### 禁止

- `rgba()` / `#rrggbb` のハードコード
- 存在しない CSS 変数（`--color-background`, `--color-primary-*`, `--color-surface` 等）
- フォールバック値に旧 orange `#f97316` を使うこと → `#06b6d4` を使う

---

## Part 4 — タイポグラフィ

### フォント

```tsx
className="font-mono"  // var(--font-mono) = B612 Mono
```

### サイズ体系

| 用途 | クラス | tracking | weight |
|------|--------|----------|--------|
| Wing 見出し | `text-[11px]` | `tracking-[0.15em]` | `font-bold` |
| 主要コンテンツ | `text-[12px]` | — | `font-normal` |
| ラベル / 列ヘッダー | `text-[10px]` | `tracking-[0.12em]` | `font-semibold` |
| ボタンテキスト | `text-[10px]` | `tracking-[0.1em]` | `font-semibold` |
| マイクロバッジ | `text-[9px]` | `tracking-[0.08em]` | `font-bold` |

### テキストの大文字化

- **必ず ALL CAPS:** Wing ラベル、セクション見出し、ボタンテキスト、列ヘッダー
- **そのまま:** ユーザー入力値、ゲーム名、プロセス名、パス

---

## Part 5 — スタイリング方針

- **Tailwind クラスのみ使用**。`style={{ }}` インラインスタイルは原則禁止
  - 例外: `width: X%` 等の計算値（プログレスバーの幅など）
- CSS 変数は `src/index.css` で定義、Tailwind 経由で参照
- `className` の条件分岐で動的スタイルを実装

```tsx
// ✅ 正しい
className={isActive ? 'text-accent-500' : 'text-text-muted'}

// ❌ 禁止
style={{ color: isActive ? 'var(--color-accent-500)' : 'var(--color-text-muted)' }}
```

---

## Part 6 — コンポーネントルール

### Wing 標準構造

```tsx
<div className="flex flex-col h-full">
  {/* 1. ヘッダー（固定） */}
  <div className="px-4 py-[10px] border-b border-border-subtle flex-shrink-0 flex items-center justify-between">
    <SectionHeader title="▶ WING / SECTION" />
    {/* contextual buttons */}
  </div>

  {/* 2. エラーバナー（条件付き） */}
  {error && <ErrorBanner message={error} />}

  {/* 3. スクロール可能コンテンツ */}
  <div className="flex-1 overflow-y-auto p-4">
    {/* content */}
  </div>
</div>
```

### ボタン 3 種

```tsx
// Primary（推奨アクション）
<Button variant="primary" />  // bg-accent-500 text-base-950

// Secondary（通常操作）
<Button variant="secondary" />  // border-only

// Danger（破壊操作）
<Button variant="danger" />  // border-danger-600 text-danger-500
```

### 破壊操作の 2 ステップ確認

```tsx
const [pendingId, setPendingId] = useState<string | null>(null);
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleDelete = (id: string) => {
  if (pendingId === id) {
    // 実行
    setPendingId(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  } else {
    setPendingId(id);
    timerRef.current = setTimeout(() => setPendingId(null), 3000);
  }
};
```

### SectionHeader

```tsx
// color: 'accent' (default) | 'muted'
<SectionHeader title="▶ WING / SECTION" />
<SectionHeader title="▶ WING / SECTION" color="muted" />
```

### Card バリアント

```tsx
// variant: 'default' | 'elevated' | 'outlined' | 'glow'
<Card title="TITLE" variant="glow">...</Card>
```

### ソート可能テーブルヘッダー

```tsx
<th
  className="cursor-pointer select-none ..."
  onClick={() => handleSort('column')}
>
  COLUMN {sortKey === 'column' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
</th>
```

---

## Part 7 — 状態管理・ロギング

### Zustand ストア命名規則

```
src/stores/use{WingName}Store.ts
```

### セレクタ最適化（useShallow）

```tsx
import { useShallow } from 'zustand/react/shallow';

const { items, isLoading } = useStore(
  useShallow((s) => ({ items: s.items, isLoading: s.isLoading }))
);
```

### ロギング（pino）

```typescript
import log from '../../lib/logger';

// ✅ 正しい
log.info({ wingId }, 'Wing mounted');
log.error({ err: error }, '[ErrorBoundary]');

// ❌ 禁止
console.log(...)
console.error(...)
```

### Tauri イベントリスン（ストアレベルで管理）

```typescript
// store の setupListeners アクション
setupListeners: () => {
  return listen<ResourceSnapshot>('pulse:snapshot', (event) => {
    set({ snapshot: event.payload });
  });
},
```

Wing コンポーネントではなくストア自身が `listen()` を保持する。

---

## Part 8 — 品質ゲート・チェックリスト

### 実装時チェックリスト

**新 Wing を作るとき:**
- [ ] `src/components/{wing}/{Wing}Wing.tsx` に配置
- [ ] `src/types/index.ts` の `WingId` に追加
- [ ] `src/App.tsx` の `WING_COMPONENTS` に追加
- [ ] `Shell.tsx` の `WING_ZONES` に追加
- [ ] Rust コマンドは `src-tauri/src/commands/{wing}.rs` に分離
- [ ] `lib.rs` の `invoke_handler` に登録

**スタイル:**
- [ ] ハードコード色なし（`rgba()` / `#rrggbb` 禁止）
- [ ] 存在しない CSS 変数を使っていない
- [ ] インラインスタイルは計算値のみ

**UX:**
- [ ] loading / error / empty state 実装済み
- [ ] 破壊操作は 2 ステップ確認
- [ ] `console.log` / `console.error` を使っていない

### 品質ゲートコマンド

```bash
npm run typecheck     # tsc --noEmit
npm run check         # biome check
npm run lint          # lint:css + lint:wings + lint:handoff
npm run test          # vitest
cargo clippy -- -D warnings
cargo test
```

### 禁止事項（コード）

| 禁止 | 代替 |
|------|------|
| `console.log` / `console.error` | `log.info` / `log.error` (pino) |
| `any` 型 | 明示的な型定義 |
| `unwrap()` in Rust 本番コード | `AppError` で適切にハンドリング |
| `style={{ color: ... }}` | `className="text-accent-500"` 等 |
| `#f97316` / `rgba()` ハードコード | CSS 変数クラス |
