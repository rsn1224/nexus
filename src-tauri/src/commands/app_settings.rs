use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tracing::{info, warn};

use crate::error::AppError;
use crate::services::credentials;

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
    info!("get_app_settings: 設定読み込み中");

    let settings_path = get_settings_path(&app)?;

    let mut settings = if settings_path.exists() {
        let content = fs::read_to_string(&settings_path).map_err(|e| {
            warn!("設定ファイル読み込みエラー: {}", e);
            AppError::Io(format!("設定ファイル読み込みエラー: {}", e))
        })?;
        serde_json::from_str::<AppSettings>(&content).map_err(|e| {
            warn!("設定ファイル解析エラー: {}", e);
            AppError::Serialization(format!("設定ファイル解析エラー: {}", e))
        })?
    } else {
        info!("設定ファイルなし。デフォルト設定を返します");
        AppSettings::default()
    };

    // API キーは keyring から読み込む（JSON ファイルには保存しない）
    match credentials::load_api_key("perplexity-api-key") {
        Ok(Some(key)) => settings.perplexity_api_key = key,
        Ok(None) => {} // keyring にエントリなし — デフォルト空文字列のまま
        Err(e) => {
            warn!(
                "keyring からの API キー読み込みに失敗: {}。空文字列で続行します",
                e
            );
            // エラーでも設定自体は返す（API キーだけ空）
        }
    }

    info!("get_app_settings: 設定読み込み完了");
    Ok(settings)
}

#[tauri::command]
pub fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), AppError> {
    info!("save_app_settings: 設定保存中");

    // API キーは keyring に保存
    if let Err(e) = credentials::save_api_key("perplexity-api-key", &settings.perplexity_api_key) {
        warn!(
            "keyring への API キー保存に失敗: {}。JSON にフォールバック",
            e
        );
        // フォールバック: keyring が使えない場合は JSON に含める
        let settings_path = get_settings_path(&app)?;
        let content = serde_json::to_string_pretty(&settings)
            .map_err(|e| AppError::Serialization(format!("設定シリアライズエラー: {}", e)))?;
        fs::write(&settings_path, content)
            .map_err(|e| AppError::Io(format!("設定ファイル書き込みエラー: {}", e)))?;
        return Ok(());
    }

    // JSON ファイルには API キー以外を保存
    let mut file_settings = settings.clone();
    file_settings.perplexity_api_key = String::new(); // JSON には書かない

    let settings_path = get_settings_path(&app)?;
    let content = serde_json::to_string_pretty(&file_settings).map_err(|e| {
        warn!("設定シリアライズエラー: {}", e);
        AppError::Serialization(format!("設定シリアライズエラー: {}", e))
    })?;

    fs::write(&settings_path, content).map_err(|e| {
        warn!("設定ファイル書き込みエラー: {}", e);
        AppError::Io(format!("設定ファイル書き込みエラー: {}", e))
    })?;

    info!("save_app_settings: 設定保存完了");
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
