# Tailwind v4 移行記録 — nexus

> **ステータス: 完了** （2026-04-13 確認）
> 最終コミット: `ad6e2a4` — `chore: remove nexus.css import — all nx-* classes migrated`

---

## 移行概要

nexus は独自 CSS クラス（`nx-*` プレフィックス）を Tailwind v4 + CSS 変数ベースのデザインシステムに移行した。

| 前 | 後 |
|----|-----|
| `nexus.css` の `nx-*` ユーティリティクラス | Tailwind v4 ユーティリティ + `@theme` CSS 変数 |
| ハードコード HEX カラー | `--color-base-*` / `--color-accent-*` 変数 |
| カスタム CSS アニメーション | `transform` / `opacity` ベースのみ（GPU 対応） |

---

## 完了コンポーネント一覧

| コンポーネント | 対応コミット |
|--------------|------------|
| MonitorView | `6f82f0a` |
| OptimizeSection | `051c9c5` |
| Main floating panel & tabs | `9e971b3` |
| BoostView | `4823d40` |
| QuickPanels | `cdfb31a` |
| TabBar | `086055e` |
| Toggle | `e13f11e` |
| SectionLabel | `d436788` |
| nexus.css 削除（完全撤廃） | `61f08c4` |

---

## 検証コマンド

```bash
# nx-* クラス残存チェック（0件であること）
grep -rn "nx-" src --include="*.tsx" --include="*.ts" | grep -v "node_modules"

# デザイントークン同期確認
pnpm run validate:design
```

---

## デザインシステム規約（今後の実装ルール）

### カラーパレット

`src/design-tokens.ts` と `src/index.css` の `@theme` ブロックを **常に同期** すること。
片方だけ更新した場合、実行時にスタイルが壊れる。

```css
/* index.css @theme */
--color-base-950: #05060b;
--color-accent-500: #4ade80;
```

```typescript
// design-tokens.ts (同じ値)
export const NEXUS_TOKENS = {
  color: { base: { 950: '#05060b' }, accent: { 500: '#4ade80' } }
};
```

### アニメーション制約（全プロジェクト共通）

- `transform` / `opacity` のみ（GPU アクセラレーション）
- `width` / `height` / `margin` のアニメーション禁止（CPU レイアウト再計算）

### CSS 変数の使い方

```tsx
// OK: CSS 変数参照
className="bg-(--color-base-950) text-(--color-accent-500)"

// NG: ハードコードカラー
className="bg-[#05060b] text-[#4ade80]"
```

---

## 今後の注意点

1. 新コンポーネント追加時は必ず `src/design-tokens.ts` のトークンを参照する
2. `nexus.css` は削除済み — 復元禁止
3. `nx-*` クラスは廃止済み — 新規使用禁止
