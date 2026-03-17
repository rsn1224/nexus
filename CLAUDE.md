# nexus — CLAUDE.md

Claude Code がこのプロジェクトで作業するときのルール。
グローバル `~/.claude/CLAUDE.md` のルールに加えて適用される。

---

## プロジェクト概要

**nexus** — Personal Base of Operations
個人向け統合管理ダッシュボード（React + Tauri v2 + Rust）

### Wings（機能エリア）

| Wing | パス | 責務 |
|------|------|------|
| `recon` | `src/components/recon/` | ネットワークスキャン・トラフィック監視 |
| `ops` | `src/components/ops/` | プロセス管理・Dockerコンテナ・AI提案 |
| `vault` | `src/components/vault/` | パスワード・APIキー・設定の安全管理 |
| `archive` | `src/components/archive/` | ノート・リンク付きナレッジ管理 |
| `pulse` | `src/components/pulse/` | リソース時系列グラフ（CPU/MEM/NET） |
| `chrono` | `src/components/chrono/` | タスク管理・スケジュール |
| `link` | `src/components/link/` | クリップボード履歴・スニペット管理 |
| `beacon` | `src/components/beacon/` | ファイルシステム監視 |
| `signal` | `src/components/signal/` | RSS フィード・HTTP ポーリング |

---

## 開発コマンド

```bash
npm run dev        # Vite 開発サーバー（フロントのみ）
npm run tauri dev  # Tauri フル起動（推奨）
npm run check      # biome check --write .（フォーマット + リント）
npm run lint       # CSS変数・Deadコード・HANDOFF.md 検証
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
cd src-tauri && cargo fmt
```

---

## レビューワークフロー

Cascade が実装完了したら、以下の手順でレビューしてから push する。

### ステップ 1 — ステージング

```bash
git add -p   # 変更を1ブロックずつ確認しながらステージング
             # y = 追加 / n = スキップ / s = 分割 / ? = ヘルプ
```

### ステップ 2 — Claude Code レビュー

**TSX / TS ファイルのレビュー:**
```bash
./scripts/review.sh                          # ステージング済み全ファイル
./scripts/review.sh src/components/xxx/XxxWing.tsx  # 特定ファイルのみ
```

**Rust ファイルのレビュー:**
```bash
./scripts/review-rust.sh                           # src-tauri/src/commands/ 全体
./scripts/review-rust.sh src-tauri/src/commands/xxx.rs  # 特定ファイルのみ
```

> **ヒント:** 2回目以降は `↑ Enter` で再実行できる

### ステップ 3 — 結果の判定

| 出力 | 対応 |
|------|------|
| `APPROVED` | そのまま `git commit && git push` |
| `REQUIRES_CHANGES` | 指摘内容を Cascade に貼り付けて修正依頼 → ステップ1に戻る |

### ステップ 4 — push

```bash
git commit -m "feat: xxx"
git push
```

### タイミングまとめ

```
Cascade 実装完了の報告
  └─ git add -p              （変更を目視確認）
  └─ ./scripts/review.sh     （↑ Enter で再実行可）
  └─ APPROVED → git push
  └─ REQUIRES_CHANGES → Cascade に修正指示 → 繰り返し
```

---

## アーキテクチャルール

### フロントエンド

- コンポーネントは対応する Wing フォルダに配置（例: recon 関連 → `src/components/recon/`）
- 共有コンポーネントは `src/components/shared/`（存在しない場合は作成可）
- 状態管理: Zustand（`src/stores/use{WingName}Store.ts` の命名）
- 型定義: `src/types/index.ts` に集約
- ロギング: `src/lib/logger.ts` の `log` を使う（`console.log` 禁止）

### バックエンド（Rust / Tauri）

- コマンドは Wing 単位でファイルを分ける: `src-tauri/src/commands/{wing}.rs`
- 新コマンド追加時は `src-tauri/src/lib.rs` の `invoke_handler` にも登録すること
- エラー型: `src-tauri/src/error.rs` の `AppError` を使う
- `unwrap()` は本番コードで禁止（テストは理由コメント付きで許可）
- `unsafe` 禁止（理由明記の場合を除く）

### 新 Wing の追加手順

1. `src/components/{wing}/` ディレクトリと `{Wing}Wing.tsx` を作成
2. `src/types/index.ts` に型を追加
3. `src-tauri/src/commands/{wing}.rs` を作成
4. `src-tauri/src/commands/mod.rs` に `pub mod {wing};` を追加
5. `src-tauri/src/lib.rs` の `invoke_handler` にコマンドを登録
6. `src/App.tsx` の `WING_COMPONENTS` に追加

---

## テスト方針

- フロントエンド: `src/stores/*.test.ts`（Zustand ストアのユニットテスト）
- Rust: 各コマンドファイル内の `#[cfg(test)] mod tests`
- カバレッジ目標: 80% 以上
- ロジック変更後は必ずテストを実行してパスを確認すること

---

## 禁止事項

- `console.log` / `println!` の本番コードへの混入（`log.info` / `tracing::info!` を使う）
- `src/types/index.ts` 以外での型定義の分散（共有型は必ず集約）
- `any` 型の使用（Biome の `noExplicitAny: error` で自動検出される）
- APIキー・シークレットのハードコード

---

## Cascade との協業

- Cascade が実装 → Claude Code がレビュー → Cascade が修正 というフローが標準
- Claude Code が直接実装する場合も同じ品質基準を適用する
- `.windsurfrules`（`c:\Users\rsn12\dev\.windsurfrules`）に共通ルールが定義されている
