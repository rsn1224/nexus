//! ゲーム起動/終了の監視サービス
//! 仕様: docs/specs/game-enhancement-spec.md §5
//!
//! unified_emitter から `check_once` として呼び出される（3秒間隔）。

use std::collections::HashMap;

use tauri::{AppHandle, Emitter, Manager};
use tracing::{info, warn};

use crate::error::AppError;
use crate::services;
use crate::state::SharedState;
use crate::types::game::{GameExitEvent, GameLaunchEvent};

/// 監視中のゲームの状態
pub struct ActiveGame {
    pub profile_id: String,
    pub exe_path: String,
    #[allow(dead_code)]
    pub pid: u32,
    pub started_at: u64,
}

/// ゲーム監視チェック（unified_emitter の tick%3 ごとに呼び出される）
///
/// `process_list` は呼び出し元が既に refresh_processes 済みのリストを渡す。
/// この関数内では refresh_processes を呼ばない。
pub async fn check_once(
    process_list: &[(u32, String)],
    app: &AppHandle,
    active_games: &mut HashMap<u32, ActiveGame>,
) {
    let profiles = match get_profiles(app) {
        Ok(p) => p,
        Err(e) => {
            warn!("game_monitor: プロファイル読み込みエラー: {}", e);
            return;
        }
    };

    if profiles.is_empty() {
        return;
    }

    // 起動検出: プロファイルの exe がプロセス一覧に存在するかチェック
    for profile in &profiles {
        let exe_name = match profile.exe_path.file_name() {
            Some(name) => name.to_string_lossy().to_lowercase(),
            None => continue,
        };

        if active_games.values().any(|g| g.profile_id == profile.id) {
            continue;
        }

        if let Some((pid, _)) = process_list
            .iter()
            .find(|(_, name)| name.to_lowercase() == exe_name)
        {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            info!(
                "ゲーム起動検出: {} (PID: {}, プロファイル: {})",
                exe_name, pid, profile.display_name
            );

            active_games.insert(
                *pid,
                ActiveGame {
                    profile_id: profile.id.clone(),
                    exe_path: profile.exe_path.to_string_lossy().to_string(),
                    pid: *pid,
                    started_at: now,
                },
            );

            let state = app.state::<SharedState>();
            match services::boost::apply_profile_boost(profile, &state) {
                Ok(result) => {
                    let _ = app.emit("nexus://profile-applied", &result);
                }
                Err(e) => {
                    warn!("ゲーム起動時のブースト適用失敗: {}", e);
                }
            }

            let event = GameLaunchEvent {
                exe_path: profile.exe_path.to_string_lossy().to_string(),
                profile_id: Some(profile.id.clone()),
                pid: *pid,
                detected_at: now,
            };
            let _ = app.emit("nexus://game-launched", &event);

            match crate::services::frame_time::FrameTimeSession::start(*pid, exe_name.clone()) {
                Ok(_session) => {
                    info!("フレームタイム監視を開始: PID {}", pid);
                }
                Err(e) => {
                    warn!("フレームタイム監視開始失敗: {}", e);
                }
            }
        }
    }

    // 終了検出: アクティブなゲームのプロセスがまだ存在するかチェック
    let running_pids: Vec<u32> = process_list.iter().map(|(pid, _)| *pid).collect();
    let exited_pids: Vec<u32> = active_games
        .keys()
        .filter(|pid| !running_pids.contains(pid))
        .copied()
        .collect();

    for pid in exited_pids {
        if let Some(game) = active_games.remove(&pid) {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let play_secs = now.saturating_sub(game.started_at);

            info!(
                "ゲーム終了検出: PID {} (プロファイル: {}, プレイ時間: {}秒)",
                pid, game.profile_id, play_secs
            );

            let state = app.state::<SharedState>();
            let revert_success = services::boost::revert_boost(&state).is_ok();

            if let Ok(dir) = app.path().app_data_dir() {
                let _ = services::profile::update_play_time(&dir, &game.profile_id, play_secs);
            }

            let event = GameExitEvent {
                exe_path: game.exe_path,
                profile_id: Some(game.profile_id),
                play_secs,
                revert_success,
                avg_fps: None,
                percentile_1_low: None,
                percentile_01_low: None,
                stutter_count: None,
            };
            let _ = app.emit("nexus://game-exited", &event);

            if let Ok(mut state) = app.state::<SharedState>().lock() {
                if let Some(ref mut session) = state.frame_time_session {
                    session.stop();
                    info!("フレームタイム監視を停止: PID {}", pid);
                }
                state.frame_time_session = None;
            }
        }
    }
}

/// プロファイル一覧を取得するヘルパー
fn get_profiles(app: &AppHandle) -> Result<Vec<crate::types::game::GameProfile>, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::GameMonitor(format!("app_data_dir 取得エラー: {}", e)))?;
    services::profile::load_profiles(&dir)
}

#[cfg(test)]
mod tests {
    // ゲーム監視は AppHandle 依存のため、ユニットテストは限定的
    // 統合テストは E2E で行う
}
