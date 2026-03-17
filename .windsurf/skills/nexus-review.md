---
name: nexus-review
description: nexus Wing 実装後のレビューチェックリスト。実装完了報告時・レビュー依頼時に自動適用する。
---

# nexus レビューチェックリスト

## スタイル
- [ ] `fontFamily: 'var(--font-mono)'` が全テキストに適用されている
- [ ] ボタン・見出し・ラベルが ALL CAPS になっている
- [ ] フォントサイズが規定スケール内（9 / 10 / 11 / 12px）
- [ ] ハードコードカラー（`#xxx` / `rgb()`）を使っていない → `var(--color-*)` のみ
- [ ] 存在しない CSS 変数を参照していない（`--color-background` 等は nexus に存在しない）
- [ ] `border-radius` は最大 `3px`（プログレスバーは `4px`）
- [ ] Tailwind クラスを使っていない → インラインスタイルのみ
- [ ] `style={{ }}` インラインスタイルのみ使用（className 禁止）

## 状態表示
- [ ] loading 状態がある（`LOADING...` / `SCANNING...`）
- [ ] error 状態がある（エラーバナー: `rgba(239,68,68,0.1)` 背景 + `--color-danger-600` ボーダー）
- [ ] empty 状態がある（次のアクションを添える: `NO ENTRIES — PRESS + ADD`）

## ボタン
- [ ] 全ボタンに `type="button"` がある
- [ ] 破壊操作（KILL / DEL / CLEAR）に2ステップ確認（3秒タイムアウト）がある
- [ ] `disabled` 時に `opacity: 0.5` または `cursor: 'default'`
- [ ] ローディング中はボタンが `disabled` になっている
- [ ] CSS `:hover` を使っていない → `useState` で hover スタイルを管理

## テーブル
- [ ] `borderCollapse: 'collapse'`
- [ ] `<thead>` に `position: sticky; top: 0; background: var(--color-base-800)`
- [ ] 行に `borderBottom: 1px solid var(--color-border-subtle)`
- [ ] オルタネート行: `rgba(255,255,255,0.02)`
- [ ] `key={index}` を使っていない → ユニークな ID / 複合キーを使う

## UX
- [ ] `window.alert` / `window.confirm` を使っていない
- [ ] エラーを握りつぶしていない（catch で何もしない禁止）
- [ ] ポーリング系は unmount 時に `clearInterval` している
- [ ] 重いソート・フィルタリングに `useMemo` を使っている

## コード品質
- [ ] `console.log` がない → `log.info/error` (pino) を使う
- [ ] `any` 型がない
- [ ] モック `invoke` が残っていない → `import { invoke } from '@tauri-apps/api/core'`
- [ ] `npm run typecheck` PASS
- [ ] `npm run check` PASS
- [ ] `npm run test` PASS
