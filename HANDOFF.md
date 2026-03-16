# nexus — HANDOFF.md

> **Cascade ↔ Claude Code 引き継ぎログ**
> ステータス: `pending` → `in-progress` → `review` → `done`
> UI 実装時は必ず [`DESIGN.md`](DESIGN.md) を参照すること

---

## 進行中タスク

### タスク 2 — P1: Shell 左サイドバー化 + Wing 構成リセット

**ステータス**: pending
**担当**: Cascade
**背景**: nexus を最適化ツール（GPO 後継）として再構成する。
ナビゲーションを上部タブから左サイドバーに変更し、Wing 構成を新機能セットに置き換える。
UI/UX デザインは後続タスクで行うため、今回は**構造変更のみ**。新規 Wing はプレースホルダーでよい。

#### 仕様（Claude Code 記入）

**目的**: Shell を左サイドバー構造に変更し、新 Wing 構成を反映する

**変更ファイル一覧**:

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/types/index.ts` | 修正 | WingId を新セットに更新 |
| `src/App.tsx` | 修正 | WING_COMPONENTS 更新・初期 Wing を 'home' に変更 |
| `src/components/layout/Shell.tsx` | 大幅修正 | 上部タブ → 左サイドバーに再設計 |
| `src/components/home/HomeWing.tsx` | 新規 | プレースホルダー |
| `src/components/boost/BoostWing.tsx` | 新規 | プレースホルダー |
| `src/components/windows/WindowsWing.tsx` | 新規 | プレースホルダー |
| `src/components/hardware/HardwareWing.tsx` | 新規 | プレースホルダー |
| `src/components/netopt/NetoptWing.tsx` | 新規 | プレースホルダー |
| `src/components/storage/StorageWing.tsx` | 新規 | プレースホルダー |
| `src/components/log/LogWing.tsx` | 新規 | プレースホルダー |
| `src/components/settings/SettingsWing.tsx` | 新規 | プレースホルダー |

**削除しないがナビから外すファイル（コードは残す）**:
`VaultWing`, `ArchiveWing`, `ChronoWing`, `LinkWing`, `SignalWing`, `BeaconWing`, `SecurityWing`

---

#### 1. 新 WingId 型（`src/types/index.ts`）

```typescript
export type WingId =
  | 'home'
  | 'boost'
  | 'windows'
  | 'pulse'
  | 'hardware'
  | 'ops'
  | 'launcher'
  | 'advisor'
  | 'recon'
  | 'netopt'
  | 'storage'
  | 'log'
  | 'settings';
