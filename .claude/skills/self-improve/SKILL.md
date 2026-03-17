---
name: self-improve
description: スキル・ルール・エージェント定義を改善するメタスキル。作業中に発見した知識をルールに昇格させる。
---

# Self-Improve スキル

作業中に発見したパターン・バグ・ベストプラクティスをルールとして永続化する。

## トリガー

- 同じ間違いを2回犯した
- Cascade が規約を誤解した
- 新しい Tauri/React のハマりポイントを発見した
- レビューで同じ指摘が繰り返された

## 更新先の判断

| 内容 | 更新先 |
|------|--------|
| Tailwind クラス・デザイン規約 | `.claude/skills/nexus-design.md` |
| Tauri/Rust の注意点 | `.claude/rules/tauri-v2-gotchas.md` |
| Cascade 向けワークフロー | `.claude/skills/cascade-workflow/SKILL.md` |
| メモリ管理ルール | `.claude/rules/memory-decisions.md` |
| ユーザーの好み | `memory/feedback_*.md` |
| nexus 固有のアーキテクチャルール | `CLAUDE.md` または `.windsurfrules` |

## 実行手順

1. **何を学んだか明確にする** — 「このパターンは〇〇の場合に問題になる」
2. **最適な保存先を特定** — 上記の表を参照
3. **既存の内容を確認** — 重複・矛盾がないか読む
4. **簡潔に追記** — 例: Why + How to apply の形式
5. **Windsurf 側にも同期が必要か判断** — `.windsurf/skills/` の対応ファイルも更新

## Windsurf/Cascade への同期

`.claude/skills/` と `.windsurf/skills/` は内容を一致させること。
重要な規約変更は両方を更新する。

```bash
# 同期スクリプト（存在する場合）
./scripts/sync-skills.sh
```
