# DESIGN.md — nexus UI 設計ルール

> **目的:** Claude Code / Cascade が参照することで、UIの実装・レビュー時のブレをゼロにする。
> 「どう見えるか」ではなく「どう実装するか」の粒度で書く。
>
> **最終更新:** 2026-03-16

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
┌─────────────────────────────────────── 40px ──┐
│ NEXUS   [RCN][PLS][BCN] | [OPS][SEC] | [VLT]…  DATE TIME │  ← header
├───────────────────────────────────────────────┤
│                                               │
│               Wing コンテンツ                  │  ← main (flex:1)
│                                               │
├─────────────────────────────────────── 24px ──┤
│ CPU 23%   TASKS 3   SIGNALS 2   ● RECON   STATUS: ONLINE │  ← footer
└───────────────────────────────────────────────┘
```

- `height: 100vh`, `overflow: hidden` — スクロールバーは各 Wing 内部のみ
- header / footer は `flexShrink: 0` で固定
- main は `flex: 1; overflow: hidden`

### Wing 内部の標準構造

```
┌── Wing header (padding: 10px 16px, borderBottom) ──────────┐
│  ▶ WING / SECTION   [tab][tab]   [contextual buttons]       │
├── Error banner (条件付き) ──────────────────────────────────┤
│  ERROR: ...                                                  │
├── スクロール可能コンテンツ (flex:1, overflowY: auto) ─────────┤
│  table / list / form                                         │
└────────────────────────────────────────────────────────────┘
```

- Wing header は `flexShrink: 0`
- スクロール領域は必ず `flex: 1; overflow-y: auto`
- padding は `16px` を標準とする（header は `10px 16px`）

### ナビゲーションのゾーン分け

ナビボタンは3ゾーンに分け、ゾーン間に `1px` のセパレーターを入れる。

| ゾーン | Wings | 意味 |
|--------|-------|------|
| MONITOR | RCN / PLS / BCN | 「今何が起きているか」を見る |
| CONTROL | OPS / SEC | 「システムを操作する」 |
| WORK | VLT / ARC / CHR / LNK / SIG | 「情報を管理する」 |

---

## 3. 情報階層ルール

1. **セクションタイトル** — `▶ WING / SECTION`、`fontSize: 11px`, `fontWeight: 700`, ゾーン色
2. **ラベル（列見出し・フィールド名）** — `fontSize: 10px`, `color: var(--color-text-muted)`, `letterSpacing: 0.12em`
3. **主要データ値** — `fontSize: 12px`, `color: var(--color-text-primary)`
4. **補助データ** — `fontSize: 11px`, `color: var(--color-text-secondary)`
5. **マイクロラベル（バッジ・タグ）** — `fontSize: 9px`, `padding: 1px 5px`, ボーダーのみスタイル

**視線誘導の原則:** 左上→右下。最重要情報を左に、操作ボタンを右端に配置する。

---

## 4. 配色ルール

### パレット（CSS変数）

```css
/* ベース — 背景・サーフェス */
--color-base-900: #0a0a0f   /* メイン背景 */
--color-base-800: #12121a   /* header/footer/panel 背景 */
--color-base-700: #1a1a2e   /* input 背景、セカンダリ面 */
--color-base-600: #1e2040   /* hover 背景 */
--color-base-500: #2a2d4a   /* 選択状態背景 */

/* アクセント — 管理・操作系 (orange) */
--color-accent-500: #f97316  /* 主要ボタン、アクティブタブ、OPS系ヘッダー */
--color-accent-400: #fb923c  /* 高負荷警告テキスト (CPU 20-50%) */

/* シアン — 監視・情報系 */
--color-cyan-500: #06b6d4   /* PULSE/RECON/BEACON 系ヘッダー、監視中インジケーター */
--color-cyan-700: #0e7490   /* シアン系ボーダー */

/* 危険 — 警告・破壊操作 */
--color-danger-500: #ef4444  /* エラーテキスト、KILL/DEL ボタン、CPU ≥50% */
--color-danger-600: #b91c1c  /* 危険ボーダー */

/* 成功 — 正常・完了 */
--color-success-500: #22c55e /* オンラインインジケーター、TOTP プログレス */

