use crate::error::AppError;
use crate::state::SharedState;
use crate::types::v4::{ApplyResult, OptCandidate, RevertResult};
use tauri::State;

#[tauri::command]
pub fn get_optimization_candidates() -> Vec<OptCandidate> {
    crate::services::optimize::get_candidates()
}

#[tauri::command]
pub fn apply_optimizations(
    ids: Vec<String>,
    app: tauri::AppHandle,
    state: State<'_, SharedState>,
) -> Result<ApplyResult, AppError> {
    crate::services::optimize::apply_optimizations(&ids, &app, &state)
}

#[tauri::command]
pub fn revert_all() -> RevertResult {
    crate::services::optimize::revert_all()
}
