# ROADMAP.md — nexus オーバーホール実行計画

> **目的:** OVERHAUL.md に基づき、GPU監視・プロセス保護・自動ブースト等を段階的に実装
> **最終更新:** 2026-03-16

---

## Step OH1: PowerShell フラグ修正
**状態:** ✅ 完了済み（本セッション中に修正・cargo test 37件通過）
**依存:** なし
**変更ファイル:** `src-tauri/src/commands/winopt.rs` 
**理由:** セキュリティポリシーが Restricted な環境でのブロック防止。
**完了条件チェックリスト:**
- [x] `-NoProfile -NonInteractive -ExecutionPolicy Bypass` フラグが追加されている
- [x] cargo test 37件通過
**品質チェック:** `cargo test`（スキップ — 完了済み）

---

## Step OH2: GPU 型定義・取得実装
**状態:** 未着手
**依存:** なし
**変更ファイル:**
- `src-tauri/src/commands/hardware.rs`（HardwareInfo に GPU フィールド追加）
- `src/types/index.ts`（HardwareInfo 型に GPU フィールド追加）
**理由:** GPU データは on-demand の hardware.rs に集約。pulse.rs への混入を避けパフォーマンスリスクを排除。
**完了条件チェックリスト:**
- [ ] HardwareInfo に `gpu_vram_total_mb / gpu_vram_used_mb / gpu_temp_c / gpu_usage_percent` が追加されている（全 Option<T>）
- [ ] Get-CimInstance Win32_VideoController で GPU 名・VRAM 合計が取得できる
- [ ] AdapterRAM が bytes → MB 変換されている（/ 1024 / 1024）
- [ ] GPU 情報が取得できない場合（AMD 等）は全フィールド None で返りエラーにならない
- [ ] PowerShell フラグに `-NoProfile -NonInteractive -ExecutionPolicy Bypass` が含まれる
- [ ] `src/types/index.ts` の HardwareInfo 型が Rust 側と一致している
- [ ] `cargo test` 通過
- [ ] `npm run typecheck` 通過
**品質チェック:** `cargo test && npm run typecheck` 

---

## Step OH3: プロセス保護リスト実装
**状態:** 未着手
**依存:** なし（OH2 と並行可能）
**変更ファイル:**
- `src-tauri/src/commands/boost.rs` 
- `src/components/boost/BoostWing.tsx` 
**理由:** KILL 誤爆防止はセキュリティ上の Must。UI 修正（ErrorBanner / タブカラー / ヘッダー）も BoostWing を触るこのタイミングで同時に対応する。
**完了条件チェックリスト:**
- [ ] `PROTECTED_PROCESSES` 定数が boost.rs に定義されている
- [ ] `BoostAction` に `is_protected: bool` フィールドが追加されている
- [ ] PROTECTED プロセスは `action: "skipped_protected"` で返りKILLされない
- [ ] 結果テーブルの `skipped_protected` 行が `--color-text-muted` で表示される
- [ ] 結果テーブルの `skipped_protected` 行に `[PROT]` バッジが表示される
- [ ] BoostWing の ErrorBanner が `rgba(239,68,68,0.1)` + `borderBottom` スタイルに修正されている（DESIGN.md 準拠）
- [ ] BoostWing のアクティブタブカラーが `--color-accent-500` に修正されている（管理系 Wing）
- [ ] BoostWing の Wing ヘッダーに `flexShrink: 0` と `borderBottom` が追加されている
- [ ] `cargo test` 通過
- [ ] `npm run check` 通過
**品質チェック:** `cargo test && npm run check` 

---

## Step OH4: GPU UI + AI ルール追加
**状態:** 未着手
**依存:** OH2 完了後
**変更ファイル:**
- `src/components/home/HomeWing.tsx` 
- `src/lib/localAi.ts` 
**理由:** OH2 の型定義が完了してからでないとフロントが型エラーになる。
**完了条件チェックリスト:**
- [ ] HomeWing の HW カードに GPU セクションが表示される
- [ ] GPU 名が表示される（null の場合は `N/A` を `--color-text-muted` で表示）
- [ ] VRAM 合計が表示される（null の場合は `N/A`）
- [ ] GPU データが全 null のときエラーにならず正常表示される
- [ ] localAi.ts に GPU 温度ルールが追加されている（85°C → warn, 95°C → critical）
- [ ] GPU データが全 null のとき GPU ルールのサジェストは生成されない
- [ ] `npm run check` 通過
- [ ] `npm run typecheck` 通過
**品質チェック:** `npm run check && npm run typecheck` 

---

