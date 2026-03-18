# DESIGN.md — nexus アプリケーション設計書

> **目的:** Claude Code / Cascade が参照することで、実装・レビュー時のブレをゼロにする。
> 「どう見えるか」ではなく「どう実装するか」の粒度で書く。
>
> **最終更新:** 2026-03-18

---

## 目次

1. デザイン原則
2. 画面レイアウト原則
3. 情報階層ルール
4. 配色ルール
5. 余白と密度ルール
6. タイポグラフィルール
7. スタイリング方針（Tailwind v4）
8. コンポーネントルール
9. 共通 UI コンポーネント
10. 状態表示ルール
11. フィードバックルール
12. 禁止事項
13. バックエンドアーキテクチャ設計
14. セキュリティ設計
15. イベント駆動アーキテクチャ設計
16. React 19 / Zustand v5 パターン
17. 実装時チェックリスト
18. レビュー時チェックリスト
19. GPU 監視
20. プロセス保護

---

## 1. デザイン原則

| # | 原則 | 意味 |
|---|------|------|
| P1 | **情報密度ファースト** | 1画面に最大の情報を詰める。余白は「意味のある区切り」にだけ使う |
| P2 | **アクション文脈の一致** | ボタンは「今できること」だけ表示。非活性なものは隠すか dim にする |
| P3 | **視覚的階層の明確化** | ラベル（dim）→ 値（明るい）→ アクション（アクセントカラー）の3階層を崩さない |
| P4 | **破壊的操作は2ステップ** | KILL / DEL など不可逆な操作は必ず確認ステップを挟む |
| P5 | **状態は常に可視** | loading / error / empty は必ず専用の表示を持つ。無音失敗禁止 |
| P6 | **全テキストはモノスペース** | UI全体で `var(--font-mono)` を使う。フォントの揺らぎを排除する |
| P7 | **色は意味を持つ** | 装飾目的の色使い禁止。cyan=監視系、accent(orange)=管理系、danger=警告、success=正常 |

---

## 2. 画面レイアウト原則

### 全体構造（Shell）

```
┌───────────────────────────── header (40px) ──────────────────────┐
│  NEXUS  │ [HOME][BOOST][LAUNCHER]│[SETTINGS][WINDOWS][HARDWARE]│… │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                    Wing コンテンツ                                 │  ← main (flex:1)
│                                                                   │
└───────────────────────────── footer (24px) ──────────────────────┘
```

- `height: 100vh`, `overflow: hidden` — スクロールバーは各 Wing 内部のみ
- header は `flex-shrink-0` で固定
- main は `flex-1 overflow-hidden`

### サイドバーナビゲーション（現行構成）

```
[HOME]                  ← ダッシュボード概要
[BOOST]                 ← CPU優先度最適化
[LAUNCHER]              ← ゲームランチャー
─────────────────
[SETTINGS]              ← アプリ設定
[WINDOWS]               ← プロセス・タスク管理
[HARDWARE]              ← CPU/GPU/RAM監視
─────────────────
[LOG]                   ← スクリプト実行ログ
[NETOPT]                ← ネットワーク最適化
[STORAGE]               ← ストレージ監視
```

### Wing 内部の標準構造

```
┌── Wing header (px-4 py-[10px] border-b border-border-subtle flex-shrink-0) ──┐
│  ▶ WING / SECTION   [tab][tab]   [contextual buttons]                          │
├── Error banner（条件付き）─────────────────────────────────────────────────────┤
│  ERROR: ...                                                                     │
├── スクロール可能コンテンツ (flex-1 overflow-y-auto p-4) ────────────────────────┤
│  table / list / form                                                            │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 情報階層ルール

1. **セクションタイトル** — `▶ WING / SECTION`、`text-[11px] font-bold` ゾーン色、`tracking-[0.15em]`
2. **ラベル（列見出し・フィールド名）** — `text-[10px] text-text-muted tracking-[0.12em]`
3. **主要データ値** — `text-[12px] text-text-primary`
4. **補助データ** — `text-[11px] text-text-secondary`
5. **マイクロラベル（バッジ・タグ）** — `text-[9px] px-[5px] py-[1px]`、ボーダーのみスタイル

**視線誘導の原則:** 左上→右下。最重要情報を左に、操作ボタンを右端に配置する。

---

## 4. 配色ルール

### パレット（CSS変数 → Tailwindクラス対応）

```css
/* ベース — 背景・サーフェス */
--color-base-900: #0a0a0f   /* bg-base-900   メイン背景 */
--color-base-800: #12121a   /* bg-base-800   header/footer/panel 背景 */
--color-base-700: #1a1a2e   /* bg-base-700   input 背景、セカンダリ面 */
--color-base-600: #1e2040   /* bg-base-600   hover 背景 */
--color-base-500: #2a2d4a   /* bg-base-500   選択状態背景 */

