//! ヘルスチェックコマンド

use crate::error::AppError;
use crate::services::health_check::{self, HealthCheckInput, HealthCheckResult};

#[tauri::command]
pub fn run_health_check(input: HealthCheckInput) -> Result<HealthCheckResult, AppError> {
    Ok(health_check::run_health_check(&input))
}