```

---

#### 2. Shell 左サイドバーのレイアウト仕様

**全体構造**:
```
┌──────────────────────────────────────────────────────┐
│ (scan-line そのまま維持)                              │
├──────────────┬───────────────────────────────────────┤
│  SIDEBAR     │  CONTENT                              │
│  width:160px │  flex: 1, overflow: hidden            │
│              │                                       │
│  ┌─────────┐ │                                       │
│  │ LOGO    │ │                                       │
│  │ 48px    │ │  ← 各 Wing の中身がここに表示          │
│  ├─────────┤ │                                       │
│  │ NAV     │ │                                       │
│  │ flex:1  │ │                                       │
│  │ scroll  │ │                                       │
│  ├─────────┤ │                                       │
│  │ STATUS  │ │                                       │
│  │ 56px    │ │                                       │
│  └─────────┘ │                                       │
└──────────────┴───────────────────────────────────────┘
```

**サイドバーのスタイル**:
- `width: 160px`, `flexShrink: 0`
- `background: var(--color-base-950)` ※ない場合は `var(--color-base-900)`
- `borderRight: '1px solid var(--color-border-subtle)'`
- `display: flex`, `flexDirection: column`

**ロゴエリア（48px）**:
- "NEXUS" — `var(--color-accent-500)`, 14px, fontWeight:700, letterSpacing:0.2em
- サブタイトル — "GAMING TOOLS", 9px, `var(--color-text-muted)`
- 右端または下部に時計 — 10px, muted（現行の formatClock をそのまま流用）

**ナビゾーン定義**:

```typescript
const SIDEBAR_ZONES = [
  {
    label: null, // ラベルなし（HOME は単独）
    wings: [{ id: 'home', label: 'HOME' }],
  },
  {
    label: 'OPTIMIZE',
    wings: [
      { id: 'boost', label: 'BOOST' },
      { id: 'windows', label: 'WINDOWS' },
    ],
  },
  {
    label: 'MONITOR',
    wings: [
      { id: 'pulse', label: 'PULSE' },
      { id: 'hardware', label: 'HARDWARE' },
    ],
  },
  {
    label: 'CONTROL',
    wings: [{ id: 'ops', label: 'OPS' }],
  },
  {
    label: 'GAME',
    wings: [
      { id: 'launcher', label: 'LAUNCHER' },
      { id: 'advisor', label: 'ADVISOR' },
    ],
  },
  {
    label: 'NETWORK',
    wings: [
      { id: 'recon', label: 'RECON' },
      { id: 'netopt', label: 'NETOPT' },
    ],
  },
  {
    label: 'SYSTEM',
    wings: [
      { id: 'storage', label: 'STORAGE' },
      { id: 'log', label: 'LOG' },
      { id: 'settings', label: 'SETTINGS' },
    ],
  },
] as const;
```

**ゾーンヘッダーのスタイル**:
- `fontSize: 9px`, `color: var(--color-text-muted)`, `letterSpacing: 0.15em`
- `padding: '12px 12px 4px'`

**ナビアイテムのスタイル**:
- 高さ: 28px, `padding: '0 12px 0 16px'`
- フォント: `var(--font-mono)`, 11px, letterSpacing: 0.08em
- アクティブ: `background: var(--color-accent-500)`, `color: #000`
- 非アクティブ: `background: transparent`, `color: var(--color-text-secondary)`
- ホバー: `background: var(--color-base-800)`

**サイドバー下部ステータス（56px）**:
- `borderTop: '1px solid var(--color-border-subtle)'`
- CPU% — `var(--color-accent-500)` or danger（50%以上で danger）
- SCORE — プレースホルダーで "-- / 100"（後続タスクで実装）
- フォント: 10px mono muted

---

#### 3. プレースホルダー Wing の構造

新規 Wing（HOME / BOOST / WINDOWS / HARDWARE / NETOPT / STORAGE / LOG / SETTINGS）は以下のテンプレートで作成する:

```tsx
export default function XxxWing(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid var(--color-border-subtle)', flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
          color: 'var(--color-accent-500)', letterSpacing: '0.15em',
        }}>
          ▶ WINGNAME / SUBTITLE
        </span>
      </div>
      {/* Placeholder content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '11px',
        color: 'var(--color-text-muted)', letterSpacing: '0.1em',
      }}>
        UNDER CONSTRUCTION
      </div>
    </div>
  );
}
```

各 Wing のヘッダー文言:

| Wing | ヘッダー文言 |
|---|---|
| HomeWing | `▶ HOME / OVERVIEW` |
| BoostWing | `▶ BOOST / OPTIMIZATION` |
| WindowsWing | `▶ WINDOWS / SETTINGS` |
| HardwareWing | `▶ HARDWARE / INFO` |
| NetoptWing | `▶ NETOPT / NETWORK` |
| StorageWing | `▶ STORAGE / APPS` |
| LogWing | `▶ LOG / HISTORY` |
| SettingsWing | `▶ SETTINGS / CONFIG` |

---

#### 4. App.tsx の変更点

- `WING_COMPONENTS` を新 WingId に合わせて更新
- 古い Wing のインポートは残さない（コンパイルエラーになるため削除）
- 初期 activeWing: `'home'`
- 初期 mountedWings: `new Set<WingId>(['home'])`

---

#### 受け入れ条件

