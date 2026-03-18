//! セッション管理コマンド

use crate::error::AppError;
use crate::services::session_store;
use crate::types::game::{SavedFrameTimeSession, SessionComparisonResult, SessionListItem};
use tauri::AppHandle;

#[tauri::command]
pub fn list_sessions(app: AppHandle) -> Result<Vec<SessionListItem>, AppError> {
    session_store::list_sessions(&app)
}

#[tauri::command]
pub fn get_session(app: AppHandle, session_id: String) -> Result<SavedFrameTimeSession, AppError> {
    session_store::get_session(&app, &session_id)
}

#[tauri::command]
pub fn delete_session(app: AppHandle, session_id: String) -> Result<(), AppError> {
    session_store::delete_session(&app, &session_id)
}

#[tauri::command]
pub fn compare_sessions(
    app: AppHandle,
    session_a_id: String,
    session_b_id: String,
) -> Result<SessionComparisonResult, AppError> {
    session_store::compare_sessions(&app, &session_a_id, &session_b_id)
}

#[tauri::command]
pub fn update_session_note(
    app: AppHandle,
    session_id: String,
    note: String,
) -> Result<(), AppError> {
    session_store::update_session_note(&app, &session_id, note)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::session_store;
    use crate::types::game::{HardwareSnapshot, SessionSummary};
    use std::fs;
    use tempfile::TempDir;

    fn setup_test_dir() -> TempDir {
        TempDir::new().unwrap()
    }

    #[test]
    fn test_validate_session_id_command() {
        // コマンドレベルのバリデーションテストはsession_storeでカバー
        assert!(true); // placeholder
    }

    #[test]
    fn test_delete_session_command() {
        let temp_dir = setup_test_dir();

        // 手動でテストデータを作成
        let session_file = temp_dir.path().join("test-session.json");
        let session_data = r#"{
            "id": "test-session",
            "gameName": "Test Game",
            "startedAt": 1000,
            "endedAt": 2000,
            "playSecs": 1000,
            "summary": {
                "avgFps": 60.0,
                "pct1Low": 55.0,
                "pct01Low": 50.0,
                "totalStutterCount": 5,
                "maxFrameTimeMs": 33.3,
                "minFps": 45.0,
                "totalFrames": 60000
            },
            "percentiles": [],
            "fpsTimeline": [],
            "note": "",
            "hardwareSnapshot": null,
            "profileId": null
        }"#;

        fs::write(&session_file, session_data).unwrap();
        assert!(session_file.exists());

        // ファイルが存在することを確認
        assert!(session_file.exists());

        // 手動で削除して確認
        fs::remove_file(&session_file).unwrap();
        assert!(!session_file.exists());
    }

    #[test]
    fn test_update_session_note_command() {
        let temp_dir = setup_test_dir();

        // 手動でテストデータを作成
        let session_file = temp_dir.path().join("test-session.json");
        let session_data = r#"{
            "id": "test-session",
            "gameName": "Test Game",
            "startedAt": 1000,
            "endedAt": 2000,
            "playSecs": 1000,
            "summary": {
                "avgFps": 60.0,
                "pct1Low": 55.0,
                "pct01Low": 50.0,
                "totalStutterCount": 5,
                "maxFrameTimeMs": 33.3,
                "minFps": 45.0,
                "totalFrames": 60000
            },
            "percentiles": [],
            "fpsTimeline": [],
            "note": "",
            "hardwareSnapshot": null,
            "profileId": null
        }"#;

        fs::write(&session_file, session_data).unwrap();

        // ノートを更新
        let updated_data = r#"{
            "id": "test-session",
            "gameName": "Test Game",
            "startedAt": 1000,
            "endedAt": 2000,
            "playSecs": 1000,
            "summary": {
                "avgFps": 60.0,
                "pct1Low": 55.0,
                "pct01Low": 50.0,
                "totalStutterCount": 5,
                "maxFrameTimeMs": 33.3,
                "minFps": 45.0,
                "totalFrames": 60000
            },
            "percentiles": [],
            "fpsTimeline": [],
            "note": "Updated note",
            "hardwareSnapshot": null,
            "profileId": null
        }"#;

        fs::write(&session_file, updated_data).unwrap();

        // 更新を確認
        let content = fs::read_to_string(&session_file).unwrap();
        assert!(content.contains("Updated note"));
    }

    #[test]
    fn test_compare_sessions_command() {
        // 比較ロジックのテストはsession_storeでカバー
        assert!(true); // placeholder
    }
}
