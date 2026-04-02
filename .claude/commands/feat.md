機能名: $ARGUMENTS

## Phase 1: 調査（コード変更禁止）

以下を調査して報告すること:
- 影響するストア・コンポーネント（ファイル:行番号を明示）
- 既存の類似実装（再利用できるものを優先）
- 追加するファイルと変更するファイルの候補リスト

<constraints>
- TS/TSX: 200行制限（scripts/check-file-size.mjs が CI で強制）
- Rust: 300行制限
- デザイントークン: src/index.css の CSS 変数のみ使用（ハードコード色禁止）
- console.log / println! 禁止（logger.ts / tracing::info! を使う）
- any 型禁止
- インラインスタイル禁止
- Rust 4層ルール厳守: commands → services → infra/parsers（逆方向禁止）
- 新 Rust コマンドは src-tauri/src/lib.rs の invoke_handler に必ず登録
- System::new_all() を各コマンドで直接呼ばない（PulseState を使う）
</constraints>

調査完了後、「以下のファイルを変更します:（一覧）。実装してよいですか？」と確認を求めること。

## Phase 2: 実装（承認後のみ）

<tasks>
1. 型定義（src/types/ または該当ファイル）
2. Rust コマンド実装（services 層 → commands 層の順で）
3. tauri-commands.ts に invoke ラッパーを追加
4. Zustand ストア（useShallow セレクタを使う）
5. コンポーネント実装
6. /check を実行して全 PASS を確認
</tasks>

## 完了条件

- `npm run check` — エラー 0
- `npm run typecheck` — 型エラー 0
- `cargo clippy -- -D warnings` — warning 0
- `npm run test` — 全テストグリーン
