//! ブースト適用ロジック
//! 仕様: docs/specs/game-enhancement-spec.md §6
//!
//! Phase 8a: Level 1（ソフト — バックグラウンドプロセス一時停止）
//! Phase 8b: Level 2/3（ミディアム/ハード — 電源プラン・アフィニティ・プロセス終了）

use tracing::{info, warn};

use crate::error::AppError;
use crate::infra::cpu_affinity;
#[cfg(windows)]
use crate::infra::power_plan;
use crate::services::core_parking;
use crate::state::SharedState;
use crate::types::game::{BoostLevel, GameProfile, ProfileApplyResult};

use tauri::State;

use super::levels::{apply_level1, apply_level2, apply_level3};
use super::revert::save_revert_snapshot;
use super::utils::find_pids_by_name;

/// プロファイルに基づいてブーストを適用する
/// 現在は Level 1（ソフト）のみ実装。Level 2/3 は Phase 8b で追加。
pub fn apply_profile_boost(
    profile: &GameProfile,
    state: &State<'_, SharedState>,
) -> Result<ProfileApplyResult, AppError> {
    let mut result = ProfileApplyResult::new(&profile.id);

    match profile.boost_level {
        BoostLevel::None => {
            info!("ブーストなし: プロファイル {}", profile.display_name);
            result.applied.push("ブーストなし".to_string());
        }
        BoostLevel::Soft => {
            apply_level1(profile, state, &mut result)?;
        }
        BoostLevel::Medium => {
            apply_level1(profile, state, &mut result)?;
            apply_level2(profile, state, &mut result)?;
        }
        BoostLevel::Hard => {
            apply_level1(profile, state, &mut result)?;
            apply_level2(profile, state, &mut result)?;
            apply_level3(profile, &mut result)?;
        }
    }

    // コアパーキング制御（プロファイル設定による）
    if profile.core_parking_disabled {
        match core_parking::disable_parking() {
            Ok(prev_percent) => {
                result.prev_core_parking = Some(prev_percent);
                result.applied.push("コアパーキング無効化".to_string());
                info!("コアパーキング無効化完了: 元の値={}%", prev_percent);
            }
            Err(e) => {
                let msg = format!("コアパーキング無効化失敗: {}", e);
                warn!("{}", msg);
                result.warnings.push(msg);
            }
        }
    }

    // 電源プラン変更（Level 1 でも PowerPlan が指定されていれば適用）
    if let Some(_guid) = profile.power_plan.guid() {
        #[cfg(windows)]
        {
            match power_plan::switch_power_plan(profile.power_plan) {
                Ok(prev) => {
                    result.prev_power_plan = prev.clone();
                    result
                        .applied
                        .push(format!("電源プラン変更: {:?}", profile.power_plan));
                    info!(
                        "電源プラン変更完了: {:?} (元: {:?})",
                        profile.power_plan, prev
                    );
                }
                Err(e) => {
                    let msg = format!("電源プラン変更失敗: {}", e);
                    warn!("{}", msg);
                    result.warnings.push(msg);
                }
            }
        }
        #[cfg(not(windows))]
        {
            let msg = "電源プラン変更: Linux ではスキップ".to_string();
            warn!("{}", msg);
            result.warnings.push(msg);
        }
    }

    // タイマーリゾリューション設定
    if let Some(resolution) = profile.timer_resolution_100ns {
        #[cfg(windows)]
        {
            match crate::infra::timer_resolution::set_resolution(resolution) {
                Ok(_timer_state) => {
                    // AppState に要求値を記録
                    if let Ok(mut s) = state.lock() {
                        s.timer_resolution_requested = Some(resolution);
                    }
                    result.applied.push(format!(
                        "タイマーリゾリューション: {} ms",
                        resolution as f64 / 10000.0
                    ));
                    info!(
                        "タイマーリゾリューション設定完了: {} ms",
                        resolution as f64 / 10000.0
                    );
                }
                Err(e) => {
                    let msg = format!("タイマーリゾリューション設定失敗: {}", e);
                    warn!("{}", msg);
                    result.warnings.push(msg);
                }
            }
        }
        #[cfg(not(windows))]
        {
            // AppState に要求値を記録
            if let Ok(mut s) = state.lock() {
                s.timer_resolution_requested = Some(resolution);
            }
            let msg = format!(
                "タイマーリゾリューション設定: {} ms - Linux ではスキップ",
                resolution as f64 / 10000.0
            );
            warn!("{}", msg);
            result.warnings.push(msg);
        }
    }

    // Level 2/3 の場合、アフィニティ変更前の状態を取得
    let prev_affinities = if matches!(profile.boost_level, BoostLevel::Medium | BoostLevel::Hard) {
        let exe_name = profile
            .exe_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();
        collect_prev_affinities(state, &exe_name)
    } else {
        vec![]
    };

    // リバートスナップショットを保存
    save_revert_snapshot(state, &profile.id, &result, prev_affinities)?;

    info!(
        "ブースト適用完了: プロファイル={}, 適用={}, 警告={}",
        profile.display_name,
        result.applied.len(),
        result.warnings.len()
    );

    Ok(result)
}

/// Level 2 のアフィニティ変更前の状態を収集して返す
fn collect_prev_affinities(state: &State<'_, SharedState>, exe_name: &str) -> Vec<(u32, usize)> {
    let game_pids = match find_pids_by_name(state, exe_name) {
        Ok(pids) => pids,
        Err(_) => return vec![],
    };

    let mut affinities = Vec::new();
    for &pid in &game_pids {
        if let Ok(cores) = cpu_affinity::get_affinity(pid) {
            let mask = cpu_affinity::cores_to_mask(&cores);
            affinities.push((pid, mask));
        }
    }
    affinities
}
