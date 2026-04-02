//! 最適化セッションの保存

use crate::error::AppError;
use crate::types::v4::{AppliedItem, FailedItem};
use tauri::Manager;
use tracing::info;

pub(super) fn save_session(
    app: &tauri::AppHandle,
    applied: &[AppliedItem],
    failed: &[FailedItem],
) -> Result<String, AppError> {
    use std::time::{SystemTime, UNIX_EPOCH};

    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::Internal(e.to_string()))?
        .as_secs();

    let id = format!("opt-{ts}");
    let session = crate::types::v4::OptSession {
        id: id.clone(),
        timestamp: ts,
        applied: applied.to_vec(),
        failed: failed.to_vec(),
    };

    let mut dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    dir.push("sessions");
    std::fs::create_dir_all(&dir).map_err(|e| AppError::Io(e.to_string()))?;

    let json = serde_json::to_string_pretty(&session)
        .map_err(|e| AppError::Serialization(e.to_string()))?;
    std::fs::write(dir.join(format!("{id}.json")), json)
        .map_err(|e| AppError::Io(e.to_string()))?;

    info!("session saved: {id}");
    Ok(id)
}
