//! ゲームプロファイルの CRUD 操作
//! 保存先: `app_data_dir()/profiles.json`
//! 仕様: docs/specs/game-enhancement-spec.md §2.1, §4

mod crud;
mod search;

pub use crud::*;
pub use search::*;

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::game::{BoostLevel, PowerPlan, ProcessPriority};
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
        save_profile(
            dir.path(),
            create_default_profile("パス検索テスト", "C:\\Games\\RocketLeague.exe"),
        )
        .unwrap();

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
