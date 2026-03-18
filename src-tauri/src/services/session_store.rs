//! セッション永続化サービス
//! SQLite or JSON ファイルでセッションデータを保存する。
//! app_data_dir/sessions/ 配下に {session_id}.json として保存。
//! 一覧は sessions/index.json で管理。

use crate::error::AppError;
use crate::types::game::{SavedFrameTimeSession, SessionListItem};
use std::fs;
use tauri::{AppHandle, Manager};

/// セッション保存先ディレクトリを取得（app_data_dir/sessions/）
pub fn sessions_dir(app: &AppHandle) -> Result<std::path::PathBuf, AppError> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(format!("Failed to get app data dir: {e}")))?;
    let sessions_dir = data_dir.join("sessions");
    fs::create_dir_all(&sessions_dir).map_err(|e| AppError::Io(e.to_string()))?;
    Ok(sessions_dir)
}

/// セッション ID をバリデーション
fn validate_session_id(id: &str) -> Result<(), AppError> {
    if id.is_empty() {
        return Err(AppError::InvalidInput(
            "Session ID cannot be empty".to_string(),
        ));
    }

    // 英数字とハイフンのみ許可（パストラバーサル防止）
    if !id.chars().all(|c| c.is_alphanumeric() || c == '-') {
        return Err(AppError::InvalidInput(
            "Session ID can only contain alphanumeric characters and hyphens".to_string(),
        ));
    }

    if id.len() > 100 {
        return Err(AppError::InvalidInput(
            "Session ID too long (max 100 characters)".to_string(),
        ));
    }

    Ok(())
}

/// セッションを保存
pub fn save_session(app: &AppHandle, session: &SavedFrameTimeSession) -> Result<(), AppError> {
    validate_session_id(&session.id)?;

    let dir = sessions_dir(app)?;
    let path = dir.join(format!("{}.json", session.id));

    let json = serde_json::to_string_pretty(session)
        .map_err(|e| AppError::Internal(format!("Serialize failed: {e}")))?;

    fs::write(&path, json).map_err(|e| AppError::Io(e.to_string()))?;
    Ok(())
}

/// 全セッションの一覧（サマリのみ）を取得
pub fn list_sessions(app: &AppHandle) -> Result<Vec<SessionListItem>, AppError> {
    let dir = sessions_dir(app)?;
    let mut sessions = Vec::new();

    if !dir.exists() {
        return Ok(sessions);
    }

    let entries = fs::read_dir(&dir).map_err(|e| AppError::Io(e.to_string()))?;

    for entry in entries {
        let entry = entry.map_err(|e| AppError::Io(e.to_string()))?;
        let path = entry.path();

        // .json ファイルのみ処理
        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }

        // ファイル名からセッション ID を取得
        let file_name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .ok_or_else(|| AppError::Internal("Invalid file name".to_string()))?;

        validate_session_id(file_name)?;

        // JSON を読み込んで SavedFrameTimeSession にデシリアライズ
        let content = fs::read_to_string(&path).map_err(|e| AppError::Io(e.to_string()))?;
        let session: SavedFrameTimeSession = serde_json::from_str(&content)
            .map_err(|e| AppError::Internal(format!("Deserialize failed: {e}")))?;

        // SessionListItem に変換して追加
        sessions.push(SessionListItem {
            id: session.id,
            game_name: session.game_name,
            started_at: session.started_at,
            ended_at: session.ended_at,
            summary: session.summary,
        });
    }

    // 開始時間の降順でソート
    sessions.sort_by(|a, b| b.started_at.cmp(&a.started_at));

    Ok(sessions)
}

/// セッション詳細を取得
pub fn get_session(app: &AppHandle, session_id: &str) -> Result<SavedFrameTimeSession, AppError> {
    validate_session_id(session_id)?;

    let dir = sessions_dir(app)?;
    let path = dir.join(format!("{}.json", session_id));

    if !path.exists() {
        return Err(AppError::NotFound(format!(
            "Session not found: {session_id}"
        )));
    }

    let content = fs::read_to_string(&path).map_err(|e| AppError::Io(e.to_string()))?;
    let session: SavedFrameTimeSession = serde_json::from_str(&content)
        .map_err(|e| AppError::Internal(format!("Deserialize failed: {e}")))?;

    Ok(session)
}

