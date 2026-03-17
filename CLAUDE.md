# nexus — CLAUDE.md

Claude Code がこのプロジェクトで作業するときのルール。グローバル `~/.claude/CLAUDE.md` に加えて適用される。

---

## プロジェクト概要

**nexus** — Personal Gaming Dashboard（React + Tauri v2 + Rust）

### Wings

| Wing | パス | 責務 |
|------|------|------|
| `home` | `src/components/home/` | ダッシュボード概要 |
| `boost` | `src/components/boost/` | CPU優先度最適化 |
| `launcher` | `src/components/launcher/` | ゲームランチャー |
| `settings` | `src/components/settings/` | アプリ設定 |
| `windows` | `src/components/windows/` | Windowsプロセス・タスク管理 |
| `hardware` | `src/components/hardware/` | CPU/GPU/RAM監視 |
| `log` | `src/components/log/` | スクリプト実行ログ |
| `netopt` | `src/components/netopt/` | ネットワーク最適化 |
| `storage` | `src/components/storage/` | ストレージ監視 |

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

- コンポーネント: `src/components/{wing}/`（共有: `src/components/shared/`）
- 状態管理: Zustand `src/stores/use{Wing}Store.ts`
- 型定義: `src/types/index.ts`（すべての共有型はここに集約）
- ロギング: `src/lib/logger.ts` の `log`（`console.log` 禁止）
- Rust コマンド: `src-tauri/src/commands/{wing}.rs`
- 新コマンド追加時: `src-tauri/src/lib.rs` の `invoke_handler` にも登録

新 Wing 追加手順 → `AGENTS.md` 参照

---

## テスト

- TS: `src/stores/*.test.ts`（Vitest）
- Rust: 各コマンドファイル内の `#[cfg(test)] mod tests`
- カバレッジ目標: 80% 以上

---

## 禁止事項

- `console.log` / `println!` 本番コード混入（`log.info` / `tracing::info!` を使う）
- `any` 型（Biome の `noExplicitAny: error` で自動検出）
- APIキー・シークレットのハードコード
- `src/types/index.ts` 以外での共有型定義の分散

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

## 参照先

| 内容 | ファイル |
| ---- | ------- |
| UIデザイン規約・Tailwindクラス | `.claude/skills/nexus-design.md` |
| Cascade協業・モデル使い分け | `.claude/skills/cascade-workflow/SKILL.md` |
| Tauri v2 注意点 | `.claude/rules/tauri-v2-gotchas.md` |
| メモリ管理ルール | `.claude/rules/memory-decisions.md` |
