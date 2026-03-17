---
name: nexus-rust-rules
description: nexus の Rust / Tauri バックエンド実装規約。Rust コマンド追加・修正時に参照する。
---

# nexus Rust 実装規約

## 絶対ルール

- `unwrap()` 禁止（本番コード）→ `?` 演算子または `match` で `AppError` に変換
- `unsafe` 禁止（理由明記の場合を除く）
- `println!` 禁止 → `tracing::info!` / `tracing::error!` を使う
- エラー型は `src-tauri/src/error.rs` の `AppError` を使う

## コマンドのボイラープレート

```rust
// src-tauri/src/commands/{wing}.rs
use crate::error::AppError;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]  // TypeScript と camelCase で統一
pub struct MyData {
    pub field_name: String,
    pub optional_field: Option<f64>,  // 取得不可は Option で返す（エラーにしない）
}

#[tauri::command]
pub fn my_command(arg: String) -> Result<MyData, AppError> {
    // ...
    Ok(MyData { ... })
}
```

## 登録手順

```rust
// mod.rs に追加
pub mod {wing};

// lib.rs の invoke_handler に追加
.invoke_handler(tauri::generate_handler![
    commands::{wing}::my_command,
    // ...
])
```

## Windows API パターン

```rust
// レジストリ操作（winreg）
use winreg::enums::*;
use winreg::RegKey;

let hkcu = RegKey::predef(HKEY_CURRENT_USER);
let run_key = hkcu.open_subkey_with_flags(
    "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
    KEY_SET_VALUE,
)?;
// set: run_key.set_value("Nexus", &exe_path)?;
// del: run_key.delete_value("Nexus").ok(); // 存在しなくてもOK

// ファイル保存先（settings / data）
// {AppData}/nexus/{filename}.json
use tauri::Manager;
let app_data = app.path().app_data_dir()?;
let nexus_dir = app_data.join("nexus");
std::fs::create_dir_all(&nexus_dir)?;
```

## serde の規約

- 全 struct に `#[serde(rename_all = "camelCase")]` を付ける（TypeScript 側 camelCase と統一）
- レジストリキーは `REG_DWORD` → `u32`、`REG_SZ` → `String`

## テスト

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_my_command() {
        let result = my_command("arg".to_string());
        assert!(result.is_ok()); // unwrap() はテストのみ許可（理由: テスト失敗を明示するため）
    }
}
```

## 品質ゲート

```bash
cd src-tauri
cargo test
cargo clippy -- -D warnings
cargo fmt -- --check
```
