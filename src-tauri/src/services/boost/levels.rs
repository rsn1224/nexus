//! ブーストレベル別の適用ロジック
//! Level 1: バックグラウンドプロセス一時停止
//! Level 2: CPU アフィニティ再配置 + プロセス優先度設定
//! Level 3: 不要プロセス強制終了

use tracing::{info, warn};

use crate::constants::is_protected_process;
use crate::error::AppError;
use crate::infra::{cpu_affinity, process_control};
use crate::state::SharedState;
use crate::types::game::{GameProfile, ProfileApplyResult};

use sysinfo::ProcessesToUpdate;
use tauri::State;

use super::utils::find_pids_by_name;

/// Level 1 ブースト: バックグラウンドプロセスを一時停止
pub(super) fn apply_level1(
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
pub(super) fn apply_level2(
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
pub(super) fn apply_level3(
    profile: &GameProfile,
    result: &mut ProfileApplyResult,
) -> Result<(), AppError> {
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
