# nexus — HANDOFF.md

> **Cascade ↔ Claude Code 引き継ぎログ**
> ステータス: `pending` → `in-progress` → `review` → `done`
> UI 実装時は必ず [`DESIGN.md`](DESIGN.md) を参照すること
> 設計詳細は [`docs/reviews/`](docs/reviews/) を参照すること

---

## 現在のステータス

| 項目 | 状態 |
|------|------|
| ベースライン（T1-T10） | ✅ 完了 |
| オーバーホール（OH1-OH8, OH-B3, OH-E1〜E4） | ✅ 完了 |
| 再構築 Phase 0 | ✅ 完了 |
| 再構築 Phase 1 | ✅ 完了 |
| 再構築 Phase 2 | ✅ 完了 |
| 再構築 Phase 3〜7 | ⬜ 未着手 |

**最新コミット:** `5deefd6`
**テスト:** 149 unit + 3 E2E green

---

## 再構築フェーズ（Phase 0〜7）

> 推奨実行順序: Phase 0 → 1 → 2 → 4 → 5 → 3 → 6 → 7
> 詳細なレビュー根拠: `docs/reviews/frontend-review.md` / `docs/reviews/backend-review.md`

---

## Phase 0: クリティカルバグ修正

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `c4a71e3` + `3c0ccf4`
**工数見積もり:** 1〜2日
**担当:** Cascade

---

### ① 前提条件

- 特になし（他のフェーズとの依存関係なし）
- `DESIGN.md` のスタイリング方針（Tailwind v4）を事前確認すること
- 参照: `docs/reviews/frontend-review.md` FE-P0-1, FE-P0-2
- 参照: `docs/reviews/backend-review.md` BE-P0-2, BE-P0-3, BE-P0-4

---

### ② 対象ファイル

- `src/stores/useLauncherStore.ts`
- `src/stores/useScriptStore.ts`
- `src-tauri/src/commands/pulse.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/commands/boost.rs`

---

### ③ 実装内容

**0-1: useLauncherStore.ts 復旧**

`LauncherWing.tsx` の使用箇所を読んで必要な state/action を逆算し、ストアを正しく実装する。

最低限必要な state:
```typescript
interface LauncherState {
  games: Game[];
  isLoading: boolean;
  error: string | null;
  autoBoostEnabled: boolean;
  isBoosting: boolean;
  sortBy: 'name' | 'lastPlayed' | 'playtime';
  sortOrder: 'asc' | 'desc';
}
```

最低限必要な action:
```typescript
interface LauncherActions {
  loadGames: () => Promise<void>;
  addGame: (game: Omit<Game, 'id'>) => Promise<void>;
  removeGame: (id: string) => Promise<void>;
  launchGame: (id: string) => Promise<void>;
  toggleAutoBoost: () => void;
  setSortBy: (field: LauncherState['sortBy']) => void;
}
```

**0-2: useScriptStore.ts の isRunning バグ修正**

```typescript
// 修正前（バグ）
} catch (err) {
  set({ isLoading: false, error: extractErrorMessage(err) });
}

// 修正後
} catch (err) {
  set({ isRunning: false, isLoading: false, error: extractErrorMessage(err) });
}
```

**0-3: pulse.rs の Mutex 保持中 sleep 解消**

```rust
// 修正前（バグ）
loop {
    let mut state = pulse_state.lock().unwrap();
    state.system.refresh_all();
    let snapshot = collect_snapshot(&state);
    // ... Mutex 保持したまま sleep
    thread::sleep(Duration::from_millis(200)); // ← ロック保持中！
}

// 修正後（ロック外で sleep）
loop {
    {
        // スコープでロックを限定
        let mut state = pulse_state.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        state.system.refresh_all();
        // snapshotを取得してすぐにロック解放
    } // ← ここでロック解放
    tokio::time::sleep(Duration::from_millis(200)).await;
}
```

**0-4: get_storage_info 二重登録修正**

`src-tauri/src/lib.rs` の `invoke_handler` から重複している `get_storage_info` の2回目の登録を削除する。

**0-5: run_boost の設計判断**

現在の `run_boost` の実装状態を確認し、以下のどちらかを明確にする:
- **選択肢A**: 現在シミュレーションのみの場合 → UI に「SIMULATION MODE」バッジを表示し、実装予定の旨を明記
- **選択肢B**: 実機能が実装されている場合 → 動作を確認し、テストを追加

判断をコミットメッセージに記録すること。

---

### ④ 注意事項

- `useLauncherStore.ts` の修正は `LauncherWing.tsx` との型整合を必ず確認すること
- `isRunning` バグは `useScriptStore.ts` のみ対象。他のストアには同様のバグがないか簡単に確認する
- `pulse.rs` の修正は既存の unit test が通ることを確認してから提出する
- Mutex 修正後は `cargo test` でデッドロックが発生しないことを確認する

