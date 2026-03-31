use crate::error::AppError;
use crate::types::v4::OptSession;
use tauri::Manager;

#[tauri::command]
pub fn get_history(app: tauri::AppHandle) -> Result<Vec<OptSession>, AppError> {
    let mut dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    dir.push("sessions");

    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut sessions: Vec<OptSession> = Vec::new();

    for entry in std::fs::read_dir(&dir).map_err(|e| AppError::Io(e.to_string()))? {
        let entry = entry.map_err(|e| AppError::Io(e.to_string()))?;
        let path = entry.path();

        if path.extension().is_some_and(|ext| ext == "json") {
            if let Ok(content) = std::fs::read_to_string(&path) {
                if let Ok(session) = serde_json::from_str::<OptSession>(&content) {
                    sessions.push(session);
                }
            }
        }
    }

    sessions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(sessions)
}
