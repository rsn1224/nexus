use crate::error::AppError;
use crate::types::v4::NexusSettings;
use tauri::Manager;

fn settings_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, AppError> {
    let mut dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    dir.push("v4_settings.json");
    Ok(dir)
}

#[tauri::command]
pub fn get_v4_settings(app: tauri::AppHandle) -> Result<NexusSettings, AppError> {
    let path = settings_path(&app)?;
    if path.exists() {
        let content = std::fs::read_to_string(&path).map_err(|e| AppError::Io(e.to_string()))?;
        serde_json::from_str(&content).map_err(|e| AppError::Serialization(e.to_string()))
    } else {
        Ok(NexusSettings::default())
    }
}

#[tauri::command]
pub fn update_v4_settings(
    app: tauri::AppHandle,
    settings: NexusSettings,
) -> Result<(), AppError> {
    let path = settings_path(&app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| AppError::Io(e.to_string()))?;
    }
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| AppError::Serialization(e.to_string()))?;
    std::fs::write(path, json).map_err(|e| AppError::Io(e.to_string()))?;
    Ok(())
}