/// セッション削除
pub fn delete_session(app: &AppHandle, session_id: &str) -> Result<(), AppError> {
    validate_session_id(session_id)?;

    let dir = sessions_dir(app)?;
    let path = dir.join(format!("{}.json", session_id));

    if !path.exists() {
        return Err(AppError::NotFound(format!(
            "Session not found: {session_id}"
        )));
    }

    fs::remove_file(&path).map_err(|e| AppError::Io(e.to_string()))?;
    Ok(())
}

/// セッション比較
pub fn compare_sessions(
    app: &AppHandle,
    session_a_id: &str,
    session_b_id: &str,
) -> Result<crate::types::game::SessionComparisonResult, AppError> {
    validate_session_id(session_a_id)?;
    validate_session_id(session_b_id)?;

    if session_a_id == session_b_id {
        return Err(AppError::InvalidInput(
            "Cannot compare session with itself".to_string(),
        ));
    }

    let session_a = get_session(app, session_a_id)?;
    let session_b = get_session(app, session_b_id)?;

    // 差分計算（B - A）。正の値 = 改善
    let fps_delta_pct = if session_a.summary.avg_fps > 0.0 {
        ((session_b.summary.avg_fps - session_a.summary.avg_fps) / session_a.summary.avg_fps)
            * 100.0
    } else {
        0.0
    };

    let pct_1_low_delta_pct = if session_a.summary.pct_1_low > 0.0 {
        ((session_b.summary.pct_1_low - session_a.summary.pct_1_low) / session_a.summary.pct_1_low)
            * 100.0
    } else {
        0.0
    };

    let pct_01_low_delta_pct = if session_a.summary.pct_01_low > 0.0 {
        ((session_b.summary.pct_01_low - session_a.summary.pct_01_low)
            / session_a.summary.pct_01_low)
            * 100.0
    } else {
        0.0
    };

    let stutter_delta =
        session_b.summary.total_stutter_count as i32 - session_a.summary.total_stutter_count as i32;

    // NOTE: v2 予定 — AI による自動サマリ生成（Perplexity API 連携）
    let auto_summary = String::new();

    Ok(crate::types::game::SessionComparisonResult {
        session_a: session_a.summary,
        session_b: session_b.summary,
        fps_delta_pct,
        pct_1_low_delta_pct,
        pct_01_low_delta_pct,
        stutter_delta,
        auto_summary,
    })
}

