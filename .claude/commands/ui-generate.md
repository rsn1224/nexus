---
description: nexus の UI コンポーネントを nexus-design 規約 GENERATE モードで新規生成する
---

# /ui-generate — UIコンポーネント生成

引数: `<作成したいコンポーネントの説明>`

## 動作手順

1. `nexus/UI-SPEC.md` を読む（省略禁止）
2. `nexus/.claude/skills/nexus-design/references/` を参照する
3. `nexus/.claude/skills/nexus-design/SKILL.md` の **GENERATE モード**で実装する
4. 実装後、自動で **REVIEW モード**のセルフチェックを実行する
5. チェックで問題があれば修正してから最終コードを出力する
6. 以下のサマリーを添付する:

```
## 生成サマリー

### 使用トークン
- 背景: bg-base-800
- テキスト: text-text-primary / text-text-muted
- アクセント: text-accent-500
- ...

### 実装済み状態
- [x] default
- [x] hover
- [x] loading（border spinner）
- [x] error（role="alert"）
- [x] empty（"NO DATA"）

### セルフレビュー結果
- 合格: N 項目 / 要修正: 0 項目
```

## 使用例

```
/ui-generate CPU使用率を表示するミニカード
/ui-generate ネットワーク送受信速度のリアルタイム表示セクション
/ui-generate 最適化候補リスト（チェックボックス付き）
```