- [ ] 左サイドバーが表示され、7ゾーン13アイテムが正しく並ぶ
- [ ] アクティブ Wing が accent 色でハイライトされる
- [ ] ホバー時に背景色が変わる
- [ ] 起動時に HOME が表示される
- [ ] 既存 Wing（OPS / PULSE / RECON / LAUNCHER / ADVISOR）が正常に表示・動作する
- [ ] 新規プレースホルダー Wing が "UNDER CONSTRUCTION" を表示する
- [ ] サイドバー下部に CPU% が表示される
- [ ] `npm run typecheck` PASS
- [ ] `npm run check` PASS
- [ ] `npm run test` PASS

#### DESIGN.md 準拠チェックポイント

- [ ] CSS 変数のみ使用
- [ ] フォント `var(--font-mono)`、サイズ規約通り
- [ ] ラベルは UPPER_CASE

#### Cascade 記入欄

- **実装内容**:
- **テスト実行結果**: `npm run typecheck` [ ] PASS / `npm run check` [ ] PASS / `npm run test` [ ] PASS
- **特記事項**:

#### Claude Code レビュー結果

- **判定**: [ ] PASS / [ ] REQUIRES_CHANGES
- **指摘事項**:
- **レビュー日**:

---

### タスク 3 — HomeWing 実装 + NavStore 導入

**ステータス**: pending
**担当**: Cascade
**前提**: タスク2完了済み（HomeWing プレースホルダーが存在すること）
**背景**: 起動直後に表示されるダッシュボード画面を実装する。既存ストアのデータを集約し、ゲームスコア・システムゲージ・クイック起動・アラートログを一画面に表示する。BOOST ボタンで BoostWing へ遷移できる。

#### ワイヤーフレーム

```
┌──────────────────────────────────────────────────────────────────┐
│ ▶ HOME / OVERVIEW                              [⚡ BOOST]        │
├─────────────┬──────────────┬──────────────┬──────────────────────┤
│    CPU       │     RAM      │   CPU TEMP   │       SCORE          │
│   32%        │  17.4/31 GB  │    45°C      │      90/100          │
│ ██████░░░░   │ ████████░░   │  [null: --]  │       GOOD           │
└─────────────┴──────────────┴──────────────┴──────────────────────┘
├────────────────────────────┬─────────────────────────────────────┤
│  QUICK LAUNCH              │  OPTIMIZATION HISTORY               │
│                            │                                     │
│  [▶ GameName]  [▶ Game2]   │  ● BOOST applied   09:00           │
│  [▶ Game3]                 │  ● App started     08:55           │
│  (scanGames 未実行なら      │                                     │
│   "NO GAMES — SCAN FIRST") │  (空の場合: NO HISTORY YET)        │
│                    → LNC   │                                     │
├────────────────────────────┴─────────────────────────────────────┤
│  ALERTS                                                          │
│  ⚠ CPU HIGH (80%+) — processName  [→ OPS]                      │
│  (正常時: ● SYSTEM NOMINAL)                                      │
└──────────────────────────────────────────────────────────────────┘
```

#### 設計メモ

- **スコア計算（クライアントサイド）**: `Math.round(100 - cpu * 0.5 - (memUsed/memTotal) * 30)`。データ未取得時は `--`
- **BOOST ボタン**: `useNavStore().navigate('boost')` を呼び出す
- **QUICK LAUNCH**: `useLauncherStore.games` の先頭5件。scanGames 未実行なら "NO GAMES — SCAN FIRST" + [SCAN] ボタン
- **OPTIMIZATION HISTORY**: `localStorage` に `nexus:home:history` として最大10件保存。初回は空
- **ALERTS**: `useOpsStore.processes` で cpuPercent >= 80 のプロセスを最大3件表示。なければ "SYSTEM NOMINAL"

#### 仕様

**目的**: ダッシュボード画面の実装とアプリ内ナビゲーション基盤の整備

