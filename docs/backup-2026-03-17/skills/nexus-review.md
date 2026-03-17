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
- `style={{ }}` インラインスタイルを使っていない → Tailwind CSS 変数クラス（`text-[var(--color-*)]` 等）を使う

## 状態表示
- loading 状態がある（`LOADING...` / `SCANNING...`）
- error 状態がある（バナー: `bg-[var(--color-base-800)] border-[var(--color-danger-600)] text-[var(--color-danger-500)]`）
- empty 状態がある（次のアクションを添える）

## ボタン
- 全ボタンに `type="button"` がある
- 破壊操作（KILL / DEL / CLEAR）に 2ステップ確認（3秒タイムアウト）
- `disabled` 時に `opacity: 0.5` または `cursor: 'default'`
- ローディング中はボタンが `disabled`
- CSS `:hover` 不使用 → `useState` で hover 状態管理

## テーブル

- `border-collapse` は `className="border-collapse"` で指定
- `<thead>` に `sticky top-0 bg-[var(--color-base-800)]`
- 行に `border-b border-[var(--color-border-subtle)]`
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
