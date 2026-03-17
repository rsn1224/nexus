# AGENTS.md — nexus AI 協業ワークフロー

このファイルは nexus プロジェクトにおける AI エージェントの役割分担と協業フローを定義する。

---

## ワークフロー概要

```text
Perplexity → Claude Code → Cascade → Claude Code
```

このサイクルを 1 イテレーションとして繰り返す。

---

## 各 AI の役割

| エージェント | 主な担当 | 得意領域 |
| ------------ | -------- | -------- |
| **Perplexity** | 設計レビュー・事前検証 | プロンプト品質チェック、GitHub リポジトリ参照による存在しない型・関数の検出、ライブラリ最新 API 調査 |
| **Claude Code** | 仕様設計・レビュー・検証 | ROADMAP/仕様書作成、実装後コードレビュー、テスト実行・品質保証、ローカルファイル全参照 |
| **Cascade** | 実装作業 | ファイル作成・編集・削除、複数ファイル同時編集、Biome/clippy などの品質チェック実行 |

### 役割の境界線

- **Claude Code が直接実装する場面**: コンパイルエラー修正（Rust API 互換など即時対応が必要な場合）、Cascade 出力の不完全コードの即時パッチ
- **Cascade に委譲する場面**: 新機能の複数ファイル実装、フォーマット統一、テスト追加
- **Perplexity に確認する場面**: 実装前の設計判断、ライブラリの最新 API 確認、プロンプトの事前レビュー

---

## セッション開始チェックリスト

新しいセッションを始める前に以下を確認すること:

- [ ] `ROADMAP.md` の現在地（どのステップまで完了しているか）を確認
- [ ] `git status` / `git diff main` でローカルと master の差分を確認
- [ ] 前回セッションの既知バグリストを確認（未解決のものがあれば最優先）

---

## Cascade 向けプロンプトテンプレート

````markdown
## タスク: {タスク名}

### 前提確認（必須）
- 関連ファイルを読むこと: {読むべきファイルのパスリスト}
- 依存関係: {関連ストア・型定義・Rust コマンドなど}
- 既存パターン参照: {流用すべき実装パターン（例: useBoostStore.ts のエラーハンドリング）}

### 対象ファイル
- 新規作成: {ファイルパス}
- 編集: {ファイルパス}
- 登録が必要なファイル: {mod.rs / lib.rs / App.tsx など副作用があるファイル}

### 実装内容
{箇条書きで実装すべき内容を具体的に記述}

### 注意事項
- {型制約・API バージョン依存など注意が必要な点}
- unwrap() は本番コードで禁止
- console.log / println! 禁止（log. / tracing:: を使うこと）
- any 型禁止

### 完了条件
- [ ] {機能要件1}
- [ ] {機能要件2}

### 品質チェック（必須）
- [ ] `cargo build` が成功する
- [ ] `cargo clippy -- -D warnings` が通る
- [ ] `cargo fmt` を実行済み
- [ ] `npm run typecheck` が通る
- [ ] `npm run check`（Biome）が通る
- [ ] `npm run test` が通る（ロジック変更がある場合）
````

---

## バグ報告フォーマット

レビュー・テスト実行後のバグ報告は以下の表形式で記録する:

| # | 症状 | 原因 | 修正 |
| - | ---- | ---- | ---- |
| 1 | {ユーザーが見た症状} | {技術的な根本原因} | {修正内容の要約} |

---

## プロジェクト固有の注意事項（全エージェント共通）

### Tauri v2 エラーハンドリング（TypeScript）

`invoke()` のエラーは `Error` インスタンスではなく plain object。全 catch ブロックで以下のパターンを使うこと:

```typescript
const message =
  err instanceof Error
    ? err.message
    : typeof err === 'string'
      ? err
      : (err as Record<string, unknown>).message != null
        ? String((err as Record<string, unknown>).message)
        : JSON.stringify(err);
```

### JSX Unicode エスケープ

JSX テキストノード内で `\uXXXX` は解釈されない。JS 式として書くこと:

```tsx
// NG（"25b6テキスト" と表示される）
\u25b6 テキスト

// OK
{'\u25b6'} テキスト
```

### PowerShell（Windows）

- 日本語 Windows では文字化け対策として UTF-8 プレフィックスを付ける:

```text
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; {コマンド}
```

- `findstr` は一致なしで exit code 1 を返す → `unwrap_or_default()` で対処
- `Select-Object -ExpandProperty` は対象プロパティが存在しない場合に exit code 1 → `unwrap_or_default()`
- HKLM レジストリ書き込みは管理者権限が必要 → `.map_err(|_| AppError::Command("管理者権限が必要です。nexus を管理者として実行してください。".to_string()))`

### sysinfo 0.32 API（Rust）

```rust
// プロセス名: &OsStr → String
p.name().to_string_lossy().to_string()

// ディスク使用量
p.disk_usage().read_bytes
p.disk_usage().written_bytes

// PID 変換（u32 → Pid）
sysinfo::Pid::from(pid as usize)

// kill() は bool を返す（Result ではない）
if process.kill() { ... }
```

---

## 過去の実装で確立したパターン

### Zustand ストア構造

```typescript
// src/stores/use{Wing}Store.ts
interface {Wing}Store {
  // state fields
  // actions: () => Promise<void>
}
export const use{Wing}Store = create<{Wing}Store>((set, get) => ({ ... }));
```

### Tauri コマンド追加手順

1. `src-tauri/src/commands/{wing}.rs` にコマンドを実装
2. `src-tauri/src/commands/mod.rs` に `pub mod {wing};` を追加
3. `src-tauri/src/lib.rs` の `invoke_handler!` に登録

### ApiResult パターン（外部 API 呼び出し）

```typescript
// src/services/{service}.ts
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
// 関数は throw しない — 全パスで ApiResult を返す
```

---

## 定期リファクタリング — 自動検出パターン

次回セッション開始時や、大きな機能追加後に以下のパターンで問題を検出すること。

### TypeScript 検出

```bash
# Tauri v2 エラーハンドリング未適用の catch ブロック
grep -rn "String(err)\|err\.message" src/stores/ --include="*.ts"

# マジックナンバー候補（3桁以上の数値リテラル）
grep -rn "[^A-Z_][0-9]\{3,\}[^0-9]" src/ --include="*.ts" --include="*.tsx"

# JSX テキストノード内の Unicode エスケープ
grep -rn "\\\\u[0-9a-fA-F]\{4\}" src/components/ --include="*.tsx"
```

### Rust 検出

```bash
# 本番コードの unwrap()（テスト外）
grep -rn "\.unwrap()" src-tauri/src/commands/ --include="*.rs"

# mod.rs に未登録の .rs ファイル（死骸ファイル候補）
comm -23 \
  <(ls src-tauri/src/commands/*.rs | xargs -I{} basename {} .rs | sort) \
  <(grep "pub mod" src-tauri/src/commands/mod.rs | awk '{print $3}' | tr -d ';' | sort)
```

### 品質チェック一括実行

```bash
cd src-tauri && cargo clippy -- -D warnings && cargo fmt --check && cd ..
npm run typecheck && npm run check && npm run test
```
