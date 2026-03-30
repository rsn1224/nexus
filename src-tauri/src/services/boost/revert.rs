//! ブーストリバートロジック

use tracing::{info, warn};

use crate::error::AppError;
#[cfg(windows)]
use crate::infra::power_plan;
use crate::infra::{cpu_affinity, process_control};
use crate::services::core_parking;
use crate::state::SharedState;
use crate::types::game::{ProfileApplyResult, RevertSnapshot};

use tauri::State;

/// リバート: ブースト適用前の状態に戻す
pub fn revert_boost(state: &State<'_, SharedState>) -> Result<(), AppError> {
    let snapshot = {
        let mut s = state
            .lock()
            .map_err(|e| AppError::Process(format!("Stateロックエラー: {}", e)))?;
        s.revert_snapshot.take()
    };

    let Some(snapshot) = snapshot else {
        info!("リバート対象のスナップショットなし");
        return Ok(());
    };

    info!(
        "リバート開始: プロファイル {}, 一時停止PID {}件, アフィニティ変更 {}件",
        snapshot.profile_id,
        snapshot.suspended_pids.len(),
        snapshot.prev_affinities.len()
    );

    // 一時停止プロセスを再開
    for pid in &snapshot.suspended_pids {
        if let Err(e) = process_control::resume_process(*pid) {
            warn!("プロセス再開失敗: PID {}: {}", pid, e);
        }
    }

    // アフィニティを元に戻す
    for (pid, prev_mask) in &snapshot.prev_affinities {
        let cores = cpu_affinity::mask_to_cores(*prev_mask);
        if !cores.is_empty() {
            if let Err(e) = cpu_affinity::set_affinity(*pid, &cores) {
                warn!("アフィニティ復元失敗: PID {}: {}", pid, e);
            }
        }
    }

    // コアパーキングを復元
    if let Some(prev_percent) = snapshot.prev_core_parking {
        if let Err(e) = core_parking::restore_parking(prev_percent) {
            warn!("コアパーキング復元失敗: {}%", e);
        } else {
            info!("コアパーキング復元完了: {}%", prev_percent);
        }
    }

    // 電源プランを元に戻す
    if let Some(_prev_guid) = &snapshot.prev_power_plan_guid {
        #[cfg(windows)]
        {
            if let Err(e) = power_plan::revert_power_plan(Some(_prev_guid.to_string())) {
                warn!("電源プラン復元失敗: {}: {}", _prev_guid, e);
            }
        }
        #[cfg(not(windows))]
        {
            warn!("電源プラン復元: Linux ではスキップ");
        }
    }

    // タイマーリゾリューションを復元
    {
        let has_timer = state
            .lock()
            .map(|s| s.timer_resolution_requested.is_some())
            .unwrap_or(false);

        if has_timer {
            #[cfg(windows)]
            {
                if let Err(e) = crate::infra::timer_resolution::restore_resolution() {
                    warn!("タイマーリゾリューション復元失敗: {}", e);
                } else {
                    info!("タイマーリゾリューション: デフォルトに復元");
                }
            }
            #[cfg(not(windows))]
            {
                warn!("タイマーリゾリューション復元: Linux ではスキップ");
            }
            // AppState の要求値をクリア
            if let Ok(mut s) = state.lock() {
                s.timer_resolution_requested = None;
            }
        }
    }

    info!("リバート完了: プロファイル {}", snapshot.profile_id);
    Ok(())
}

/// リバートスナップショットを AppState に保存する
pub(crate) fn save_revert_snapshot(
    state: &State<'_, SharedState>,
    profile_id: &str,
    result: &ProfileApplyResult,
    prev_affinities: Vec<(u32, usize)>,
) -> Result<(), AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Process(format!("Stateロックエラー: {}", e)))?;

    s.revert_snapshot = Some(RevertSnapshot {
        profile_id: profile_id.to_string(),
        prev_power_plan_guid: result.prev_power_plan.clone(),
        suspended_pids: result.suspended_pids.clone(),
        prev_affinities,
        prev_core_parking: result.prev_core_parking,
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    });

    Ok(())
}
