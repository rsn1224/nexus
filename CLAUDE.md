# nexus — CLAUDE.md

Claude Code がこのプロジェクトで作業するときのルール。グローバル `~/.claude/CLAUDE.md` に加えて適用される。

---

## プロジェクト概要

**nexus** | Personal Gaming Dashboard
（React 19 + Tauri v2 + TypeScript + Zustand v5 + Tailwind v4 + Biome v2 + Rust edition 2021）

**実行環境:** Node.js >= 22.0.0 / npm >= 10.0.0 / Rust stable / Windows 10/11

**コンセプト:** ゲーム前の30秒ルーティン。開く → 状態確認 → 最適化 → 閉じる。

**画面構成:** Main 1画面（スクロール不要）+ スライドパネル 2枚（Settings, History）

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

## アーキテクチャ

### フロントエンド

```text
src/
├── App.tsx / App.css            # ルートコンポーネント
├── main.tsx                     # Vite エントリーポイント
├── index.css                    # デザイントークン CSS（@theme）
├── design-tokens.ts             # トークン定義 SSOT（TypeScript）
├── components/
│   ├── Main.tsx                 # 全セクション統合（1画面）
│   ├── Diagnostics.tsx          # 異常時のみ表示
│   ├── actions/
│   │   └── ActionStrip.tsx      # アクション行
│   ├── diagnostic/
│   │   └── DiagnosticBanner.tsx # 診断バナー
│   ├── layout/
│   │   ├── AppShell.tsx         # アプリシェル
│   │   ├── TopBar.tsx           # トップバー
│   │   ├── Sidebar.tsx          # サイドバー
│   │   └── FooterBar.tsx        # フッターバー
│   ├── optimize/
│   │   └── OptimizeSection.tsx  # 最適化セクション
│   ├── panels/
│   │   ├── SettingsPanel.tsx    # 設定スライドパネル
│   │   ├── HistoryPanel.tsx     # 履歴スライドパネル
│   │   └── QuickPanels.tsx      # クイックパネル
│   ├── system/
│   │   └── KpiGrid.tsx          # KPI グリッド
│   ├── ui/                      # Button, Card, Toggle, StatusBadge, ErrorBanner,
│   │                            #   LoadingState, SlidePanel, OptimizationRow 等
│   └── views/                   # DashboardView, BoostView, HardwareView, MemoryView,
│                                #   MonitorView, NetworkView, OptimizeView, SettingsView,
│                                #   TimerView, WindowsView
├── stores/
│   ├── useSystemStore.ts        # SystemStatus + Diagnostics（5秒ポーリング）
│   ├── useOptimizeStore.ts      # candidates / apply / revert
│   ├── useSettingsStore.ts      # settings CRUD
│   ├── useAppSettingsStore.ts   # アプリ設定
│   ├── useHardwareStore.ts      # ハードウェア情報
│   ├── useMemoryStore.ts        # メモリ情報
│   ├── useNavStore.ts           # ナビゲーション状態
│   ├── useNetworkStore.ts       # ネットワーク情報
│   ├── useTimerStore.ts         # タイマー
│   └── useWindowsStore.ts       # Windows 設定
├── lib/
│   ├── tauri-commands.ts        # invoke ラッパー全集約
│   ├── formatters.ts            # 温度・容量・パーセンテージ
│   ├── logger.ts                # console.log 禁止、これを使う
│   ├── cn.ts                    # classname マージユーティリティ
│   └── constants.ts             # 定数定義
├── hooks/
│   └── useFocusTrap.ts          # フォーカストラップ
├── types/
│   ├── system.ts                # SystemStatus, DiagnosticAlert
│   ├── optimize.ts              # OptCandidate, ApplyResult, Session
│   ├── settings.ts              # Settings
│   └── index.ts                 # re-export のみ
├── i18n/
│   └── locales/ en/ ja/         # 国際化リソース
└── services/
    ├── notificationService.ts
    └── perplexityService.ts
```