/* アクセント — 管理・操作系 (orange) */
--color-accent-500: #f97316  /* text-(--color-accent-500) / border-(--color-accent-500) */

/* シアン — 監視・情報系 */
                             /* text-cyan-500 / border-cyan-500 */

/* 危険 — 警告・破壊操作 */
--color-danger-500: #ef4444  /* text-danger-500 */
--color-danger-600: #b91c1c  /* border-danger-600 */

/* 成功 */
--color-success-500: #22c55e /* text-[var(--color-success-500)] */

/* テキスト */
                             /* text-text-primary / text-text-secondary / text-text-muted */

/* ボーダー */
                             /* border-border-subtle / border-border-active */
```

### 色の意味マッピング（厳守）

| 状況 | Tailwindクラス |
|------|---------------|
| 監視・情報系 Wing ヘッダー | `text-cyan-500` |
| 管理・操作系 Wing ヘッダー | `text-(--color-accent-500)` |
| CPU < 20% | `text-cyan-500` |
| CPU 20–50% | `text-(--color-accent-500)` |
| CPU ≥ 50% | `text-danger-500` |
| エラーバナー | `bg-base-800 border-b border-danger-600 text-danger-500` |
| アクティブタブ/ボタン | `bg-(--color-accent-500) text-base-900` |
| 非アクティブタブ | `bg-transparent text-text-secondary` |
| オルタネート行 | `bg-white/[0.02]` |

### 存在しない変数（使用禁止）

`--color-background` / `--color-primary-*` / `--color-surface` / `--color-border`（末尾なし）/ `--color-warning-500`

---

## 5. 余白と密度ルール

### 基本スペーシングスケール（Tailwind対応）

| 用途 | Tailwindクラス |
|------|---------------|
| テーブルセル padding | `px-3 py-[5px]` |
| セクション padding | `px-4 py-[10px]` |
| コンテンツ padding | `p-4` |
| ボタン padding (小) | `px-[5px] py-[1px]` |
| ボタン padding (標準) | `px-[10px] py-[2px]` |
| ボタン padding (大) | `px-3 py-[5px]` |
| 要素間 gap (密) | `gap-1` |
| 要素間 gap (標準) | `gap-2` |
| 要素間 gap (疎) | `gap-3` または `gap-4` |
| モーダル padding | `p-5` |

### 密度の指針

- テーブル行の高さは明示しない（padding で自然に決まる）
- セクション間の区切りは `border-b border-border-subtle` のみ
- 空白行・空白ブロックを追加しない
- モーダルは `w-[400px] max-w-[90%]` を標準とする

---

## 6. タイポグラフィルール

### フォント

```tsx
// UIの全テキストに適用（例外なし）
className="font-[var(--font-mono)]"
```

### サイズ体系

| 用途 | クラス | letterSpacing | fontWeight |
|------|--------|---------------|------------|
| ロゴ | `text-[16px]` | `tracking-[0.2em]` | `font-bold` |
| モーダルタイトル / Wing 見出し | `text-[11px]` 〜 `text-[14px]` | `tracking-[0.1em]` 〜 `tracking-[0.15em]` | `font-bold` |
| 主要コンテンツ | `text-[12px]` | normal | `font-normal` |
| ラベル・ヘッダー | `text-[10px]` 〜 `text-[11px]` | `tracking-[0.1em]` 〜 `tracking-[0.15em]` | `font-semibold` |
| ボタンテキスト | `text-[9px]` 〜 `text-[11px]` | `tracking-[0.05em]` 〜 `tracking-[0.12em]` | `font-semibold` |
| マイクロバッジ | `text-[9px]` | `tracking-[0.08em]` | `font-bold` |
| ステータスバー | `text-[10px]` | `tracking-[0.08em]` | `font-normal` |

### テキストの大文字化

- **必ず ALL CAPS:** Wing ラベル、セクション見出し、ボタンテキスト、ステータステキスト、列ヘッダー
- **そのまま:** ユーザー入力値、ゲーム名、プロセス名、パス、URL
- **混在NG:** 同一 UI 要素内でケースを混ぜない

---

## 7. スタイリング方針（Tailwind v4）

### 基本ルール

**Tailwind CSS変数クラス（`className`）を使う。`style={{ }}` インラインスタイルは原則禁止。**

- CSS カスタムプロパティは `src/index.css` で定義し、Tailwind 経由のみで参照する
- 動的なスタイルも `className` の条件分岐で実装する
- `src/lib/styles.ts` は dead code のため削除対象（Phase 2）

### CSS変数の Tailwind クラス対応

```tsx
// ベース背景
className="bg-base-900"           // #0a0a0f
className="bg-base-800"           // #12121a
className="bg-base-700"           // #1a1a2e