---

### ⑤ 完了条件

- [ ] LauncherWing が起動してゲームリストが表示される
- [ ] スクリプト実行エラー後に再実行ボタンが活性化される
- [ ] `cargo test` でパルス関連テストが通る
- [ ] `get_storage_info` の重複警告がコンパイル時に出ない
- [ ] `run_boost` の状態（シミュレーション or 実機能）が明確になっている

---

### ⑥ 品質チェック

```bash
npm run typecheck  # 型エラー 0
npm run check      # lint エラー 0
npm run test       # 全テスト green（149件以上）
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] console.log なし
- [ ] any 型なし
- [ ] インラインスタイルなし

---

## Phase 1: セキュリティ基盤

**ステータス:** ✅ 完了（2026-03-18）
**コミット:** `39a2e5b`
**工数見積もり:** 2〜3日
**担当:** Cascade

---

### ① 前提条件

- Phase 0 完了（全テスト green）
- 参照: `docs/reviews/backend-review.md` BE-P0-1, BE-P2-8, BE-P2-9

---

### ② 対象ファイル

- `src-tauri/tauri.conf.json`（CSP 設定）
- `src-tauri/capabilities/default.json`（permissions）
- `src-tauri/src/commands/netopt.rs`（バリデーション追加）
- `src-tauri/src/commands/storage.rs`（バリデーション追加）
- `src-tauri/src/constants.rs`（新規または更新）
- `src-tauri/src/infra/powershell.rs`（新規作成）

---

### ③ 実装内容

**1-1: CSP 設定の厳格化**

```json
// src-tauri/tauri.conf.json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.perplexity.ai"
    }
  }
}
```

**1-2: capabilities/default.json のコマンド別 permission 定義**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "nexus default capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging",
    "opener:default",
    "notification:default",
    "clipboard-manager:read-text",
    "clipboard-manager:write-text"
  ]
}
```

**1-3: infra/powershell.rs の作成（安全な PowerShell 実行ヘルパー）**

```rust
// src-tauri/src/infra/powershell.rs
use crate::error::AppError;
use std::process::Command;

/// PowerShell を安全に実行する。
/// ユーザー入力は必ず args として渡し、コマンド文字列への直接連結は禁止。
pub fn run_powershell(script: &str) -> Result<String, AppError> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script])
        .output()
        .map_err(|e| AppError::PowerShell(e.to_string()))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(AppError::PowerShell(
            String::from_utf8_lossy(&output.stderr).to_string()
        ))
    }
}

/// ユーザー入力文字列を PowerShell の引数として安全にエスケープする
pub fn escape_ps_arg(input: &str) -> String {
    input.replace('\'', "''")
}
```

**1-4: 入力バリデーション実装**

```rust
// src-tauri/src/services/validation.rs（新規）
use regex::Regex;
use crate::error::AppError;

pub fn validate_ip_address(ip: &str) -> Result<(), AppError> {
    let re = Regex::new(r"^(\d{1,3}\.){3}\d{1,3}$").unwrap();
    if !re.is_match(ip) {
        return Err(AppError::Internal(format!("Invalid IP address: {}", ip)));
    }
    // 各オクテットが 0-255 の範囲内か確認
    let parts: Vec<u8> = ip.split('.').filter_map(|s| s.parse().ok()).collect();
    if parts.len() != 4 {
        return Err(AppError::Internal("Invalid IP address format".to_string()));
    }
    Ok(())
}

pub fn validate_hostname(hostname: &str) -> Result<(), AppError> {
    let re = Regex::new(r"^[a-zA-Z0-9.-]{1,253}$").unwrap();
    if !re.is_match(hostname) {
        return Err(AppError::Internal(format!("Invalid hostname: {}", hostname)));
    }
    Ok(())
}

pub fn validate_windows_path(path: &str) -> Result<(), AppError> {
    // Windowsパス形式チェック（ドライブレター + バックスラッシュ区切り）
    let re = Regex::new(r"^[a-zA-Z]:\\[\w\s\-\.\\ ]*$").unwrap();
    if !re.is_match(path) {
        return Err(AppError::Internal(format!("Invalid Windows path: {}", path)));
    }
    Ok(())
}
```

各コマンドでバリデーションを呼び出す:
```rust
// commands/netopt.rs
#[tauri::command]
pub async fn set_dns(interface_name: String, dns_server: String) -> Result<(), AppError> {
    services::validation::validate_ip_address(&dns_server)?;
    services::netopt::set_dns(&interface_name, &dns_server).await
}
```

**1-5: constants.rs の保護プロセスリスト統合**

