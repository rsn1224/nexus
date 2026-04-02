---
name: nexus-review
description: >
  nexus プロジェクトのコードレビューチェックリスト（v4）。
  コンポーネント・Zustand ストア・Rust コマンドのスタイル・状態管理・アーキテクチャを検証する。
  Use when user says "レビューして", "review", "REQUIRES_CHANGES or APPROVED",
  "コードを確認して", or runs /review.
  Do NOT use for Rust-only changes (use nexus-rust-rules instead).
---

# nexus レビューチェックリスト（v4）

コンポーネント・ストアの実装をレビューする際に、以下の全項目を確認すること。
問題があれば `REQUIRES_CHANGES`、なければ `APPROVED` と出力する。

## スタイル

- インラインスタイル禁止（`style={{ }}` は不可、Tailwind className を使う）
- ハードコードカラー禁止（`#xxx` / `rgb()` 不可 → CSS 変数経由のクラスを使う）
- `nx-*` クラス禁止（廃止済み）
- `border-radius` は `rounded`（4px）統一
- `animate-spin` は border spinner パターンのみ使用可（他のアニメーション禁止）
- 存在しない CSS 変数を参照していない → references/style-rules.md

## タイポグラフィ

- KPI 数字: `text-[24px] font-bold`
- セクション見出し: `text-[11px] tracking-[0.15em] uppercase font-bold`
- 本文: `text-[12px] font-normal`
- ラベル: `text-[10px] tracking-[0.12em] font-semibold`
- ボタン文字: `text-[11px] tracking-[0.1em] uppercase font-semibold`

## 状態管理

- Zustand ストアに `useShallow` セレクターを使っているか
- `useStore(s => s)` などオブジェクト全体サブスクライブがないか
- ポーリング系は unmount 時に `clearInterval` / cleanup 実施済みか

## ボタン・UX

- 全ボタンに `type="button"` があるか
- `window.alert` / `window.confirm` 不使用
- catch で何もしない禁止（エラーを必ず表示）

## コード品質

- → 詳細・Good/Bad 例: references/examples.md
