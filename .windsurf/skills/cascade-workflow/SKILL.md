---
name: claude-code-cascade-workflow
description: Claude CodeとCascadeの最適ワークフロー。モデル使い分け、サブエージェント活用、MCP統合、並列開発パターン、ベストプラクティス。
version: 2026.03.17
tags: [workflow, claude-code, cascade, mcp, best-practices]
---

# ワークフローガイド

## モデル使い分け

| 作業 | Cascadeモデル | 理由 |
|---|---|---|
| UI実装・スタイリング | SWE-1.5（デフォルト） | 950 tok/s の爆速。単純な実装は速度が正義 |
| 複雑なRustロジック | Claude Sonnet 4.6 | 型推論・ライフタイムは精度が要る |
| アーキテクチャ設計 | Claude Opus 4.6 | 複雑な推論が必要な時だけ |

## ワークフロー（5段階）

```
Perplexity（設計相談・プロンプト設計）
  ↓
Claude Code（HANDOFF.md に仕様記述）
  ↓
Cascade（実装 + テスト実行）
  ↓
./scripts/review.sh（Claude Code 半自動レビュー）
  ↓
ユーザー判断（APPROVED → push / REQUIRES_CHANGES → 修正指示）
```

## サブエージェント活用（Claude Code側）

メインコンテキストを汚さないために、探索的タスクはサブエージェントに委任する。

| サブエージェント | モデル | ツール | 用途 |
|---|---|---|---|
| Explore | Haiku | 読み取り専用 | コードベース探索・依存関係調査 |
| Plan | 継承 | 読み取り専用 | 実装計画の策定 |
| カスタム | 任意 | カスタマイズ可 | タスク特化の専門エージェント |

使い方:
- バグ調査 → Explore に委任（「この型エラーの原因を探って」）
- リファクタ前調査 → Explore に委任（「useOpsStore を使っている全コンポーネントを列挙」）
- テスト分析 → サブエージェントに委任（「カバレッジが低いファイルを特定」）

## 設定共有

| 設定 | Cascade | Claude Code |
|---|---|---|
| Skills | .windsurf/skills/*.md | .claude/skills/*.md |
| ルール | .windsurfrules | CLAUDE.md |
| MCP | ~/.codeium/windsurf/mcp_config.json | claude mcp add |

## ベストプラクティス

- CLAUDE.md を簡潔に保つ（推測できることは書かない）
- 探索的タスクはサブエージェントに委任し、メインコンテキストを保全
- 2回修正して失敗したら /clear で新しいプロンプトから再開
- Context7 MCP で最新バージョン固有のドキュメントを参照
- 修正は共有スキルにフィードバックし知識を蓄積