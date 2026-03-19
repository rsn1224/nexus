// Cleanup Services — 全設定リバート機能

use crate::state::SharedState;
use std::path::PathBuf;
use tauri::{Manager, State};
use tracing::info;

/// リバート結果の個別レポート
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RevertItem {
    pub category: String,
    pub label: String,
    pub success: bool,
    pub detail: String,
}

/// 全設定リバート結果
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RevertAllResult {
    pub items: Vec<RevertItem>,
    pub total: usize,
    pub success_count: usize,
    pub fail_count: usize,
}

/// nexus が変更した全設定を元に戻す。
/// 各ステップは独立して実行し、1 つ失敗しても残りを続行する。
pub fn revert_all(state: &State<'_, SharedState>) -> RevertAllResult {
    let mut items: Vec<RevertItem> = Vec::new();

    // 1. Windows 設定 (winopt) — バックアップが存在する全項目をリバート
    revert_win_settings(&mut items);

    // 2. ネットワーク設定 — バックアップが存在する全項目をリバート
    revert_net_settings(&mut items);

    // 3. タイマーリゾリューション — デフォルトに戻す
    revert_timer(state, &mut items);

    // 4. ゲームプロファイル — アクティブなら revert
    revert_game_profile(state, &mut items);

    let total = items.len();
    let success_count = items.iter().filter(|i| i.success).count();
    let fail_count = total - success_count;

    info!(
        total = total,
        success = success_count,
        fail = fail_count,
        "cleanup: revert_all 完了"
    );

    RevertAllResult {
        items,
        total,
        success_count,
        fail_count,
    }
}

fn revert_win_settings(_items: &mut Vec<RevertItem>) {
    // winopt_backup.json を読み込み、全キーをリバート
    #[cfg(windows)]
    {
        let items = _items;
        let settings = match crate::commands::winopt::get_win_settings() {
            Ok(s) => s,
            Err(e) => {
                items.push(RevertItem {
                    category: "Windows設定".to_string(),
                    label: "バックアップ読込".to_string(),
                    success: false,
                    detail: format!("バックアップ読込失敗: {}", e),
                });
                return;
            }
        };

        for setting in settings.iter().filter(|s| s.can_revert) {
            let result = crate::commands::winopt::revert_win_setting(&setting.id);
            items.push(RevertItem {
                category: "Windows設定".to_string(),
                label: setting.label.clone(),
                success: result.is_ok(),
                detail: match result {
                    Ok(()) => "リバート完了".to_string(),
                    Err(e) => format!("{}", e),
                },
            });
        }
    }
}

fn revert_net_settings(_items: &mut Vec<RevertItem>) {
    #[cfg(windows)]
    {
        let items = _items;
        let settings = match crate::commands::winopt::get_net_settings() {
            Ok(s) => s,
            Err(e) => {
                items.push(RevertItem {
                    category: "ネットワーク設定".to_string(),
                    label: "バックアップ読込".to_string(),
                    success: false,
                    detail: format!("バックアップ読込失敗: {}", e),
                });
                return;
            }
        };

        for setting in settings.iter().filter(|s| s.can_revert) {
            let result = crate::commands::winopt::revert_net_setting(&setting.id);
            items.push(RevertItem {
                category: "ネットワーク設定".to_string(),
                label: setting.label.clone(),
                success: result.is_ok(),
                detail: match result {
                    Ok(()) => "リバート完了".to_string(),
                    Err(e) => format!("{}", e),
                },
            });
        }
    }
}

fn revert_timer(state: &State<'_, SharedState>, items: &mut Vec<RevertItem>) {
    #[cfg(windows)]
    {
        let result = crate::services::timer::restore_timer(state);
        items.push(RevertItem {
            category: "タイマー".to_string(),
            label: "タイマーリゾリューション".to_string(),
            success: result.is_ok(),
            detail: match result {
                Ok(()) => "デフォルトに復元".to_string(),
                Err(e) => format!("{}", e),
            },
        });
    }
    #[cfg(not(windows))]
    {
        let _ = state; // unused variable 防止
        items.push(RevertItem {
            category: "タイマー".to_string(),
            label: "タイマーリゾリューション".to_string(),
            success: true,
            detail: "Linux: スキップ".to_string(),
        });
    }
}

fn revert_game_profile(state: &State<'_, SharedState>, items: &mut Vec<RevertItem>) {
    let result = crate::services::boost::revert_boost(state);
    items.push(RevertItem {
        category: "ゲーム".to_string(),
        label: "ゲームプロファイル".to_string(),
        success: result.is_ok(),
        detail: match result {
            Ok(()) => "ブースト解除完了".to_string(),
            Err(e) => format!("{}", e),
        },
    });
}

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_revert_item_serialization() {
        let item = RevertItem {
            category: "テスト".to_string(),
            label: "テスト項目".to_string(),
            success: true,
            detail: "成功".to_string(),
        };

        let json = serde_json::to_string(&item).expect("シリアライズ失敗");
        let deserialized: RevertItem = serde_json::from_str(&json).expect("デシリアライズ失敗");

        assert_eq!(item.category, deserialized.category);
        assert_eq!(item.label, deserialized.label);
        assert_eq!(item.success, deserialized.success);
        assert_eq!(item.detail, deserialized.detail);
    }

    #[test]
    fn test_revert_all_result_counts() {
        let items = vec![
            RevertItem {
                category: "テスト1".to_string(),
                label: "項目1".to_string(),
                success: true,
                detail: "成功".to_string(),
            },
            RevertItem {
                category: "テスト2".to_string(),
                label: "項目2".to_string(),
                success: false,
                detail: "失敗".to_string(),
            },
            RevertItem {
                category: "テスト3".to_string(),
                label: "項目3".to_string(),
                success: true,
                detail: "成功".to_string(),
            },
        ];

        let total = items.len();
        let success_count = items.iter().filter(|i| i.success).count();
        let fail_count = total - success_count;

        assert_eq!(total, 3);
        assert_eq!(success_count, 2);
        assert_eq!(fail_count, 1);
    }

    #[test]
    fn test_get_backup_path() {
        let path = get_backup_path();
        assert!(path.ends_with("nexus/winopt_backup.json"));
    }

    #[test]
    fn test_delete_file_item_nonexistent() {
        let mut items: Vec<RevertItem> = Vec::new();
        let nonexistent_path = PathBuf::from("nonexistent_file.txt");

        delete_file_item(&nonexistent_path, "テストファイル", &mut items);

        assert_eq!(items.len(), 1);
        assert!(items[0].success);
        assert_eq!(items[0].label, "テストファイル");
        assert!(items[0].detail.contains("ファイルなし"));
    }
}
