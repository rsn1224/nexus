機能名: $ARGUMENTS

## Phase 1: 調査（コード変更禁止）

以下を調査して報告すること:
- 影響するストア・コンポーネント（ファイル:行番号を明示）
- 既存の類似実装（再利用できるものを優先）
- 追加するファイルと変更するファイルの候補リスト

<constraints>
- TS/TSX: 200行制限（scripts/check-file-size.mjs が CI で強制）
- Rust: 300行制限
- デザイントークン: src/index.css の CSS 変数のみ使用（ハードコード色禁止）
- console.log / println! 禁止（logger.ts / tracing::info! を使う）
- any 型禁止
- インラインスタイル禁止
- Rust 4層ルール厳守: commands → services → infra/parsers（逆方向禁止）
- 新 Rust コマンドは src-tauri/src/lib.rs の invoke_handler に必ず登録
- System::new_all() を各コマンドで直接呼ばない（PulseState を使う）
</constraints>

調査完了後、`docs/specs/$ARGUMENTS/proposal.md` を以下の内容で生成すること:

```markdown
# [機能名]: Proposal

## 背景・動機
（なぜこの機能が必要か）

## ゴール
（実装後に達成できること）

## 非ゴール
（スコープ外の内容）

## 影響ファイル

### フロントエンド
（変更するファイルと追加するファイルの一覧）

### Rust バックエンド
（変更するファイルと追加するファイルの一覧）

## 想定 Rust コマンド候補
（関数名・引数型・戻り値型の概案）

## 実装方針メモ
（技術的な選択肢と推奨アプローチ）

## 懸念・リスク
（既知の問題や注意点）
```

生成後、変更ファイル一覧を提示して実装の承認を求めること。

## Phase 2: 実装（承認後のみ）

承認を受けたら、実装を開始する前に `docs/specs/$ARGUMENTS/` へ以下を生成すること:

**spec.md**（技術設計）:

```markdown
# [機能名]: Spec

## Rust 側 API
詳細: コマンド関数シグネチャ・入出力型

## TypeScript 側
詳細: invoke ラッパーの型定義・Zustand ストア設計

## コンポーネント設計
詳細: Props 型・状態管理方針
```

**tasks.md**（実装チェックリスト）:

```markdown
# [機能名]: Tasks

- [ ] 型定義（src/types/）
- [ ] Rust コマンド実装（services 層）
- [ ] Rust コマンド実装（commands 層）
- [ ] invoke_handler 登録（src-tauri/src/lib.rs）
- [ ] tauri-commands.ts に invoke ラッパー追加
- [ ] Zustand ストア実装
- [ ] コンポーネント実装
- [ ] /check 全 PASS 確認
```

その後、tasks.md のチェックリストに沿って実装を進めること。各タスク完了時にチェックを入れること。

## 完了条件

- `npm run check` — エラー 0
- `npm run typecheck` — 型エラー 0
- `cargo clippy -- -D warnings` — warning 0
- `npm run test` — 全テストグリーン
