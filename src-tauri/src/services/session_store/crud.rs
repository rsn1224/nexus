//! セッション CRUD 操作

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
pub(super) fn validate_session_id(id: &str) -> Result<(), AppError> {
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
