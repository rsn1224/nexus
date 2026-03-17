# Claude Code 仕様書作成プロンプト — ゲーム特化強化

以下を Claude Code にそのまま貼り付けてください。

---

## プロンプト本文

```
あなたはシニア・システムアーキテクトです。
nexus をゲーム特化の軽量最適化ツールとして大幅強化するための「実装仕様書」を作成してください。

## 背景

添付の `docs/game-enhancement-plan.md` に、Perplexity で調査した強化プランがあります。
このプランを **nexus の既存アーキテクチャに適合した実装仕様書** に落とし込んでください。

強化プランの要約（優先順）:
1. ゲームプロファイルシステム（Steam連携・自動適用/リバート）
2. CPUアフィニティ・コアアイソレーション（P-Core/E-Core分離）
3. 段階的ブースト再設計（kill方式→suspend/電源/アフィニティの3段階）
4. フレームタイム監視（ETWベース・0.1%/1% low）
5. タイマーリゾリューション管理（NtSetTimerResolution FFI）

## 作業内容

### Step 1: 現状コードベース分析

以下のファイルを読んで、ゲーム強化に関連する既存コードを棚卸しすること:

**Rust バックエンド（拡張対象）:**
- `src-tauri/src/commands/boost.rs` — 現在のブーストロジック（kill方式）
- `src-tauri/src/commands/launcher.rs` — ゲーム起動・Steam連携
- `src-tauri/src/commands/ops.rs` — プロセス管理
- `src-tauri/src/commands/pulse.rs` — システム監視（CPU/RAM）
- `src-tauri/src/commands/hardware.rs` — GPU/温度監視
- `src-tauri/src/services/boost.rs` — ブーストサービス層
- `src-tauri/src/services/process.rs` — プロセスサービス層
- `src-tauri/src/services/system_monitor.rs` — システム監視サービス
- `src-tauri/src/services/hardware.rs` — ハードウェアサービス
- `src-tauri/src/state.rs` — 共有状態（PulseState）
- `src-tauri/src/lib.rs` — コマンド登録・manage() 一覧
- `src-tauri/src/error.rs` — AppError 定義
- `src-tauri/src/parsers/vdf.rs` — VDFパーサー（Steam連携用）
- `src-tauri/src/constants.rs` — 定数・保護プロセスリスト
- `src-tauri/Cargo.toml` — 現在の依存クレート

**フロントエンド（拡張対象）:**
- `src/stores/useBoostStore.ts` — ブーストストア
- `src/stores/useLauncherStore.ts` — ランチャーストア
- `src/stores/useOpsStore.ts` — プロセスストア
- `src/stores/usePulseStore.ts` — パルスストア
- `src/stores/useHardwareStore.ts` — ハードウェアストア
- `src/components/boost/BoostWing.tsx` — ブーストUI（3タブ構造）
- `src/components/launcher/LauncherWing.tsx` — ランチャーUI
- `src/components/home/HomeWing.tsx` — ダッシュボード
- `src/types/index.ts` — 全共有型定義

**設計ドキュメント:**
- `CLAUDE.md` — 開発ルール・アーキテクチャ概要
- `DESIGN.md` — UI設計規約
- `HANDOFF.md` — Cascade引き継ぎフォーマット
- `ROADMAP.md` — 現在のロードマップ

### Step 2: 仕様書の作成

以下の構造で `docs/specs/game-enhancement-spec.md` を作成すること:

```markdown
# ゲーム特化強化 — 実装仕様書

## 1. 概要
- 目的・スコープ・前提条件
- 既存 Phase 3/6/7 との関係（ゲーム強化は Phase 8以降として追加）

## 2. 新規 Rust 型定義
- GameProfile 構造体（全フィールド・derive・serde属性）
- CpuTopology / CoreIsolation 型
- BoostLevel / BoostStrategy enum
- TimerResolution 型
- FrameTimeSnapshot 型
- 全てのフィールドに doc comment を付けること

## 3. 新規 Tauri コマンド一覧
- コマンド名、引数、戻り値を表形式で列挙
- 既存コマンドとの依存関係
- capabilities/default.json への追加 permission

## 4. 新規/変更ファイル一覧
- ファイルパス・新規/変更・概要を表形式で
- 4層アーキテクチャ遵守（commands → services → infra）

## 5. データフロー図
- ゲーム起動検出 → プロファイル適用 → ゲーム終了 → リバート の全フロー
- Tauri イベント（emit/listen）の設計
- フロントエンドストアとの接続

## 6. 段階的ブースト仕様
- Level 1/2/3 の具体的な操作リスト
- 各操作の Rust 実装方針（Windows API / PowerShell / レジストリ）
- リバート保証の仕組み

## 7. CPUアフィニティ仕様
- Windows API（SetProcessAffinityMask）のFFI設計
- Intel P/E-Core / AMD CCD 自動検出のロジック
- 子プロセス追従の仕組み

## 8. タイマーリゾリューション仕様
- ntdll.dll NtSetTimerResolution の FFI 定義
- ゲーム起動/終了連動のライフサイクル
- エラーハンドリング（権限不足時）

