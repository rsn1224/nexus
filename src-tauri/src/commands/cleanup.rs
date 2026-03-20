// Cleanup Commands — 全設定リバート・データ削除コマンド + 一時ファイル削除

use crate::error::AppError;
use crate::services::cleanup::{CleanupResult, CleanupScanResult, RevertAllResult};
use crate::state::SharedState;
use tauri::State;
use tracing::info;

/// 全設定リバート
#[tauri::command]
pub fn revert_all_settings(state: State<'_, SharedState>) -> Result<RevertAllResult, AppError> {
    info!("revert_all_settings: 全設定リバート開始");
    Ok(crate::services::cleanup::revert_all(&state))
}

/// 一時ファイルをスキャン
#[tauri::command]
pub async fn scan_temp_files() -> Result<CleanupScanResult, AppError> {
    info!("scan_temp_files: スキャン開始");
    tokio::task::spawn_blocking(crate::services::cleanup::scan_temp_files)
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

/// 指定された一時ファイルを削除
#[tauri::command]
pub async fn delete_temp_files(paths: Vec<String>) -> Result<CleanupResult, AppError> {
    // paths のバリデーション: TEMP_DIRS 配下のパスのみ許可
    info!(count = paths.len(), "delete_temp_files: 削除開始");
    tokio::task::spawn_blocking(move || crate::services::cleanup::delete_temp_files(paths))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}
