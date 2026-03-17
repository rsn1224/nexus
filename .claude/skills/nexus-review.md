# nexus レビューチェックリスト

Cascade が実装した Wing ・コンポーネントをレビューする際に、以下の全項目を確認すること。
問題があれば `REQUIRES_CHANGES`、なければ `APPROVED` と出力する。

## スタイル
- `fontFamily: 'var(--font-mono)'` が全テキストに適用されている
- ボタン・見出し・ラベルが ALL CAPS
- フォントサイズが規定スケール内（9 / 10 / 11 / 12px）
- ハードコードカラー（`#xxx` / `rgb()`）を使っていない → `var(--color-*)` のみ
- 存在しない CSS 変数を参照していない（`--color-background` 等は存在しない）
- `border-radius` は最大 `3px`（プログレスバーは `4px`）
- Tailwind クラスを使っていない → `style={{ }}` インラインスタイルのみ

## 状態表示
- loading 状態がある（`LOADING...` / `SCANNING...`）
- error 状態がある（バナー: `rgba(239,68,68,0.1)` 背景 + `--color-danger-600` ボーダー）
- empty 状態がある（次のアクションを添える）

## ボタン
- 全ボタンに `type="button"` がある
- 破壊操作（KILL / DEL / CLEAR）に 2ステップ確認（3秒タイムアウト）
- `disabled` 時に `opacity: 0.5` または `cursor: 'default'`
- ローディング中はボタンが `disabled`
- CSS `:hover` 不使用 → `useState` で hover 状態管理

## テーブル
- `borderCollapse: 'collapse'`
- `<thead>` に `position: sticky; top: 0; background: var(--color-base-800)`
- 行に `borderBottom: 1px solid var(--color-border-subtle)`
- オルタネート行: `rgba(255,255,255,0.02)`
- `key={index}` 不使用 → ユニーク ID を使う

## UX
- `window.alert` / `window.confirm` 不使用
- catch で何もしない禁止（エラーを必ず表示）
- ポーリング系は unmount 時に `clearInterval`
- 重いソート・フィルタリングに `useMemo`

## コード品質
- `console.log` なし → `log.info/error` (pino)
- `any` 型なし
- モック `invoke` なし → `import { invoke } from '@tauri-apps/api/core'`
- `npm run typecheck` PASS
- `npm run check` PASS
- `npm run test` PASS
