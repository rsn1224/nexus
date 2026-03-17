---
name: nexus-design
description: nexus の UI 実装規約。新規 Wing 作成・既存 Wing 編集時に参照する。
---

# nexus UI 実装規約

## 絶対ルール

- スタイルは `style={{ }}` インラインスタイル + CSS変数のみ。Tailwind / className 禁止
- フォントは `fontFamily: 'var(--font-mono)'` を全テキストに適用（例外なし）
- CSS `:hover` 禁止 → `useState` で isHovered を管理してスタイルを切り替える
- ハードコードカラー禁止 → 必ず CSS 変数を使う

## CSS 変数パレット（存在する変数のみ使う）

```
背景: --color-base-900 / -800 / -700 / -600 / -500
アクセント(orange): --color-accent-500 / -400
シアン: --color-cyan-500 / -700
危険: --color-danger-500 / -600
成功: --color-success-500
テキスト: --color-text-primary / -secondary / -muted
ボーダー: --color-border-subtle / -active
フォント: --font-mono
```

❌ 存在しない変数: `--color-background` `--color-primary-*` `--color-surface` `--color-border`（末尾なし）

## 色の意味（厳守）

| 用途 | 色 |
|------|----|
| 管理・操作系ヘッダー | `--color-accent-500` |
| 監視・情報系ヘッダー | `--color-cyan-500` |
| CPU < 20% | `--color-cyan-500` |
| CPU 20–50% | `--color-accent-500` |
| CPU ≥ 50% | `--color-danger-500` |
| エラーバナー背景 | `rgba(239,68,68,0.1)` |

## フォントサイズ体系

| 用途 | サイズ |
|------|--------|
| Wing 見出し | 11–14px |
| 主要コンテンツ | 12px |
| ラベル・ヘッダー | 10–11px |
| ボタンテキスト | 9–11px |
| マイクロバッジ | 9px（最小値）|

## Wing の標準構造

```tsx
// 1. Wing header（固定）
<div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
    color: 'var(--color-accent-500)', letterSpacing: '0.15em' }}>
    ▶ WING / SECTION
  </span>
</div>

// 2. エラーバナー（条件付き）
{error && (
  <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)',
    borderBottom: '1px solid var(--color-danger-600)',
    fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-danger-500)' }}>
    ERROR: {error}
  </div>
)}

// 3. スクロール可能コンテンツ
<div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
  ...
</div>
```

## ボタンスタイルパターン

```tsx
// 標準
{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 10px',
  background: 'transparent', border: '1px solid var(--color-border-subtle)',
  color: 'var(--color-text-secondary)', cursor: 'pointer', letterSpacing: '0.1em',
  transition: 'all 0.1s ease', type: 'button' }

// プライマリ
{ border: '1px solid var(--color-accent-500)', color: 'var(--color-accent-500)' }

// 危険
{ border: '1px solid var(--color-danger-600)', color: 'var(--color-danger-500)' }

// 確認中（2ステップ目）
{ background: 'var(--color-danger-500)', color: '#000' }
```

## 状態表示テンプレート

```tsx
// loading
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '120px', fontFamily: 'var(--font-mono)', fontSize: '11px',
  color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
  LOADING...
</div>

// empty（次のアクションを添える）
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '120px', fontFamily: 'var(--font-mono)', fontSize: '11px',
  color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
  NO ENTRIES — PRESS + ADD
</div>
```

## 新規 Wing 追加手順

1. `src/components/{wing}/{Wing}Wing.tsx` を作成
2. `src/types/index.ts` の `WingId` に追加
3. `src/App.tsx` の `WING_COMPONENTS` に追加
4. `Shell.tsx` の `WING_ZONES` に追加（適切なゾーンに）
5. Rust: `src-tauri/src/commands/{wing}.rs` → `mod.rs` → `lib.rs` invoke_handler
