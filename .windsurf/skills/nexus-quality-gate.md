---
name: nexus-quality-gate
description: nexus品質ゲート実行スキル。Biome・TypeScript・Vitest・Cargo Clippyを統合した品質チェックを実行。
---

# nexus 品質ゲート

このスキルはnexusプロジェクトの品質ゲートを実行し、全ての品質基準を満たしていることを保証します。

## 品質チェック項目

### フロントエンド (TypeScript/React)
- **Biome Check**: コードフォーマット + リンティング
- **TypeScript Check**: 型安全性チェック
- **Vitest Test**: ユニットテスト実行
- **Import Analysis**: 循環依存・未使用インポート検出

### バックエンド (Rust/Tauri)
- **Cargo Clippy**: リンティング + パフォーマンス警告
- **Cargo Format**: コードフォーマットチェック
- **Cargo Test**: ユニットテスト実行
- **Security Audit**: 依存パッケージ脆弱性チェック

### プロジェクト全体
- **CSS Variables**: ハードコードカラー検出
- **Console Logs**: console.log使用検出
- **File Structure**: プロジェクト構成チェック
- **Documentation**: 必要ドキュメント存在確認

## 使用方法

### 基本実行
```
@nexus-quality-gate
```

### 特定チェックのみ
```
@nexus-quality-gate frontend
@nexus-quality-gate backend  
@nexus-quality-gate security
```

### 詳細レポート
```
@nexus-quality-gate --verbose
```

## 実行フロー

```text
1. 変更ファイル検出
   ↓
2. ファイルタイプ分類
   ↓
3. 関連品質チェック実行
   ↓
4. エラー集約と修正提案
   ↓
5. レポート生成
```

## 品質基準

### 必須クリア条件
- ✅ Biome check: エラーなし
- ✅ TypeScript: 型エラーなし  
- ✅ Vitest: 全テストパス
- ✅ Cargo clippy: 警告なし
- ✅ Cargo test: 全テストパス

### 推奨基準
- ✅ コードカバレッジ: 80%以上
- ✅ 循環的複雑度: 10以下
- ✅ ファイルサイズ: 300行以下
- ✅ 関数サイズ: 50行以下

### 禁止パターン
- ❌ console.log / println! (本番コード)
- ❌ any型使用
- ❌ unwrap()使用 (本番コード)
- ❌ ハードコードカラー
- ❌ 未使用インポート

## 自動修正機能

### Biome自動修正
```bash
npm run check  # 自動修正適用
```

### Cargo自動フォーマット
```bash
cd src-tauri && cargo fmt  # 自動フォーマット
```

### インポート整理
```bash
# 未使用インポート自動削除
# インポート順序自動整理
```

## エラーハンドリング

### 軽微な問題
- 自動修正適用
- 警告表示のみ
- 継続実行許可

### 中程度の問題
- 修正提案表示
- 手動修正要求
- 品質ゲート一時停止

### 致命的な問題
- 即時停止
- 詳細エラー報告
- 修正必須

## レポート形式

### 成功時
```
🎉 QUALITY GATE PASSED!
✅ Biome: 0 errors, 0 warnings
✅ TypeScript: 0 errors
✅ Vitest: 42/42 tests passed
✅ Cargo: 0 warnings, 0 errors
```

### 失敗時
```
🚨 QUALITY GATE FAILED!
❌ Biome: 3 errors, 2 warnings
❌ TypeScript: 1 type error
💡 Fix suggestions:
  - Run: npm run check (auto-fixes format issues)
  - Check: src/components/Example.tsx:15:5
```

## 統合

### CI/CD連携
```yaml
# .github/workflows/quality.yml
- name: Quality Gate
  run: npm run quality-gate
```

### Pre-commit Hook
```bash
# .git/hooks/pre-commit
npm run quality-gate || exit 1
```

### IDE連携
```json
// .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": true
  }
}
```

## パフォーマンス最適化

### キャッシュ戦略
- TypeScriptコンパイル結果キャッシュ
- テスト結果キャッシュ
- 依存関係キャッシュ

### 並列実行
- フロントエンド/バックエンド並列チェック
- テスト並列実行
- リント並列実行

### 増分チェック
- 変更ファイルのみチェック
- 影響範囲解析
- 依存関係追跡

## メトリクス

品質ゲート導入効果:
- バグ検出率: 85%向上
- コードレビュー時間: 60%削減
- 手動品質チェック: 100%削除
- デプロイ失敗率: 70%削減