// テキスト
className="text-text-primary"     // #e2e8f0
className="text-text-secondary"   // #94a3b8
className="text-text-muted"       // #475569
className="text-cyan-500"         // #06b6d4
className="text-danger-500"       // #ef4444
className="text-(--color-accent-500)"  // #f97316

// ボーダー
className="border-border-subtle"  // #1e293b
className="border-danger-600"     // #b91c1c

// フォント
className="font-[var(--font-mono)]"
```

### 動的スタイル（条件付きクラス）

```tsx
// ✅ 正しい（条件 className）
className={isActive ? 'text-cyan-500' : 'text-text-muted'}
className={`text-[12px] ${error ? 'text-danger-500' : 'text-text-primary'}`}

// ❌ 禁止（インラインスタイル）
style={{ color: isActive ? 'var(--color-cyan-500)' : 'var(--color-text-muted)' }}
```

---

## 8. コンポーネントルール

### Wing 標準構造

```tsx
// Wing ルートは flex-col h-full
<div className="flex flex-col h-full">
  {/* 1. Wing header（固定） */}
  <div className="px-4 py-[10px] border-b border-border-subtle flex-shrink-0 flex items-center justify-between">
    <span className="font-[var(--font-mono)] text-[11px] font-bold text-(--color-accent-500) tracking-[0.15em]">
      ▶ WING / SECTION
    </span>
    <div className="flex items-center gap-2">
      {/* contextual buttons */}
    </div>
  </div>

  {/* 2. エラーバナー（条件付き） */}
  {error && (
    <div className="px-4 py-2 bg-base-800 border-b border-danger-600 font-[var(--font-mono)] text-[11px] text-danger-500">
      ERROR: {error}
    </div>
  )}

  {/* 3. スクロール可能コンテンツ */}
  <div className="flex-1 overflow-y-auto p-4">
    {/* content */}
  </div>
</div>
```

### ボタン

```tsx
// 標準（非破壊）
className="font-[var(--font-mono)] text-[10px] px-[10px] py-[2px] bg-transparent border border-border-subtle text-text-secondary cursor-pointer tracking-[0.1em] transition-all duration-100"

// プライマリ（推奨アクション）
className="... border-(--color-accent-500) text-(--color-accent-500)"

// 情報系アクション（シアン）
className="... border-cyan-500 text-cyan-500"

// 危険（KILL/DEL）
className="... border-danger-600 text-danger-500"

// アクティブ状態（タブ等）
className="... bg-(--color-accent-500) text-base-900"

