---
description: nexus Rust 実装規約（コマンドボイラープレート・登録手順・品質ゲート）
globs: "src-tauri/**/*.rs"
---

# nexus Rust 実装規約

汎用 Rust ルールはグローバル `.claude/rules/tauri-v2-gotchas.md` を参照。
nexus 固有の Tauri 注意点は `.claude/rules/tauri-v2-gotchas.md` を参照。

## 絶対ルール

- `unwrap()` 禁止（本番コード）→ `?` 演算子または `match` で `AppError` に変換
- `unsafe` 禁止（理由明記の場合を除く）
- `println!` 禁止 → `tracing::info!` / `tracing::error!`
- エラー型は `src-tauri/src/error.rs` の `AppError` のみ

## コマンドボイラープレート

```rust
use crate::error::AppError;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MyData {
    pub field_name: String,
    pub optional_field: Option<f64>,
}

// 同期コマンド（CPU バウンドな軽量処理）
#[tauri::command]
pub fn my_command(arg: String) -> Result<MyData, AppError> {
    Ok(MyData { field_name: arg, optional_field: None })
}

// 非同期コマンド（I/O バウンドな処理）
#[tauri::command]
pub async fn my_async_command(
    state: tauri::State<'_, crate::state::PulseState>,
    arg: String,
) -> Result<MyData, AppError> {
    Ok(MyData { field_name: arg, optional_field: None })
}
```

CPU バウンドな処理を `async` 内に書かない → `tokio::task::spawn_blocking` を使う。

## 登録手順（nexus のモジュール構成）

```rust
// commands/{wing}/mod.rs
pub mod my_wing;

// src-tauri/src/lib.rs — invoke_handler に追加
.invoke_handler(tauri::generate_handler![
    commands::my_wing::my_command,
    commands::my_wing::my_async_command,
])
```

## 品質ゲート

```bash
cd src-tauri
cargo test
cargo clippy -- -D warnings
cargo fmt -- --check
```
