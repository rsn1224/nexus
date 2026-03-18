//! ゲームプロファイルの CRUD 操作
//! 保存先: `app_data_dir()/profiles.json`
//! 仕様: docs/specs/game-enhancement-spec.md §2.1, §4

use std::path::{Path, PathBuf};

use tracing::{info, warn};
use uuid::Uuid;

use crate::error::AppError;
use crate::types::game::GameProfile;
#[cfg(test)]
use crate::types::game::{BoostLevel, PowerPlan, ProcessPriority};

/// profiles.json のファイル名
const PROFILES_FILE: &str = "profiles.json";

/// プロファイル保存パスを取得
fn profiles_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(PROFILES_FILE)
}

/// 全プロファイルを読み込む
pub fn load_profiles(app_data_dir: &Path) -> Result<Vec<GameProfile>, AppError> {
    let path = profiles_path(app_data_dir);
    if !path.exists() {
        info!("プロファイルファイルなし。空リストを返します: {:?}", path);
        return Ok(vec![]);
    }

    let json = std::fs::read_to_string(&path)
        .map_err(|e| AppError::Profile(format!("プロファイル読み込みエラー: {}", e)))?;

    let profiles: Vec<GameProfile> = serde_json::from_str(&json).map_err(|e| {
        warn!("プロファイル JSON 解析エラー: {}", e);
        AppError::Profile(format!("プロファイル解析エラー: {}", e))
    })?;

    info!("プロファイル {} 件読み込み完了", profiles.len());
    Ok(profiles)
}

/// 指定 ID のプロファイルを取得する
pub fn get_profile(app_data_dir: &Path, id: &str) -> Result<Option<GameProfile>, AppError> {
    let profiles = load_profiles(app_data_dir)?;
    Ok(profiles.into_iter().find(|p| p.id == id))
}

/// プロファイルを保存（新規作成 or 更新）
/// - `id` が空の場合は UUID v4 を自動生成
/// - `created_at` が 0 の場合は現在時刻を設定
/// - `updated_at` は常に現在時刻で上書き
pub fn save_profile(
    app_data_dir: &Path,
    mut profile: GameProfile,
) -> Result<GameProfile, AppError> {
    let mut profiles = load_profiles(app_data_dir)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // ID 自動生成
    if profile.id.is_empty() {
        profile.id = Uuid::new_v4().to_string();
        profile.created_at = now;
        info!(
            "新規プロファイル作成: id={}, name={}",
            profile.id, profile.display_name
        );
    } else {
        info!(
            "プロファイル更新: id={}, name={}",
            profile.id, profile.display_name
        );
    }
    profile.updated_at = now;

    // 既存プロファイルの置換 or 追加
    if let Some(pos) = profiles.iter().position(|p| p.id == profile.id) {
        profiles[pos] = profile.clone();
    } else {
        profiles.push(profile.clone());
    }

    write_profiles(app_data_dir, &profiles)?;
    Ok(profile)
}

/// プロファイルを削除
pub fn delete_profile(app_data_dir: &Path, id: &str) -> Result<(), AppError> {
    let mut profiles = load_profiles(app_data_dir)?;
    let before_len = profiles.len();
    profiles.retain(|p| p.id != id);

    if profiles.len() == before_len {
        warn!("削除対象プロファイルが見つかりません: id={}", id);
        return Err(AppError::Profile(format!(
            "プロファイルが見つかりません: {}",
            id
        )));
    }

    write_profiles(app_data_dir, &profiles)?;
    info!("プロファイル削除完了: id={}", id);
    Ok(())
}

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
        // フルパス一致、またはファイル名のみ一致
        profile_exe == exe_lower
            || p.exe_path
                .file_name()
                .map(|f| f.to_string_lossy().to_lowercase() == exe_lower)
                .unwrap_or(false)
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

