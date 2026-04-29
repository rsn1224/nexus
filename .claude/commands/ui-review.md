---
description: nexus の UI コンポーネントを nexus-design 規約 REVIEW モードで評価する
---

# /ui-review — UIコンポーネントレビュー

引数: `<ファイルパスまたはコンポーネント名>`

## 動作手順

1. 引数で指定されたファイルを読む
2. `nexus/UI-SPEC.md` を参照する
3. `nexus/.claude/skills/nexus-design/SKILL.md` の **REVIEW モード**で評価する
4. 以下の形式でレポートを出力する:

```
## UI Review: <ファイル名>

### 合格 ✅
- <合格項目>

### 要修正 ⚠️
**[critical]** <問題の説明>
修正前: `<現在のコード>`
修正後: `<修正コード>`

**[major]** ...
**[minor]** ...

### サマリー
- 合格: N 項目 / 要修正: N 項目（critical N, major N, minor N）
```

## 使用例

```
/ui-review src/components/system/KpiGrid.tsx
/ui-review src/components/views/BoostView.tsx
/ui-review MonitorView
```
