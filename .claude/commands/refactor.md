対象: $ARGUMENTS

## Phase 1: 調査（コード変更禁止）

対象ファイルを読んで以下を報告すること:
- 現在の構造と問題点（ファイル:行番号を明示）
- リファクタ後の構造（変更ファイル一覧・インターフェース変更点）
- リグレッションリスクの評価（影響を受けるコンポーネント・ストア）

<constraints>
- 外部インターフェースを変えない（Tauri コマンド名・Store API・コンポーネント Props）
- 行数制限を守る（TS/TSX: 200行、Rust: 300行）
- デザイントークンは src/index.css の CSS 変数のみ使用
- `any` 型 / インラインスタイル / console.log の追加禁止
- ファイル移動は `git mv` を使う（履歴を保持するため）
</constraints>

調査完了後、「以下のリファクタ計画を実行します:（変更内容一覧）。よいですか？」と確認を求めること。

## Phase 2: リファクタ（承認後のみ）

<tasks>
1. ファイル分割・移動（git mv を使う）
2. ロジック移行
3. インポートパスを更新
4. /check を実行して全 PASS を確認
</tasks>

## 完了条件

- `npm run check` / `npm run typecheck` — エラー 0
- `cargo clippy -- -D warnings` — warning 0
- `npm run test` — 全テストグリーン（リグレッションなし）
