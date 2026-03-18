//! ブーストロジック（services 層）
//! 仕様: docs/specs/game-enhancement-spec.md §6
//!
//! Phase 8a: Level 1（ソフト — バックグラウンドプロセス一時停止）
//! Phase 8b: Level 2/3（ミディアム/ハード — 電源プラン・アフィニティ・プロセス終了）

use tracing::{info, warn};

use crate::constants::is_protected_process;
use crate::error::AppError;
#[cfg(windows)]
use crate::infra::power_plan;
use crate::infra::{cpu_affinity, process_control};
use crate::services::core_parking;
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

/// Level 2 ブースト: CPU アフィニティ再配置 + プロセス優先度設定
fn apply_level2(
    profile: &GameProfile,
    state: &State<'_, SharedState>,
    result: &mut ProfileApplyResult,
) -> Result<(), AppError> {
    info!(
        "Level 2 ブースト開始: プロファイル {}",
        profile.display_name
    );

    // CPU トポロジー取得
    let topology = crate::services::cpu_topology::detect_topology()?;

    // --- ゲームプロセスの CPU アフィニティ設定 ---
    let exe_name = profile
        .exe_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    if !exe_name.is_empty() {
        let game_pids = find_pids_by_name(state, &exe_name)?;

        // ゲーム用コアを決定
        let game_cores = if let Some(ref cores) = profile.cpu_affinity_game {
            cores.clone()
        } else if !topology.p_cores.is_empty() && !topology.e_cores.is_empty() {
            // P-Core のみに限定（Intel ハイブリッド CPU の場合）
            topology.p_cores.clone()
        } else {
            // P/E 分離なし — アフィニティ変更はスキップ
            vec![]
        };

        if !game_cores.is_empty() {
            for &pid in &game_pids {
                match cpu_affinity::set_affinity(pid, &game_cores) {
                    Ok(()) => {
                        result.applied.push(format!(
                            "CPU アフィニティ設定: {} (PID: {}) → コア {:?}",
                            exe_name, pid, game_cores
                        ));
                    }
                    Err(e) => {
                        let msg =
                            format!("アフィニティ設定失敗: {} (PID: {}): {}", exe_name, pid, e);
                        warn!("{}", msg);
                        result.warnings.push(msg);
                    }
                }
            }
        }
    }

    // --- バックグラウンドプロセスの E-Core 追い出し ---
    let bg_cores = if let Some(ref cores) = profile.cpu_affinity_background {
        cores.clone()
    } else if !topology.e_cores.is_empty() {
        topology.e_cores.clone()
    } else {
        vec![] // E-Core がなければスキップ
    };

    if !bg_cores.is_empty() {
        apply_background_affinity(state, &bg_cores, &exe_name, result);
    }

    // --- ゲームプロセスの優先度設定 ---
    if profile.process_priority != crate::types::game::ProcessPriority::Normal
        && !exe_name.is_empty()
    {
        let game_pids = find_pids_by_name(state, &exe_name)?;
        for &pid in &game_pids {
            match process_control::set_process_priority_class(pid, profile.process_priority) {
                Ok(()) => {
                    result.applied.push(format!(
                        "プロセス優先度設定: {} (PID: {}) → {:?}",
                        exe_name, pid, profile.process_priority
                    ));
                }
                Err(e) => {
                    let msg = format!("優先度設定失敗: {} (PID: {}): {}", exe_name, pid, e);
                    warn!("{}", msg);
                    result.warnings.push(msg);
                }
            }
        }
    }

    Ok(())
}

/// バックグラウンドプロセスを指定コアに追い出す
fn apply_background_affinity(
    state: &State<'_, SharedState>,
    bg_cores: &[usize],
    game_exe_name: &str,
    result: &mut ProfileApplyResult,
) {
    let Ok(mut s) = state.lock() else {
        result
            .warnings
            .push("State ロックエラー: バックグラウンドアフィニティスキップ".to_string());
        return;
    };

    s.sys.refresh_processes(ProcessesToUpdate::All, true);
    let game_name_lower = game_exe_name.to_lowercase();

    let bg_pids: Vec<(u32, String)> = s
        .sys
        .processes()
        .values()
        .filter_map(|p| {
            let name = p.name().to_string_lossy().to_lowercase();
            // 自アプリ、ゲーム、保護プロセスは除外
            if name == game_name_lower || is_protected_process(&name) || name == "nexus.exe" {
                None
            } else {
                Some((p.pid().as_u32(), name))
            }
        })
        .collect();

    drop(s); // ロック解放

    let mut moved_count = 0u32;
    for (pid, _name) in &bg_pids {
        match cpu_affinity::set_affinity(*pid, bg_cores) {
            Ok(()) => {
                moved_count += 1;
            }
            Err(_) => {
                // バックグラウンドプロセスの追い出し失敗は致命的ではないので警告のみ
                // 大量に出るため個別ログはスキップ
            }
        }
    }

    if moved_count > 0 {
        result.applied.push(format!(
            "バックグラウンドプロセス {} 件を E-Core（コア {:?}）に移動",
            moved_count, bg_cores
        ));
    }
}

/// Level 3 ブースト: 不要プロセス強制終了
fn apply_level3(profile: &GameProfile, result: &mut ProfileApplyResult) -> Result<(), AppError> {
    info!(
        "Level 3 ブースト開始: プロファイル {}",
        profile.display_name
    );

    if profile.processes_to_kill.is_empty() {
        result.applied.push("強制終了対象プロセスなし".to_string());
        return Ok(());
    }

    for proc_name in &profile.processes_to_kill {
        // 保護プロセスチェック（絶対に kill しない）
        if is_protected_process(proc_name) {
            let msg = format!("保護プロセスの強制終了をスキップ: {}", proc_name);
            warn!("{}", msg);
            result.warnings.push(msg);
            continue;
        }

        match process_control::find_pids_by_name(proc_name) {
            Ok(pids) => {
                if pids.is_empty() {
                    result
                        .warnings
                        .push(format!("終了対象プロセスが見つかりません: {}", proc_name));
                    continue;
                }
                for pid in pids {
                    match process_control::terminate_process(pid, 0) {
                        Ok(()) => {
                            result
                                .applied
                                .push(format!("プロセス強制終了: {} (PID: {})", proc_name, pid));
                            info!("プロセス強制終了: {} (PID: {})", proc_name, pid);
                        }
                        Err(e) => {
                            let msg = format!(
                                "プロセス強制終了失敗: {} (PID: {}): {}",
                                proc_name, pid, e
                            );
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
    if let Some(prev_guid) = &snapshot.prev_power_plan_guid {
        #[cfg(windows)]
        {
            if let Err(e) = power_plan::revert_power_plan(Some(prev_guid.to_string())) {
                warn!("電源プラン復元失敗: {}: {}", prev_guid, e);
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
