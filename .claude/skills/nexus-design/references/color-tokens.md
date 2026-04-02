# CSS 変数 / カラートークン一覧（v4）

## 背景（6段階）

```
bg-base-950   # 最も暗い（アプリ背景）
bg-base-900
bg-base-800   # カード背景
bg-base-700
bg-base-600
bg-base-500
```

## アクセント（Cyan 単色 — #06b6d4）

```
text-accent-500       # テキスト
bg-accent-500         # 背景
border-accent-500     # ボーダー
bg-accent-500/10      # 薄い背景（hover など）
```

## セマンティックカラー

```
text-success-500 / bg-success-500 / border-success-500   # 正常 #22c55e
text-warning-500 / bg-warning-500 / border-warning-500   # 警告 #f59e0b
text-danger-500  / bg-danger-500  / border-danger-500    # 危険 #ef4444
```

## テキスト

```
text-primary    # メインテキスト
text-secondary  # サブテキスト
text-muted      # 補足テキスト・プレースホルダー
```

## ボーダー

```
border-border-subtle   # 通常ボーダー
border-border-active   # アクティブ・フォーカス状態
```

## 存在しない変数（使用禁止）

```
--color-background
--color-primary-*
--color-surface
--color-border（末尾なし — border-subtle / border-active を使う）
bg-base-1000 / bg-base-400（範囲外）
```

## 色の使い分けガイド

| 用途 | クラス |
|------|--------|
| セクション見出し・アクセント強調 | `text-accent-500` |
| アクティブ・選択状態 | `text-accent-500` / `border-accent-500` |
| 正常値・成功メッセージ | `text-success-500` |
| 警告値・注意 | `text-warning-500` |
| 危険・エラー | `text-danger-500` |
| カード | `bg-base-800 border border-border-subtle rounded` |
