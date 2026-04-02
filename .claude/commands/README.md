# nexus カスタムコマンド一覧

nexus プロジェクト固有のスラッシュコマンド。グローバルコマンド（`~/.claude/commands/`）を上書き・補完する。

## 開発フロー

| コマンド | 用途 |
|---------|------|
| `/plan-feature <name>` | 調査のみ実施し `docs/specs/<name>/proposal.md` を生成して停止。コード変更なし |
| `/feat <name>` | Phase 1（調査 + proposal.md 生成）→ 承認後 Phase 2（実装 + spec.md / tasks.md 生成）|
| `/fix <対象>` | バグ調査 → 根本原因確認 → 承認後修正 |
| `/refactor <対象>` | リファクタ計画提示 → 承認後実行。外部インターフェースは変えない |

## 品質・検証

| コマンド | 用途 |
|---------|------|
| `/check` | Rust（cargo check / clippy / fmt）+ TypeScript（tsc / biome）の品質ゲートを一括実行 |
| `/test <対象>` | Rust（`#[cfg(test)]`）+ TypeScript（vitest）のテストを生成・実行 |
| `/review` | `git diff HEAD` または指定ファイルのコードレビュー。4層ルール・型安全性・デザイントークンを検証 |

## セッション管理

| コマンド | 用途 |
|---------|------|
| `/reflect` | セッション振り返りを行い `HANDOFF.md` を更新してコミット |

## spec ドキュメント構造

`/feat` および `/plan-feature` が生成するファイル:

```
docs/specs/<feature-name>/
├── proposal.md   # 背景・ゴール・影響ファイル・実装方針メモ
├── spec.md       # Rust API / TypeScript 型定義 / コンポーネント設計
└── tasks.md      # 実装チェックリスト（実装中に逐次チェック）
```
