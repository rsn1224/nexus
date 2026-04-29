---
description: nexus 固有の Tauri v2 補足（共通パターンはグローバルを参照）
globs: "src-tauri/**/*.rs"
---

# Tauri v2 注意点（nexus 固有）

共通の Tauri v2 落とし穴はグローバル `.claude/rules/tauri-v2-gotchas.md` を参照。
以下は nexus 固有のルール。

## `invoke_handler` 登録（nexus のモジュール構成）

nexus では `commands::` 配下にモジュールを配置する。追加時は必ず `lib.rs` にも登録:

```rust
// src-tauri/src/lib.rs
.invoke_handler(tauri::generate_handler![
  commands::boost::run_boost,      // ← 追加したら必ずここにも
  commands::hardware::get_snapshot,
])
```