/* テキスト */
--color-text-primary:   #e2e8f0  /* 主要コンテンツ */
--color-text-secondary: #94a3b8  /* 補助テキスト */
--color-text-muted:     #475569  /* ラベル、無効化テキスト */

/* ボーダー */
--color-border-subtle: #1e293b   /* 標準区切り線 */
--color-border-active: #f97316   /* アクティブ状態のボーダー */
```

### 色の意味マッピング（厳守）

| 状況 | 使う色 |
|------|-------|
| 監視・情報系 Wing ヘッダー | `--color-cyan-500` |
| 管理・操作系 Wing ヘッダー | `--color-accent-500` |
| CPU < 20% | `--color-cyan-500` |
| CPU 20–50% | `--color-accent-500` |
| CPU ≥ 50% | `--color-danger-500` |
| エラーバナー背景 | `rgba(239,68,68,0.1)` + `borderBottom: --color-danger-600` |
| アクティブなタブ/ボタン | 背景: アクセント色、テキスト: `#000` |
| 非アクティブタブ | 背景: transparent、テキスト: `--color-text-secondary` |
| オルタネート行 | `rgba(255,255,255,0.02)` |

---

## 5. 余白と密度ルール

### 基本スペーシングスケール

| 用途 | 値 |
|------|----|
| テーブルセル padding | `5px 12px` |
| セクション padding | `10px 16px` |
| コンテンツ padding | `16px` |
| ボタン padding (小) | `1px 5px` |
| ボタン padding (標準) | `2px 10px` |
| ボタン padding (大) | `5px 12px` |
| 要素間 gap (密) | `4px` |
| 要素間 gap (標準) | `8px` |
| 要素間 gap (疎) | `12–16px` |
| モーダル padding | `20px` |

### 密度の指針

- テーブル行の高さは明示しない（padding で自然に決まる）
- セクション間の区切りは `borderBottom: 1px solid var(--color-border-subtle)` のみ
- 空白行・空白ブロックを追加しない（視覚的区切りはボーダーで行う）
- モーダルは `width: 400px; maxWidth: 90%` を標準とする

---

## 6. タイポグラフィルール

### フォント

```
fontFamily: 'var(--font-mono)'  ← UIの全テキストに適用（例外なし）
```

### サイズ体系

| 用途 | size | letterSpacing | fontWeight |
|------|------|---------------|------------|
| ロゴ | 16px | 0.2em | 700 |
| モーダルタイトル / Wing 見出し | 11–14px | 0.1–0.15em | 700 |
| 主要コンテンツ | 12px | normal | 400 |
| ラベル・ヘッダー | 10–11px | 0.1–0.15em | 600 |
| ボタンテキスト | 9–11px | 0.05–0.12em | 600 |
| マイクロバッジ | 9px | 0.05–0.08em | 700 |
| ステータスバー | 10px | 0.08em | 400 |

### テキストの大文字化

- **必ず ALL CAPS:** Wing ラベル、セクション見出し、ボタンテキスト、ステータステキスト、列ヘッダー
- **そのまま:** ユーザー入力値、ゲーム名、プロセス名、パス、URL
- **混在NG:** 同一 UI 要素内でケースを混ぜない

---

## 7. コンポーネントルール

### ボタン

```tsx
// 標準（非破壊）
{
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  padding: '2px 10px',
  background: 'transparent',
  border: '1px solid var(--color-border-subtle)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  letterSpacing: '0.1em',
}

// プライマリ（推奨アクション）— アクセント色
border: '1px solid var(--color-accent-500)'
color: 'var(--color-accent-500)'

// 情報系アクション — シアン
border: '1px solid var(--color-cyan-500)'
color: 'var(--color-cyan-500)'

// 危険（KILL/DEL）
border: '1px solid var(--color-danger-600)'
color: 'var(--color-danger-500)'

// アクティブ状態（タブ等）
background: 'var(--color-accent-500)'
color: '#000'

// 危険確認中（2ステップ目）
background: 'var(--color-danger-500)'
color: '#000'
```

**ボタンルール:**
- 必ず `type="button"` を明示（フォーム内は `type="submit"`）
- `disabled` 時は `opacity: 0.5` または `cursor: default`
- 状態変化には `transition: all 0.1s ease`

### テーブル

