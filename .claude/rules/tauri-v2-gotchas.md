---
name: tauri-v2-gotchas
description: Tauri v2 固有の注意点・既知のハマりポイントと対処法
---

# Tauri v2 注意点

## invoke エラーは plain object

Tauri v2 の `invoke()` が throw するエラーは `Error` インスタンスではなく plain object。

```typescript
// NG: message が undefined になる
catch (err) {
  set({ error: (err as Error).message });
}

// OK: JSON.stringify でフォールバック
catch (err) {
  const message = err instanceof Error ? err.message : JSON.stringify(err);
  set({ error: message });
}
```

**Why:** Tauri v2 は Rust の `AppError` をシリアライズして JS 側に返すため、`Error` オブジェクトにならない。

## `invoke_handler` 登録忘れ

新しい Rust コマンドを追加した際、`src-tauri/src/lib.rs` の `invoke_handler![]` マクロに登録しないと実行時エラーになる。コンパイルは通るので気づきにくい。

```rust
// src-tauri/src/lib.rs
.invoke_handler(tauri::generate_handler![
  commands::boost::run_boost,      // ← 追加したら必ずここにも
  commands::hardware::get_snapshot,
])
```

## `#[tauri::command]` の引数名は camelCase で受け取られる

Rust 関数の引数名 `snake_case` は JS 側では `camelCase` として呼ぶ。

```rust
// Rust
pub fn get_process_info(process_id: u32) -> Result<...>
```

```typescript
// TypeScript — JS から呼ぶ時は camelCase
invoke('get_process_info', { processId: 1234 });
```

## AppError の定義

エラーハンドリングは `src-tauri/src/error.rs` の `AppError` を使う。新しいエラーバリアントは必ずここに追加する。`thiserror` で自動実装済み。

```rust
use crate::error::AppError;

pub fn my_command() -> Result<String, AppError> {
    // ...
}
```

## Tauri v2 の権限設定

新コマンドがシステムリソースにアクセスする場合、`src-tauri/capabilities/` に権限設定が必要な場合がある。ビルドは通るが実行時に拒否される。
