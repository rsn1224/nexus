//! プロファイル検索・更新ヘルパー

use std::path::Path;

use tracing::{info, warn};

use crate::error::AppError;
use crate::types::game::GameProfile;

use super::crud::{load_profiles, write_profiles};

/// exe_path でプロファイルを検索する（ゲーム起動検出時に使用）
#[allow(dead_code)] // game_monitor で使用予定
pub fn find_profile_by_exe(
    app_data_dir: &Path,
    exe_path: &str,
) -> Result<Option<GameProfile>, AppError> {
    let profiles = load_profiles(app_data_dir)?;
    // exe_path の末尾（ファイル名）で比較
    let exe_lower = exe_path.to_lowercase();
    Ok(profiles.into_iter().find(|p| {
        let profile_exe = p.exe_path.to_string_lossy().to_lowercase();
        // フルパス一致
        if profile_exe == exe_lower {
            return true;
        }
        // file_name() によるファイル名一致（Linux では Windows パスの \ を認識しないため両方試みる）
        let os_file_name = p
            .exe_path
            .file_name()
            .map(|f| f.to_string_lossy().to_lowercase());
        if os_file_name.as_deref() == Some(exe_lower.as_str()) {
            return true;
        }
        // \ 区切りでフォールバック（Windows パスを Linux でパースする場合）
        let backslash_file_name = profile_exe.rsplit('\\').next().unwrap_or(&profile_exe);
        backslash_file_name == exe_lower
    }))
}

/// プレイ時間を更新する
pub fn update_play_time(app_data_dir: &Path, id: &str, play_secs: u64) -> Result<(), AppError> {
    let mut profiles = load_profiles(app_data_dir)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    if let Some(profile) = profiles.iter_mut().find(|p| p.id == id) {
        profile.total_play_secs += play_secs;
        profile.last_played = Some(now);
        profile.updated_at = now;
        let total_play = profile.total_play_secs;
        let _ = profile; // 借用を解放
        write_profiles(app_data_dir, &profiles)?;
        info!(
            "プレイ時間更新: id={}, +{}秒, 累計{}秒",
            id, play_secs, total_play
        );
    } else {
        warn!("プレイ時間更新対象が見つかりません: id={}", id);
    }

    Ok(())
}

/// デフォルトのプロファイルを生成する（テスト用）
#[cfg(test)]
pub fn create_default_profile(display_name: &str, exe_path: &str) -> GameProfile {
    use crate::types::game::{BoostLevel, PowerPlan, ProcessPriority};
    use std::path::PathBuf;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    GameProfile {
        id: String::new(), // save_profile で自動生成
        display_name: display_name.to_string(),
        exe_path: PathBuf::from(exe_path),
        steam_app_id: None,
        cpu_affinity_game: None,
        cpu_affinity_background: None,
        process_priority: ProcessPriority::default(),
        power_plan: PowerPlan::default(),
        processes_to_suspend: vec![],
        processes_to_kill: vec![],
        timer_resolution_100ns: None,
        boost_level: BoostLevel::default(),
        core_parking_disabled: false,
        auto_suspend_enabled: true,
        last_played: None,
        total_play_secs: 0,
        created_at: now,
        updated_at: now,
    }
}