## Step OH5: styles.ts 新規作成
**状態:** 未着手
**依存:** なし（どの Step とも並行可能）
**変更ファイル:**
- `src/lib/styles.ts`（新規）
- `DESIGN.md`（セクション 15 追記のみ）
**理由:** 既存ファイルは変更しない。新規ファイルの品質基準を定義するだけ。
**完了条件チェックリスト:**
- [ ] `S.monoLabel / S.monoValue / S.sectionTitle / S.microBadge` 等の共通定数が定義されている
- [ ] `as const satisfies Record<string, React.CSSProperties>` で型安全になっている
- [ ] 既存ファイル（HomeWing / BoostWing 等）は一切変更されていない
- [ ] DESIGN.md セクション 15 に「新規ファイルは styles.ts を使う」旨が追記されている
- [ ] `npm run check` 通過（未使用変数エラーがないこと）
**品質チェック:** `npm run check` 

---

## Step OH6: 自動ブースト設定
**状態:** 未着手
**依存:** なし
**変更ファイル:**
- `src/stores/useSettingsStore.ts` 
- `src/components/launcher/LauncherWing.tsx` 
- `src/components/settings/SettingsWing.tsx` 
**理由:** Store → Launcher → Settings の順で依存するが全て同一 Step で完結できる。
**完了条件チェックリスト:**
- [ ] `autoBoostOnLaunch: boolean` が useSettingsStore に追加されている（デフォルト: false）
- [ ] localStorage に永続化されている（アプリ再起動後も維持される）
- [ ] ゲーム起動時に `autoBoostOnLaunch === true` なら `runBoost()` が先行実行される
- [ ] `runBoost()` 実行中はゲーム起動ボタンが `disabled` になる
- [ ] SettingsWing にトグルが追加されている
- [ ] `npm run check` 通過
- [ ] `npm run typecheck` 通過
**品質チェック:** `npm run check && npm run typecheck` 

---

## Step OH7: テスト追加
**状態:** 未着手
**依存:** OH2・OH4 完了後
**変更ファイル:**
- `src/test/localAi.test.ts`（新規）
- `src/test/stores.test.ts`（新規）
**理由:** OH2 の型変更と OH4 の GPU ルール追加が完了してからテストを書く。
**完了条件チェックリスト:**
- [ ] `homePageSuggestions`: CPU 69/70/89/90/91% の境界値テスト
- [ ] `homePageSuggestions`: メモリ 74/75/89/90% の境界値テスト
- [ ] `homePageSuggestions`: ディスク 84/85/94/95% の境界値テスト
- [ ] `homePageSuggestions`: GPU 温度 84/85/94/95°C の境界値テスト
- [ ] `homePageSuggestions`: GPU データが全 null のときサジェストが生成されないこと
- [ ] `boostPageSuggestions`: 全最適化済み / 未最適化 / 部分最適化
- [ ] `launcherPageSuggestions`: ゲーム 0件 / お気に入り 0件 / 正常
- [ ] `sortAndSlice`: critical が必ず先頭、max=3 で切り捨て
- [ ] `useSettingsStore`: autoBoostOnLaunch の初期値 false・永続化
- [ ] `hardware.rs`: test_gpu_fields_serialization（Option フィールドの JSON）
- [ ] `boost.rs`: test_protected_processes_not_killed
- [ ] `npm run test` 全通過
- [ ] `cargo test` 通過
**品質チェック:** `npm run test && cargo test` 

---

## Step OH8: エラーハンドリング統一
**状態:** 未着手
**依存:** なし
**変更ファイル:**
- `src/services/perplexityService.ts` 
**理由:** 他の Step と独立。Step 6b（Perplexity UI）の前に完了させると実装が楽になる。
**完了条件チェックリスト:**
- [ ] 二重 try-catch が排除されている
- [ ] `{ ok: true; data: T } | { ok: false; error: string }` 型相当の戻り値に変更されている
- [ ] 呼び出し側（SettingsWing 等）の catch が最小限になっている
- [ ] `npm run typecheck` 通過
**品質チェック:** `npm run typecheck` 

---

### 並行実行可能グループ

| グループ | Steps | 開始条件 |
|---------|-------|---------|
| A（同時実行可） | OH2, OH3, OH5, OH6, OH8 | 即時 |
| B（A 後） | OH4 | OH2 完了後 |
| C（B 後） | OH7 | OH2 + OH4 完了後 |

---

### 将来のロードマップ（本オーバーホール対象外）

| ID | 内容 | 前提 |
|----|------|------|
| OH-B1 | BoostWing リアルタイムプロセスリスト（B案） | OH3 完了後 |
| OH-B2 | NVIDIA GPU 使用率取得（nvml-wrapper） | OH2 完了後 |
| OH-B3 | ゲームスコア実装（CPU/MEM/DISK/GPU 加重平均） | OH4 完了後 |
| OH-B4 | 全設定リバート + アンインストールフロー | OH6 完了後 |
| OH-B5 | ウィンドウ最小幅設定（tauri.conf.json minWidth: 900） | いつでも |
