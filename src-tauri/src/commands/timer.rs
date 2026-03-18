//! タイマーリゾリューション系コマンド（commands 層）
//! 仕様: docs/specs/game-enhancement-spec.md §3.3, §8

use crate::error::AppError;
use crate::services::timer;
use crate::state::SharedState;
use crate::types::game::TimerResolutionState;

use tauri::State;

/// 現在のタイマーリゾリューション情報を取得する。
#[tauri::command]
pub fn get_timer_resolution(
    state: State<'_, SharedState>,
) -> Result<TimerResolutionState, AppError> {
    timer::get_timer_state(&state)
}

/// タイマーリゾリューションを設定する。
/// resolution_100ns: 要求値（100 ns 単位、例: 5000 = 0.5 ms, 10000 = 1 ms）
#[tauri::command]
pub fn set_timer_resolution(
    state: State<'_, SharedState>,
    resolution_100ns: u32,
) -> Result<TimerResolutionState, AppError> {
    timer::set_timer(&state, resolution_100ns)
}

/// タイマーリゾリューションをデフォルトに戻す。
#[tauri::command]
pub fn restore_timer_resolution(state: State<'_, SharedState>) -> Result<(), AppError> {
    timer::restore_timer(&state)
}