```rust
// src-tauri/src/constants.rs
pub const PROTECTED_PROCESSES: &[&str] = &[
    "system",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "winlogon.exe",
    "lsass.exe",
    "svchost.exe",
    "services.exe",
    "explorer.exe",
    "nexus.exe",
];

pub const POWERSHELL_TIMEOUT_MS: u64 = 5000;
pub const PULSE_INTERVAL_MS: u64 = 2000;
pub const OPS_INTERVAL_MS: u64 = 3000;
pub const HW_INTERVAL_MS: u64 = 5000;
```

---

### ④ 注意事項

- PowerShell インジェクション対策: `format!` でユーザー入力を直接コマンド文字列に埋め込む既存コードを全て修正すること
- `netopt.rs` / `storage.rs` / `boost.rs` のコマンドハンドラを全て確認し、ユーザー入力の検証が必要なものを洗い出すこと
- CSP 変更後は Perplexity パネルの API 通信が正常に動作することを確認する
- バリデーションは FE 側（TypeScript）と BE 側（Rust）の両方に実装する

---

### ⑤ 完了条件

- [ ] `tauri.conf.json` の CSP から `'unsafe-eval'` が削除されている
- [ ] 全コマンドの PowerShell 実行が `infra/powershell.rs` のヘルパー経由になっている
- [ ] `set_dns` / `ping_host` / `analyze_disk_usage` にバリデーションが実装されている
- [ ] 不正な入力（`;`, `|`, `&`, `..` 等）でコマンドが拒否される
- [ ] Perplexity API が正常に動作する（CSP 確認）

---

### ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
cd src-tauri && cargo test && cargo clippy -- -D warnings
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] console.log なし
- [ ] any 型なし
- [ ] インラインスタイルなし

---

## Phase 2: ドキュメント・設定整合

**ステータス:** ⬜ 未着手（Phase 1 完了後に着手）
**工数見積もり:** 1日
**担当:** Cascade

---

### ① 前提条件

- Phase 1 完了
- 参照: `docs/reviews/backend-review.md` BE-P1-7, BE-P1-8, BE-P2-1

---

### ② 対象ファイル

- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`（WatcherState 削除）
- `src/lib/styles.ts`（削除）
- `ROADMAP.md`（OH-B3 完了反映）

---

### ③ 実装内容

**2-1: 未使用クレート削除**

`Cargo.toml` から以下を削除する（削除前に `grep -r` で使用箇所がないことを確認すること）:

```toml
# 削除対象
regex = "..."        # 使用箇所なし
walkdir = "..."      # 使用箇所なし
pathdiff = "..."     # 使用箇所なし
reqwest = "..."      # 使用箇所なし（Perplexity は FE から直接呼び出し）
sha2 = "..."         # 使用箇所なし
uuid = "..."         # 使用箇所なし
feed-rs = "..."      # 使用箇所なし
totp-rs = "..."      # 使用箇所なし
log = "..."          # tracing を使用
```

**注意:** バリデーション (Phase 1) で `regex` を追加した場合は削除しないこと。

**2-2: WatcherState + notify クレート削除**

```toml
# 削除
notify = "..."
```

`lib.rs` / `state.rs` から `WatcherState` に関連するコードを削除する。

**2-3: tokio features 最小化**

```toml
# 修正前
tokio = { version = "1", features = ["full"] }

# 修正後（実際に使用している機能のみ）
tokio = { version = "1", features = ["rt", "rt-multi-thread", "time", "sync", "macros"] }
```

**2-4: styles.ts の削除**

```bash
# src/lib/styles.ts を削除
# 削除前に参照箇所がないことを確認
grep -r "styles" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

参照箇所が残っている場合は Tailwind クラスに移行してから削除する。

---

### ④ 注意事項

- クレート削除後は必ず `cargo build` でコンパイルエラーがないことを確認する
- `tokio features` の変更後は非同期コマンドが正常動作することを確認する
- `styles.ts` に `S.xxx` を参照しているファイルが残っている場合は、Tailwind クラスに置き換えてから削除する

---

### ⑤ 完了条件

- [ ] 未使用クレートが `Cargo.toml` から削除されている
- [ ] `cargo build` がエラーなく通る
- [ ] `styles.ts` が削除されており、参照ファイルが存在しない
- [ ] コンパイル時間が短縮されている（目安: 10%以上）

---

### ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
cd src-tauri && cargo build && cargo test && cargo clippy -- -D warnings
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] console.log なし
- [ ] any 型なし

---

## Phase 3: フロントエンド基盤強化

**ステータス:** ⬜ 未着手（Phase 4-5 完了後に着手を推奨）
**工数見積もり:** 4〜5日
**担当:** Cascade

---

### ① 前提条件

