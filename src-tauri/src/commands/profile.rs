//! ゲームプロファイル系コマンドハンドラ
//! 仕様: docs/specs/game-enhancement-spec.md §3.1

use tauri::{AppHandle, Emitter, Manager, State};
use tracing::info;

use crate::error::AppError;
#[cfg(windows)]
use crate::infra::power_plan::PowerPlanController;
use crate::services;
use crate::state::SharedState;
use crate::types::game::{GameProfile, ProfileApplyResult, SharedProfile};

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

/// 現在のアクティブな電源プランを取得
#[cfg(windows)]
#[tauri::command]
pub fn get_current_power_plan() -> Result<crate::types::game::CurrentPowerPlan, AppError> {
    let controller = PowerPlanController::new();
    let guid = controller
        .get_active_plan_guid()?
        .ok_or_else(|| AppError::Power("現在の電源プランが取得できません".to_string()))?;
    let name = controller.get_plan_name(&guid)?;
    Ok(crate::types::game::CurrentPowerPlan { name, guid })
}

#[cfg(not(windows))]
#[tauri::command]
pub fn get_current_power_plan() -> Result<crate::types::game::CurrentPowerPlan, AppError> {
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// デフォルトのサスペンド候補プロセスリストを取得
#[tauri::command]
pub fn get_suspend_candidates() -> Vec<String> {
    crate::constants::DEFAULT_SUSPEND_CANDIDATES
        .iter()
        .map(|s| s.to_string())
        .collect()
}

// ─── プロファイル共有（エクスポート / インポート） ────────────────────────────

/// プロファイルをコミュニティ共有用 JSON にエクスポート
/// マシン固有情報（exe_path / id / プレイ統計）を除いた設定のみを返す
#[tauri::command]
pub fn export_game_profile(app: AppHandle, id: String) -> Result<String, AppError> {
    let dir = get_app_data_dir(&app)?;
    let profile = services::profile::get_profile(&dir, &id)?
        .ok_or_else(|| AppError::Profile(format!("プロファイルが見つかりません: {}", id)))?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let shared = SharedProfile {
        version: 1,
        display_name: profile.display_name,
        cpu_affinity_game: profile.cpu_affinity_game,
        cpu_affinity_background: profile.cpu_affinity_background,
        process_priority: profile.process_priority,
        power_plan: profile.power_plan,
        processes_to_suspend: profile.processes_to_suspend,
        processes_to_kill: profile.processes_to_kill,
        auto_suspend_enabled: profile.auto_suspend_enabled,
        timer_resolution_100ns: profile.timer_resolution_100ns,
        boost_level: profile.boost_level,
        core_parking_disabled: profile.core_parking_disabled,
        exported_at: now,
    };

    serde_json::to_string_pretty(&shared)
        .map_err(|e| AppError::Profile(format!("JSON シリアライズ失敗: {}", e)))
}

/// 共有 JSON からプロファイルをインポートしてストレージに保存
/// id を新規生成し exe_path は空にする（ユーザーが後から設定する）
#[tauri::command]
pub fn import_game_profile(app: AppHandle, json: String) -> Result<GameProfile, AppError> {
    let shared: SharedProfile = serde_json::from_str(&json)
        .map_err(|e| AppError::Profile(format!("JSON パース失敗: {}", e)))?;

    if shared.version != 1 {
        return Err(AppError::Profile(format!(
            "未対応のフォーマットバージョン: {}",
            shared.version
        )));
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    // 新規 ID を生成（タイムスタンプベース）
    let new_id = format!("imported_{}", now);

    let profile = GameProfile {
        id: new_id,
        display_name: format!("[IMPORTED] {}", shared.display_name),
        exe_path: std::path::PathBuf::new(), // ユーザーが後から設定
        steam_app_id: None,
        cpu_affinity_game: shared.cpu_affinity_game,
        cpu_affinity_background: shared.cpu_affinity_background,
        process_priority: shared.process_priority,
        power_plan: shared.power_plan,
        processes_to_suspend: shared.processes_to_suspend,
        processes_to_kill: shared.processes_to_kill,
        auto_suspend_enabled: shared.auto_suspend_enabled,
        timer_resolution_100ns: shared.timer_resolution_100ns,
        boost_level: shared.boost_level,
        core_parking_disabled: shared.core_parking_disabled,
        last_played: None,
        total_play_secs: 0,
        created_at: now,
        updated_at: now,
    };

    let dir = get_app_data_dir(&app)?;
    services::profile::save_profile(&dir, profile)
}