// 確認中（2ステップ目）
className="... bg-danger-500 text-base-900"
```

**ボタンルール:**
- 必ず `type="button"` を明示（フォーム内は `type="submit"`）
- `disabled` 時は `opacity-50 cursor-default`
- 状態変化には `transition-all duration-100`

### テーブル

```tsx
<table className="w-full border-collapse">
  <thead>
    <tr className="sticky top-0 bg-base-800 border-b border-border-subtle">
      <th className="px-3 py-[6px] font-[var(--font-mono)] text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left">
        COLUMN
      </th>
    </tr>
  </thead>
  <tbody>
    {items.map((item, index) => (
      <tr key={item.id} className={`border-b border-border-subtle ${index % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
        <td className="px-3 py-[5px] font-[var(--font-mono)] text-[12px] text-text-primary">
          {item.value}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

- thead は必ず `sticky top-0` で固定
- ソート可能列はヘッダーに `cursor-pointer select-none` + `▼/▲` インジケーター

### 入力フィールド

```tsx
<input
  className="w-full font-[var(--font-mono)] text-[11px] px-2 py-[5px] bg-base-700 border border-border-subtle text-text-primary outline-none box-border"
/>
```

### バッジ / カテゴリタグ

```tsx
<span className={`font-[var(--font-mono)] text-[9px] px-[5px] py-[1px] border tracking-[0.08em] ${colorClass}`}>
  {label}
</span>
// 背景は透明のみ。solid 塗りつぶしは使わない
```

### モーダルオーバーレイ

```tsx
// オーバーレイ
<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
  {/* コンテンツボックス */}
  <div className="bg-base-900 border border-border-subtle p-5 w-[400px] max-w-[90%]">
    {children}
  </div>
</div>
```

### プログレスバー

```tsx
// トラック
<div className="w-full h-2 bg-base-800 rounded overflow-hidden">
  {/* フィル */}
  <div
    className={`h-full transition-all duration-300 ${colorClass}`}
    style={{ width: `${percent}%` }}
  />
</div>
// ※ width はパーセント値が動的なため style 属性を例外的に使用
```

---

## 9. 共通 UI コンポーネント

> 実装場所: `src/components/ui/`

### ErrorBanner

```tsx
interface ErrorBannerProps {
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  onDismiss?: () => void;
}
```

バリエーション:
- `error`: `bg-base-800 border-b border-danger-600 text-danger-500`
- `warning`: `bg-base-800 border-b border-(--color-accent-500) text-(--color-accent-500)`
- `info`: `bg-base-800 border-b border-cyan-500 text-cyan-500`
- `success`: `bg-base-800 border-b border-[var(--color-success-500)] text-[var(--color-success-500)]`

### LoadingState

```tsx
interface LoadingStateProps {
  message?: string;   // デフォルト: 'LOADING...'
  height?: string;    // デフォルト: 'h-[120px]'
}
```

```tsx
<div className={`flex items-center justify-center ${height} font-[var(--font-mono)] text-[11px] text-text-muted tracking-[0.1em]`}>
  {message}
</div>
```

### EmptyState

```tsx
interface EmptyStateProps {
  message: string;      // 例: 'NO GAMES FOUND'
  action?: string;      // 例: 'PRESS + ADD'（次のアクションを添える）
  height?: string;
}
```

### SectionHeader

```tsx
interface SectionHeaderProps {
  title: string;
  color?: 'accent' | 'cyan' | 'muted';  // デフォルト: 'accent'
  children?: React.ReactNode;  // 右側のボタン群
}
```

### KeyValueRow

```tsx
interface KeyValueRowProps {
  label: string;
  value: string | number;
  valueColor?: string;  // Tailwind クラス（デフォルト: 'text-text-primary'）
}
```

### Toggle

```tsx
interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}
```

### ProgressBar

```tsx
interface ProgressBarProps {
  percent: number;          // 0〜100
  colorClass?: string;      // デフォルト: CPU/MEM 用の動的色
  height?: 'h-1' | 'h-2';  // デフォルト: 'h-2'
  showText?: boolean;       // パーセントテキスト表示
}
```

---

## 10. 状態表示ルール

### loading

```tsx
// インラインテキスト（ヘッダー内）
<span className="font-[var(--font-mono)] text-[10px] text-cyan-500">
  SCANNING...
</span>

// 中央配置（LoadingState コンポーネントを使う）
<LoadingState message="ANALYZING..." />
```

### error

```tsx
// ErrorBanner コンポーネントを使う
{error && <ErrorBanner message={error} />}
```

### empty state

```tsx
// EmptyState コンポーネントを使う
<EmptyState message="NO ENTRIES" action="PRESS + ADD" />
```

### success / 完了フィードバック

```tsx
// コピー完了等の一時的フィードバック（2秒後に元に戻す）
const [copied, setCopied] = useState(false);
// ボタンテキストを一時変更: 'COPY' → 'COPIED'
```

### disabled

```tsx
className="opacity-50 cursor-default"
// または
className="opacity-50 cursor-not-allowed"
```

---

## 11. フィードバックルール

### hover

Tailwind の `hover:` ユーティリティを使う（CSS `:hover` 疑似クラスも可）。
複雑な hover 挙動は React state で管理する。

### focus

`outline-none` を input に設定する場合は、必ず `focus:border-cyan-500` 等でフォーカス状態を視認できるようにする。

### 2ステップ確認（破壊操作）

```tsx
const [pendingId, setPendingId] = useState<string | null>(null);
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleRequest = (id: string) => {
  if (pendingId === id) {
    // 実行
    setPendingId(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  } else {
    setPendingId(id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPendingId(null), 3000);
  }
};

// 表示
<button
  type="button"
  className={pendingId === item.id
    ? 'bg-danger-500 text-base-900 ...'
    : 'border-danger-600 text-danger-500 ...'}
  onClick={() => handleRequest(item.id)}
>
  {pendingId === item.id ? 'CONFIRM?' : 'KILL'}
</button>
```

### empty state のメッセージ

- 内容 + 次のアクションをセットで書く: `NO TASKS — PRESS + TASK`
- 単なる `No data` は禁止

### toast / 通知

デスクトップ通知は `tauri-plugin-notification` の `sendNotification()` で行う。
UI 内 toast コンポーネントは現状不使用。コピー完了等はボタンテキストの一時変化で代替。

---

## 12. 禁止事項

### スタイル

| 禁止 | 理由 | 代替 |
|------|------|------|
| `style={{ }}` インラインスタイル | Tailwind v4 に統一 | `className="..."` |
| CSS変数以外のハードコード色 | `#f97316` 等の直書き禁止 | Tailwind CSS変数クラス |
| 存在しない CSS 変数 | `--color-warning-500` 等 | 上記パレット参照 |
| `border-radius` の多用 | ターミナル風シャープデザインと不一致 | ボタン最大 `rounded-[3px]`、プログレスバー `rounded`、ステータスドット/スピナー `rounded-full` のみ許容 |
| セリフ体 / サンセリフ体フォント | モノスペース統一 | `font-[var(--font-mono)]` |
| `text-[8px]` 以下 | 可読性 | 最小 `text-[9px]` |

### UX

| 禁止 | 理由 |
|------|------|
| 確認なしの破壊操作（KILL/DEL） | 誤操作でデータ・プロセスを消す |
| 無音失敗（エラーを飲み込む） | ユーザーが状況を把握できない |
| ロード中に再度操作可能 | 二重実行を防ぐため `disabled` にする |
| スクロール不可のコンテンツ | 画面サイズに依存した UI |
| `window.alert` / `window.confirm` | nexus のデザイン言語と不一致 |

### コード

| 禁止 | 代替 |
|------|------|
| `console.log` 本番コード | `log.info/error` (pino) |
| `any` 型 | 明示的な型定義 |
| マジックナンバー直書き | `UPPER_SNAKE_CASE` 定数 |
| `unwrap()` in Rust 本番コード | `AppError` で適切にハンドリング |
| `System::new_all()` 各コマンドで呼び出し | `PulseState` の System を共有 |
| PowerShell コマンドへのユーザー入力直結 | `infra/powershell.rs` のヘルパー + バリデーション |

---

## 13. バックエンドアーキテクチャ設計

### 4層アーキテクチャ

```
src-tauri/src/
├── commands/    — Tauri コマンドハンドラのみ（薄いレイヤー）
│                  invoke() から呼ばれ、services/ に処理を委譲する
├── services/    — ビジネスロジック（テスト可能な純粋ロジック）
│                  commands/ から呼ばれる。外部 I/O は直接行わず infra/ を通す
├── infra/       — 外部システム接続
│   ├── powershell.rs  — PowerShell 実行ヘルパー（入力サニタイズ済み）
│   ├── registry.rs    — Registry 操作（winreg クレート）
│   └── filesystem.rs  — ファイルシステム操作
└── parsers/     — データパーサー
    ├── vdf.rs         — Steam VDF フォーマット
    └── ipconfig.rs    — ipconfig /all 出力（日本語ロケール対応）
```

**依存方向（逆方向は禁止）:**
```
commands → services → infra / parsers
```

### 各レイヤーの責務

| レイヤー | 責務 | してはいけないこと |
|---------|------|------------------|
| commands | 引数受け取り、services 呼び出し、Result 返却 | ビジネスロジックの実装 |
| services | ビジネスルールの実装、複数 infra の組み合わせ | 外部 I/O の直接実行 |
| infra | 外部システムとの通信 | ビジネスロジックの実装 |
| parsers | テキスト/バイナリデータの変換 | 外部 I/O |

### commands/ の実装パターン

```rust
// commands/netopt.rs — ハンドラのみ（ロジックなし）
#[tauri::command]
pub async fn set_dns(
    interface_name: String,
    dns_server: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), AppError> {
    // バリデーションは services/ で行う
    services::netopt::set_dns(&interface_name, &dns_server, &state).await
}
```

### AppError 設計

```rust
// error.rs
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("PowerShell execution failed: {0}")]
    PowerShell(String),

    #[error("Registry operation failed: {0}")]
    Registry(String),

    #[error("Process operation failed: {0}")]
    Process(String),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}
```

### System インスタンス共有

```rust
// state.rs — PulseState が System を所有
pub struct PulseState {
    pub system: Arc<Mutex<System>>,
    // ...
}

// commands/ops.rs — PulseState から借用
#[tauri::command]
pub async fn get_processes(state: tauri::State<'_, PulseState>) -> Result<Vec<ProcessInfo>, AppError> {
    let mut sys = state.system.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    sys.refresh_processes();
    // ...
}
```

---

## 14. セキュリティ設計

### CSP ポリシー（tauri.conf.json）

```json
{
  "security": {
    "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.perplexity.ai"
  }
}
```

- `'unsafe-eval'` は禁止
- 外部接続は Perplexity API のみ許可

### Tauri v2 capabilities/default.json

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "nexus default capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging",
    "opener:default",
    "notification:default",
    "clipboard-manager:read-text",
    "clipboard-manager:write-text"
  ]
}
```

コマンド別 permission は `src-tauri/capabilities/` に追加ファイルを作成する。

### 入力バリデーション仕様

```typescript
// FE 側バリデーション（Rust 側でも重複チェック）
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const HOSTNAME_REGEX = /^[a-zA-Z0-9.-]{1,253}$/;
const PATH_SAFE_REGEX = /^[a-zA-Z]:\\[\w\s\-\.\\]+$/;

// 各コマンドのバリデーション
// set_dns: IPアドレス形式チェック
// ping_host: ホスト名 or IP 形式チェック
// analyze_disk_usage: Windowsパス形式チェック
```

### PowerShell 安全実行パターン

```rust
// infra/powershell.rs
pub fn run_powershell_safe(args: &[&str]) -> Result<String, AppError> {
    // ① ユーザー入力は引数として渡す（文字列連結禁止）
    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command"])
        .args(args)  // ← ユーザー入力は別引数として渡す
        .output()
        .map_err(|e| AppError::PowerShell(e.to_string()))?;
    // ...
}

// ❌ 禁止パターン
let cmd = format!("Set-DnsClientServerAddress -InterfaceAlias '{}'", user_input);
```

### 保護プロセスリスト（constants.rs）

```rust
// src-tauri/src/constants.rs
pub const PROTECTED_PROCESSES: &[&str] = &[
    "system",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "winlogon.exe",
    "lsass.exe",
    "svchost.exe",
    "services.exe",
    "explorer.exe",
    // nexus 自身
    "nexus.exe",
];
```

---

## 15. イベント駆動アーキテクチャ設計

### ポーリング → Tauri イベントへの移行

| イベント名 | 内容 | Rust 側間隔 |
|------------|------|-------------|
| `pulse:snapshot` | ResourceSnapshot（CPU/MEM/DISK） | 2秒 |
| `ops:processes` | プロセスリスト | 3秒 |
| `hw:info` | HardwareInfo（GPU/CPU詳細） | 5秒 |

### Rust 側実装パターン

```rust
// src-tauri/src/lib.rs — 起動時に emit ループを開始
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    // データ取得
                    let snapshot = collect_snapshot().await;
                    // 差分チェック（変化がない場合は emit しない）
                    if snapshot != last_snapshot {
                        handle.emit("pulse:snapshot", &snapshot).ok();
                        last_snapshot = snapshot;
                    }
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            });
            Ok(())
        })
        // ...
}
```

### FE 側実装パターン

```typescript
// Zustand store
import { listen } from '@tauri-apps/api/event';

