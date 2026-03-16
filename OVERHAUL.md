# OVERHAUL.md — nexus オーバーホール設計書

> **目的:** GPU監視・プロセス保護・自動ブースト等の生産性向上機能を段階的に追加
> **最終更新:** 2026-03-16

---

## 1. 解決する課題（優先順位付き）

### Must（リリースブロッカー）
- ~~PowerShell フラグ不足~~ **[完了済み — 本セッション中に修正・cargo test 37件通過]**
- GPU 監視の欠如（使用率・温度・VRAM）
- プロセス最適化の安全性（重要プロセス誤 KILL 防止）

### Should（品質向上）
- インラインスタイルの新規ファイル向け共通定数化（既存ファイルは対象外）
- テストカバレッジ不足（コンポーネントテスト・統合テストがない）
- ゲーム起動時の自動ブースト機能
- エラーハンドリングの一貫性（perplexityService.ts の二重 try-catch）

### Nice-to-have（競争優位）
- ゲームごとの個別最適化プロファイル
- FPS カウンター / ゲームパフォーマンス計測
- ウィンドウリサイズ対応（最小幅 800px）
- 全設定リバート + アンインストールフロー
- スキャン差分表示（前回との変化）

---

## 2. アーキテクチャ変更方針

### 変更する
- `src-tauri/src/commands/hardware.rs` — GPU データ取得フィールド追加
- `src-tauri/src/commands/boost.rs` — プロセス保護リスト追加
- `src/types/index.ts` — GPU 型フィールド追加
- `src/components/home/HomeWing.tsx` — GPU 表示カード追加
- `src/lib/localAi.ts` — GPU 温度ルール追加
- `src/stores/useSettingsStore.ts` — autoBoostOnLaunch フラグ追加
- `src/components/launcher/LauncherWing.tsx` — 自動ブースト連携
- `src/components/boost/BoostWing.tsx` — 保護プロセスバッジ UI

### 新規作成
- `src/lib/styles.ts` — 共通スタイル定数（新規コンポーネントのみ使用）
- `src/test/localAi.test.ts` — AI ルール境界値テスト
- `src/test/stores.test.ts` — Store 単体テスト

### 変更しない
- Tauri v2 / React / Zustand / Biome の基本スタック
- DESIGN.md のデザインシステム（CSS 変数・インラインスタイル方針）
- Wing 構造・ナビゲーション構造
- `Cargo.toml`（依存クレートの追加は最小限にとどめ、nvml-wrapper は追加しない）

---

## 3. GPU 監視設計

### 取得方法（優先順位）

このプロジェクトのターゲット環境は AMD CPU/GPU を含む Windows 環境。
NVIDIA 専用ライブラリは主軸にしない。

#### 1. PowerShell + Get-CimInstance Win32_VideoController（主軸）
- GPU 名・VRAM 合計・ドライバー情報が取得可能
- 使用率は Win32_VideoController では取得不可 → `gpu_usage_percent: None` で返す
- 温度は一部 AMD 環境で取れる場合があるが、不可なら `None`

#### 2. nvml-wrapper crate（本オーバーホールの対象外）
- Cargo.toml への追加は行わない
- 将来の NVIDIA 対応は別 Step として切り出す

#### 3. 取得不可 → None
- GPU フィールドはすべて `Option<T>` とし、取得失敗はエラーにしない
- フロントエンドでは `null` の場合 `N/A` を `--color-text-muted` で表示

### GPU データの配置先：HardwareInfo（hardware.rs）

GPU データは ResourceSnapshot（pulse.rs）には追加しない。
理由：pulse.rs は sysinfo による高頻度ポーリング専用。
      PowerShell プロセスを毎ポーリング起動するとオーバーヘッドが大きい。

GPU フィールドは HardwareInfo（hardware.rs）に追加する。
hardware.rs はすでに PowerShell 経由で gpu_name を取得しており、
GPU の自然な置き場として設計上も整合している。

#### HardwareInfo への追加フィールド:

```rust
pub gpu_vram_total_mb: Option<u64>,   // AdapterRAM / 1024 / 1024
pub gpu_vram_used_mb: Option<u64>,    // Win32では取得不可 → None
pub gpu_temp_c: Option<f32>,          // AMD環境では取得不可の場合 None
pub gpu_usage_percent: Option<f32>,   // Win32では取得不可 → None
```

#### PowerShell コマンド（hardware.rs 内で get_hardware_info に追加）:

```powershell
Get-CimInstance Win32_VideoController |
  Select-Object -First 1 Name, AdapterRAM |
  ConvertTo-Json -Compress
```

**注意：** AdapterRAM は bytes で返るため /1024/1024 して MB 換算すること。

#### フロントエンドの参照先:
- localAi.ts の GPU ルールは `hwInfo?.gpuTempC` を参照（変更なし）
- HomeWing の GPU 表示は `hwInfo` から読む（usePulseStore の変更不要）

---

## 4. プロセス保護リスト設計

### 実装方針：軽量版（A案）を採用

BoostWing の「プロセス最適化」タブは現在
「RUN BOOST ボタン + 実行結果テーブル」のみの構成であり、
個別プロセスリスト UI は存在しない。

新たなプロセスリスト UI は作成しない（工数対効果が低い）。
代わりに BoostAction の結果に `is_protected: bool` を追加し、
結果テーブルで「保護済みのためスキップ」として表示する。

### Rust 側

boost.rs に `PROTECTED_PROCESSES` 定数を追加：

