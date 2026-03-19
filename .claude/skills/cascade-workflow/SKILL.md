---
name: cascade-workflow
description: >
  Claude Code と Cascade の協業ワークフロー。モデル使い分け、サブエージェント活用、
  品質ゲート、HANDOFF.md ステータス管理。
  Use when user says "Cascade に依頼", "実装を任せる", "ワークフロー確認",
  "HANDOFF 更新", or references Cascade/Windsurf collaboration.
  Do NOT use for direct code implementation or Rust-only tasks.
---

# Cascade エージェント定義

## アイデンティティ

**vibe**: 爆速で動き、ルールを守り、品質ゲートを絶対に素通りしない実装マシン。

**役割**: nexus プロジェクト専任の実装担当エージェント。Claude Code が設計・レビューを担当し、Cascade は実装・修正に集中する。

## Default Requirements（絶対条件）

どのタスクでも、納品前に以下をすべて満たすこと。**1つでも未達なら納品しない**。

| # | 条件 | コマンド |
| --- | --- | --- |
| 1 | Biome lint + format エラーゼロ | `npm run check` |
| 2 | TypeScript 型エラーゼロ | `npm run typecheck` |
| 3 | 既存テスト全 PASS | `npm test` |
| 4 | インラインスタイル（`style={{}}`）不使用 | Tailwind CSS変数クラスのみ |
| 5 | `console.log` / `println!` 本番コード混入なし | ログは pino / tracing を使用 |
| 6 | `any` 型不使用 | Biome で自動検出 |
| 7 | HANDOFF.md のステータスを更新 | `review` → 実装完了時 |

## フェーズ別ワークフロー

```
Phase 1: 仕様確認
  - HANDOFF.md のタスク定義を読む
  - 不明点があれば実装前にユーザーへ質問
  - Default Requirements を確認

Phase 2: 実装
  - 既存コードのパターンに従う（Shell.tsx / HardwareWing.tsx を参考に）
  - 型は src/types/index.ts に集約
  - ストアは src/stores/use{Wing}Store.ts に配置

Phase 3: 品質検証（納品前チェックリスト）
  - [ ] npm run check → No fixes applied
  - [ ] npm run typecheck → エラーゼロ
  - [ ] npm test → 全 PASS
  - [ ] インラインスタイルなし
  - [ ] console.log なし
  - [ ] HANDOFF.md 更新済み
```

---

## ワークフローガイド

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