/// プロファイルリストを JSON ファイルに書き込む
fn write_profiles(app_data_dir: &Path, profiles: &[GameProfile]) -> Result<(), AppError> {
    // ディレクトリが存在しない場合は作成
    if !app_data_dir.exists() {
        std::fs::create_dir_all(app_data_dir)
            .map_err(|e| AppError::Profile(format!("データディレクトリ作成エラー: {}", e)))?;
    }

    let json = serde_json::to_string_pretty(profiles)
        .map_err(|e| AppError::Profile(format!("プロファイルシリアライズエラー: {}", e)))?;

    std::fs::write(profiles_path(app_data_dir), json)
        .map_err(|e| AppError::Profile(format!("プロファイル書き込みエラー: {}", e)))?;

    Ok(())
}

/// デフォルトのプロファイルを生成する（テスト用）
#[cfg(test)]
pub fn create_default_profile(display_name: &str, exe_path: &str) -> GameProfile {
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
        last_played: None,
        total_play_secs: 0,
        created_at: now,
        updated_at: now,
    }
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::TempDir;

    fn temp_dir() -> TempDir {
        TempDir::new().expect("一時ディレクトリ作成に失敗")
    }

    #[test]
    fn test_load_empty_profiles() {
        let dir = temp_dir();
        let profiles = load_profiles(dir.path()).unwrap();
        assert!(profiles.is_empty(), "空ディレクトリから空リストが返るべき");
    }

    #[test]
    fn test_save_and_load_profile() {
        let dir = temp_dir();
        let profile = create_default_profile("テストゲーム", "C:\\Games\\test.exe");
        let saved = save_profile(dir.path(), profile).unwrap();

        assert!(!saved.id.is_empty(), "ID が自動生成されるべき");
        assert!(saved.created_at > 0);
        assert!(saved.updated_at > 0);

        let loaded = load_profiles(dir.path()).unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].id, saved.id);
        assert_eq!(loaded[0].display_name, "テストゲーム");
    }

    #[test]
    fn test_update_existing_profile() {
        let dir = temp_dir();
        let profile = create_default_profile("ゲーム1", "C:\\game1.exe");
        let saved = save_profile(dir.path(), profile).unwrap();

        // 名前を変更して更新
        let mut updated = saved.clone();
        updated.display_name = "ゲーム1（更新）".to_string();
        let result = save_profile(dir.path(), updated).unwrap();

        assert_eq!(result.id, saved.id, "ID は変わらないべき");
        assert_eq!(result.display_name, "ゲーム1（更新）");

        let loaded = load_profiles(dir.path()).unwrap();
        assert_eq!(loaded.len(), 1, "更新なので件数は変わらないべき");
    }

    #[test]
    fn test_save_multiple_profiles() {
        let dir = temp_dir();
        save_profile(dir.path(), create_default_profile("ゲーム1", "game1.exe")).unwrap();
        save_profile(dir.path(), create_default_profile("ゲーム2", "game2.exe")).unwrap();
        save_profile(dir.path(), create_default_profile("ゲーム3", "game3.exe")).unwrap();

        let loaded = load_profiles(dir.path()).unwrap();
        assert_eq!(loaded.len(), 3);
    }

    #[test]
    fn test_delete_profile() {
        let dir = temp_dir();
        let saved =
            save_profile(dir.path(), create_default_profile("削除テスト", "del.exe")).unwrap();
        let id = saved.id.clone();

        delete_profile(dir.path(), &id).unwrap();

        let loaded = load_profiles(dir.path()).unwrap();
        assert!(loaded.is_empty(), "削除後は空になるべき");
    }

    #[test]
    fn test_delete_nonexistent_profile() {
        let dir = temp_dir();
        let result = delete_profile(dir.path(), "存在しないID");
        assert!(
            result.is_err(),
            "存在しないプロファイルの削除はエラーになるべき"
        );
    }

    #[test]
    fn test_get_profile() {
        let dir = temp_dir();
        let saved =
            save_profile(dir.path(), create_default_profile("取得テスト", "get.exe")).unwrap();

        let found = get_profile(dir.path(), &saved.id).unwrap();
        assert!(found.is_some());
        assert_eq!(found.unwrap().display_name, "取得テスト");

        let not_found = get_profile(dir.path(), "存在しないID").unwrap();
        assert!(not_found.is_none());
    }

    #[test]
    fn test_find_profile_by_exe_full_path() {
        let dir = temp_dir();
        let mut profile = create_default_profile("パス検索テスト", "C:\\Games\\RocketLeague.exe");
        save_profile(dir.path(), profile).unwrap();

        let found = find_profile_by_exe(dir.path(), "C:\\Games\\RocketLeague.exe").unwrap();
        assert!(found.is_some());
        assert_eq!(found.unwrap().display_name, "パス検索テスト");
    }

    #[test]
    fn test_find_profile_by_exe_name_only() {
        let dir = temp_dir();
        save_profile(
            dir.path(),
            create_default_profile("名前検索テスト", "C:\\Games\\Apex\\r5apex.exe"),
        )
        .unwrap();

        let found = find_profile_by_exe(dir.path(), "r5apex.exe").unwrap();
        assert!(found.is_some());
    }

    #[test]
    fn test_find_profile_by_exe_case_insensitive() {
        let dir = temp_dir();
        save_profile(
            dir.path(),
            create_default_profile("大文字小文字テスト", "C:\\Games\\TEST.EXE"),
        )
        .unwrap();

        let found = find_profile_by_exe(dir.path(), "c:\\games\\test.exe").unwrap();
        assert!(found.is_some());
    }

    #[test]
    fn test_update_play_time() {
        let dir = temp_dir();
        let saved = save_profile(
            dir.path(),
            create_default_profile("プレイ時間テスト", "play.exe"),
        )
        .unwrap();

        update_play_time(dir.path(), &saved.id, 3600).unwrap();

        let loaded = get_profile(dir.path(), &saved.id).unwrap().unwrap();
        assert_eq!(loaded.total_play_secs, 3600);
        assert!(loaded.last_played.is_some());

        // 2回目の更新で累計になることを確認
        update_play_time(dir.path(), &saved.id, 1800).unwrap();
        let loaded2 = get_profile(dir.path(), &saved.id).unwrap().unwrap();
        assert_eq!(loaded2.total_play_secs, 5400);
    }

    #[test]
    fn test_create_default_profile() {
        let profile = create_default_profile("デフォルト", "default.exe");
        assert!(profile.id.is_empty(), "save前はIDが空");
        assert_eq!(profile.boost_level, BoostLevel::None);
        assert_eq!(profile.process_priority, ProcessPriority::Normal);
        assert_eq!(profile.power_plan, PowerPlan::Unchanged);
        assert!(profile.processes_to_suspend.is_empty());
        assert!(profile.processes_to_kill.is_empty());
        assert_eq!(profile.total_play_secs, 0);
    }

    #[test]
    fn test_profiles_json_roundtrip() {
        let dir = temp_dir();
        let mut profile = create_default_profile("ラウンドトリップ", "rt.exe");
        profile.boost_level = BoostLevel::Soft;
        profile.process_priority = ProcessPriority::High;
        profile.power_plan = PowerPlan::HighPerformance;
        profile.processes_to_suspend = vec!["chrome.exe".to_string(), "discord.exe".to_string()];
        profile.steam_app_id = Some(12345);

        let saved = save_profile(dir.path(), profile).unwrap();
        let loaded = get_profile(dir.path(), &saved.id).unwrap().unwrap();

        assert_eq!(loaded.boost_level, BoostLevel::Soft);
        assert_eq!(loaded.process_priority, ProcessPriority::High);
        assert_eq!(loaded.power_plan, PowerPlan::HighPerformance);
        assert_eq!(
            loaded.processes_to_suspend,
            vec!["chrome.exe", "discord.exe"]
        );
        assert_eq!(loaded.steam_app_id, Some(12345));
    }
}
