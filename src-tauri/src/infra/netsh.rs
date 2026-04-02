//! netsh コマンドの薄いラッパー（Windows 専用）
//!
//! services/ 層は直接 `std::process::Command` を呼ばず、
//! このモジュール経由で netsh を実行する。

use crate::error::AppError;
use std::process::Command;

/// `netsh <args>` を実行し、stdout を UTF-8 文字列として返す。
///
/// 終了コードが非ゼロの場合は `AppError::Command` を返す。
pub fn run_netsh(args: &[&str]) -> Result<String, AppError> {
    let output = Command::new("netsh")
        .args(args)
        .output()
        .map_err(|e| AppError::Command(format!("netsh コマンド失敗: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "netsh 実行エラー: {}",
            stderr.trim()
        )));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
