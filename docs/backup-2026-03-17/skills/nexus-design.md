# nexus UI 実装規約

新規 Wing 作成・既存 Wing 編集時に必ずこの規約に従うこと。

## 絶対ルール
- スタイルは `style={{ }}` インラインスタイル + CSS変数のみ。Tailwind / className 禁止
- フォントは `fontFamily: 'var(--font-mono)'` を全テキストに適用（例外なし）
- CSS `:hover` 禁止 → `useState` で isHovered を管理
- ハードコードカラー禁止 → 必ず CSS 変数を使う

## 存在する CSS 変数のみ使う

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

❌ 存在しない: `--color-background` `--color-primary-*` `--color-surface` `--color-border`（末尾なし）

## 色の意味（厳守）

| 用途 | 色 |
|------|----|
| 管理・操作系ヘッダー | `--color-accent-500` |
| 監視・情報系ヘッダー | `--color-cyan-500` |
| CPU < 20% | `--color-cyan-500` |
| CPU 20–50% | `--color-accent-500` |
| CPU ≥ 50% | `--color-danger-500` |
| エラーバナー背景 | `rgba(239,68,68,0.1)` |

## Wing 標準構造

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

## ボタンスタイル

```tsx
// 標準
{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 10px',
  background: 'transparent', border: '1px solid var(--color-border-subtle)',
  color: 'var(--color-text-secondary)', cursor: 'pointer', letterSpacing: '0.1em',
  transition: 'all 0.1s ease' }
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
// empty
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '120px', fontFamily: 'var(--font-mono)', fontSize: '11px',
  color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
  NO ENTRIES — PRESS + ADD
</div>
```
