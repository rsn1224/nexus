---
name: nexus-automation
description: nexus完全自動化ワークフロー実行スキル。品質ゲート・HANDOFF更新・レビュー・MCP統合を一括実行。
---

# nexus 完全自動化ワークフロー

このスキルはnexusプロジェクトの完全自動化ワークフローを実行し、Claude Codeとの協業をスムーズにします。

## 実行内容

### 1. 品質ゲート自動実行
- Biome format + lint チェック
- TypeScript 型チェック
- Vitest テスト実行
- Cargo clippy + format + test
- エラー時の自動修正提案

### 2. HANDOFF.md 自動更新
- 変更ファイルからタスクを自動検出
- 実装内容の自動記録
- テスト結果の自動記入
- ステータスの自動更新

### 3. 自動レビュー実行
- コード品質チェック
- セキュリティスキャン
- パフォーマンス確認
- レビュー結果の自動記録

### 4. MCP統合機能
- GitHub MCPでのPR/Issue管理
- Context7 MCPでの最新ドキュメント参照
- Filesystem MCPでのファイル操作
- SQLite MCPでのプロジェクト状態管理

## 使用方法

```
@nexus-automation
```

## 自動化フロー

```text
1. ファイル編集検知
   ↓
2. Pre-edit安全チェック
   ↓
3. 品質ゲート実行
   ↓
4. HANDOFF.md更新
   ↓
5. 自動レビュー実行
   ↓
6. 結果記録とコミット
   ↓
7. GitHub連携（MCP経由）
```

## 設定要件

- `.claude/settings.json` にフック設定済み
- `scripts/` ディレクトリに自動化スクリプト配置済み
- `.windsurf/mcp_config.json` にMCPサーバー設定済み

## 環境変数

- `GITHUB_TOKEN`: GitHub MCP用
- `BRAVE_API_KEY`: Brave Search MCP用（任意）

## トラブルシューティング

### 品質ゲート失敗時
- Biomeエラー: `npm run check` で自動修正
- TypeScriptエラー: 型エラーを修正
- テスト失敗: テストコードを修正

### HANDOFF更新失敗時
- ファイル権限を確認
- Gitリポジトリ状態を確認

### MCP接続失敗時
- 環境変数を確認
- ネットワーク接続を確認

## メトリクス

自動化により以下の効率向上を期待:
- 手動作業時間: 90%削減
- 品質チェック漏れ: 0%に
- ドキュメント陳腐化: 防止
- レビューサイクル: 50%短縮
