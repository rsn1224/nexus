//! アプリデータ削除（アンインストール用）

use std::path::PathBuf;
use tauri::Manager;
use tracing::info;

use super::types::RevertItem;

/// nexus データ削除（アンインストール用）
/// バックアップ JSON + プロファイル JSON + アプリ設定 + keyring を削除
#[allow(dead_code)]
pub fn cleanup_app_data(app: tauri::AppHandle) -> Vec<RevertItem> {
    info!("cleanup_app_data: アプリデータ削除開始");
    let mut items: Vec<RevertItem> = Vec::new();

    // 1. winopt_backup.json 削除
    delete_file_item(&get_backup_path(), "winopt_backup.json", &mut items);

    // 2. profiles.json 削除
    if let Ok(dir) = app.path().app_data_dir() {
        let profiles_path: PathBuf = dir.join("profiles.json");
        delete_file_item(&profiles_path, "profiles.json", &mut items);

        // 3. app_settings.json 削除
        let app_settings_path: PathBuf = dir.join("nexus").join("app_settings.json");
        delete_file_item(&app_settings_path, "app_settings.json", &mut items);
    }

    // 4. keyring からAPI キー削除
    match crate::services::credentials::delete_api_key("perplexity_api_key") {
        Ok(()) => items.push(RevertItem {
            category: "認証".to_string(),
            label: "API キー".to_string(),
            success: true,
            detail: "keyring から削除済み".to_string(),
        }),
        Err(e) => items.push(RevertItem {
            category: "認証".to_string(),
            label: "API キー".to_string(),
            success: false,
            detail: format!("{}", e),
        }),
    }

    items
}

#[allow(dead_code)]
fn get_backup_path() -> PathBuf {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    PathBuf::from(local_app_data)
        .join("nexus")
        .join("winopt_backup.json")
}

#[allow(dead_code)]
fn delete_file_item(path: &std::path::Path, label: &str, items: &mut Vec<RevertItem>) {
    if path.exists() {
        match std::fs::remove_file(path) {
            Ok(()) => items.push(RevertItem {
                category: "データ".to_string(),
                label: label.to_string(),
                success: true,
                detail: "削除完了".to_string(),
            }),
            Err(e) => items.push(RevertItem {
                category: "データ".to_string(),
                label: label.to_string(),
                success: false,
                detail: format!("削除失敗: {}", e),
            }),
        }
    } else {
        items.push(RevertItem {
            category: "データ".to_string(),
            label: label.to_string(),
            success: true,
            detail: "ファイルなし（スキップ）".to_string(),
        });
    }
}