- Phase 2 完了
- Phase 4-5 完了後に着手することを推奨（イベント駆動化後のポーリングコード削除で作業量が変わる）
- 参照: `docs/reviews/frontend-review.md` FE-P1-3, FE-P1-4, FE-P1-5, FE-P1-6, FE-P1-7

---

### ② 対象ファイル

- `src/stores/useSettingsStore.ts`（統合）
- `src/stores/useAppSettingsStore.ts`（統合先または削除）
- `src/components/ui/ErrorBanner.tsx`（新規）
- `src/components/ui/LoadingState.tsx`（新規）
- `src/components/ui/EmptyState.tsx`（新規）
- `src/components/ui/SectionHeader.tsx`（新規）
- `src/components/ui/KeyValueRow.tsx`（新規）
- `src/components/ui/Toggle.tsx`（新規）
- `src/components/ui/ProgressBar.tsx`（新規）
- `src/components/home/HomeWing.tsx`（分割）
- `src/components/log/LogWing.tsx`（分割）
- `src/components/launcher/LauncherWing.tsx`（分割）

---

### ③ 実装内容

**3-1: ストア統合（useSettingsStore + useAppSettingsStore）**

2つのストアを調査し、重複フィールドを特定して1つに統合する:

```typescript
// src/stores/useSettingsStore.ts（統合後）
interface SettingsState {
  // 旧 useSettingsStore のフィールド
  pollIntervalMs: number;
  // 旧 useAppSettingsStore のフィールド
  perplexityApiKey: string;
  theme: 'dark';  // 現在はダークのみ
  // その他統合フィールド
}
```

**3-2: useShallow 導入**

全ストアのセレクタを `useShallow` に移行する:

```typescript
// 移行前（パフォーマンス問題）
const { games, isLoading } = useLauncherStore(s => ({
  games: s.games,
  isLoading: s.isLoading
}));

// 移行後
import { useShallow } from 'zustand/react/shallow';
const { games, isLoading } = useLauncherStore(
  useShallow(s => ({ games: s.games, isLoading: s.isLoading }))
);
```

**3-3: 共通 UI コンポーネント実装**

`DESIGN.md` セクション9のインターフェース定義に従って実装する。

```tsx
// src/components/ui/ErrorBanner.tsx
interface ErrorBannerProps {
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  onDismiss?: () => void;
}

export function ErrorBanner({ message, variant = 'error', onDismiss }: ErrorBannerProps) {
  const variantClasses = {
    error: 'bg-base-800 border-b border-danger-600 text-danger-500',
    warning: 'bg-base-800 border-b border-(--color-accent-500) text-(--color-accent-500)',
    info: 'bg-base-800 border-b border-cyan-500 text-cyan-500',
    success: 'bg-base-800 border-b border-[var(--color-success-500)] text-[var(--color-success-500)]',
  };

  return (
    <div className={`px-4 py-2 font-[var(--font-mono)] text-[11px] flex items-center justify-between ${variantClasses[variant]}`}>
      <span>{variant.toUpperCase()}: {message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="ml-4 text-text-muted hover:text-text-primary">
          ✕
        </button>
      )}
    </div>
  );
}
```

```tsx
// src/components/ui/LoadingState.tsx
interface LoadingStateProps {
  message?: string;
  height?: string;
}

export function LoadingState({ message = 'LOADING...', height = 'h-[120px]' }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center ${height} font-[var(--font-mono)] text-[11px] text-text-muted tracking-[0.1em]`}>
      {message}
    </div>
  );
}
```

```tsx
// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  message: string;
  action?: string;
  height?: string;
}