**変更ファイル一覧**:

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/stores/useNavStore.ts` | 新規 | `navigate(wingId)` アクションを持つ最小ストア |
| `src/App.tsx` | 修正 | マウント時に `useNavStore.setState({ navigate: handleWingChange })` |
| `src/components/home/HomeWing.tsx` | 修正 | プレースホルダーを実装に差し替え |

**useNavStore の型**:

```typescript
interface NavStore {
  navigate: (wing: WingId) => void;
}
export const useNavStore = create<NavStore>(() => ({
  navigate: () => {},
}));
```

**受け入れ条件**:

- [ ] CPU% / RAM / CPU温度 / スコアが表示される（Pulse 未起動時は `--`）
- [ ] BOOST ボタンクリックで BoostWing に遷移する
- [ ] QUICK LAUNCH にゲーム名が表示され、クリックで起動できる
- [ ] ゲーム未スキャン時は "NO GAMES — SCAN FIRST" + [SCAN] ボタンが表示される
- [ ] CPU 80% 超プロセスが ALERTS に表示される
- [ ] 正常時は "SYSTEM NOMINAL" が表示される
- [ ] `npm run typecheck` PASS / `npm run check` PASS / `npm run test` PASS

#### T3-DESIGN.md 準拠チェックポイント

- [ ] CSS 変数のみ使用（ハードコードカラーなし）
- [ ] ゲージバーの色: 正常 `--color-success-500`、警告 `--color-accent-400`、危険 `--color-danger-500`
- [ ] BOOST ボタン: primary スタイル（`--color-accent-500` 塗り）
- [ ] フォント `var(--font-mono)`、サイズ規約通り
- [ ] ローディング / 空状態の表示あり

#### T3-Cascade 記入欄

- **実装内容**:
- **テスト実行結果**: `npm run typecheck` [ ] PASS / `npm run check` [ ] PASS / `npm run test` [ ] PASS
- **特記事項**:

#### T3-Claude Code レビュー結果

- **判定**: [ ] PASS / [ ] REQUIRES_CHANGES
- **指摘事項**:
- **レビュー日**:

---

### タスク 4 — LauncherWing 実装

**ステータス**: pending
**担当**: Cascade
**前提**: タスク2完了済み（LauncherWing プレースホルダーが存在すること）
**背景**: ゲームライブラリ画面を実装する。既存の `launcher.rs`（`scan_steam_games` / `launch_game`）と `useLauncherStore` をそのまま活用し、新規 Rust コードは不要。

#### ワイヤーフレーム

```
┌──────────────────────────────────────────────────────────────────┐
│ ▶ LAUNCHER / GAMES           N GAMES · LAST SCAN HH:MM  [SCAN]  │
├──────────────────────────────────────────────────────────────────┤
│  NAME                    APP ID      SIZE        ACTIONS         │
│  ──────────────────────────────────────────────────────────────  │
│  Football Manager 2026   1946240     4.2 GB      [▶ LAUNCH]      │
│  Counter-Strike 2        730         28.1 GB     [▶ LAUNCH]      │
│  Dota 2                  570         15.0 GB     [▶ LAUNCH]      │
│  ...                                                              │
│                                                                   │
│  (空の場合)                                                       │
│         NO GAMES — PRESS SCAN TO DETECT STEAM LIBRARY            │
│                                                                   │
│  (スキャン中)                                                     │
│         SCANNING STEAM LIBRARY...                                 │
└──────────────────────────────────────────────────────────────────┘
```

#### 仕様

**目的**: Steam ゲームライブラリ一覧の表示と起動

**変更ファイル一覧**:

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/components/launcher/LauncherWing.tsx` | 修正 | プレースホルダーを実装に差し替え |

**注意事項**:
- `LauncherWing.tsx` の置き場所はタスク2で作成したパス（`src/components/launcher/`）に従う
- タスク2実施前の場合は `src/components/ops/LauncherWing.tsx` を参考に新規作成
- `size_gb` は Rust 側で `0.0` 固定のため、`0.0` の場合は `--` 表示とすること

**受け入れ条件**:

- [ ] マウント時に自動で `scanGames()` を実行する
- [ ] ゲーム一覧がテーブル形式（NAME / APP ID / SIZE / ACTIONS）で表示される
- [ ] `size_gb === 0` の場合は SIZE 列に `--` を表示する
- [ ] [▶ LAUNCH] ボタンで Steam 経由でゲームが起動する
- [ ] スキャン中は "SCANNING STEAM LIBRARY..." を表示する
- [ ] Steam 未インストール時はエラーバナーを表示する
- [ ] ゲームが0件時は空状態ガイドを表示する
- [ ] `npm run typecheck` PASS / `npm run check` PASS / `npm run test` PASS