// store の setupListeners アクション
setupListeners: () => {
  const unlisten = listen<ResourceSnapshot>('pulse:snapshot', (event) => {
    set({ snapshot: event.payload, lastUpdate: Date.now() });
  });
  return unlisten; // クリーンアップ用
},
```

```tsx
// Wing コンポーネント
useEffect(() => {
  const cleanup = usePulseStore.getState().setupListeners();
  return () => { cleanup.then(fn => fn()); };
}, []);
```

### バックプレッシャー対策

- Rust 側で前回の値と比較し、変化がない場合は `emit()` しない
- FE 側は受け取ったデータをそのまま state に反映（追加フィルタリング不要）

---

## 16. React 19 / Zustand v5 パターン

### use() + Suspense（非同期データ取得）

```tsx
// ✅ React 19 推奨パターン
function GameList() {
  const games = use(fetchGamesPromise);  // Suspense がローディングを処理
  return <ul>{games.map(g => <GameCard key={g.id} game={g} />)}</ul>;
}

// 親コンポーネント
<Suspense fallback={<LoadingState />}>
  <GameList />
</Suspense>
```

### useActionState（フォーム送信）

```tsx
// ✅ React 19 推奨パターン
function DnsForm() {
  const [state, action, isPending] = useActionState(
    async (prevState, formData: FormData) => {
      const dns = formData.get('dns') as string;
      try {
        await invoke('set_dns', { dns });
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: extractErrorMessage(err) };
      }
    },
    { success: false, error: null }
  );

  return (
    <form action={action}>
      <input name="dns" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'APPLYING...' : 'APPLY'}
      </button>
      {state.error && <ErrorBanner message={state.error} />}
    </form>
  );
}
```

### useOptimistic（楽観的更新）

```tsx
// ✅ ゲーム追加の楽観的更新例
function LauncherWing() {
  const { games, addGame } = useLauncherStore(/* ... */);
  const [optimisticGames, addOptimistic] = useOptimistic(
    games,
    (state, newGame: Game) => [...state, { ...newGame, pending: true }]
  );

  const handleAdd = async (game: Game) => {
    addOptimistic(game);
    await addGame(game);
  };
}
```

### useShallow（Zustand v5 セレクタ最適化）

```tsx
// ✅ 正しい（useShallow で過剰再レンダリング防止）
import { useShallow } from 'zustand/react/shallow';

