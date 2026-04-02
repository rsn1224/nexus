//! ping コマンドの薄いラッパー
//!
//! services/ 層は直接 `std::process::Command` を呼ばず、
//! このモジュール経由で ping を実行する。

use crate::error::AppError;
use std::process::Command;

/// `ping -n <count> <target>` を実行し、stdout を文字列として返す。
///
/// ping の終了コードは 0 以外でも stdout に結果が含まれるため、
/// コマンド自体の起動失敗のみをエラーとする。
pub fn run_ping(target: &str, count: u32) -> Result<String, AppError> {
    let count_str = count.to_string();
    let output = Command::new("ping")
        .args(["-n", &count_str, target])
        .output()
        .map_err(|e| AppError::Command(format!("ping コマンド失敗: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !stderr.trim().is_empty() {
            return Err(AppError::Command(format!(
                "ping 失敗: {}",
                stderr.trim()
            )));
        }
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
