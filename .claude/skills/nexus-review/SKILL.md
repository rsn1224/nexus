---
name: nexus-review
description: >
  nexus プロジェクトのコードレビューチェックリスト。Cascade が実装した
  Wing・コンポーネントのスタイル・状態表示・ボタン・アーキテクチャを検証する。
  Use when user says "レビューして", "review", "REQUIRES_CHANGES or APPROVED",
  "Cascade の実装を確認", or runs ./scripts/review.sh.
  Do NOT use for Rust-only changes (use nexus-rust-rules instead).
---

# nexus レビューチェックリスト

Cascade が実装した Wing・コンポーネントをレビューする際に、以下の全項目を確認すること。
問題があれば `REQUIRES_CHANGES`、なければ `APPROVED` と出力する。

## スタイル
- `fontFamily: 'var(--font-mono)'` が全テキストに適用されている
- ボタン・見出し・ラベルが ALL CAPS
- フォントサイズが規定スケール内（9 / 10 / 11 / 12px）
- ハードコードカラー（`#xxx` / `rgb()`）を使っていない → `var(--color-*)` のみ
- 存在しない CSS 変数を参照していない（`--color-background` 等は存在しない）
- `border-radius` は最大 `3px`（プログレスバーは `4px`）
- `style={{ }}` インラインスタイル不使用 → Tailwind CSS 変数クラスを使う

## 状態表示
- loading 状態がある（`LOADING...` / `SCANNING...`）
- error 状態がある → 詳細: references/style-rules.md
- empty 状態がある（次のアクションを添える）

## ボタン
- 全ボタンに `type="button"` がある
- 破壊操作（KILL / DEL / CLEAR）に 2ステップ確認（3秒タイムアウト）
- `disabled` 時に `opacity: 0.5` または `cursor: 'default'`
- ローディング中はボタンが `disabled`
- CSS `:hover` 不使用 → `useState` で hover 状態管理

## テーブル・UX・コード品質
- → 詳細: references/examples.md
