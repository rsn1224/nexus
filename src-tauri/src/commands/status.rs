use crate::error::AppError;
use crate::state::SharedState;
use crate::types::v4::SystemStatus;
use tauri::State;

#[tauri::command]
pub fn get_system_status(state: State<'_, SharedState>) -> Result<SystemStatus, AppError> {
    crate::services::status_service::get_system_status(&state)
}