```tsx
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr style={{ position: 'sticky', top: 0, background: 'var(--color-base-800)', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <th style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}>
        COLUMN
      </th>
    </tr>
  </thead>
  <tbody>
    <tr style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <td style={{ padding: '5px 12px' }}>...</td>
    </tr>
  </tbody>
</table>
```

- thead は必ず `position: sticky; top: 0` で固定
- オルタネート行は `rgba(255,255,255,0.02)`
- ソート可能列はヘッダーに `cursor: pointer; userSelect: none` + `▼/▲` インジケーター

### 入力フィールド

```tsx
{
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  padding: '5px 8px',
  background: 'var(--color-base-700)',
  border: '1px solid var(--color-border-subtle)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
```

### バッジ / カテゴリタグ

```tsx
{
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  padding: '1px 5px',
  border: `1px solid ${categoryColor}`,
  color: categoryColor,
  letterSpacing: '0.08em',
}
// 背景は透明のみ。solid 塗りつぶしは使わない（マイクロ優先度ラベルは例外）
```

### エラーバナー

```tsx
<div style={{
  padding: '8px 16px',
  background: 'rgba(239,68,68,0.1)',
  borderBottom: '1px solid var(--color-danger-600)',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: 'var(--color-danger-500)',
}}>
  ERROR: {message}
</div>
```

### モーダルオーバーレイ

```tsx
// オーバーレイ
{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000 }

// コンテンツボックス
{ backgroundColor: 'var(--color-base-900)',
  border: '1px solid var(--color-border-subtle)',
  padding: '20px', width: '400px', maxWidth: '90%' }
```

### プログレスバー

```tsx
// トラック
{ width: '100%', height: '8px', backgroundColor: 'var(--color-base-800)',
  borderRadius: '4px', overflow: 'hidden' }

// フィル（CPU用は 4px 高）
{ width: `${percent}%`, height: '100%', backgroundColor: color,
  transition: 'width 0.3s ease' }
```

---

## 8. 状態表示ルール

### loading

```tsx
// インラインテキスト（ヘッダー内）
<span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-cyan-500)' }}>
  SCANNING...  // or LOADING... / ANALYZING...
</span>

// 中央配置（コンテンツエリア内）
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '120px', fontFamily: 'var(--font-mono)', fontSize: '11px',
  color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
  LOADING...
</div>
```

### error

```tsx
// エラーバナー（Wing header 直下、borderBottom あり）
<div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)',
  borderBottom: '1px solid var(--color-danger-600)',
  fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-danger-500)' }}>
  ERROR: {message}
</div>
```

### empty state

```tsx
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '120px', fontFamily: 'var(--font-mono)', fontSize: '11px',
  color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
  NO ENTRIES — PRESS + ADD  // 具体的な次のアクションを添える
</div>
```

### success / 完了フィードバック

```tsx
// コピー完了等の一時的フィードバック
background: 'var(--color-success-600)'
color: 'var(--color-text-primary)'
// 2秒後に元のスタイルに戻す（setTimeout）
```

### disabled

```tsx
opacity: 0.5
cursor: 'default'
// または cursor: 'not-allowed'（ユーザーが操作しようとした場合に意味が伝わる文脈）
```

### active/監視中

```tsx
// ヘッダー内のインジケーター
<span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px',
  color: 'var(--color-cyan-500)' }}>
  MONITORING
</span>
```

---

## 9. フィードバックルール

### hover

ボタン・インタラクティブ要素は CSS `:hover` を使わず、スタイルの切り替えは React state で行う。
ただし `transition: 'all 0.1s ease'` は全ボタンに付与する。

### focus

`outline: none` を input に設定する場合は、必ず `border` か `box-shadow` でフォーカス状態が視認できるようにする。

### 2ステップ確認（破壊操作）

```
状態1（通常）:  KILL  — background: transparent, border: danger-600, color: danger-500
状態2（確認中）: CONFIRM? — background: danger-500, color: #000
タイムアウト: 3000ms で状態1に自動リセット
```

