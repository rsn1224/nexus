use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tracing::{info, warn};

use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub perplexity_api_key: String,
    pub start_with_windows: bool,
    pub minimize_to_tray: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            perplexity_api_key: String::new(),
            start_with_windows: false,
            minimize_to_tray: true,
        }
    }
}

fn get_settings_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("Failed to get app data directory: {e}")))?;

    let nexus_dir = app_data_dir.join("nexus");
    if !nexus_dir.exists() {
        fs::create_dir_all(&nexus_dir)
            .map_err(|e| AppError::Io(format!("Failed to create nexus directory: {e}")))?;
    }
    Ok(nexus_dir.join("app_settings.json"))
}

#[tauri::command]
pub fn get_app_settings(app: AppHandle) -> Result<AppSettings, AppError> {
    info!("get_app_settings: loading app settings");
    
    let settings_path = get_settings_path(&app)?;
    
    if !settings_path.exists() {
        info!("Settings file not found, returning default settings");
        return Ok(AppSettings::default());
    }
    
    let content = fs::read_to_string(&settings_path).map_err(|e| {
        warn!("Failed to read settings file: {}", e);
        AppError::Io(format!("Failed to read settings file: {}", e))
    })?;
    
    let settings: AppSettings = serde_json::from_str(&content).map_err(|e| {
        warn!("Failed to parse settings file: {}", e);
        AppError::Serialization(format!("Failed to parse settings file: {}", e))
    })?;
    
    info!("get_app_settings: successfully loaded settings");
    Ok(settings)
}

#[tauri::command]
pub fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), AppError> {
    info!("save_app_settings: saving app settings");
    
    let settings_path = get_settings_path(&app)?;
    
    let content = serde_json::to_string_pretty(&settings).map_err(|e| {
        warn!("Failed to serialize settings: {}", e);
        AppError::Serialization(format!("Failed to serialize settings: {}", e))
    })?;
    
    fs::write(&settings_path, content).map_err(|e| {
        warn!("Failed to write settings file: {}", e);
        AppError::Io(format!("Failed to write settings file: {}", e))
    })?;
    
    info!("save_app_settings: successfully saved settings");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_app_settings_default() {
        let settings = AppSettings::default();
        assert_eq!(settings.perplexity_api_key, "");
        assert!(!settings.start_with_windows);
        assert!(settings.minimize_to_tray);
    }
    
    #[test]
    fn test_app_settings_serialization() {
        let settings = AppSettings {
            perplexity_api_key: "test-key".to_string(),
            start_with_windows: true,
            minimize_to_tray: false,
        };
        
        let serialized = serde_json::to_string(&settings).unwrap();
        let deserialized: AppSettings = serde_json::from_str(&serialized).unwrap();
        
        assert_eq!(settings.perplexity_api_key, deserialized.perplexity_api_key);
        assert_eq!(settings.start_with_windows, deserialized.start_with_windows);
        assert_eq!(settings.minimize_to_tray, deserialized.minimize_to_tray);
    }
}