## 9. フレームタイム監視仕様（Phase 9a 向け・設計のみ）
- ETW アプローチの概要
- 必要な crate（ferrisetw 等）
- 0.1%/1% low の計算ロジック
- ★ Phase 8 完了後に着手するため、詳細設計のみで実装指示は不要

## 10. フロントエンド変更仕様
- 新規ストア: useGameProfileStore.ts
- 既存ストア変更: useBoostStore.ts, useLauncherStore.ts
- 新規/変更 Wing コンポーネント
- TypeScript 型定義（src/types/index.ts への追加）

## 11. テスト戦略
- Rust ユニットテスト（services/ レイヤー）
- TypeScript ユニットテスト（ストア・ロジック）
- E2E シナリオ（ゲーム起動→ブースト→終了）
- モック戦略（Windows API を直接呼べない CI 環境向け）

## 12. Cascade 実装プロンプト分割案
- Phase 8a/8b/9a/9b をそれぞれ Cascade プロンプト単位に分割
- 各プロンプトの入力ファイル・出力ファイル・検証手順
- HANDOFF.md への追記テンプレート

## 13. ROADMAP.md 更新案
- Phase 8a/8b/9a/9b/10 の追加
- 依存関係図の更新
- 工数見積もり
```

### Step 3: ROADMAP.md に Phase 8〜10 を追記

仕様書と整合する形で `ROADMAP.md` に以下を追記:
- Phase 8a: ゲームプロファイル基盤
- Phase 8b: CPUアフィニティ・ブースト再設計
- Phase 9a: フレームタイム監視
- Phase 9b: タイマーリゾリューション・ネットワーク強化
- Phase 10: 高度な可視化・スコア再設計
- 依存関係図の更新

### Step 4: HANDOFF.md にゲーム強化セクションを追記

HANDOFF.md に Phase 8a の Cascade 実装プロンプトの雛形を追記する。
既存の Phase 0〜5 のフォーマットに従うこと（前提条件・対象ファイル・実装内容・注意事項・完了条件・品質チェック の6項目）。

## 制約

- 既存のアーキテクチャ（4層: commands/services/infra/parsers）を遵守
- 新規 crate 追加は最小限にし、追加する場合は理由を明記
- 全ての Windows API 呼び出しは infra/ レイヤーに隔離
- 既存コマンド・型・ストアとの互換性を壊さない
- CLAUDE.md のデフォルト要件（lint 0, type error 0, no any, no console.log, no unwrap, no inline style）を遵守
- 常駐メモリ 30MB 以下・CPU アイドル 0.5% 以下の軽量性目標を維持
- フレームタイム監視（Phase 9a）は設計のみ。ETW の実装詳細は Phase 8 完了後に改めて設計する
- Cascade プロンプトの言語ルール:
  コミットメッセージ、コードコメント、doc comment、エラーメッセージ、ログメッセージ、テスト名、変数名以外の自然言語テキストはすべて日本語で記述。コード中の文字列リテラル（ユーザー向けメッセージ）も日本語にすること。

## 出力

1. `docs/game-enhancement-plan.md`（添付ファイルをそのまま配置）
2. `docs/specs/game-enhancement-spec.md`（新規・メイン成果物）
3. `ROADMAP.md`（Phase 8〜10 追記）
4. `HANDOFF.md`（Phase 8a セクション追記）

作業を始める前に、ファイル読み込み結果をもとに「発見した課題・設計判断が必要な点」を箇条書きで提示し、私の承認を待ってください。
```

---

## 事前準備（Claude Code に投げる前に）

1. `nexus-game-enhancement-plan.md` を `docs/game-enhancement-plan.md` としてリポジトリに配置:
   ```bash
   mkdir -p docs
   cp /path/to/nexus-game-enhancement-plan.md docs/game-enhancement-plan.md
   git add docs/game-enhancement-plan.md
   git commit -m "docs: ゲーム特化強化プラン追加"
   git push
   ```

2. Claude Code を nexus プロジェクトルートで起動:
   ```bash
   cd C:\Users\rsn12\nexus
   claude
   ```

3. 上記プロンプト本文をそのまま貼り付ける

## 期待される所要時間

- Step 1（コード読み込み）: 3〜5分
- Step 2（仕様書作成）: 10〜15分
- Step 3-4（ROADMAP/HANDOFF更新）: 3〜5分
- 合計: 約20分

## プロンプト設計の意図

| 設計判断 | 理由 |
|---------|------|
| 「ファイルを読んでから設計」を強制 | 既存コードと乖離した仕様を防ぐ |
| 承認ゲートを設置 | 自動実行で暴走するリスクを回避 |
| Phase 9a は「設計のみ」 | ETW は複雑で、Phase 8 の土台がないと正確な設計ができない |
| HANDOFF.md のテンプレに含める | 仕様書→Cascade実装のハンドオフを1ステップで完結させる |
| 言語ルールを明記 | Cascade出力が英語になる問題の再発防止 |