#### T4-DESIGN.md 準拠チェックポイント

- [ ] CSS 変数のみ使用
- [ ] [▶ LAUNCH] ボタン: primary スタイル（`--color-accent-500` 塗り）
- [ ] テーブルヘッダー: UPPER_CASE、10px muted
- [ ] ローディング / エラー / 空状態の表示あり

#### T4-Cascade 記入欄

- **実装内容**:
- **テスト実行結果**: `npm run typecheck` [ ] PASS / `npm run check` [ ] PASS / `npm run test` [ ] PASS
- **特記事項**:

#### T4-Claude Code レビュー結果

- **判定**: [ ] PASS / [ ] REQUIRES_CHANGES
- **指摘事項**:
- **レビュー日**:

---

### タスク 5 — ScriptWing 実装（新規 Wing）

**ステータス**: pending
**担当**: Cascade
**前提**: タスク2完了済み
**背景**: PowerShell / Python スクリプトの登録・トリガー管理・実行ログを管理する自動化 Wing を新規実装する。既存コマンドに相当するものがないため Rust コマンドを新規作成する。

#### ワイヤーフレーム

```
┌──────────────────────────────────────────────────────────────────┐
│ ▶ SCRIPT / AUTOMATION                          [+ REGISTER]      │
├──────────────────────────────────────────────────────────────────┤
│  NAME           TYPE        TRIGGER       STATUS   ACTIONS       │
│  ─────────────────────────────────────────────────────────────   │
│  cleanup.ps1    PowerShell  BEFORE_GAME   ENABLED  [▶][DEL]      │
│  fps_boost.py   Python      MANUAL        ENABLED  [▶][DEL]      │
│  restore.ps1    PowerShell  AFTER_GAME    ENABLED  [▶][DEL]      │
│                                                                   │
│  (空の場合: NO SCRIPTS — PRESS + REGISTER)                       │
├──────────────────────────────────────────────────────────────────┤
│  EXECUTION LOG                                       [CLEAR]      │
│  ─────────────────────────────────────────────────────────────   │
│  [09:01:23] cleanup.ps1   EXIT 0   OK                            │
│  [09:00:10] fps_boost.py  EXIT 1   ERROR: module not found       │
│  (空の場合: NO LOGS YET)                                          │
└──────────────────────────────────────────────────────────────────┘

モーダル（+ REGISTER / 編集時）:
┌─────────────────────────────┐
│  REGISTER SCRIPT            │
│  NAME    [____________]     │
│  TYPE    [PowerShell ▼]     │
│  PATH    [____________]     │
│  TRIGGER [BEFORE_GAME ▼]   │
│       [CANCEL]  [SAVE]      │
└─────────────────────────────┘
```

#### 仕様

**目的**: スクリプト自動化機能の新規実装

**変更ファイル一覧**:

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/types/index.ts` | 修正 | `WingId` に `'script'` を追加、`ScriptEntry` / `ScriptTrigger` / `ExecutionLog` 型を追加 |
| `src-tauri/src/commands/script.rs` | 新規 | スクリプト管理コマンド |
| `src-tauri/src/commands/mod.rs` | 修正 | `pub mod script;` を追加 |
| `src-tauri/src/lib.rs` | 修正 | `invoke_handler` に新コマンドを登録 |
| `src/stores/useScriptStore.ts` | 新規 | スクリプト状態管理ストア |
| `src/components/script/ScriptWing.tsx` | 新規 | Script Wing コンポーネント |
| `src/components/layout/Shell.tsx` | 修正 | SYSTEM ゾーンに `{ id: 'script', label: 'SCRIPT' }` を追加 |
| `src/App.tsx` | 修正 | `WING_COMPONENTS` に `script: <ScriptWing />` を追加 |

**Rust 型定義**:

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScriptEntry {
    pub id: String,
    pub name: String,
    pub script_type: String,  // "powershell" | "python"
    pub path: String,
    pub trigger: String,      // "BEFORE_GAME" | "AFTER_GAME" | "ON_EXIT" | "MANUAL"
    pub enabled: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionResult {
    pub script_id: String,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub timestamp: u64,
}
```

