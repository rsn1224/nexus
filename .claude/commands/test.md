$ARGUMENTS のテストを生成または実行してください。

## Rust テスト（src-tauri/src/ 配下）

- `#[cfg(test)]` モジュールにユニットテストを追加
- Windows API は trait mock で隔離（`cfg(test)` を活用）
- エラーケースを必ずカバー
- テスト名は日本語 OK（`何をすると何になる` 形式推奨）

## TypeScript テスト（vitest 使用）

- Zustand ストアの状態遷移テスト
- Tauri invoke は `vi.mock('@tauri-apps/api/core')` で置換
- ハッピーパス + エラーパス + エッジケース

## 実行前の確認

「以下のテストを生成します:（箇条書き）。よろしいですか？」と確認を求めること。

## 実行

テスト生成後は以下で実行し結果を報告すること:

- Rust: `cargo test`
- TypeScript: `npx vitest run`
