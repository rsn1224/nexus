//! Launcher settings persistence
//!
//! Provides file-based persistence for launcher settings like:
//! - Auto boost enabled state
//! - Favorite games list
//! - Last played timestamps

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

use tauri::Manager;
use tracing::info;

use crate::error::AppError;

// ─── Types ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LauncherSettings {
    pub auto_boost_enabled: bool,
    pub favorites: Vec<i32>,
    pub last_played: std::collections::HashMap<i32, u64>, // app_id -> timestamp (ms)
}

#[allow(clippy::derivable_impls)]
impl Default for LauncherSettings {
    fn default() -> Self {
        Self {
            auto_boost_enabled: false,
            favorites: Vec::new(),
            last_played: std::collections::HashMap::new(),
        }
    }
}

// ─── Functions ───────────────────────────────────────────────────────────────

/// Get the launcher settings file path
fn get_settings_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::GameMonitor(format!("Failed to get app data dir: {}", e)))?;

    Ok(app_data_dir.join("launcher_settings.json"))
}

/// Load launcher settings from file
pub fn get_launcher_settings(app: &AppHandle) -> Result<LauncherSettings, AppError> {
    let settings_path = get_settings_path(app)?;

    if !settings_path.exists() {
        info!("launcher: settings file not found, using defaults");
        return Ok(LauncherSettings::default());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| AppError::LauncherError(format!("Failed to read settings file: {}", e)))?;

    let settings: LauncherSettings = serde_json::from_str(&content)
        .map_err(|e| AppError::LauncherError(format!("Failed to parse settings file: {}", e)))?;

    info!("launcher: settings loaded successfully");
    Ok(settings)
}

/// Save launcher settings to file
pub fn save_launcher_settings(
    app: &AppHandle,
    settings: &LauncherSettings,
) -> Result<(), AppError> {
    let settings_path = get_settings_path(app)?;

    // Ensure directory exists
    if let Some(parent) = settings_path.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            AppError::LauncherError(format!("Failed to create settings directory: {}", e))
        })?;
    }

    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| AppError::LauncherError(format!("Failed to serialize settings: {}", e)))?;

    fs::write(&settings_path, content)
        .map_err(|e| AppError::LauncherError(format!("Failed to write settings file: {}", e)))?;

    info!("launcher: settings saved successfully");
    Ok(())
}

/// Migrate settings from localStorage to file
/// This should be called once during app startup
#[allow(dead_code)]
pub fn migrate_from_localstorage(app: &AppHandle) -> Result<(), AppError> {
    let settings_path = get_settings_path(app)?;

    // Only migrate if settings file doesn't exist
    if settings_path.exists() {
        info!("launcher: settings file already exists, skipping migration");
        return Ok(());
    }

    // Check for localStorage data via frontend
    // This will be handled by the frontend calling a migration command
    info!("launcher: ready for localStorage migration");
    Ok(())
}

// ─── Tauri Commands ───────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_launcher_settings_cmd(app: AppHandle) -> Result<LauncherSettings, AppError> {
    get_launcher_settings(&app)
}

#[tauri::command]
pub async fn save_launcher_settings_cmd(
    app: AppHandle,
    settings: LauncherSettings,
) -> Result<(), AppError> {
    save_launcher_settings(&app, &settings)
}

#[tauri::command]
pub async fn migrate_launcher_settings(
    app: AppHandle,
    local_settings: Option<LauncherSettings>,
) -> Result<(), AppError> {
    if let Some(settings) = local_settings {
        save_launcher_settings(&app, &settings)?;
        info!("launcher: migrated settings from localStorage");
    }
    Ok(())
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use tempfile::TempDir;

    fn mock_app_handle() -> AppHandle {
        // This is a simplified mock - in real tests you'd need proper setup
        // For now, we'll test the core logic without Tauri integration
        panic!("Mock AppHandle requires proper test setup")
    }

    #[test]
    fn test_launcher_settings_default() {
        let settings = LauncherSettings::default();
        assert!(!settings.auto_boost_enabled);
        assert!(settings.favorites.is_empty());
        assert!(settings.last_played.is_empty());
    }

    #[test]
    fn test_launcher_settings_serialization() {
        let mut settings = LauncherSettings::default();
        settings.auto_boost_enabled = true;
        settings.favorites.push(123);
        settings.favorites.push(456);
        settings.last_played.insert(123, 1640995200000);

        let json = serde_json::to_string(&settings).unwrap();
        let deserialized: LauncherSettings = serde_json::from_str(&json).unwrap();

        assert_eq!(settings.auto_boost_enabled, deserialized.auto_boost_enabled);
        assert_eq!(settings.favorites, deserialized.favorites);
        assert_eq!(settings.last_played, deserialized.last_played);
    }
}
