// Cleanup Commands — 全設定リバート・データ削除コマンド

use crate::error::AppError;
use crate::services::cleanup::RevertAllResult;
use crate::state::SharedState;
use tauri::State;
use tracing::info;

/// 全設定リバート
#[tauri::command]
pub fn revert_all_settings(state: State<'_, SharedState>) -> Result<RevertAllResult, AppError> {
    info!("revert_all_settings: 全設定リバート開始");
    Ok(crate::services::cleanup::revert_all(&state))
}
