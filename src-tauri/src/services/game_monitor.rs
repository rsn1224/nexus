//! ゲーム起動/終了の監視サービス
//! 仕様: docs/specs/game-enhancement-spec.md §5
//!
//! sysinfo ポーリング（3秒間隔）でプロセス一覧を取得し、
//! 登録済みプロファイルの exe とマッチングする。

use std::collections::HashMap;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{Duration, interval};
use tracing::{error, info, warn};

use crate::error::AppError;
use crate::services;
use crate::state::SharedState;
use crate::types::game::{GameExitEvent, GameLaunchEvent};

/// 監視中のゲームの状態
#[allow(dead_code)]
struct ActiveGame {
    profile_id: String,
    exe_path: String,
    pid: u32,
    started_at: u64,
}

/// ゲーム監視ポーリングループ（3秒間隔）
/// `lib.rs` の setup から `tauri::async_runtime::spawn` で起動される。
pub async fn start_polling(app: AppHandle) {
    let mut tick = interval(Duration::from_secs(3));
    let mut active_games: HashMap<u32, ActiveGame> = HashMap::new();

    info!("ゲーム監視ポーリング開始（3秒間隔）");

    loop {
        tick.tick().await;

        // 監視フラグを確認
        {
            let state = app.state::<Mutex<crate::state::AppState>>();
            let s = match state.lock() {
                Ok(s) => s,
                Err(e) => {
                    error!("game_monitor: Stateロックエラー: {}", e);
                    continue;
                }
            };
            if !s.game_monitor_active {
                info!("ゲーム監視停止フラグを検出。ポーリングを終了します");
                break;
            }
        }

        // プロファイル一覧を取得
        let profiles = match get_profiles(&app) {
            Ok(p) => p,
            Err(e) => {
                warn!("ゲーム監視: プロファイル読み込みエラー: {}", e);
                continue;
            }
        };

        if profiles.is_empty() {
            continue;
        }

        // 現在のプロセス一覧を取得
        let running_processes = match get_running_processes(&app) {
            Ok(p) => p,
            Err(e) => {
                warn!("ゲーム監視: プロセス一覧取得エラー: {}", e);
                continue;
            }
        };

        // 起動検出: プロファイルの exe がプロセス一覧に存在するかチェック
        for profile in &profiles {
            let exe_name = match profile.exe_path.file_name() {
                Some(name) => name.to_string_lossy().to_lowercase(),
                None => continue,
            };

            // 既にアクティブなゲームは無視
            if active_games.values().any(|g| g.profile_id == profile.id) {
                continue;
            }

            // プロセス一覧からマッチング
            if let Some((pid, _)) = running_processes
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

                // アクティブゲームに追加
                active_games.insert(
                    *pid,
                    ActiveGame {
                        profile_id: profile.id.clone(),
                        exe_path: profile.exe_path.to_string_lossy().to_string(),
                        pid: *pid,
                        started_at: now,
                    },
                );

                // ブースト自動適用
                let state = app.state::<SharedState>();
                match services::boost::apply_profile_boost(profile, &state) {
                    Ok(result) => {
                        let _ = app.emit("nexus://profile-applied", &result);
                    }
                    Err(e) => {
                        warn!("ゲーム起動時のブースト適用失敗: {}", e);
                    }
                }

                // 起動イベント emit
                let event = GameLaunchEvent {
                    exe_path: profile.exe_path.to_string_lossy().to_string(),
                    profile_id: Some(profile.id.clone()),
                    pid: *pid,
                    detected_at: now,
                };
                let _ = app.emit("nexus://game-launched", &event);

                // フレームタイム監視を自動開始
                match crate::services::frame_time::FrameTimeSession::start(*pid, exe_name.clone()) {
                    Ok(_session) => {
                        // State に保存
                        if let Ok(mut state) = app.state::<SharedState>().lock() {
                            // 既存のセッションがあれば停止
                            if let Some(ref mut existing) = state.frame_time_session {
                                existing.stop();
                            }
                            // 新しいセッションを保存（unsafe transmute が必要だが、ここでは一時的に）
                            // TODO: State 構造を修正してセッションを保持できるようにする
                        }
                        info!("フレームタイム監視を開始: PID {}", pid);
                    }
                    Err(e) => {
                        warn!("フレームタイム監視開始失敗: {}", e);
                    }
                }
            }
        }

        // 終了検出: アクティブなゲームのプロセスがまだ存在するかチェック
        let running_pids: Vec<u32> = running_processes.iter().map(|(pid, _)| *pid).collect();
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

                // リバート実行
                let state = app.state::<SharedState>();
                let revert_success = services::boost::revert_boost(&state).is_ok();

                // プレイ時間更新
                if let Ok(dir) = app.path().app_data_dir() {
                    let _ = services::profile::update_play_time(&dir, &game.profile_id, play_secs);
                }

                // 終了イベント emit
                let event = GameExitEvent {
                    exe_path: game.exe_path,
                    profile_id: Some(game.profile_id),
                    play_secs,
                    revert_success,
                };
                let _ = app.emit("nexus://game-exited", &event);

                // フレームタイム監視を停止
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
}

/// プロファイル一覧を取得するヘルパー
fn get_profiles(app: &AppHandle) -> Result<Vec<crate::types::game::GameProfile>, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::GameMonitor(format!("app_data_dir 取得エラー: {}", e)))?;
    services::profile::load_profiles(&dir)
}

/// 現在の実行中プロセスの (PID, プロセス名) リストを取得するヘルパー
fn get_running_processes(app: &AppHandle) -> Result<Vec<(u32, String)>, AppError> {
    let state = app.state::<Mutex<crate::state::AppState>>();
    let mut s = state
        .lock()
        .map_err(|e| AppError::GameMonitor(format!("Stateロックエラー: {}", e)))?;

    s.sys
        .refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let processes: Vec<(u32, String)> = s
        .sys
        .processes()
        .values()
        .map(|p| (p.pid().as_u32(), p.name().to_string_lossy().to_string()))
        .collect();

    Ok(processes)
}

#[cfg(test)]
mod tests {
    // ゲーム監視は AppHandle 依存のため、ユニットテストは限定的
    // 統合テストは E2E で行う
}