const { games, isLoading, error } = useLauncherStore(
  useShallow((s) => ({ games: s.games, isLoading: s.isLoading, error: s.error }))
);

// ❌ 禁止（ファサードセレクタ）
const vm = useLauncherStore(s => ({ games: s.games, isLoading: s.isLoading }));
// 毎レンダリング新しいオブジェクトが生成され、不要な再描画が発生する
```

---

## 17. 実装時チェックリスト

### 新 Wing を作るとき

- [ ] `src/components/{wing}/{Wing}Wing.tsx` に配置
- [ ] `src/types/index.ts` の `WingId` に追加
- [ ] `src/App.tsx` の `WING_COMPONENTS` に追加
- [ ] `Shell.tsx` の `WING_ZONES` に追加（適切なゾーンに）
- [ ] Rust コマンドは `src-tauri/src/commands/{wing}.rs` に分離
- [ ] `mod.rs` と `lib.rs` の `invoke_handler` に登録

### Wing の header

- [ ] `▶ WING / SECTION` フォーマットでタイトルを付ける
- [ ] loading 中はインラインで `SCANNING...` 等を表示
- [ ] `px-4 py-[10px] border-b border-border-subtle`
- [ ] `flex-shrink-0`

### テーブル

- [ ] `border-collapse` 等価クラス `border-collapse`
- [ ] thead に `sticky top-0 bg-base-800`
- [ ] 行に `border-b border-border-subtle`
- [ ] オルタネート行あり
- [ ] empty state あり（EmptyState コンポーネント使用）

### ボタン

- [ ] `type="button"` 明示
- [ ] 破壊操作は `danger` カラーを使用
- [ ] 確認が必要な操作は2ステップ実装
- [ ] `disabled` 時に `opacity-50 cursor-default`

### 状態

- [ ] loading 状態あり（LoadingState コンポーネント使用）
- [ ] error 状態あり（ErrorBanner コンポーネント使用）
- [ ] empty 状態あり（次のアクション付き）

### スタイリング

- [ ] `className` のみ使用（`style={{ }}` なし）
- [ ] 存在しない CSS 変数を使っていないか確認
- [ ] ハードコード色（`#xxxxxx` や `rgb()`）を直書きしていないか確認
  - 例外: `bg-white/[0.02]`（オルタネート行）/ `bg-black/60`（モーダルオーバーレイ）

