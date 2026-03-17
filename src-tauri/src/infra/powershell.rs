#![allow(dead_code)]

use crate::error::AppError;
use tracing::debug;

/// PowerShell コマンドを実行し、標準出力を返す
///
/// - UTF-8 出力を強制
/// - NoProfile + NonInteractive + ExecutionPolicy Bypass
/// - エラー時は AppError::PowerShell を返す
pub fn run_powershell(command: &str) -> Result<String, AppError> {
    debug!("PowerShell実行: {}", &command[..command.len().min(100)]);

    let utf8_command = format!(
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; {}",
        command
    );

    let output = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            utf8_command.as_str(),
        ])
        .output()
        .map_err(|e| AppError::PowerShell(format!("PowerShellの起動に失敗: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let detail = if !stderr.trim().is_empty() {
            stderr.trim().to_string()
        } else if !stdout.trim().is_empty() {
            stdout.trim().to_string()
        } else {
            format!("終了コード {}", output.status.code().unwrap_or(-1))
        };
        return Err(AppError::PowerShell(format!(
            "PowerShell実行失敗: {}",
            detail
        )));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.trim().to_string())
}

/// PowerShell コマンドを実行し、失敗時はデフォルト値を返す（ベストエフォート実行）
pub fn run_powershell_or_default(command: &str) -> String {
    run_powershell(command).unwrap_or_default()
}
