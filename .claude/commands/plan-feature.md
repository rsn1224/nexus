機能名: $ARGUMENTS

$ARGUMENTS が空の場合は「機能名を引数で指定してください（例: /plan-feature dark-mode）」と伝えて処理を停止すること。
機能名はケバブケースで指定する（例: `dark-mode`、`network-optimizer`）。スペースは使わない。

ソースコードおよびテストファイルは変更しません。`docs/specs/` 配下のドキュメント生成のみ行います。

## プロジェクト共通制約

このコマンド全体を通じて以下の制約が適用される:

- TS/TSX: 200行制限（scripts/check-file-size.mjs が CI で強制）
- Rust: 300行制限
- デザイントークン: src/index.css の CSS 変数のみ使用（ハードコード色禁止）
- console.log / println! 禁止（logger.ts / tracing::info! を使う）
- any 型禁止
- インラインスタイル禁止
- Rust 4層ルール厳守: commands → services → infra/parsers（逆方向禁止）
- 新 Rust コマンドは src-tauri/src/lib.rs の invoke_handler に必ず登録
- System::new_all() を各コマンドで直接呼ばない（PulseState を使う）

## Step 1: 調査（読み取り専用）

以下を調査して報告すること:

### フロントエンド側

- 影響するストア・コンポーネント（ファイル:行番号を明示）
- 既存の類似実装（再利用できるものを優先）
- 追加するファイルと変更するファイルの候補リスト

### Rust バックエンド側

- 影響する Rust レイヤー（commands / services / infra）と該当ファイル
- 新規追加が必要な Tauri コマンド候補（関数名・引数型・戻り値型の概案）
- PulseState や既存 services との接続方法

## Step 2: proposal.md を生成

`docs/specs/$ARGUMENTS/` ディレクトリーが存在しない場合は作成してから、`docs/specs/$ARGUMENTS/proposal.md` を生成すること:

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

## Step 3: 完了報告

生成したファイルのパス（`docs/specs/$ARGUMENTS/proposal.md`）を示して、「計画が完成しました。実装を開始する場合は `feat.md` コマンド（`/feat $ARGUMENTS`）を実行してください。」と伝えること。

ソースコードの変更は一切行わないこと。