export function EmptyState({ message, action, height = 'h-[120px]' }: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center ${height} font-[var(--font-mono)] text-[11px] text-text-muted tracking-[0.1em]`}>
      {action ? `${message} — ${action}` : message}
    </div>
  );
}
```

**3-4: コンポーネント分割（HomeWing を例として）**

300行を超えているコンポーネントをサブコンポーネントに分割する:

```
HomeWing.tsx（< 300行）
├── HardwareCard.tsx  ← CPU/GPU/RAM カード
├── AiInsightPanel.tsx  ← AI 提案パネル
└── StatusSummary.tsx  ← ステータス概要
```

**3-5: useEffect 依存配列修正**

React DevTools の lint 警告に従い、依存配列の不備を修正する。

---

### ④ 注意事項

- ストア統合は既存のストアを参照している全コンポーネントを確認してから行うこと
- 共通コンポーネントは既存の Wing コンポーネントのインラインパターンをそのまま抽出する
- `AiPanel.tsx` も Tailwind 化の対象（インラインスタイルが残っている場合）

---

### ⑤ 完了条件

- [ ] useSettingsStore と useAppSettingsStore が1つに統合されている
- [ ] 全ストアセレクタが `useShallow` を使用している
- [ ] ErrorBanner / LoadingState / EmptyState / SectionHeader / KeyValueRow / Toggle / ProgressBar が実装されている
- [ ] HomeWing / LogWing / LauncherWing が 300行以内に分割されている
- [ ] AiPanel.tsx にインラインスタイルが残っていない

---

### ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] console.log なし
- [ ] any 型なし
- [ ] インラインスタイルなし（AiPanel.tsx 含む）

---

## Phase 4: バックエンド再設計

**ステータス:** ⬜ 未着手（Phase 2 完了後に着手）
**工数見積もり:** 4〜5日
**担当:** Cascade

---

### ① 前提条件

- Phase 2 完了
- 参照: `docs/reviews/backend-review.md` BE-P1-1, BE-P1-2, BE-P1-3, BE-P1-4, BE-P1-5
- `DESIGN.md` セクション13（バックエンドアーキテクチャ設計）を必ず参照

---

### ② 対象ファイル

- `src-tauri/src/commands/`（全ファイル — 薄くする）
- `src-tauri/src/services/`（新規ディレクトリ）
- `src-tauri/src/infra/`（新規ディレクトリ）
- `src-tauri/src/parsers/`（新規ディレクトリ）
- `src-tauri/src/error.rs`（AppError 拡張）
- `src-tauri/src/state.rs`（System 共有）
- `src-tauri/Cargo.toml`（winreg 追加）

---

### ③ 実装内容

**4-1: 4層アーキテクチャの作成**

```
src-tauri/src/
├── commands/       既存（薄くする）
├── services/       新規
│   ├── mod.rs
│   ├── netopt.rs   ← commands/netopt.rs のロジックを移動
│   ├── boost.rs    ← commands/boost.rs のロジックを移動
│   ├── storage.rs  ← commands/storage.rs のロジックを移動
│   └── validation.rs（Phase 1 で作成済みなら移動）
├── infra/          新規
│   ├── mod.rs
│   ├── powershell.rs（Phase 1 で作成済みなら確認）
│   ├── registry.rs  新規（winreg クレート使用）
│   └── filesystem.rs 新規
└── parsers/        新規
    ├── mod.rs
    ├── vdf.rs      ← 既存の VDF パース処理を移動
    └── ipconfig.rs  新規（日本語ロケール対応）
```

**4-2: AppError 拡張**

```rust
// src-tauri/src/error.rs
#[derive(Debug, thiserror::Error, serde::Serialize)]
pub enum AppError {
    #[error("PowerShell execution failed: {0}")]
    PowerShell(String),

    #[error("Registry operation failed: {0}")]
    Registry(String),

    #[error("Process operation failed: {0}")]
    Process(String),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("IO error: {0}")]
    Io(String),  // From<std::io::Error> で自動変換

    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}
```

**4-3: System インスタンス共有**

```rust
// src-tauri/src/state.rs
use std::sync::{Arc, Mutex};
use sysinfo::System;

pub struct PulseState {
    pub system: Arc<Mutex<System>>,
    pub last_snapshot: Arc<Mutex<Option<ResourceSnapshot>>>,
}

impl PulseState {
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();
        Self {
            system: Arc::new(Mutex::new(system)),
            last_snapshot: Arc::new(Mutex::new(None)),
        }
    }
}
```

**4-4: winreg クレート導入**

```toml
# Cargo.toml
[target.'cfg(windows)'.dependencies]
winreg = "0.52"
```

```rust
// src-tauri/src/infra/registry.rs
use winreg::enums::*;
use winreg::RegKey;
use crate::error::AppError;

pub fn read_string(hive: winreg::enums::HKEY, path: &str, name: &str) -> Result<String, AppError> {
    let hklm = RegKey::predef(hive);
    let key = hklm.open_subkey(path)
        .map_err(|e| AppError::Registry(e.to_string()))?;
    key.get_value(name)
        .map_err(|e| AppError::Registry(e.to_string()))
}
```

**4-5: 重い同期コマンドの async 化**

```rust
// 修正前（UI スレッドをブロック）
#[tauri::command]
pub fn analyze_disk_usage(path: String) -> Result<DiskUsage, AppError> {
    // 重い処理...
}

// 修正後
#[tauri::command]
pub async fn analyze_disk_usage(path: String) -> Result<DiskUsage, AppError> {
    tauri::async_runtime::spawn_blocking(move || {
        services::storage::analyze_disk_usage(&path)
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}
```

---

### ④ 注意事項

- リファクタは段階的に行う。1コマンドファイルずつ `services/` に移行し、各ステップで `cargo test` を確認する
- `System` インスタンス共有後は、他のコマンドで `System::new_all()` を呼び出していないことを grep で確認する
- `winreg` は Windows のみの依存であるため `[target.'cfg(windows)'.dependencies]` に追加する

---

### ⑤ 完了条件

- [ ] `commands/` の全ファイルがハンドラのみ（ロジックを `services/` に移動済み）
- [ ] `System::new_all()` を直接呼び出している箇所が `PulseState` 以外にない
- [ ] `AppError` に `PowerShell` / `Registry` / `Process` / `Validation` バリアントが追加されている
- [ ] `analyze_disk_usage` 等の重い処理が `async fn` になっている
- [ ] `services/` の関数に対する Rust ユニットテストが存在する

---

### ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
cd src-tauri && cargo test && cargo clippy -- -D warnings && cargo fmt
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] console.log なし
- [ ] any 型なし
- [ ] unwrap() なし（本番コード）
- [ ] System::new_all() 直接呼び出しなし

