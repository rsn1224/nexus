# nexus Rust 実装規約

Rust コマンド追加・修正時に必ずこの規約に従うこと。

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

#[tauri::command]
pub fn my_command(arg: String) -> Result<MyData, AppError> {
    Ok(MyData { ... })
}
```

## 登録手順

```rust
// mod.rs
pub mod {wing};
// lib.rs invoke_handler
.invoke_handler(tauri::generate_handler![commands::{wing}::my_command])
```

## 品質ゲート

```bash
cd src-tauri
cargo test
cargo clippy -- -D warnings
cargo fmt -- --check
```
