# nexus — CLAUDE.md

Claude Code がこのプロジェクトで作業するときのルール。グローバル `~/.claude/CLAUDE.md` に加えて適用される。

---

## プロジェクト概要

**nexus** — Personal Gaming Dashboard（React 19 + Tauri v2 + TypeScript + Zustand v5 + Tailwind v4 + Biome v2 + Rust edition 2021）

### Wings（5 Wing 構成）

| WingId | コンポーネントパス | 責務 |
|--------|-----------------|------|
| `core` → `dashboard`* | `src/components/dashboard/` | ダッシュボード概要・ヘルス |
| `arsenal` → `gaming`* | `src/components/gaming/` | ゲーム最適化・ランチャー |
| `tactics` → `monitor`* | `src/components/monitor/` | リアルタイムシステム監視 |
| `logs` → `history`* | `src/components/history/` | セッション履歴・トレンド |
| `settings` | `src/components/settings/` | アプリ設定・Windows設定 |

> \* WingId はコード名（左）とディレクトリ名（右）が一致していない。Phase B で `dashboard/gaming/monitor/history` に統一予定。

---

## 開発コマンド

```bash
npm run dev        # Vite 開発サーバー（フロントのみ）
npm run tauri dev  # Tauri フル起動（推奨）
npm run check      # Biome lint + format
npm run typecheck  # tsc --noEmit
npm run test       # Vitest
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
cd src-tauri && cargo fmt
```

---

## レビューワークフロー

```
Cascade 実装完了
  └─ git add -p                    # 変更を目視確認
  └─ ./scripts/review.sh           # ↑ Enter で再実行可
  └─ APPROVED      → git commit && git push
  └─ REQUIRES_CHANGES → Cascade に修正指示 → 繰り返し
```

詳細 → `.claude/skills/cascade-workflow/SKILL.md`

---

## アーキテクチャ

### フロントエンド

- コンポーネント: `src/components/{wing}/`（共有: `src/components/shared/`）
- 共通 UI: `src/components/ui/`（Button, Card, StatusBadge, TabBar, ErrorBanner, LoadingState, EmptyState...）
- 状態管理: Zustand v5 `src/stores/use{Wing}Store.ts`
- 型定義: `src/types/index.ts`（すべての共有型はここに集約）
- ロギング: `src/lib/logger.ts` の `log`（`console.log` 禁止）

### バックエンド（Rust 4層アーキテクチャ）

```
src-tauri/src/
├── commands/    — Tauri コマンドハンドラのみ（薄いレイヤー）
├── services/    — ビジネスロジック（テスト可能な純粋ロジック）
├── infra/       — 外部システム接続（PowerShell, Registry, FileSystem）
└── parsers/     — VDF, ログ等のパーサー
```

**依存方向（逆方向禁止）:** `commands → services → infra/parsers`

- `commands/` にビジネスロジックを書かない。`services/` に委譲する
- `services/` は外部 I/O を直接呼ばない。`infra/` を通す
- 新コマンド追加時: `src-tauri/src/lib.rs` の `invoke_handler` にも登録
- エラーは `src-tauri/src/error.rs` の `AppError` を使う

### System インスタンス

- `sysinfo::System` は `PulseState` が保持する1インスタンスのみ
- `ops.rs` / `hardware.rs` は `PulseState` の `System` を共有する
- **`System::new_all()` を各コマンドで直接呼び出すことは禁止**

---

## React 19 推奨パターン

```tsx
// ✅ use() + Suspense（useEffect + isLoading 置換）
const data = use(fetchDataPromise);

// ✅ useActionState（フォーム送信管理）
const [state, action] = useActionState(submitHandler, initialState);

// ✅ useOptimistic（楽観的更新）
const [optimisticList, addOptimistic] = useOptimistic(list, reducer);
```

---

## Zustand v5 推奨パターン

```tsx
// ✅ useShallow セレクタ（過剰再レンダリング防止）
const { games, isLoading } = useLauncherStore(
  useShallow((s) => ({ games: s.games, isLoading: s.isLoading }))
);

// ❌ ファサードセレクタ（新規作成禁止）
const selectViewModel = (s) => ({ ... }); // 毎回新オブジェクト生成
```

---

## セキュリティ必須事項