---

## Phase 5: Tauri v2 フル活用

**ステータス:** ⬜ 未着手（Phase 4 完了後に着手）
**工数見積もり:** 2〜3日
**担当:** Cascade

---

### ① 前提条件

- Phase 4 完了
- 参照: `docs/reviews/backend-review.md` BE-P1-6
- `DESIGN.md` セクション15（イベント駆動アーキテクチャ設計）を必ず参照

---

### ② 対象ファイル

- `src-tauri/src/lib.rs`（emit ループ追加）
- `src-tauri/src/commands/pulse.rs`（既存ポーリングコマンド廃止）
- `src-tauri/src/commands/ops.rs`（既存ポーリングコマンド廃止）
- `src-tauri/src/commands/hardware.rs`（既存ポーリングコマンド廃止）
- `src/stores/usePulseStore.ts`（ポーリング → listen 移行）
- `src/stores/useOpsStore.ts`（ポーリング → listen 移行）
- `src/stores/useHardwareStore.ts`（ポーリング → listen 移行）
- `src-tauri/Cargo.toml`（tauri-plugin-shell 追加）

---

### ③ 実装内容

**5-1: Rust 側 emit ループ**

```rust
// src-tauri/src/lib.rs の setup クロージャ内
.setup(|app| {
    let handle = app.handle().clone();
    let pulse_state = app.state::<PulseState>();
    let system = Arc::clone(&pulse_state.system);

    // pulse:snapshot ループ（2秒）
    let handle_pulse = handle.clone();
    let sys_pulse = Arc::clone(&system);
    tauri::async_runtime::spawn(async move {
        let mut last: Option<ResourceSnapshot> = None;
        loop {
            tokio::time::sleep(Duration::from_millis(PULSE_INTERVAL_MS)).await;
            let snapshot = {
                let mut sys = sys_pulse.lock().unwrap();
                sys.refresh_cpu_all();
                sys.refresh_memory();
                collect_snapshot(&sys)
            };
            // 差分チェック — 変化がない場合は emit しない
            if last.as_ref() != Some(&snapshot) {
                handle_pulse.emit("pulse:snapshot", &snapshot).ok();
                last = Some(snapshot);
            }
        }
    });

    // ops:processes ループ（3秒）
    let handle_ops = handle.clone();
    let sys_ops = Arc::clone(&system);
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_millis(OPS_INTERVAL_MS)).await;
            let processes = {
                let mut sys = sys_ops.lock().unwrap();
                sys.refresh_processes();
                collect_processes(&sys)
            };
            handle_ops.emit("ops:processes", &processes).ok();
        }
    });

    Ok(())
})
```

**5-2: FE 側 listen パターン（Zustand store）**

```typescript
// src/stores/usePulseStore.ts
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { ResourceSnapshot } from '../types';

interface PulseState {
  snapshot: ResourceSnapshot | null;
  lastUpdate: number;
  setupListeners: () => Promise<UnlistenFn>;
}

export const usePulseStore = create<PulseState>((set) => ({
  snapshot: null,
  lastUpdate: 0,
  setupListeners: async () => {
    const unlisten = await listen<ResourceSnapshot>('pulse:snapshot', (event) => {
      set({ snapshot: event.payload, lastUpdate: Date.now() });
    });
    return unlisten;
  },
}));
```

```tsx
// Wing コンポーネントでの使用
useEffect(() => {
  let cleanup: UnlistenFn | null = null;
  usePulseStore.getState().setupListeners().then(fn => { cleanup = fn; });
  return () => { cleanup?.(); };
}, []);
```

