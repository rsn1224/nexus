# 品質ゲート

nexus の品質ゲートを実行します。全て PASS してから「チェック完了」と報告してください。

## Rust（src-tauri/）

1. `cargo check` （コンパイルエラー 0件）
2. `cargo clippy -- -D warnings` （warning 0件）
3. `cargo fmt --check` （フォーマット OK）
4. `cargo test` （テスト全件グリーン）

## TypeScript（src/）

1. `npx tsc --noEmit` （型エラー 0件）
2. `npx biome check --apply .` （自動修正実行）
3. `npx biome check .` （修正後 0件であること）

## 禁止パターン確認

```bash
grep -rn "console\.log" src/
grep -rn "println!" src-tauri/src/
grep -rn ": any" src/
grep -rn "style={{" src/
```

上記 4コマンドはすべて 0件であること。1件でも検出した場合は即修正してから再チェックする。

## 変更確認

- `git diff --name-only` で変更ファイルを表示
- 未コミット変更があればコミットを提案する

FAIL した場合は即修正 → 再チェックを繰り返す。「完了」は全 PASS 後のみ。
