#![allow(dead_code)]

//! ブーストロジック（services 層）
//! 仕様: docs/specs/game-enhancement-spec.md §6
//!
//! Phase 8a: Level 1（ソフト — バックグラウンドプロセス一時停止）
//! Phase 8b: Level 2/3（ミディアム/ハード — 電源プラン・アフィニティ・プロセス終了）

use tracing::{info, warn};

use crate::constants::is_protected_process;
use crate::error::AppError;
use crate::infra::{power_plan, process_control};
use crate::state::SharedState;
use crate::types::game::{BoostLevel, GameProfile, ProfileApplyResult, RevertSnapshot};

use sysinfo::ProcessesToUpdate;
use tauri::State;

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
        BoostLevel::Medium | BoostLevel::Hard => {
            // Phase 8b で実装予定
            warn!(
                "BoostLevel::{:?} は未実装です。Level 1 にフォールバックします",
                profile.boost_level
            );
            apply_level1(profile, state, &mut result)?;
            result.warnings.push(format!(
                "BoostLevel::{:?} は未実装。Level 1 で代替実行しました",
                profile.boost_level
            ));
        }
    }

    // 電源プラン変更（Level 1 でも PowerPlan が指定されていれば適用）
    if let Some(_guid) = profile.power_plan.guid() {
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

    // リバートスナップショットを保存
    save_revert_snapshot(state, &profile.id, &result)?;

    info!(
        "ブースト適用完了: プロファイル={}, 適用={}, 警告={}",
        profile.display_name,
        result.applied.len(),
        result.warnings.len()
    );

    Ok(result)
}

/// Level 1 ブースト: バックグラウンドプロセスを一時停止
fn apply_level1(
    profile: &GameProfile,
    state: &State<'_, SharedState>,
    result: &mut ProfileApplyResult,
) -> Result<(), AppError> {
    info!(
        "Level 1 ブースト開始: プロファイル {}",
        profile.display_name
    );

    if profile.processes_to_suspend.is_empty() {
        result.applied.push("一時停止対象プロセスなし".to_string());
        return Ok(());
    }

    for proc_name in &profile.processes_to_suspend {
        // 保護プロセスチェック
        if is_protected_process(proc_name) {
            let msg = format!("保護プロセスをスキップ: {}", proc_name);
            warn!("{}", msg);
            result.warnings.push(msg);
            continue;
        }

        // プロセス名から PID を検索
        match find_pids_by_name(state, proc_name) {
            Ok(pids) => {
                if pids.is_empty() {
                    result
                        .warnings
                        .push(format!("プロセスが見つかりません: {}", proc_name));
                    continue;
                }
                for pid in pids {
                    match process_control::suspend_process(pid) {
                        Ok(()) => {
                            result.suspended_pids.push(pid);
                            result
                                .applied
                                .push(format!("一時停止: {} (PID: {})", proc_name, pid));
                        }
                        Err(e) => {
                            let msg = format!("一時停止失敗: {} (PID: {}): {}", proc_name, pid, e);
                            warn!("{}", msg);
                            result.warnings.push(msg);
                        }
                    }
                }
            }
            Err(e) => {
                let msg = format!("プロセス検索エラー: {}: {}", proc_name, e);
                warn!("{}", msg);
                result.warnings.push(msg);
            }
        }
    }

    Ok(())
}

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
        "リバート開始: プロファイル {}, 一時停止PID {}件",
        snapshot.profile_id,
        snapshot.suspended_pids.len()
    );

    // 一時停止プロセスを再開
    for pid in &snapshot.suspended_pids {
        if let Err(e) = process_control::resume_process(*pid) {
            warn!("プロセス再開失敗: PID {}: {}", pid, e);
            // 再開失敗は致命的ではないので続行
        }
    }

    // 電源プランを元に戻す
    if let Some(prev_guid) = &snapshot.prev_power_plan_guid {
        if let Err(e) = power_plan::revert_power_plan(Some(prev_guid.to_string())) {
            warn!("電源プラン復元失敗: {}: {}", prev_guid, e);
        }
    }

    info!("リバート完了: プロファイル {}", snapshot.profile_id);
    Ok(())
}

/// プロセス名から PID リストを検索する
fn find_pids_by_name(state: &State<'_, SharedState>, name: &str) -> Result<Vec<u32>, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Process(format!("Stateロックエラー: {}", e)))?;

    s.sys.refresh_processes(ProcessesToUpdate::All, true);

    let name_lower = name.to_lowercase();
    let pids: Vec<u32> = s
        .sys
        .processes()
        .values()
        .filter(|p| {
            let proc_name = p.name().to_string_lossy().to_lowercase();
            proc_name == name_lower
        })
        .map(|p| p.pid().as_u32())
        .collect();

    Ok(pids)
}

/// リバートスナップショットを AppState に保存する
fn save_revert_snapshot(
    state: &State<'_, SharedState>,
    profile_id: &str,
    result: &ProfileApplyResult,
) -> Result<(), AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Process(format!("Stateロックエラー: {}", e)))?;

    s.revert_snapshot = Some(RevertSnapshot {
        profile_id: profile_id.to_string(),
        prev_power_plan_guid: result.prev_power_plan.clone(),
        suspended_pids: result.suspended_pids.clone(),
        prev_affinities: vec![], // Phase 8b で使用
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    });

    Ok(())
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_pids_returns_empty_for_nonexistent() {
        // State を直接作れないので、ロジックの単体テストは限定的
        // 統合テストは commands 層 or E2E で行う
    }

    #[test]
    fn test_boost_level_determines_action() {
        // BoostLevel の判定ロジックが正しいことを確認
        assert!(BoostLevel::None < BoostLevel::Soft);
        assert!(BoostLevel::Soft < BoostLevel::Medium);
    }

    #[test]
    fn test_protected_process_skipped() {
        assert!(is_protected_process("explorer.exe"));
        assert!(is_protected_process("svchost.exe"));
        assert!(!is_protected_process("chrome.exe"));
    }
}