**5-3: tauri-plugin-shell の導入**

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-shell = "2"
```

```json
// capabilities/default.json に追加
"shell:allow-execute",
"shell:allow-kill"
```

PowerShell 実行を `tauri-plugin-shell` 経由に統一（許可するコマンドをホワイトリスト管理）。

---

### ④ 注意事項

- イベント移行は Wing ごとに段階的に行う。1つの Wing で動作確認してから次に進む
- emit ループと既存のポーリングコマンドを同時に有効にすると二重更新が発生する。移行完了後に既存コマンドを削除すること
- `PartialEq` + `Eq` が `ResourceSnapshot` / `ProcessInfo` に必要（差分チェックのため）

---

### ⑤ 完了条件

- [ ] `pulse:snapshot` / `ops:processes` / `hw:info` イベントが Rust から emit されている
- [ ] FE 側ストアがポーリングから `listen()` に移行されている
- [ ] 不要になったポーリングコマンド（`get_resource_snapshot` 等）が削除されている
- [ ] `tauri-plugin-shell` が導入されている
- [ ] Wing がアンマウントされたときに `unlisten` が呼ばれている

---

### ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
cd src-tauri && cargo test && cargo clippy -- -D warnings
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] console.log なし
- [ ] any 型なし
- [ ] インラインスタイルなし

---

## Phase 6: React 19 / Zustand v5 活用

**ステータス:** ⬜ 未着手（Phase 3 完了後に着手）
**工数見積もり:** 3〜4日
**担当:** Cascade

---

### ① 前提条件

- Phase 3 完了
- 参照: `docs/reviews/frontend-review.md` FE-P2-1, FE-P2-3
- `DESIGN.md` セクション16（React 19 / Zustand v5 パターン）を必ず参照

---

### ② 対象ファイル

- `src/components/home/HomeWing.tsx`（use() + Suspense 例示）
- `src/components/hardware/HardwareWing.tsx`（use() + Suspense 例示）
- `src/components/netopt/NetoptWing.tsx`（useActionState 例示）
- `src/components/settings/SettingsWing.tsx`（useActionState 例示）
- `src/App.tsx`（React.lazy + Suspense）

---

### ③ 実装内容

**6-1: use() + Suspense への移行（HomeWing / HardwareWing を例として）**

```tsx
// 移行前
function HomeWing() {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomeData().then(d => {
      setData(d);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <LoadingState />;
  return <div>{/* ... */}</div>;
}

// 移行後
function HomeWingContent({ dataPromise }: { dataPromise: Promise<HomeData> }) {
  const data = use(dataPromise);  // Suspense が loading を処理
  return <div>{/* ... */}</div>;
}

function HomeWing() {
  const dataPromise = useMemo(() => fetchHomeData(), []);
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeWingContent dataPromise={dataPromise} />
    </Suspense>
  );
}
```

**6-2: useActionState の導入（フォーム系コンポーネント）**

DNS 設定、ネットワーク最適化等のフォーム送信を `useActionState` に移行する（`DESIGN.md` セクション16 参照）。

**6-3: React.lazy + code splitting**

```tsx
// src/App.tsx
const HomeWing = lazy(() => import('./components/home/HomeWing'));
const BoostWing = lazy(() => import('./components/boost/BoostWing'));
const LauncherWing = lazy(() => import('./components/launcher/LauncherWing'));
// ... 全 Wing を lazy import

// 使用箇所
<Suspense fallback={<LoadingState height="h-full" message="LOADING WING..." />}>
  <ActiveWingComponent />
</Suspense>
```

---

### ④ 注意事項

- `use()` フックは Promise を受け取る。Zustand ストアから直接呼び出すパターンとは異なる
- `useActionState` は React 19 以上が必要。`package.json` の React バージョンを確認する
- `React.lazy` は default export のみサポートする。named export のコンポーネントは変更が必要

---

### ⑤ 完了条件

- [ ] HomeWing / HardwareWing で `use()` + Suspense パターンが使われている
- [ ] フォーム送信が `useActionState` を使用している（最低2箇所）
- [ ] 全 Wing が `React.lazy` で遅延ロードされている
- [ ] 初回ロード時間が改善されている（DevTools で確認）

---

### ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] console.log なし
- [ ] any 型なし
- [ ] インラインスタイルなし

---

## Phase 7: 品質仕上げ

**ステータス:** ⬜ 未着手（Phase 6 完了後に着手）
**工数見積もり:** 2〜3日
**担当:** Cascade

---

### ① 前提条件

- Phase 6 完了（全フェーズ完了）
- 参照: `docs/reviews/frontend-review.md` FE-P2-8, FE-P2-9, FE-P3-3
- 参照: `docs/reviews/backend-review.md` BE-P2-7, BE-P3-3

---

### ② 対象ファイル

- `src/components/ui/*.test.tsx`（新規 — 共通コンポーネントテスト）
- `e2e/`（E2E テスト拡充）
- `src-tauri/src/services/*.rs`（Rust ユニットテスト追加）
- `src-tauri/src/parsers/ipconfig.rs`（日本語ロケール対応）
- `src-tauri/Cargo.toml`（keyring クレート追加）
- `src/stores/useSettingsStore.ts`（API キー暗号化保存）

---

### ③ 実装内容

**7-1: 共通 UI コンポーネントテスト**

```tsx
// src/components/ui/ErrorBanner.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBanner } from './ErrorBanner';

describe('ErrorBanner', () => {
  it('error バリアントで danger クラスを使う', () => {
    render(<ErrorBanner message="TEST ERROR" variant="error" />);
    expect(screen.getByText('ERROR: TEST ERROR')).toBeInTheDocument();
  });

  it('onDismiss が呼ばれる', async () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="TEST" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
```

**7-2: E2E テスト拡充**

```typescript
// e2e/launcher.test.ts — LauncherWing の主要フロー
test('ゲームが追加・削除できる', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="nav-launcher"]');
  // ゲーム追加フロー
  await page.click('[data-testid="add-game-btn"]');
  // ...
});
```

**7-3: ipconfig パーサーの日本語ロケール対応**

```rust
// src-tauri/src/parsers/ipconfig.rs
// 英語と日本語の両方のラベルに対応
const ADAPTER_LABELS: &[&str] = &[
    "Ethernet adapter",  // 英語
    "イーサネット アダプター",  // 日本語
    "無線 LAN アダプター",  // 日本語 WiFi
];
```

**7-4: keyring クレートによる API キー暗号化保存**

```toml
# Cargo.toml
keyring = "2"
```

```rust
// src-tauri/src/services/credentials.rs
use keyring::Entry;
use crate::error::AppError;

pub fn save_api_key(service: &str, key: &str) -> Result<(), AppError> {
    let entry = Entry::new(service, "nexus-user")
        .map_err(|e| AppError::Internal(e.to_string()))?;
    entry.set_password(key)
        .map_err(|e| AppError::Internal(e.to_string()))
}

pub fn load_api_key(service: &str) -> Result<Option<String>, AppError> {
    let entry = Entry::new(service, "nexus-user")
        .map_err(|e| AppError::Internal(e.to_string()))?;
    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::Internal(e.to_string())),
    }
}
```

---

### ④ 注意事項

- E2E テストは CI 環境でも動作することを確認する（Tauri ウィンドウの起動タイムアウト設定）
- `keyring` クレートは Windows 資格情報マネージャーを使用する。初回ビルド時に確認する
- ipconfig パーサーは日本語 Windows でのみテスト可能。ロケールに応じたテストデータを用意する

---

### ⑤ 完了条件

- [ ] 共通 UI コンポーネント全てにテストがある
- [ ] E2E テストが smoke tests 3件以上に追加されている（合計 10件以上目標）
- [ ] `services/` レイヤーの関数に Rust ユニットテストがある
- [ ] ipconfig パーサーが日本語出力を正しく解析できる
- [ ] Perplexity API キーが keyring に保存・取得できる

---

### ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
cd src-tauri && cargo test && cargo clippy -- -D warnings
npx playwright test  # E2E
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green（unit 180+件目標、E2E 10+件目標）
- [ ] console.log なし
- [ ] any 型なし
- [ ] インラインスタイルなし
- [ ] unwrap() なし（本番コード）
- [ ] System::new_all() 直接呼び出しなし

---

## 完了済みタスク（履歴）

> 詳細は git log で確認可能。以下は概要のみ。

| ID | 内容 | 完了日 |
|----|------|--------|
| T1-T10 | Shell サイドバー化・Wing 構成・Tailwind 化・テスト整備 | 2026-03-15 以前 |
| OH1 | PowerShell フラグ修正 | 2026-03-16 |
| OH2 | GPU 型定義・取得実装 | 2026-03-16 |
| OH3 | プロセス保護リスト | 2026-03-16 |
| OH4 | GPU UI + AI ルール追加 | 2026-03-16 |
| OH5 | styles.ts 新規作成 | 2026-03-16 |
| OH6 | 自動ブースト設定 | 2026-03-16 |
| OH7 | テスト追加（81件） | 2026-03-17 |
| OH8 | エラーハンドリング統一 | 2026-03-17 |
| OH-B3 | ゲームスコア実装 | 2026-03-17 |
| OH-B5 | ウィンドウ最小幅設定 | 2026-03-17 |
| OH-E1 | セキュリティ設定強化 | 2026-03-17 |
| OH-E2 | Tailwind CSS リファクタ | 2026-03-17 |
| OH-E3 | E2E テスト基盤 | 2026-03-17 |
| OH-E4 | 環境オーバーホール | 2026-03-18 |