```rust
const PROTECTED_PROCESSES: &[&str] = &[
    "system", "smss.exe", "csrss.exe", "wininit.exe",
    "winlogon.exe", "lsass.exe", "services.exe",
    "svchost.exe", "dwm.exe", "explorer.exe",
    "msmpeng.exe", "msseces.exe", "avp.exe",
    "nexus.exe",
];
```

BoostAction 型に `is_protected` フィールドを追加：

```rust
pub struct BoostAction {
    pub process_name: String,
    pub action: String,       // "killed" | "skipped_protected" | "skipped_threshold"
    pub is_protected: bool,
}
```

### KILL 実行前の保護チェック
- `PROTECTED_PROCESSES` に含まれる場合 → `action: "skipped_protected"`, `is_protected: true` で返す
- KILL せずに次のプロセスへ

### フロントエンド側（BoostWing.tsx の結果テーブルのみ変更）
既存の結果テーブルに `is_protected` 行の表示を追加：
- `action === "skipped_protected"` の行はテキストを `--color-text-muted` で表示
- 行末に `[PROT]` バッジ（border: `--color-text-muted`、fontSize: 9px）を追加
- KILL ボタンは結果テーブルに存在しないため disabled 対応は不要

### B案（フル版）について
BoostWing に OpsWing 相当のリアルタイムプロセスリストを新設し
各行に `[PROT]` バッジ + disabled KILL ボタンを付ける案は
工数が大幅に増えるため本オーバーホールの対象外とする。
将来の Step として ROADMAP に記録しておく。

---

## 5. スタイル定数化方針

### 方針：既存ファイルは対象外。新規ファイルのみ styles.ts を使用。

**理由：**
- HomeWing.tsx（~500行）/ BoostWing.tsx（~600行）の一括書き換えは 差分が大きすぎてレビュー困難
- Biome の未使用変数検出・型ズレによる品質チェック失敗リスクがある
- ROI が低い（機能追加なし、リスクのみ）

**実施すること：**
- `src/lib/styles.ts` を新規作成し、共通スタイルオブジェクトを定義
- 本オーバーホールで新規作成するファイルのみ `S.xxx` を使う
- DESIGN.md セクション 15 に「今後の新規ファイルは styles.ts を参照する」旨を追記

**実施しないこと：**
- 既存の HomeWing / BoostWing / LauncherWing / SettingsWing のインライン書き換え

---

## 6. テスト拡充方針

### TypeScript（Vitest）

#### src/test/localAi.test.ts
- `homePageSuggestions`: CPU 69/70/89/90/91% の境界値
- `homePageSuggestions`: メモリ 74/75/89/90% の境界値
- `homePageSuggestions`: ディスク 84/85/94/95% の境界値
- `homePageSuggestions`: GPU 温度 84/85/94/95°C の境界値
- `boostPageSuggestions`: 全最適化済み / 未最適化 / 部分最適化
- `launcherPageSuggestions`: ゲーム 0件 / お気に入り 0件 / 正常
- `sortAndSlice`: critical が必ず先頭、max=3 で切り捨て

#### src/test/stores.test.ts
- `useSettingsStore`: autoBoostOnLaunch の初期値・永続化

### Rust（cargo test）

#### boost.rs
- `test_protected_processes_not_killed`: PROTECTED 定数の各プロセスが除外されること

#### hardware.rs
- `test_gpu_fields_serialization`: Option フィールドの JSON シリアライゼーション

---

## 7. 自動ブースト設計

LauncherWing でゲームを起動したとき `autoBoostOnLaunch` が ON なら
`runBoost()` を先行実行してから `launchGame()` を呼ぶ。

```typescript
const handleLaunchGame = async (game: GameEntry) => {
  if (settings.autoBoostOnLaunch) {
    await useBoostStore.getState().runBoost();
  }
  await launchGame(game.appId);
};
```

- `autoBoostOnLaunch` は `useSettingsStore` に追加（デフォルト: false）
- SettingsWing の設定タブにトグルを追加
- `runBoost()` 中はゲーム起動ボタンを disabled にする

---

## 8. エラーハンドリング統一

### perplexityService.ts の修正方針：
- 二重 try-catch を排除
- エラーは `{ ok: true; data: T } | { ok: false; error: string }` 型で返す設計に変更
- 呼び出し元は catch ではなく result.ok で分岐する

---

## 9. 変更ファイル全一覧（予定）

| ファイル | 変更種別 | Step |
|---|---|---|
| src-tauri/src/commands/winopt.rs | 修正済み | OH1 ✅ |
| src-tauri/src/commands/hardware.rs | 修正 | OH2 |
| src-tauri/src/commands/boost.rs | 修正 | OH3 |
| src/types/index.ts | 修正 | OH2 |
| src/components/home/HomeWing.tsx | 修正 | OH4 |
| src/lib/localAi.ts | 修正 | OH4 |
| src/lib/styles.ts | 新規 | OH5 |
| src/stores/useSettingsStore.ts | 修正 | OH6 |
| src/components/launcher/LauncherWing.tsx | 修正 | OH6 |
| src/components/boost/BoostWing.tsx | 修正 | OH3 |
| src/services/perplexityService.ts | 修正 | OH8 |
| src/components/settings/SettingsWing.tsx | 修正 | OH6 |
| src/test/localAi.test.ts | 新規 | OH7 |
| src/test/stores.test.ts | 新規 | OH7 |

---

### 書き方の注意事項
- Markdown として読みやすく。## / ### を使うこと
- コードブロックには言語タグ必須（rust, typescript, powershell）
- 「未定」「TBD」禁止。決定できない項目は除外理由を書くこと
- DESIGN.md の原則（P1〜P7）に矛盾しないこと
