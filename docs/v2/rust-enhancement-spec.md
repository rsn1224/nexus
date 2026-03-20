# Rust バックエンド機能強化 — Cascade 実装指示

**ブランチ:** `feature/v2-stitch-impl`
**担当:** Cascade（実装） → Claude Code（レビュー）

## 概要

Rust バックエンドの2領域を強化する:
1. **Cleanup コマンドの拡充** — 一時ファイル削除 + ディスクスペース解放
2. **GPU モニタリング強化** — Pulse イベントに GPU データ統合 + マルチ GPU 対応

---

## Task 1: Cleanup コマンド拡充

### 背景

現在の `services/cleanup.rs` は設定リバート機能のみ。ゲーミング PC のメンテナンスとして以下の機能を追加する。

### 1.1 一時ファイルスキャン・削除コマンド

**ファイル:** `src-tauri/src/services/cleanup.rs` に追加

```rust
/// スキャン対象ディレクトリ
const TEMP_DIRS: &[&str] = &[
    "%TEMP%",                          // ユーザー一時フォルダ
    "%LOCALAPPDATA%\\Temp",            // ローカルアプリ一時
    "%WINDIR%\\Temp",                  // Windows 一時
    "%LOCALAPPDATA%\\CrashDumps",      // クラッシュダンプ
];

/// スキャン対象拡張子（安全に削除可能なもののみ）
const SAFE_EXTENSIONS: &[&str] = &[
    "tmp", "log", "bak", "old", "dmp", "etl",
];
```