実装:
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
```

### empty state のメッセージ

- 内容 + 次のアクションをセットで書く: `NO TASKS — PRESS + TASK`
- 単なる `No data` は禁止

### toast / 通知

デスクトップ通知は `tauri-plugin-notification` の `sendNotification()` で行う。
UI 内 toast コンポーネントは現状不使用。コピー完了等はボタンテキストの一時変化で代替。

---

## 10. 禁止事項

### スタイル

| 禁止 | 理由 | 代替 |
|------|------|------|
| Tailwind / 外部 CSS クラス | プロジェクトはインラインスタイル + CSS変数統一 | `style={{ ... }}` |
| CSS変数以外のハードコード色 | `#f97316` 等を直書き禁止 | `var(--color-accent-500)` |
| `--color-background` / `--color-primary-*` / `--color-surface` / `--color-border`（末尾なし） | nexus に存在しない変数 | 上記パレット参照 |
| `border-radius` を多用 | ターミナル風のシャープなデザインと不一致 | ボタン最大 `3px`、プログレスバーのみ `4px` |
| セリフ体 / サンセリフ体フォント | モノスペース統一 | `var(--font-mono)` |
| `font-size: 8px` 以下 | 可読性 | 最小 `9px` |

### UX

| 禁止 | 理由 |
|------|------|
| 確認なしの破壊操作（KILL/DEL） | 誤操作でデータ・プロセスを消す |
| 無音失敗（エラーを飲み込む） | ユーザーが状況を把握できない |
| ロード中に再度操作可能 | 二重実行を防ぐため `disabled` にする |
| スクロール不可のコンテンツ | 画面サイズに依存した UI |
| `window.alert` / `window.confirm` | nexusのデザイン言語と不一致。インライン確認で代替 |

### コード

| 禁止 | 理由 |
|------|------|
| `console.log` 本番コード | `log.info/error` (pino) を使う |
| `any` 型 | strict モード必須 |
| マジックナンバー直書き | 定数（`UPPER_SNAKE_CASE`）で定義する |
| `unwrap()` in Rust 本番コード | `AppError` で適切にハンドリング |

---

## 11. 実装時チェックリスト

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
- [ ] `padding: 10px 16px; borderBottom: 1px solid var(--color-border-subtle)`
- [ ] `flexShrink: 0`

### テーブル

- [ ] `borderCollapse: 'collapse'`
- [ ] thead に `position: sticky; top: 0; background: var(--color-base-800)`
- [ ] 行に `borderBottom: 1px solid var(--color-border-subtle)`
- [ ] オルタネート行あり
- [ ] empty state あり

### ボタン

- [ ] `type="button"` 明示
- [ ] 破壊操作は `danger` カラーを使用
- [ ] 確認が必要な操作は2ステップ実装
- [ ] `disabled` 時に `opacity: 0.5` または `cursor: default`

### 状態

- [ ] loading 状態あり
- [ ] error 状態あり（エラーバナー）
- [ ] empty 状態あり（次のアクション付き）

### CSS変数

- [ ] 存在しない変数を使っていないか確認（パレットセクション参照）
- [ ] ハードコード色（`#xxxxxx` や `rgb()`）を直書きしていないか確認
  - 例外: 半透明オーバーレイ `rgba(0,0,0,0.6)` / `rgba(255,255,255,0.02)` 等

---

## 12. レビュー時チェックリスト

### 視覚的整合性

- [ ] フォントは全て `var(--font-mono)` か
- [ ] ボタンテキストは ALL CAPS か
- [ ] サイズが体系（9/10/11/12px）の範囲内か
- [ ] 存在しない CSS 変数を参照していないか

### 情報設計

- [ ] ラベル（muted）→ 値（primary）→ アクション（accent）の階層が守られているか
- [ ] empty state は「次のアクション」まで明示しているか
- [ ] loading / error のどちらも対応しているか

### 安全性

- [ ] KILL / DEL に確認ステップがあるか
- [ ] `disabled` 中に操作できないか
- [ ] エラーが握りつぶされていないか

### パフォーマンス

- [ ] Wing はアンマウントされても状態が保持されるか（`display:none` keep-alive）
- [ ] ポーリング系は Wing がアンマウントされたときに `clearInterval` しているか
- [ ] 重いリストに `useMemo` でソート・フィルタリングをキャッシュしているか

### アクセシビリティ

- [ ] `<button>` に `type="button"` があるか
- [ ] `<input type="checkbox">` に `aria-label` があるか
- [ ] テーブルの `<th>` に適切なテキストがあるか

---

*このドキュメントは実装・レビューの都度更新すること。新しいパターンが定着したら追記する。*
