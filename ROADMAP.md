# ROADMAP.md — nexus オーバーホール実行計画

> **目的:** OVERHAUL.md に基づき、GPU監視・プロセス保護・自動ブースト等を段階的に実装
> **最終更新:** 2026-03-17

---

## Step OH1: PowerShell フラグ修正

**状態:** ✅ 完了済み

**変更ファイル:** `src-tauri/src/commands/winopt.rs`

**完了条件チェックリスト:**

- [x] `-NoProfile -NonInteractive -ExecutionPolicy Bypass` フラグが追加されている
- [x] cargo test 37件通過

---

## Step OH2: GPU 型定義・取得実装

**状態:** ✅ 完了済み

**変更ファイル:**

- `src-tauri/src/commands/hardware.rs`
- `src/types/index.ts`

**完了条件チェックリスト:**

- [x] HardwareInfo に `gpu_vram_total_mb / gpu_vram_used_mb / gpu_temp_c / gpu_usage_percent` が追加されている（全 Option）
- [x] Get-CimInstance Win32_VideoController で GPU 名・VRAM 合計が取得できる
- [x] AdapterRAM が bytes → MB 変換されている
- [x] GPU 情報が取得できない場合は全フィールド None で返りエラーにならない
- [x] `src/types/index.ts` の HardwareInfo 型が Rust 側と一致している
- [x] `cargo test` 通過
- [x] `npm run typecheck` 通過

---

## Step OH3: プロセス保護リスト実装

**状態:** ✅ 完了済み

**変更ファイル:**

- `src-tauri/src/commands/boost.rs`
- `src/components/boost/BoostWing.tsx`

**完了条件チェックリスト:**

- [x] `PROTECTED_PROCESSES` 定数が boost.rs に定義されている
- [x] `BoostAction` に `is_protected: bool` フィールドが追加されている
- [x] PROTECTED プロセスは `action: "skipped_protected"` で返りKILLされない
- [x] 結果テーブルの `skipped_protected` 行に `[PROT]` バッジが表示される
- [x] `cargo test` 通過
- [x] `npm run check` 通過

---

## Step OH4: GPU UI + AI ルール追加

**状態:** ✅ 完了済み

**変更ファイル:**

- `src/components/home/HomeWing.tsx`
- `src/lib/localAi.ts`

**完了条件チェックリスト:**

- [x] HomeWing の HW カードに GPU セクションが表示される
- [x] GPU データが全 null のときエラーにならず正常表示される
- [x] localAi.ts に GPU 温度ルールが追加されている（85°C → warn, 95°C → critical）
- [x] `npm run check` 通過
- [x] `npm run typecheck` 通過

---

## Step OH5: styles.ts 新規作成

**状態:** ✅ 完了済み

**変更ファイル:**

- `src/lib/styles.ts`（新規）

**完了条件チェックリスト:**

- [x] `S.monoLabel / S.monoValue / S.sectionTitle / S.microBadge` 等の共通定数が定義されている
- [x] `as const satisfies Record<string, React.CSSProperties>` で型安全になっている
- [x] `npm run check` 通過

---

## Step OH6: 自動ブースト設定

**状態:** ✅ 完了済み

**変更ファイル:**

- `src/stores/useLauncherStore.ts`
- `src/components/launcher/LauncherWing.tsx`
- `src/components/settings/SettingsWing.tsx`

**完了条件チェックリスト:**

- [x] `autoBoostEnabled` が useLauncherStore に追加されている
- [x] ゲーム起動時に `autoBoostEnabled === true` なら `runBoost()` が先行実行される
- [x] SettingsWing にトグルが追加されている
- [x] `npm run check` 通過
- [x] `npm run typecheck` 通過

---

## Step OH7: テスト追加

**状態:** ✅ 完了済み

**変更ファイル:**

- `src/test/localAi.test.ts`
- `src/test/stores.test.ts`

**完了条件チェックリスト:**

- [x] `homePageSuggestions`: CPU/MEM/ディスク/GPU 温度の境界値テスト
- [x] `boostPageSuggestions`: 全最適化済み / 未最適化 / 部分最適化
- [x] `launcherPageSuggestions`: ゲーム 0件 / お気に入り 0件 / 正常
- [x] `sortAndSlice`: critical が必ず先頭、max=3 で切り捨て
- [x] `useSettingsStore`: pollIntervalMs の初期値・変更
- [x] `npm run test` 全通過（81件）
- [x] `cargo test` 通過

---

## Step OH8: エラーハンドリング統一

**状態:** ✅ 完了済み

**変更ファイル:**

- `src/lib/tauri.ts`（新規）
- `src/services/perplexityService.ts`
- 全ストア（6ファイル）

**完了条件チェックリスト:**

- [x] `extractErrorMessage(err)` ヘルパーが `src/lib/tauri.ts` に定義されている
- [x] 全ストアの catch ブロックで `extractErrorMessage` を使用
- [x] `ApiResult<T>` 型パターンが perplexityService に適用されている
- [x] `npm run typecheck` 通過

---

## 全体最適化（OH 完了後）

**状態:** ✅ 完了済み（2026-03-17）

**変更ファイル:** LauncherWing / BoostWing / SettingsWing / perplexityService / pulse.rs / winopt.rs / hardware.rs

**完了条件チェックリスト:**

- [x] マジックナンバーを定数化（TypeScript 4ファイル）
- [x] `pulse.rs` の Mutex unwrap を `map_err` に修正
- [x] `winopt.rs` に `NETWORK_THROTTLE_DISABLED` 定数を追加
- [x] `hardware.rs` の GPU 未取得時に `warn!` ログ追加
- [x] 死骸ファイル `winopt_net.rs` / `winopt_win.rs` を削除
- [x] typecheck / Biome / clippy / tests 81件 すべて通過

---

## 並行実行可能グループ（参考）

| グループ | Steps | 状態 |
| -------- | ----- | ---- |
| A | OH2, OH3, OH5, OH6, OH8 | ✅ 完了 |
| B | OH4 | ✅ 完了 |
| C | OH7 | ✅ 完了 |

---

## 将来のロードマップ

| ID | 内容 | 前提 | 状態 |
| -- | ---- | ---- | ---- |
| OH-B1 | BoostWing リアルタイムプロセスリスト | OH3 完了後 | 未着手 |
| OH-B2 | NVIDIA GPU 使用率取得（nvml-wrapper） | OH2 完了後 | 未着手 |
| OH-B3 | ゲームスコア実装（CPU/MEM/DISK/GPU 加重平均） | OH4 完了後 | 未着手 |
| OH-B4 | 全設定リバート + アンインストールフロー | OH6 完了後 | 未着手 |
| OH-B5 | ウィンドウ最小幅設定（minWidth: 900） | いつでも | ✅ 完了 |
