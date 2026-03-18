// Cleanup Commands — 全設定リバート・データ削除コマンド

use crate::error::AppError;
use crate::services::cleanup::{RevertAllResult, RevertItem};
use crate::state::SharedState;
use tauri::State;
use tracing::info;

/// 全設定リバート
#[tauri::command]
pub fn revert_all_settings(state: State<'_, SharedState>) -> Result<RevertAllResult, AppError> {
    info!("revert_all_settings: 全設定リバート開始");
    Ok(crate::services::cleanup::revert_all(&state))
}

/// nexus データ削除（アンインストール用）
/// バックアップ JSON + プロファイル JSON + アプリ設定 + keyring を削除
#[tauri::command]
pub fn cleanup_app_data(app: tauri::AppHandle) -> Result<Vec<RevertItem>, AppError> {
    info!("cleanup_app_data: アプリデータ削除開始");
    Ok(crate::services::cleanup::cleanup_app_data(app))
}