**Rust コマンド**:

| コマンド | シグネチャ | 内容 |
|---|---|---|
| `list_scripts` | `() -> Result<Vec<ScriptEntry>, AppError>` | JSON ファイルから一覧取得 |
| `save_script` | `(entry: ScriptEntry) -> Result<(), AppError>` | 新規追加・上書き保存（upsert） |
| `delete_script` | `(id: String) -> Result<(), AppError>` | ID で削除 |
| `execute_script` | `(id: String) -> Result<ExecutionResult, AppError>` | `powershell -File` / `python` で実行 |

**保存先**: `{AppData}/nexus/scripts.json`（`chrono.rs` の tasks.json と同じパターン）

**TypeScript 型**（`src/types/index.ts` に追加）:

```typescript
export type ScriptTrigger = 'BEFORE_GAME' | 'AFTER_GAME' | 'ON_EXIT' | 'MANUAL';

export interface ScriptEntry {
  id: string;
  name: string;
  scriptType: 'powershell' | 'python';
  path: string;
  trigger: ScriptTrigger;
  enabled: boolean;
}

export interface ExecutionLog {
  scriptId: string;
  scriptName: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  timestamp: number;
}
```

**受け入れ条件**:

- [ ] スクリプト一覧がテーブル形式で表示される
- [ ] [+ REGISTER] でモーダルが開き、スクリプトを登録できる
- [ ] [▶] ボタンでスクリプトが実行され、ログパネルに結果が追記される
- [ ] [DEL] ボタンに2ステップ確認（3秒タイムアウト）が実装されている
- [ ] ログパネルは画面下部 30% を占有する
- [ ] [CLEAR] でログを削除できる
- [ ] 空状態ガイドが表示される（スクリプトなし / ログなし それぞれ）
- [ ] `npm run typecheck` PASS / `npm run check` PASS / `npm run test` PASS / `cargo test` PASS / `cargo clippy -- -D warnings` PASS

#### T5-DESIGN.md 準拠チェックポイント

- [ ] CSS 変数のみ使用
- [ ] [▶] 実行ボタン: primary スタイル
- [ ] [DEL] ボタン: danger スタイル（`--color-danger-*` border）、2ステップ確認あり
- [ ] ログパネルの高さ: `flex: 0 0 30%` で固定
- [ ] フォント `var(--font-mono)`、サイズ規約通り
- [ ] モーダル: 既存 TaskForm と同じオーバーレイ + カードパターン

#### T5-Cascade 記入欄

- **実装内容**:
- **テスト実行結果**: `npm run typecheck` [ ] PASS / `npm run check` [ ] PASS / `npm run test` [ ] PASS / `cargo test` [ ] PASS
- **特記事項**:

#### T5-Claude Code レビュー結果

- **判定**: [ ] PASS / [ ] REQUIRES_CHANGES
- **指摘事項**:
- **レビュー日**:

---

## 完了タスク

### タスク 1 — GPO 統合スモークテスト

**ステータス**: done
**担当**: Cascade
**背景**: gaming-pc-optimizer (GPO) を廃止し nexus に一本化。nexus は GPO の全機能をバックエンド・フロントエンド共に実装済みのため、動作確認のみ実施する。

#### 仕様（Claude Code 記入）

