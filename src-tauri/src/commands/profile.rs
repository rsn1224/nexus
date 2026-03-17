//! ゲームプロファイル系コマンドハンドラ
//! 仕様: docs/specs/game-enhancement-spec.md §3.1

use tauri::{AppHandle, Emitter, Manager, State};
use tracing::info;

use crate::error::AppError;
use crate::services;
use crate::state::SharedState;
use crate::types::game::{GameProfile, ProfileApplyResult};

/// app_data_dir を取得するヘルパー
fn get_app_data_dir(app: &AppHandle) -> Result<std::path::PathBuf, AppError> {
    app.path()
        .app_data_dir()
        .map_err(|e| AppError::Profile(format!("app_data_dir 取得エラー: {}", e)))
}

/// 全プロファイル一覧取得
#[tauri::command]
pub fn list_game_profiles(app: AppHandle) -> Result<Vec<GameProfile>, AppError> {
    let dir = get_app_data_dir(&app)?;
    services::profile::load_profiles(&dir)
}

/// 指定 ID のプロファイル取得
#[tauri::command]
pub fn get_game_profile(app: AppHandle, id: String) -> Result<Option<GameProfile>, AppError> {
    let dir = get_app_data_dir(&app)?;
    services::profile::get_profile(&dir, &id)
}

/// プロファイル作成・更新
#[tauri::command]
pub fn save_game_profile(app: AppHandle, profile: GameProfile) -> Result<GameProfile, AppError> {
    let dir = get_app_data_dir(&app)?;
    services::profile::save_profile(&dir, profile)
}

/// プロファイル削除
#[tauri::command]
pub fn delete_game_profile(app: AppHandle, id: String) -> Result<(), AppError> {
    let dir = get_app_data_dir(&app)?;
    services::profile::delete_profile(&dir, &id)
}

/// プロファイル手動適用（ブースト実行）
#[tauri::command]
pub fn apply_game_profile(
    app: AppHandle,
    id: String,
    state: State<'_, SharedState>,
) -> Result<ProfileApplyResult, AppError> {
    let dir = get_app_data_dir(&app)?;
    let profile = services::profile::get_profile(&dir, &id)?
        .ok_or_else(|| AppError::Profile(format!("プロファイルが見つかりません: {}", id)))?;

    info!(
        "プロファイル手動適用: id={}, name={}",
        id, profile.display_name
    );
    let result = services::boost::apply_profile_boost(&profile, &state)?;

    // FE にイベント通知
    if let Err(e) = app.emit("nexus://profile-applied", &result) {
        tracing::warn!("profile-applied イベント送信失敗: {}", e);
    }

    Ok(result)
}

/// リバート（最後に適用したプロファイルを元に戻す）
#[tauri::command]
pub fn revert_game_profile(app: AppHandle, state: State<'_, SharedState>) -> Result<(), AppError> {
    info!("プロファイルリバート実行");
    services::boost::revert_boost(&state)?;

    // FE にイベント通知
    if let Err(e) = app.emit(
        "nexus://profile-reverted",
        &serde_json::json!({ "success": true }),
    ) {
        tracing::warn!("profile-reverted イベント送信失敗: {}", e);
    }

    Ok(())
}

/// ゲーム起動監視開始
#[tauri::command]
pub fn start_game_monitor(app: AppHandle, state: State<'_, SharedState>) -> Result<(), AppError> {
    {
        let mut s = state
            .lock()
            .map_err(|e| AppError::GameMonitor(format!("Stateロックエラー: {}", e)))?;
        if s.game_monitor_active {
            return Ok(()); // 既に起動中
        }
        s.game_monitor_active = true;
    }

    info!("ゲーム起動監視を開始します");

    // sysinfo ポーリングで監視開始
    let monitor_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        services::game_monitor::start_polling(monitor_handle).await;
    });

    Ok(())
}

/// ゲーム起動監視停止
#[tauri::command]
pub fn stop_game_monitor(state: State<'_, SharedState>) -> Result<(), AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::GameMonitor(format!("Stateロックエラー: {}", e)))?;
    s.game_monitor_active = false;
    info!("ゲーム起動監視を停止しました");
    Ok(())
}

/// CPU トポロジー取得
#[tauri::command]
pub fn get_cpu_topology() -> Result<crate::types::game::CpuTopology, AppError> {
    crate::services::cpu_topology::detect_topology()
}

/// プロセスの CPU アフィニティを設定
#[tauri::command]
pub fn set_process_affinity(pid: u32, cores: Vec<usize>) -> Result<(), AppError> {
    crate::infra::cpu_affinity::set_affinity(pid, &cores)
}

/// プロセスの現在の CPU アフィニティを取得
#[tauri::command]
pub fn get_process_affinity(pid: u32) -> Result<Vec<usize>, AppError> {
    crate::infra::cpu_affinity::get_affinity(pid)
}
