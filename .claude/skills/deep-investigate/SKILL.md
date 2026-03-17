---
name: deep-investigate
description: 原因不明のバグ・型エラー・パフォーマンス問題を体系的に調査する。Explore サブエージェントを活用。
version: 2026.03.17
tags: [debugging, investigation, subagent, explore]
---

# Deep Investigate スキル

通常の調査では原因がつかめない問題に対して体系的に掘り下げる。

## 使い方

```
/deep-investigate {問題の説明}
```

例:
- `/deep-investigate useBoostStore の fetchBoostStatus が稀に空配列を返す`
- `/deep-investigate HardwareWing が初回マウント時にちらつく`

## 調査プロセス

### Phase 1: 症状の明確化（5分）

- エラーメッセージの全文を収集
- 再現条件を特定（常時 / 初回のみ / 特定操作後）
- 最後に動いていたコミットを特定 (`git log --oneline -20`)

### Phase 2: 範囲の絞り込み（Explore サブエージェントに委任）

メインコンテキストを汚さないため、探索はサブエージェントへ:

```
Explore に委任:
- 「{問題のある関数}を呼び出している全コンポーネントを列挙」
- 「{型名}が定義・使用されている箇所を全て特定」
- 「最近変更された {ファイルパターン} のリスト」
```

### Phase 3: 仮説の立案

調査結果から仮説を3つ立てる:
1. **最有力** — 症状との一致度が高い
2. **次点** — 可能性は低いが見落としやすい
3. **外部要因** — Tauri/OS/依存関係の問題

### Phase 4: 検証

仮説を最小コードで検証。全ファイルを変更する前に局所的に確認。

### Phase 5: 根本原因の記録

判明したら `.claude/rules/` または `CLAUDE.md` に追記（self-improve スキルを使う）。

## [BLOCKED] 報告基準

2回の修正試行が失敗したら:

```
[BLOCKED] 調査が行き詰まりました。

症状: {エラー内容}
試したこと: {仮説1の検証}, {仮説2の検証}
現在の仮説: {残る可能性}
提案:
  A) {アプローチA}
  B) {アプローチB — よりシンプルな実装に切り替え}
```