### バックエンド（Rust 4層アーキテクチャ）

```text
src-tauri/src/
├── commands/    # Tauri コマンドハンドラーのみ（薄いレイヤー）
├── services/    # ビジネスロジック（テスト可能な純粋ロジック）
├── infra/       # 外部システム接続（PowerShell, Registry, FileSystem）
└── parsers/     # VDF, ログ等のパーサー
```

**依存方向（逆方向禁止）:** `commands → services → infra/parsers`

- `commands/` にビジネスロジックを書かない。`services/` に委譲する。
- `services/` は外部 I/O を直接呼ばない。`infra/` を通す。
- 新コマンド追加時: `src-tauri/src/lib.rs` の `invoke_handler` にも登録
- エラーは `src-tauri/src/error.rs` の `AppError` を使う。

### System インスタンス

- `sysinfo::System` は `PulseState` が保持する1インスタンスのみ
- **`System::new_all()` を各コマンドで直接呼び出すことは禁止**

---

## Zustand v5 推奨パターン

```tsx
// ✅ useShallow セレクタ（過剰再レンダリング防止）
const { cpu, gpu } = useSystemStore(
  useShallow((s) => ({ cpu: s.cpuPercent, gpu: s.gpuPercent }))
);

// ❌ ファサードセレクタ（新規作成禁止）
const selectViewModel = (s) => ({ ... }); // 毎回新オブジェクト生成
```

---

## 実装済みストア設計

```typescript
// src/stores/useSystemStore.ts
// SystemStatus ポーリング（5秒間隔）+ DiagnosticAlert
// Tauri: invoke('get_system_status') / invoke('diagnose')

// src/stores/useOptimizeStore.ts
// OptCandidate リスト / apply / revert
// Tauri: invoke('get_optimization_candidates') / invoke('apply_optimizations') / invoke('revert_all')

// src/stores/useSettingsStore.ts
// Settings CRUD
// Tauri: invoke('get_settings') / invoke('update_settings')
```

---

## セキュリティー必須事項

- フロントエンドからのユーザー入力は必ずバリデーション
- PowerShell コマンド構築に `format!` + ユーザー入力を直接使用禁止 → `infra/powershell.rs` のヘルパーで対応
- 新コマンド追加時は `src-tauri/capabilities/default.json` に permission を追加
- CSP 変更禁止（変更が必要な場合はレビュー必須）

---

## テスト

- TS: Vitest（`*.test.ts` / `*.test.tsx`）
- Rust: `#[cfg(test)] mod tests` in `services/` レイヤー
- E2E: `e2e/` ディレクトリー（Playwright）
- カバレッジ目標: 80% 以上

---

## コミット前チェックリスト（全項目必須）

```bash
npm run check          # Biome format + lint
npm run typecheck      # tsc --noEmit
npm run test           # vitest run
npm run lint           # CSS 変数・アーキテクチャ・ファイルサイズ・インラインスタイル等
cargo check            # Rust 型チェック
cargo clippy           # Rust lint（警告 0）
cargo test             # Rust ユニットテスト
```

---

## デフォルト要件（変更不可）

| 要件 | 説明 |
| ------ | ------ |
| lint エラー 0 | `npm run check` + `cargo clippy` |
| 型エラー 0 | `npm run typecheck` |
| 全テスト green | unit + E2E |
| console.log 禁止 | `log.info` / `tracing::info!` を使う |
| any 型禁止 | Biome の `noExplicitAny: error` |
| インラインスタイル禁止 | Tailwind v4 className を使う |
| unwrap() 禁止 | `AppError` によるハンドリングを徹底（テスト: 理由コメント付き許可） |
| System::new_all() 禁止 | PulseState 共有を使用 |
| PowerShell 直接実行禁止 | `infra/powershell.rs` のヘルパーを使用 |
| TS/TSX 200行制限 | `scripts/check-file-size.mjs`（STRICT_MODE）が CI で強制 |
| Rust 300行制限 | `scripts/check-file-size.mjs` が CI で強制 |
| ハードコード色禁止 | デザイントークン CSS 変数を使用（DESIGN.md 参照） |
| animate-spin 限定許可 | border spinner パターン（`border + border-t-transparent + rounded-full`）のみ使用可 |

