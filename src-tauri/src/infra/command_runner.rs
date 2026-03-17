#![allow(dead_code)]

use crate::error::AppError;
use tracing::debug;

/// 外部コマンドを実行し、標準出力を返す
pub fn run_command(program: &str, args: &[&str]) -> Result<String, AppError> {
    debug!("コマンド実行: {} {:?}", program, args);

    let output = std::process::Command::new(program)
        .args(args)
        .output()
        .map_err(|e| AppError::Command(format!("{} の実行に失敗: {}", program, e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "{} 実行失敗: {}",
            program,
            stderr.trim()
        )));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.to_string())
}

/// 外部コマンドを実行し、失敗しても Ok を返す（ベストエフォート実行）
pub fn run_command_best_effort(program: &str, args: &[&str]) -> String {
    run_command(program, args).unwrap_or_default()
}
