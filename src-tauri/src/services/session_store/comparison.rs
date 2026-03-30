//! セッション比較機能

use crate::error::AppError;
use tauri::AppHandle;

use super::crud::{get_session, validate_session_id};

/// セッション比較
pub fn compare_sessions(
    app: &AppHandle,
    session_a_id: &str,
    session_b_id: &str,
) -> Result<crate::types::game::SessionComparisonResult, AppError> {
    validate_session_id(session_a_id)?;
    validate_session_id(session_b_id)?;

    if session_a_id == session_b_id {
        return Err(AppError::InvalidInput(
            "Cannot compare session with itself".to_string(),
        ));
    }

    let session_a = get_session(app, session_a_id)?;
    let session_b = get_session(app, session_b_id)?;

    // 差分計算（B - A）。正の値 = 改善
    let fps_delta_pct = if session_a.summary.avg_fps > 0.0 {
        ((session_b.summary.avg_fps - session_a.summary.avg_fps) / session_a.summary.avg_fps)
            * 100.0
    } else {
        0.0
    };

    let pct_1_low_delta_pct = if session_a.summary.pct_1_low > 0.0 {
        ((session_b.summary.pct_1_low - session_a.summary.pct_1_low) / session_a.summary.pct_1_low)
            * 100.0
    } else {
        0.0
    };

    let pct_01_low_delta_pct = if session_a.summary.pct_01_low > 0.0 {
        ((session_b.summary.pct_01_low - session_a.summary.pct_01_low)
            / session_a.summary.pct_01_low)
            * 100.0
    } else {
        0.0
    };

    let stutter_delta =
        session_b.summary.total_stutter_count as i32 - session_a.summary.total_stutter_count as i32;

    // NOTE: v2 予定 — AI による自動サマリ生成（Perplexity API 連携）
    let auto_summary = String::new();

    Ok(crate::types::game::SessionComparisonResult {
        session_a: session_a.summary,
        session_b: session_b.summary,
        fps_delta_pct,
        pct_1_low_delta_pct,
        pct_01_low_delta_pct,
        stutter_delta,
        auto_summary,
    })
}
