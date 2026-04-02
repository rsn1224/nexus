# リファクタリング

対象: $ARGUMENTS

$ARGUMENTS が空の場合は「使用例: /refactor src/stores/useSystemStore.ts または /refactor game-wing」と伝えて停止すること。
対象は「ファイルパス」または「機能名（例: game-wing）」で指定する。

## Phase 1: 調査（コード変更禁止）

対象ファイルを読んで以下を報告すること:

- 現在の構造と問題点（ファイル:行番号を明示）
- リファクタ後の構造（変更ファイル一覧・インターフェース変更点）
- リグレッションリスクの評価（影響を受けるコンポーネント・ストア）

### 制約

- 外部インターフェースを変えない（Tauri コマンド名・Store API・コンポーネント Props）
- 行数制限を守る（TS/TSX: 200行、Rust: 300行）
- デザイントークンは src/index.css の CSS 変数のみ使用
- any 型・インラインスタイル・console.log の追加禁止
- ファイル移動は `git mv` を使う（履歴を保持するため）

調査完了後、「以下のリファクタ計画を実行します:（変更内容一覧）。よいですか？ 」と確認を求めること。

## Phase 2: リファクタ（承認後のみ）

### タスク

1. ファイル分割・移動（git mv を使う）
2. `npm run test` でリグレッションなし確認
3. ロジック移行
4. `npm run test` で再確認
5. インポートパスを更新
6. /check を実行して全 PASS を確認

## 完了条件

- `npm run check` / `npm run typecheck` でエラー 0件
- `cargo clippy -- -D warnings` で warning 0件
- `npm run test` で全テストグリーン（リグレッションなし）
