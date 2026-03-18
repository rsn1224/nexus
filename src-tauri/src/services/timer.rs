//! タイマーリゾリューション管理サービス（services 層）
//! 仕様: docs/specs/game-enhancement-spec.md §8

use tracing::{info, warn};

use crate::error::AppError;
use crate::infra::timer_resolution;
use crate::state::SharedState;
use crate::types::game::TimerResolutionState;

use tauri::State;

/// 現在のタイマーリゾリューション情報を取得する。
/// AppState の要求値も反映して返す。
pub fn get_timer_state(state: &State<'_, SharedState>) -> Result<TimerResolutionState, AppError> {
    let mut timer_state = timer_resolution::query_resolution()?;

    // AppState に保存されている要求値を反映
    let requested = {
        let s = state
            .lock()
            .map_err(|e| AppError::Process(format!("State ロックエラー: {}", e)))?;
        s.timer_resolution_requested
    };
    timer_state.nexus_requested_100ns = requested;

    Ok(timer_state)
}

/// タイマーリゾリューションを設定する。
/// AppState にも要求値を記録する（リバート用）。
pub fn set_timer(
    state: &State<'_, SharedState>,
    resolution_100ns: u32,
) -> Result<TimerResolutionState, AppError> {
    // バリデーション: 現実的な範囲チェック（0.5 ms〜15.625 ms）
    if resolution_100ns < 5000 {
        warn!(
            "タイマーリゾリューション: {}({} ms) は 0.5 ms 未満のため、ハードウェアが対応していない可能性があります",
            resolution_100ns,
            resolution_100ns as f64 / 10000.0,
        );
    }
    if resolution_100ns > 156250 {
        return Err(AppError::InvalidInput(format!(
            "タイマーリゾリューション: {}({} ms) は 15.625 ms を超えています。0〜156250 の範囲で指定してください",
            resolution_100ns,
            resolution_100ns as f64 / 10000.0,
        )));
    }

    let timer_state = timer_resolution::set_resolution(resolution_100ns)?;

    // AppState に要求値を記録
    {
        let mut s = state
            .lock()
            .map_err(|e| AppError::Process(format!("State ロックエラー: {}", e)))?;
        s.timer_resolution_requested = Some(resolution_100ns);
    }

    info!(
        "タイマーリゾリューション設定: 要求={}({} ms)",
        resolution_100ns,
        resolution_100ns as f64 / 10000.0,
    );

    Ok(timer_state)
}

/// タイマーリゾリューションをデフォルトに戻す。
/// AppState の要求値もクリアする。
pub fn restore_timer(state: &State<'_, SharedState>) -> Result<(), AppError> {
    timer_resolution::restore_resolution()?;

    // AppState の要求値をクリア
    {
        let mut s = state
            .lock()
            .map_err(|e| AppError::Process(format!("State ロックエラー: {}", e)))?;
        s.timer_resolution_requested = None;
    }

    info!("タイマーリゾリューション: デフォルトに復元");
    Ok(())
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    // services 層のテストは State が必要なため、統合テストまたは commands 層で行う。
    // ロジックの単体テストは infra 層で完結している。
}
