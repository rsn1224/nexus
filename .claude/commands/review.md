nexus のコードレビューを実行します。

## レビュー対象

`git diff HEAD` または $ARGUMENTS で指定されたファイル

## チェック項目

1. **アーキテクチャ整合性**: 4 層ルール（commands → services → infra → parsers）の遵守
2. **型安全性**: any 禁止、assertNever の網羅性、extractErrorMessage パターン使用
3. **Rust 品質**: unwrap() 禁止、UTF-8 PowerShell prefix、cfg(windows) 使用
4. **デザイン**: CSS 変数使用、inline style 禁止、DESIGN.md v2 トークン準拠
5. **セキュリティ**: IPC 引数の検証、機密情報の非露出

## 出力フォーマット

| 重要度 | ファイル:行 | 内容 | 修正案 |
|--------|-----------|------|--------|

- **Critical** — 修正必須（マージ不可）
- **Warning** — 修正推奨
- **Info** — 参考情報