### Zustand

- [ ] セレクタは `useShallow` を使用
- [ ] ファサードセレクタを新規作成していない

---

## 18. レビュー時チェックリスト

### 視覚的整合性

- [ ] フォントは全て `font-[var(--font-mono)]` か
- [ ] ボタンテキストは ALL CAPS か
- [ ] サイズが体系（9/10/11/12px）の範囲内か
- [ ] 存在しない CSS 変数を参照していないか
- [ ] インラインスタイル（`style={{ }}`）が使われていないか

### 情報設計

- [ ] ラベル（muted）→ 値（primary）→ アクション（accent）の階層が守られているか
- [ ] empty state は「次のアクション」まで明示しているか
- [ ] loading / error のどちらも対応しているか

### 安全性

- [ ] KILL / DEL に確認ステップがあるか
- [ ] `disabled` 中に操作できないか
- [ ] エラーが握りつぶされていないか
- [ ] ユーザー入力に対してバリデーションがあるか

### パフォーマンス

- [ ] Wing はアンマウントされても状態が保持されるか
- [ ] ポーリング系は Wing がアンマウントされたときに cleanup しているか
- [ ] 重いリストに `useMemo` でソート・フィルタリングをキャッシュしているか
- [ ] Zustand セレクタに `useShallow` を使っているか

