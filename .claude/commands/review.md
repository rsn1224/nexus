# コードレビュー

nexus のコードレビューを実行します。

## レビュー対象

`git diff HEAD` または $ARGUMENTS で指定されたファイル

## Phase 1: nexus 固有チェック

結果は「重要度 / ファイル:行 / 内容 / 修正案」の表形式で出力すること。

チェック項目:

1. **アーキテクチャ整合性**: 4層ルール（commands → services → infra → parsers）の遵守
2. **型安全性**: any 禁止、assertNever の網羅性、extractErrorMessage パターン使用
3. **Rust 品質**: unwrap() 禁止、UTF-8 PowerShell prefix、cfg(windows) 使用
4. **デザイン**: CSS 変数使用、inline style 禁止、デザイントークン準拠
5. **セキュリティー**: IPC 引数の検証、機密情報の非露出

- **Critical**: 修正必須（マージ不可）
- **Warning**: 修正推奨
- **Info**: 参考情報

## Phase 2: 汎用コードレビュー

Phase 1 のチェックが完了したら、`code-reviewer` サブエージェントを呼び出してロジック・パフォーマンス・可読性の汎用レビューを実行すること。

## 最終サマリー

Phase 1 と Phase 2 の結果をまとめて以下の形式で報告すること:

「Critical N件、Warning N件、Info N件。マージ可否: Yes / No」
