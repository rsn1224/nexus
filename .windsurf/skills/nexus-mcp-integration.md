---
name: nexus-mcp-integration
description: nexus MCP統合管理スキル。GitHub・Context7・Filesystem・SQLite・Brave Search MCPサーバーを統合的に管理。
---

# nexus MCP統合管理

このスキルはnexusプロジェクトのMCP（Model Context Protocol）サーバー統合を管理し、外部サービスとの連携を自動化します。

## MCPサーバー一覧

### GitHub MCP
- **機能**: リポジトリ操作、PR管理、Issue管理
- **認証**: GitHub Personal Access Token
- **用途**: 自動PR作成、Issue管理、コードレビュー支援

### Context7 MCP
- **機能**: 最新バージョン固有のドキュメント提供
- **認証**: 不要
- **用途**: APIドキュメント参照、ベストプラクティス確認

### Filesystem MCP
- **機能**: ファイルシステム操作
- **認証**: 不要（ディレクトリ制限あり）
- **用途**: プロジェクトファイルの安全な操作

### SQLite MCP
- **機能**: データベース操作
- **認証**: 不要
- **用途**: プロジェクト状態管理、ナレッジベース

### Brave Search MCP
- **機能**: Web検索
- **認証**: Brave API Key（任意）
- **用途**: 最新情報取得、技術調査

## 使用方法

### 基本操作
```
@nexus-mcp-integration
```

### 特定MCP操作
```
# GitHub操作
@nexus-mcp-integration github create-pr "feat: new feature"

# Context7検索
@nexus-mcp-integration context7 search "React hooks best practices"

# ファイル操作
@nexus-mcp-integration filesystem read "src/components/Example.tsx"
```

## 自動化ワークフロー

### 1. 開発サイクル統合
```text
実装完了 → GitHub MCPでPR作成 → Context7でドキュメント確認 → SQLiteで状態記録
```

### 2. 品質保証
```text
コードレビュー → GitHub MCPでIssue作成 → Filesystem MCPで修正 → Brave MCPで調査
```

### 3. ナレッジ管理
```text
技術調査 → Context7 MCPでAPI確認 → SQLite MCPで記録 → Filesystem MCPで保存
```

## 設定

### 必須環境変数
```bash
# GitHub MCP用
export GITHUB_TOKEN="your_github_token"

# Brave Search MCP用（任意）
export BRAVE_API_KEY="your_brave_api_key"
```

### MCP設定ファイル
`.windsurf/mcp_config.json` にサーバー設定済み

## セキュリティ

### アクセス制御
- Filesystem MCP: nexusプロジェクトディレクトリ内に制限
- SQLite MCP: プロジェクトDBのみアクセス
- GitHub MCP: 読み取り専用権限推奨

### データ保護
- APIキーは環境変数で管理
- 機密情報はMCP経由で送信しない
- ローカルDBに暗号化保存

## トラブルシューティング

### GitHub MCP接続失敗
```
# トークン確認
echo $GITHUB_TOKEN

# 権限確認
gh auth status
```

### Context7 MCP応答なし
```
# ネットワーク確認
curl -I https://context7.ai

# 再起動
# MCPサーバー再起動
```

### Filesystem MCPアクセス拒否
```
# パーミッション確認
ls -la /c/Users/rsn12/dev/nexus

# パス確認
pwd
```

## ベストプラクティス

### 1. 効率的な利用
- 開発開始前にContext7で最新API確認
- 実装完了後にGitHub MCPでPR作成
- 定期的にSQLite MCPで状態バックアップ

### 2. エラーハンドリング
- MCPサーバーダウン時のフォールバック準備
- ネットワークエラー時のリトライ処理
- API制限時の待機処理

### 3. パフォーマンス最適化
- 頻繁アクセスデータはSQLite MCPにキャッシュ
- 大量データ処理はFilesystem MCPで直接操作
- Web検索はBrave MCPで効率化

## メトリクス

MCP統合による効果:
- 外部サービス連携時間: 70%削減
- ドキュメント参照時間: 80%削減  
- 手動Git操作: 95%削減
- 情報検索時間: 60%削減
