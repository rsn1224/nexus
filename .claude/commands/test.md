# テスト生成・実行

対象（機能名またはファイルパス）: $ARGUMENTS

$ARGUMENTS が空の場合は「使用例: /test useSystemStore または /test src/stores/useSystemStore.ts」と伝えて停止すること。

## Rust テスト（src-tauri/src/ 配下）

- `#[cfg(test)]` モジュールにユニットテストを追加
- Windows API は trait mock で隔離（`cfg(test)` を活用）
- エラーケースを必ずカバー
- テスト名の例: `fn cpu_使用率を取得すると0以上100以下の値が返される()`

## TypeScript テスト（vitest 使用）

- Zustand ストアの状態遷移テスト
- Tauri invoke は `vi.mock('@tauri-apps/api/core')` で置換
- ハッピーパス・エラーパス・エッジケースを網羅

## 確認

生成前に「以下のテストを生成します:（スケルトン付き一覧）。続行してよいですか？ 」と確認を求めること。

## 実行

テスト生成後は以下で実行し結果を報告すること:

- Rust: `cargo test`
- TypeScript: `npx vitest run`

## FAIL 時の対応

FAIL したときはエラーログを全文表示し、修正後に再実行すること。「完了」は全テスト PASS 後のみ報告する。