/// セッションノートを更新
pub fn update_session_note(
    app: &AppHandle,
    session_id: &str,
    note: String,
) -> Result<(), AppError> {
    validate_session_id(session_id)?;

    let mut session = get_session(app, session_id)?;
    session.note = note;

    save_session(app, &session)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::game::{HardwareSnapshot, SessionSummary};
    use std::fs;
    use tempfile::TempDir;

    fn setup_test_dir() -> TempDir {
        TempDir::new().unwrap()
    }

    #[test]
    fn test_validate_session_id() {
        // 有効な ID
        assert!(validate_session_id("session-123").is_ok());
        assert!(validate_session_id("abc123").is_ok());

        // 無効な ID
        assert!(validate_session_id("").is_err());
        assert!(validate_session_id("../etc/passwd").is_err());
        assert!(validate_session_id("session@123").is_err());
        assert!(validate_session_id("session 123").is_err());

        // 長すぎる ID
        let long_id = "a".repeat(101);
        assert!(validate_session_id(&long_id).is_err());
    }

    #[test]
    fn test_save_and_get_session() {
        let temp_dir = setup_test_dir();
        let sessions_dir = temp_dir.path().join("sessions");
        fs::create_dir_all(&sessions_dir).unwrap();

        let session = SavedFrameTimeSession {
            id: "test-session-1".to_string(),
            profile_id: None,
            game_name: "Test Game".to_string(),
            started_at: 1000,
            ended_at: 2000,
            play_secs: 1000,
            summary: SessionSummary {
                avg_fps: 60.0,
                pct_1_low: 55.0,
                pct_01_low: 50.0,
                total_stutter_count: 5,
                max_frame_time_ms: 33.3,
                min_fps: 45.0,
                total_frames: 60000,
            },
            percentiles: vec![],
            fps_timeline: vec![],
            note: "Test note".to_string(),
            hardware_snapshot: Some(HardwareSnapshot {
                cpu_name: "Test CPU".to_string(),
                gpu_name: Some("Test GPU".to_string()),
                mem_total_gb: 16.0,
                os_version: "Windows 10".to_string(),
            }),
        };

        // 保存
        let path = sessions_dir.join("test-session-1.json");
        let json = serde_json::to_string_pretty(&session).unwrap();
        fs::write(&path, json).unwrap();

        // 取得
        let content = fs::read_to_string(&path).unwrap();
        let loaded: SavedFrameTimeSession = serde_json::from_str(&content).unwrap();

        assert_eq!(loaded.id, session.id);
        assert_eq!(loaded.game_name, session.game_name);
        assert_eq!(loaded.summary.avg_fps, session.summary.avg_fps);
    }

    #[test]
    fn test_delete_session() {
        let temp_dir = setup_test_dir();
        let sessions_dir = temp_dir.path().join("sessions");
        fs::create_dir_all(&sessions_dir).unwrap();

        let session = SavedFrameTimeSession {
            id: "session-to-delete".to_string(),
            profile_id: None,
            game_name: "Test Game".to_string(),
            started_at: 1000,
            ended_at: 2000,
            play_secs: 1000,
            summary: SessionSummary {
                avg_fps: 60.0,
                pct_1_low: 55.0,
                pct_01_low: 50.0,
                total_stutter_count: 5,
                max_frame_time_ms: 33.3,
                min_fps: 45.0,
                total_frames: 60000,
            },
            percentiles: vec![],
            fps_timeline: vec![],
            note: String::new(),
            hardware_snapshot: None,
        };

        // 保存
        let path = sessions_dir.join("session-to-delete.json");
        let json = serde_json::to_string_pretty(&session).unwrap();
        fs::write(&path, json).unwrap();
        assert!(path.exists());

        // 削除
        fs::remove_file(&path).unwrap();
        assert!(!path.exists());
    }

    #[test]
    fn test_compare_sessions() {
        // セッション A
        let session_a = SavedFrameTimeSession {
            id: "session-a".to_string(),
            profile_id: None,
            game_name: "Test Game".to_string(),
            started_at: 1000,
            ended_at: 2000,
            play_secs: 1000,
            summary: SessionSummary {
                avg_fps: 50.0,
                pct_1_low: 45.0,
                pct_01_low: 40.0,
                total_stutter_count: 10,
                max_frame_time_ms: 40.0,
                min_fps: 35.0,
                total_frames: 50000,
            },
            percentiles: vec![],
            fps_timeline: vec![],
            note: String::new(),
            hardware_snapshot: None,
        };

        // セッション B（改善版）
        let session_b = SavedFrameTimeSession {
            id: "session-b".to_string(),
            profile_id: None,
            game_name: "Test Game".to_string(),
            started_at: 3000,
            ended_at: 4000,
            play_secs: 1000,
            summary: SessionSummary {
                avg_fps: 60.0,          // 20% 改善
                pct_1_low: 55.0,        // 22.2% 改善
                pct_01_low: 50.0,       // 25% 改善
                total_stutter_count: 5, // 5 減少
                max_frame_time_ms: 33.3,
                min_fps: 45.0,
                total_frames: 60000,
            },
            percentiles: vec![],
            fps_timeline: vec![],
            note: String::new(),
            hardware_snapshot: None,
        };

        // 差分計算（B - A）。正の値 = 改善
        let fps_delta_pct = if session_a.summary.avg_fps > 0.0 {
            ((session_b.summary.avg_fps - session_a.summary.avg_fps) / session_a.summary.avg_fps)
                * 100.0
        } else {
            0.0
        };

        let pct_1_low_delta_pct = if session_a.summary.pct_1_low > 0.0 {
            ((session_b.summary.pct_1_low - session_a.summary.pct_1_low)
                / session_a.summary.pct_1_low)
                * 100.0
        } else {
            0.0
        };

        let pct_01_low_delta_pct = if session_a.summary.pct_01_low > 0.0 {
            ((session_b.summary.pct_01_low - session_a.summary.pct_01_low)
                / session_a.summary.pct_01_low)
                * 100.0
        } else {
            0.0
        };

        let stutter_delta = session_b.summary.total_stutter_count as i32
            - session_a.summary.total_stutter_count as i32;

        // 差分を確認
        assert!((fps_delta_pct - 20.0).abs() < 0.01); // 20% 改善
        assert!((pct_1_low_delta_pct - 22.22).abs() < 0.01); // 22.22% 改善
        assert!((pct_01_low_delta_pct - 25.0).abs() < 0.01); // 25% 改善
        assert_eq!(stutter_delta, -5); // 5 減少
    }
}
