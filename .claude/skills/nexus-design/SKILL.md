---
name: nexus-design
description: >
  nexus UI 実装規約（v4）。Tailwind v4 + CSS 変数デザインシステム。
  カラーパレット・タイポグラフィ・コンポーネント構造テンプレート。
  TRIGGER when: user says "コンポーネント作成", "UI 実装", "view 追加",
  "デザイン", "スタイル修正", or creates/edits files in src/components/ or src/components/views/.
  静的なデザインルール（カラートークン・タイポグラフィ表）の参照は rules/design-system.md を使う。
  このスキルは UI 生成（GENERATE）・レビュー（REVIEW）・監査（AUDIT）のワークフロー実行に使う。
  Do NOT use for Rust backend or test-only changes.
---

# nexus UI 実装規約（v4）

> **デザイン仕様の Single Source of Truth: `nexus/UI-SPEC.md`**
> コンポーネント生成・レビュー・監査の前に必ず参照すること。
> `src/design-tokens.ts`（TS SSOT）と `src/index.css @theme`（CSS）も合わせて確認。

---

## モード定義

### GENERATE モード — 新規コンポーネント作成

1. `UI-SPEC.md` + `references/` を読む（省略禁止）
2. 仕様に沿って実装する
3. 実装後、自動で REVIEW モードでセルフチェック
4. チェックで問題が見つかれば修正してから最終コードを出力
5. 使用したトークン・バリアントをサマリーとして添付

### REVIEW モード — 既存UIの批評・改善提案

1. 対象ファイルを読む
2. `UI-SPEC.md` を参照
3. 下記の UX 品質チェックリストで評価
4. レポートを出力:
   - 合格項目（✅）
   - 要修正項目（⚠️）+ 具体的な修正コード例
   - 優先度順に並べる（critical → major → minor）

### AUDIT モード — 複数コンポーネントの一貫性チェック

1. 対象ファイル群を全て読む
2. 各ファイルに REVIEW モードを適用
3. プロジェクト横断の一貫性問題（同じ役割に異なるパターンが使われていないか）を追加でチェック
4. 統合レポートとして出力

---

## 絶対ルール

- **Tailwind className** を使う。`style={{ }}` インラインスタイル禁止
- CSS 変数は `src/index.css` の `@theme` 定義のみ使用（ハードコード色禁止）
- `nx-*` クラス禁止（廃止済み）
- 装飾禁止: グロー・グラデーション・シャドウ・アニメーション
  - 例外: border spinner の `animate-spin` のみ許可
- `border-radius` は `rounded`（4px）に統一

---

## UX 品質チェックリスト（REVIEW / AUDIT で使用）

### 1. デザイントークン準拠

- [ ] ハードコード色（`#xxxxxx`）が使われていないか
- [ ] 廃止済み `nx-*` クラスが使われていないか
- [ ] `style={{ }}` インラインスタイルがないか
- [ ] `text-[Npx]` が UI-SPEC.md タイポグラフィ表の値のみか（9/10/11/12/24px）
- [ ] `bg-black` / `text-white` 等の非トークンクラスがないか

### 2. 情報密度

- [ ] 必要な情報が 1 画面に収まるか（スクロール不要か）
- [ ] KPI 数値に `text-[24px] font-bold font-mono text-accent-400` が使われているか
- [ ] セクション見出しに `text-[11px] font-bold text-accent-500 tracking-[0.15em] uppercase` が使われているか

### 3. 状態網羅

- [ ] loading 状態が実装されているか（border spinner パターン）
- [ ] error 状態が実装されているか（`role="alert"` + `text-danger-500`）
- [ ] empty 状態が実装されているか（"NO DATA" + `text-text-muted`）

### 4. コントラスト・テキスト用途

- [ ] メインテキストに `text-text-primary` が使われているか
- [ ] 補助情報に `text-text-secondary` が使われているか
- [ ] ラベル・非活性に `text-text-muted` が使われているか

### 5. 一貫性

- [ ] ボタンに `src/components/ui/Button.tsx` が使われているか
- [ ] スライドパネルに `src/components/ui/SlidePanel.tsx` が使われているか
- [ ] 動的クラス結合に `cn()` ユーティリティが使われているか
- [ ] 同じ役割に同じコンポーネント・クラスが使われているか

---

## デザイントークン（v4）

→ 全変数一覧: references/color-tokens.md

```
背景（6段階）: bg-base-950 / bg-base-900 / bg-base-800 / bg-base-700 / bg-base-600 / bg-base-500
アクセント: text-accent-500 / border-accent-500 / bg-accent-500   ← Cyan #06b6d4 のみ
           text-accent-400 / border-accent-400                    ← KPI 数値・強調 #22d3ee
セマンティック: success-500 / warning-500 / danger-500
テキスト: text-text-primary / text-text-secondary / text-text-muted
ボーダー: border-border-subtle / border-border-active
```

## タイポグラフィ

| 用途 | クラス |
|------|--------|
| KPI 数字 | `text-[24px] font-bold font-mono text-accent-400` |
| セクション見出し | `text-[11px] tracking-[0.15em] uppercase font-bold text-accent-500` |
| 本文 | `text-[12px] font-normal text-text-primary` |
| ラベル | `text-[10px] tracking-[0.12em] font-semibold text-text-muted` |
| ボタン | `text-[11px] tracking-[0.1em] uppercase font-semibold` |

## コンポーネント構造テンプレート → references/components.md

## ボタン・状態表示・動的スタイル → references/patterns.md
