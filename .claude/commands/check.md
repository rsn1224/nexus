nexus の品質ゲートを実行します。全て PASS してから「✅ チェック完了」と報告してください。

## Rust（src-tauri/）

1. `cargo check` — エラー 0 件
2. `cargo clippy -- -D warnings` — warning 0 件
3. `cargo fmt --check` — フォーマット OK

## TypeScript（src/）

1. `npx tsc --noEmit` — 型エラー 0 件
2. `npx biome check --apply .` — lint/format 自動修正後 0 件

## 変更確認

- `git diff --name-only` で変更ファイルを表示
- コンソール出力・any 型・inline style の混入がないか確認
- 未コミット変更があればコミット提案

FAIL した場合は即修正 → 再チェックを繰り返す。「完了」は全 PASS 後のみ。