---

## デザインシステム Quick Reference

> **SSOT: `src/design-tokens.ts` | CSS 実体: `src/index.css` @theme**
> 値を変更するときは **両方** 更新すること。詳細は [DESIGN.md](DESIGN.md) を参照。
>
> ⚠️ `nexus.css` 由来の `nx-` プレフィックスクラス（`nx-panel`, `nx-card` 等）は**廃止済み**。
> 新規コードでの使用禁止。既存コードも見つけ次第 Tailwind className へ移行すること。

### カラー（ダークモード専用、Cyan 単色アクセント）

- 背景: `base-950` から `base-500`（6段階）
- テキスト: `text-primary` / `text-secondary` / `text-muted`
- アクセント: `accent-500` (#06b6d4 Cyan) | 唯一のアクセントカラー
- セマンティック: `success-500` / `warning-500` / `danger-500`

### タイポグラフィ

| 用途 | サイズ | ウェイト |
| ------ | -------- | ------- |
| KPI 数字 | `text-[24px]` | `font-bold` |
| セクション見出し | `text-[11px] tracking-[0.15em] uppercase` | `font-bold` |
| 本文 | `text-[12px]` | `font-normal` |
| ラベル | `text-[10px] tracking-[0.12em]` | `font-semibold` |
| ボタン | `text-[11px] tracking-[0.1em] uppercase` | `font-semibold` |

### レイアウト

- `border-radius: 4px` 統一
- カード: `bg-base-800 border border-border-subtle rounded`
- 装飾: **なし**（グロー・グラデーション・シャドウ・アニメーション禁止）
- 例外: `animate-spin` は border spinner パターン限定で許可

---

## Rust コマンド — フロントエンド連携状態

| コマンド | 状態 | フロントエンド連携 |
| ------ | ------ | ------ |
| `get_system_status` | polling 5 秒 | `useSystemStore` |
| `diagnose` | polling 5 秒 | `useSystemStore` |
| `get_optimization_candidates` | on mount | `useOptimizeStore` |
| `apply_optimizations` | `isApplying: boolean` | `useOptimizeStore` |
| `revert_all` | on demand | `useOptimizeStore` |
| `get_settings` / `update_settings` | CRUD | `useSettingsStore` |
| `get_history` | on mount | `useOptimizeStore` |

---

## 実装済み機能（v4.0 完了）

| フェーズ | 内容 |
| ------ | ------ |
| Phase 0 | クリーンアップ（旧 Wing/Stitch/v2 型全削除） |
| Phase 1 | 設計ドキュメント（DESIGN.md v4 + ROADMAP + CLAUDE.md 更新） |
| Phase 2 | Rust バックエンド（7コマンド体系・status/optimize/diagnose/history/settings） |
| Phase 3 | フロントエンド実装（Main 1画面 + SettingsPanel/HistoryPanel スライドパネル） |
| Phase 4 | 統合・リリース（E2E テスト・品質ゲート全パス） |

今後の予定 → [ROADMAP.md](ROADMAP.md) 参照

---

## コスト監視

```bash
bash scripts/check-cost.sh         # 本日のコスト
bash scripts/check-cost.sh live    # リアルタイムダッシュボード
bash scripts/check-cost.sh blocks  # 現在の5時間ブロック
```

---

## 参照先

| 内容 | ファイル |
| ------ | -------- |
| デザイントークン SSOT | `src/design-tokens.ts` |
| デザイン仕様（全体） | `DESIGN.md` |
| ロードマップ | `ROADMAP.md` |
| 引き継ぎログ | `HANDOFF.md` |
| Tauri v2 注意点 | `.claude/rules/tauri-v2-gotchas.md` |
| メモリー管理ルール | `.claude/rules/memory-decisions.md` |
