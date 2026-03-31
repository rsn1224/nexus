use crate::error::AppError;
use crate::state::SharedState;
use crate::types::v4::DiagnosticAlert;
use tauri::State;

#[tauri::command]
pub fn diagnose(state: State<'_, SharedState>) -> Result<Vec<DiagnosticAlert>, AppError> {
    let status = crate::services::status_service::get_system_status(&state)?;
    Ok(crate::services::diagnose_service::diagnose(&status))
}