- フロントエンドからのユーザー入力は必ずバリデーション（IP 形式・ホスト名・パス等）
- PowerShell コマンド構築に `format!` + ユーザー入力を直接使用禁止 → `infra/powershell.rs` のヘルパーを使用
- 新コマンド追加時は `src-tauri/capabilities/default.json` に permission を追加
- CSP 変更禁止（変更が必要な場合はレビュー必須）

---

## テスト

- TS: `src/test/*.test.ts`（Vitest）
- Rust: `#[cfg(test)] mod tests` in `services/` レイヤー
- E2E: `e2e/` ディレクトリ（Playwright）
- カバレッジ目標: 80% 以上

---

## デフォルト要件（変更不可）

| 要件 | 説明 |
|------|------|
| lint エラー 0 | `npm run check` + `cargo clippy` |
| 型エラー 0 | `npm run typecheck` |
| 全テスト green | unit + E2E |
| console.log 禁止 | `log.info` / `tracing::info!` を使う |
| any 型禁止 | Biome の `noExplicitAny: error` |
| インラインスタイル禁止 | Tailwind v4 className を使う |
| unwrap() 禁止 | 本番コードでは `AppError` でハンドリング（テストは理由コメント付きで許可） |
| System::new_all() 禁止 | PulseState 共有を使用 |
| PowerShell 直接実行禁止 | `infra/powershell.rs` のヘルパーを使用 |

---

## コスト監視

```bash
bash scripts/check-cost.sh         # 本日のコスト
bash scripts/check-cost.sh live    # リアルタイムダッシュボード
bash scripts/check-cost.sh blocks  # 現在の5時間ブロック
```

- コンテキストが90%を超えたら `/compact` を実行
- 大規模リファクタはブロック開始直後に行う
- 1日の目安上限: $5.00

---

## デザインシステム Quick Reference

> SSOT: `src/design-tokens.ts` — CSS 実体: `src/index.css` @theme  
> 値を変更するときは **両方** 更新すること

### カラーシステム（ダークモード専用）

- 背景: `base-950`〜`base-500`（6段階、深い紫寄りのグレー）
- テキスト: `text-primary` (#e0e0ec) / `text-secondary` (#9090aa) / `text-muted` (#6b6b82)
- デフォルトアクセント: `accent-500` (cyan)
- Wing 別マルチカラー: performance/games=warm, hardware/storage=purple, network/log=info, home/settings=accent

### テキストサイズ階層

| 用途 | クラス |
|---|---|
| KPI 大見出し | `text-3xl font-bold` |
| KPI 数値 | `text-2xl font-bold` |
| 温度・小 KPI | `text-xl font-semibold` |
| 容量等 | `text-lg font-semibold` |
| 本文 | `text-sm` |
| ラベル・補助 | `text-xs` |

### カードシステム

- Glass: `card-glass` / `card-glass-elevated`（CSS 定義済、Tailwind で**再実装禁止**）
- 角丸: カード = `rounded-xl` (12px), 内部パネル = `rounded-lg` (8px)
- 3層レイヤー: L1=`bg-base-900`, L2=`card-glass`, L3=`bg-base-700/40`

### 禁止パターン ⛔

```
text-black / text-white      → text-text-primary / text-text-secondary
bg-black / bg-white          → bg-base-900 / bg-base-800
shadow-lg / shadow-xl        → card-glass の built-in shadow か shadow-sm のみ
bg-gradient-to-*             → グラデーション背景禁止
text-[Npx]                   → Tailwind 標準 (text-xs/sm/base/lg/xl/2xl/3xl) のみ
font-[N]                     → font-normal/medium/semibold/bold のみ
rounded (裸)                 → rounded-xl (カード) / rounded-lg (パネル)
style={{...}} inline         → Tailwind className で対応
console.log                  → log.info を使う
any 型                       → 適切な型を定義
```

検証: `npx tsx scripts/validate-design.ts`

---

## 参照先

| 内容 | ファイル |
| ---- | ------- |
| デザイントークン SSOT | `src/design-tokens.ts` |
| UIデザイン規約・Tailwindクラス | `DESIGN.md` / `.claude/skills/nexus-design/SKILL.md` |
| Cascade協業・モデル使い分け | `.claude/skills/cascade-workflow/SKILL.md` |
| Tauri v2 注意点 | `.claude/rules/tauri-v2-gotchas.md` |
| メモリ管理ルール | `.claude/rules/memory-decisions.md` |
| 再構築計画 | `HANDOFF.md` / `ROADMAP.md` |
| 設計レビュー結果 | `docs/reviews/` |
