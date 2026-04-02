修正対象: $ARGUMENTS

## Phase 1: 調査（コード変更禁止）

対象ファイルを読んで以下を報告すること:
- 根本原因の特定（ファイル:行番号を明示）
- 修正が必要なファイルの一覧と変更行数の見積もり
- 修正方針（なぜその修正で問題が解消されるか）

<constraints>
- src/index.css の CSS 変数は変更しない
- 既存のインターフェース（型・関数シグネチャ・Tauri コマンド名）を壊さない
- TypeScript の型エラーをゼロにすること
- Rust の unwrap() を追加しない（expect("理由") または AppError を使う）
- 修正範囲を最小限に保つ（無関係なリファクタを混入させない）
</constraints>

調査完了後、「根本原因: ○○（ファイル:行）。この方針で修正してよいですか？」と確認を求めること。

## Phase 2: 修正（承認後のみ）

<tasks>
1. 根本原因を修正
2. 関連テストを追加または更新
3. /check を実行して全 PASS を確認
</tasks>

## 完了条件

- `npm run check` / `npm run typecheck` — エラー 0
- `cargo clippy -- -D warnings` — warning 0
- 対象バグが再現しないことを確認