### アクセシビリティ

- [ ] `<button>` に `type="button"` があるか
- [ ] `<input type="checkbox">` に `aria-label` があるか
- [ ] テーブルの `<th>` に適切なテキストがあるか

---

## 19. GPU 監視

- GPU データは ResourceSnapshot（pulse.rs）ではなく HardwareInfo（hardware.rs）に配置する
- 理由: pulse.rs は sysinfo による高頻度ポーリング専用。PowerShell プロセスを毎ポーリング起動するとオーバーヘッドが大きい
- 取得手段: PowerShell `Get-CimInstance Win32_VideoController`（AMD 含む全環境対応）
- nvml-wrapper は本プロジェクトでは使用しない（NVIDIA 専用のため）
- GPU フィールドはすべて `Option<T>`。取得不可はエラーにしない
- フロントエンドは `null` の場合 `N/A` を `text-text-muted` で表示する

---

## 20. プロセス保護

- `PROTECTED_PROCESSES` 定数は `src-tauri/src/constants.rs` で一元管理する
- boost.rs / ops.rs 両方からこの定数を参照する
- KILL 前に名前チェックを行い、リスト内のプロセスはスキップする
- 結果は `action: "skipped_protected"` + `is_protected: true` で返す（エラーにしない）
- UI には `[PROT]` バッジ（`text-[9px] border border-text-muted text-text-muted`）で表示する

---

*このドキュメントは実装・レビューの都度更新すること。新しいパターンが定着したら追記する。*
