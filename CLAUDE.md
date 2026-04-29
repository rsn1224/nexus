# nexus — CLAUDE.md

## プロジェクト概要

**nexus** | Personal Gaming Dashboard
（React 19 + Tauri v2 + TypeScript + Zustand v5 + Tailwind v4 + Biome v2 + Rust edition 2024）

**実行環境:** Node.js >= 22.0.0 / Rust stable / Windows 10/11

**コンセプト:** ゲーム前の30秒ルーティン。開く → 状態確認 → 最適化 → 閉じる。

**画面構成:** Main 1画面（スクロール不要）+ スライドパネル 2枚（Settings, History）

---

## 開発コマンド

```bash
pnpm dev           # Vite 開発サーバー（フロントのみ）
pnpm tauri dev     # Tauri フル起動（推奨）
pnpm check         # Biome lint + format
pnpm typecheck     # tsc --noEmit
pnpm test          # Vitest
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
cd src-tauri && cargo fmt
```

---

## アーキテクチャ

- フロント: React 19 / Zustand v5 / `src/lib/tauri-commands.ts` に invoke 集約
- バックエンド: 4 層（commands → services → infra → parsers）、依存方向は逆禁止
- `commands/` はロジックを持たず `services/` に委譲。`services/` は `infra/` 経由で外部 I/O
- `sysinfo::System` は `PulseState` の 1 インスタンスのみ（`System::new_all()` 直接呼び出し禁止）
- 新コマンド追加時: `src-tauri/src/lib.rs` の `invoke_handler` に登録必須
- エラーは `src-tauri/src/error.rs` の `AppError` を使う

詳細ディレクトリ構成 → [ARCHITECTURE.md](ARCHITECTURE.md)

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
pnpm check             # Biome format + lint
pnpm typecheck         # tsc --noEmit
pnpm test              # vitest run
pnpm lint              # CSS 変数・アーキテクチャ・ファイルサイズ・インラインスタイル等
cargo check            # Rust 型チェック
cargo clippy           # Rust lint（警告 0）
cargo test             # Rust ユニットテスト
```

---

## デフォルト要件（変更不可）

| 要件 | 説明 |
| ------ | ------ |
| lint エラー 0 | `pnpm check` + `cargo clippy` |
| 型エラー 0 | `pnpm typecheck` |
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

## デザインシステム

SSOT: `src/design-tokens.ts` / CSS 実体: `src/index.css` @theme（変更時は両方更新）
⚠️ `nx-` プレフィックスクラスは廃止済み。使用禁止。
詳細 → [`.claude/rules/design-system.md`](.claude/rules/design-system.md) / [DESIGN.md](DESIGN.md)

---

## 参照先

| 内容 | ファイル |
| ------ | -------- |
| ディレクトリ構成 | `ARCHITECTURE.md` |
| デザイントークン SSOT | `src/design-tokens.ts` |
| デザイン仕様（全体） | `DESIGN.md` |
| デザインシステムルール | `.claude/rules/design-system.md` |
| Tauri v2 注意点 | `.claude/rules/tauri-v2-gotchas.md` |
| メモリー管理ルール | `.claude/rules/memory-decisions.md` |
| 状態管理ルール | `c:\dev\.claude\rules\state-management.md` |