**新しい型定義:**

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupScanResult {
    pub dirs_scanned: usize,
    pub files_found: usize,
    pub total_size_mb: f64,
    pub items: Vec<CleanupItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupItem {
    pub path: String,
    pub size_mb: f64,
    pub category: String,       // "temp" / "crash_dump" / "log"
    pub can_delete: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupResult {
    pub deleted_count: usize,
    pub freed_mb: f64,
    pub errors: Vec<String>,
}
```

**新しいサービス関数:**

```rust
/// 一時ファイルをスキャンし、削除可能なファイル一覧を返す
pub fn scan_temp_files() -> Result<CleanupScanResult, AppError>

/// 指定されたパスのファイルを削除する
pub fn delete_temp_files(paths: Vec<String>) -> Result<CleanupResult, AppError>
```

**実装ルール:**
- `std::fs` を使用（PowerShell 不要）
- ロック中のファイルは `can_delete: false` にする（`fs::remove_file` を try して判定）
- `SAFE_EXTENSIONS` に含まれないファイルは `can_delete: false`
- Windows 以外のプラットフォームではスタブ（空の結果を返す）
- `unwrap()` 禁止 — `AppError` でハンドリング

### 1.2 新コマンド登録

**ファイル:** `src-tauri/src/commands/cleanup.rs` に追加

```rust
#[tauri::command]
pub async fn scan_temp_files() -> Result<CleanupScanResult, AppError> {
    info!("scan_temp_files: スキャン開始");
    tokio::task::spawn_blocking(|| crate::services::cleanup::scan_temp_files())
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn delete_temp_files(paths: Vec<String>) -> Result<CleanupResult, AppError> {
    // paths のバリデーション: TEMP_DIRS 配下のパスのみ許可
    info!(count = paths.len(), "delete_temp_files: 削除開始");
    tokio::task::spawn_blocking(move || crate::services::cleanup::delete_temp_files(paths))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}
```

**セキュリティ重要:** `delete_temp_files` は受け取った paths が `TEMP_DIRS` 配下であることを必ず検証する。任意パスの削除を許可してはいけない。

### 1.3 lib.rs 登録

```rust
// invoke_handler に追加
cleanup::scan_temp_files,
cleanup::delete_temp_files,
```

### 1.4 テスト

`services/cleanup.rs` の `#[cfg(test)] mod tests` に追加:

```rust
#[test]
fn test_scan_result_serialization() { ... }

#[test]
fn test_cleanup_result_counts() { ... }

#[test]
fn test_path_validation_rejects_outside_temp() {
    // TEMP_DIRS 以外のパスを渡した場合にエラーになることを確認
}
```

---

## Task 2: GPU モニタリング強化

### 背景

現在の GPU データ取得:
- `infra/gpu.rs`: NVML (NVIDIA) のみ対応、GPU 0 のみ
- `ResourceSnapshot` (pulse イベント、2秒間隔) に GPU データなし
- `HardwareInfo` (hardware イベント、5秒間隔) に GPU データあり

### 2.1 ResourceSnapshot に GPU データを追加

**ファイル:** `src-tauri/src/commands/pulse.rs`

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResourceSnapshot {
    pub timestamp: u64,
    pub cpu_percent: f32,
    pub cpu_temp_c: Option<f32>,
    pub mem_used_mb: u64,
    pub mem_total_mb: u64,
    pub disk_read_kb: u64,
    pub disk_write_kb: u64,
    pub net_recv_kb: u64,
    pub net_sent_kb: u64,
    // ── 追加 ──
    pub gpu_usage_percent: Option<f32>,
    pub gpu_temp_c: Option<f32>,
    pub gpu_vram_used_mb: Option<u64>,
}
```

**ファイル:** `src-tauri/src/emitters/unified_emitter.rs`

pulse イベント生成時に GPU 動的データを取得して ResourceSnapshot に含める:

```rust
// collect_snapshot() 内
let gpu_dynamic = crate::services::hardware::get_gpu_dynamic_info();

ResourceSnapshot {
    // ...既存フィールド...
    gpu_usage_percent: gpu_dynamic.usage_percent,
    gpu_temp_c: gpu_dynamic.temperature_c,
    gpu_vram_used_mb: gpu_dynamic.vram_used_mb,
}
```

**注意:** NVML 呼び出しは軽量（< 1ms）なので 2秒間隔の pulse に含めても問題ない。

### 2.2 マルチ GPU 対応（infra/gpu.rs）

現在は `device_by_index(0)` で最初の GPU のみ。マルチ GPU 環境（SLI/NVLink）に対応:

**ファイル:** `src-tauri/src/infra/gpu.rs`

```rust
/// 全 GPU の情報を取得
pub fn query_all_gpus() -> Result<Vec<NvmlGpuData>, AppError> {
    // Nvml::init()
    // device_count() で GPU 数を取得
    // 各 GPU をイテレーション
    // エラーは個別にスキップ（1台失敗しても他は返す）
}
```

既存の `query_nvml_gpu()` はそのまま維持（後方互換）。新しい `query_all_gpus()` を追加する形。

### 2.3 GPU 情報キャッシュの改善

**ファイル:** `src-tauri/src/state.rs`

```rust
pub struct AppState {
    // 既存
    pub gpu_static: Option<GpuStaticInfo>,
    // 追加: キャッシュの有効期限
    pub gpu_cache_updated_at: Option<std::time::Instant>,
}
```

キャッシュを60秒で更新（GPU のホットスワップ対応）:

```rust
const GPU_CACHE_TTL_SECS: u64 = 60;

fn should_refresh_gpu_cache(state: &AppState) -> bool {
    state.gpu_cache_updated_at
        .map(|t| t.elapsed().as_secs() > GPU_CACHE_TTL_SECS)
        .unwrap_or(true)
}
```

### 2.4 フロントエンド型の更新

**ファイル:** `src/types/hardware.ts` (または適切な型ファイル)

既存の `ResourceSnapshot` 型に GPU フィールドを追加:

```typescript
export interface ResourceSnapshot {
  // ...既存フィールド...
  gpuUsagePercent: number | null;
  gpuTempC: number | null;
  gpuVramUsedMb: number | null;
}
```

**ファイル:** `src/stores/usePulseStore.ts`

追加フィールドを受け取れるよう型を更新。ストアロジックの変更は不要（型だけ）。

### 2.5 テスト

**Rust テスト (`infra/gpu.rs`):**

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_query_all_gpus_returns_vec() {
        // 非 Windows 環境では空 Vec を返すことを確認
    }
}
```

**Rust テスト (`services/hardware.rs`):**

```rust
#[test]
fn test_gpu_dynamic_info_fields() {
    let info = get_gpu_dynamic_info();
    // None でもエラーにならないことを確認
}
```

**TS テスト:**

既存の pulse 関連テストに GPU フィールドのモックを追加:

```typescript
const MOCK_SNAPSHOT: ResourceSnapshot = {
  // ...既存...
  gpuUsagePercent: 45,
  gpuTempC: 72,
  gpuVramUsedMb: 4096,
};
```

---

## アーキテクチャルール（必守）

| ルール | 内容 |
|--------|------|
| 依存方向 | `commands → services → infra`（逆方向禁止） |
| エラー | `AppError` を使用。`unwrap()` 禁止（テスト内は理由コメント付きで許可） |
| ロギング | `tracing` (`info!` / `warn!` / `error!`)。`println!` 禁止 |
| PowerShell | `infra/powershell.rs` のヘルパー経由。直接実行禁止 |
| System | `PulseState` の共有インスタンスを使用。`System::new_all()` 禁止 |
| ファイルサイズ | Rust: 300行以下を目標 |
| テスト | ロジック変更には対応するテスト必須 |

## 品質ゲート

```text
cargo fmt -- --check
cargo clippy -- -D warnings
cargo test
npm run typecheck (フロントエンド型変更時)
npm run test (フロントエンドモック変更時)
```

## コミット形式

```text
feat: cleanup — 一時ファイルスキャン + 削除コマンド追加
feat: GPU モニタリング強化 — ResourceSnapshot に GPU データ統合
```