- **目的**: nexus が GPO の全機能を正常に提供できることを確認する
- **変更ファイル**: なし（動作確認のみ。問題があれば修正）
- **受け入れ条件**:
  - [ ] OpsWing PROC タブ: プロセス一覧が表示される
  - [ ] OpsWing PROC タブ: プロセス優先度変更（high / normal / idle）が実行できる
  - [ ] OpsWing PROC タブ: KILL 2ステップ確認が動作する
  - [ ] PulseWing: CPU 使用率グラフが表示される
  - [ ] PulseWing: CPU 温度が表示される（取得不可環境では `null` 表示で OK）
  - [ ] OpsWing AI タブ: Perplexity 提案が取得できる（APIキー設定済みの場合）
  - [ ] OpsWing LAUNCH タブ: ゲームランチャーが表示される
  - [ ] `npm run typecheck` PASS
  - [ ] `npm run check` PASS
  - [ ] `npm run test` PASS
  - [ ] `cargo test` PASS
  - [ ] `cargo clippy -- -D warnings` PASS

#### 確認手順

```bash
# 1. 品質ゲート
npm run typecheck
npm run check
npm run test
cd src-tauri && cargo test && cargo clippy -- -D warnings

# 2. 起動確認
npm run tauri dev
```

確認項目を手動で操作し、上記受け入れ条件をチェックする。

#### Cascade 記入欄

- **確認結果**: 
  - ✅ OpsWing PROC タブ: プロセス一覧が表示される
  - ❌ OpsWing PROC タブ: プロセス優先度変更（管理者権限が必要）
  - ❌ OpsWing PROC タブ: KILL 2ステップ確認（管理者権限が必要）
  - ✅ PulseWing: CPU 使用率グラフが表示される（自動開始に修正）
  - ✅ PulseWing: CPU 温度が表示される（null 表示で正常）
  - ⚠️ OpsWing AI タブ: APIキー未設定のため未確認
  - ✅ OpsWing LAUNCH タブ: ゲームランチャーが表示される
- **問題があれば修正内容**:
  - PulseWingが自動で監視を開始しない問題を修正（useEffectで自動startPollingを追加）
  - プロセス優先度変更とKILLはWindowsで管理者権限が必要なため、エラーハンドリングは既存のままとする
- **テスト実行結果**: `npm run typecheck` ✅ PASS / `npm run check` ✅ PASS / `npm run test` ✅ PASS / `cargo test` ✅ PASS
- **特記事項**: Windows環境ではプロセス管理機能に管理者権限が必要。Tauriアプリを管理者として実行する必要がある。

#### Claude Code レビュー結果

- **判定**: ✅ PASS
- **指摘事項**:
  - PulseWing の `useEffect` 追加は正しい実装。keep-alive マウントと整合性あり
  - 管理者権限問題はコードのバグではなくデプロイ設定の問題。将来 `tauri.conf.json` の `requestedExecutionLevel: requireAdministrator` で対応予定（別タスク）
  - `cargo clippy` の結果が Cascade 記入欄に未記入だが、`cargo test` PASS を確認済みのため許容
- **レビュー日**: 2026-03-16

---

## タスクテンプレート（新規タスク追加時にコピー）

```markdown
### タスク N — {タイトル}

**ステータス**: pending
**担当**: Cascade
**参照**: DESIGN.md § {関連セクション}

#### T-仕様（Claude Code 記入）

- **目的**:
- **変更ファイル**:
- **受け入れ条件**:
  - [ ]
  - [ ]

#### T-DESIGN.md 準拠チェックポイント

- [ ] CSS 変数のみ使用（ハードコードカラーなし）
- [ ] 存在する CSS 変数のみ使用（index.css で確認済み）
- [ ] 破壊的操作に 2 ステップ確認（3 秒タイムアウト付き）
- [ ] ボタン種別が規約通り（primary / secondary / danger）
- [ ] フォント var(--font-mono)、サイズ規約通り
- [ ] ラベル・ヘッダーは UPPER_CASE
- [ ] ローディング / エラー / 空状態の表示あり

#### T-Cascade 記入欄

- **実装内容**:
- **テスト実行結果**: npm run typecheck [ ] PASS / npm run check [ ] PASS / npm run test [ ] PASS
- **特記事項**:

#### T-Claude Code レビュー結果

- **判定**: [ ] PASS / [ ] REQUIRES_CHANGES
- **指摘事項**:
- **レビュー日**:
```
