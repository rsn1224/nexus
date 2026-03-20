// Cleanup Services — 全設定リバート機能 + 一時ファイル削除

use crate::error::AppError;
use crate::state::SharedState;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{Manager, State};
use tracing::{info, warn};

/// スキャン対象ディレクトリ
const TEMP_DIRS: &[&str] = &[
    "%TEMP%",                     // ユーザー一時フォルダ
    "%LOCALAPPDATA%\\Temp",       // ローカルアプリ一時
    "%WINDIR%\\Temp",             // Windows 一時
    "%LOCALAPPDATA%\\CrashDumps", // クラッシュダンプ
];

/// スキャン対象拡張子（安全に削除可能なもののみ）
const SAFE_EXTENSIONS: &[&str] = &["tmp", "log", "bak", "old", "dmp", "etl"];

/// 一時ファイルスキャン結果
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupScanResult {
    pub dirs_scanned: usize,
    pub files_found: usize,
    pub total_size_mb: f64,
    pub items: Vec<CleanupItem>,
}

/// 個別クリーンアップ項目
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupItem {
    pub path: String,
    pub size_mb: f64,
    pub category: String, // "temp" / "crash_dump" / "log"
    pub can_delete: bool,
}

/// 削除実行結果
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupResult {
    pub deleted_count: usize,
    pub freed_mb: f64,
    pub errors: Vec<String>,
}

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

/// 環境変数を展開したパスを取得
fn expand_env_path(path: &str) -> PathBuf {
    #[cfg(windows)]
    {
        env::var("TEMP")
            .map(|temp| {
                path.replace("%TEMP%", &temp)
                    .replace(
                        "%LOCALAPPDATA%",
                        &env::var("LOCALAPPDATA").unwrap_or_default(),
                    )
                    .replace("%WINDIR%", &env::var("WINDIR").unwrap_or_default())
            })
            .unwrap_or_else(|_| path.to_string())
            .into()
    }
    #[cfg(not(windows))]
    {
        // Windows 以外では空のパスを返す
        PathBuf::new()
    }
}

/// ファイルが削除可能かチェック
fn is_deletable_file(path: &Path) -> bool {
    // 拡張子チェック
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        if !SAFE_EXTENSIONS.contains(&ext.to_lowercase().as_str()) {
            return false;
        }
    } else {
        return false;
    }

    // ファイルロックチェック（実際に削除を試みる）
    // 注意: この方法はファイルを実際に削除してしまうため、
    // 本番環境では使用不可。テスト目的のみ。
    let _ = path; // 未使用警告回避

    // TODO: Windows API の CreateFile で FILE_SHARE_READ で
    // 開けるかチェックする実装に置き換える
    false // 現時点では安全側に倒して false を返す
}

/// 一時ファイルをスキャンし、削除可能なファイル一覧を返す
pub fn scan_temp_files() -> Result<CleanupScanResult, AppError> {
    #[cfg(windows)]
    {
        info!("scan_temp_files: スキャン開始");

        let mut items = Vec::new();
        let mut dirs_scanned = 0;
        let mut files_found = 0;
        let mut total_size_mb = 0.0;

        for dir_pattern in TEMP_DIRS {
            let dir_path = expand_env_path(dir_pattern);

            if !dir_path.exists() {
                warn!("Directory not found: {:?}", dir_path);
                continue;
            }

            dirs_scanned += 1;

            // ディレクトリ内のファイルをスキャン
            match fs::read_dir(&dir_path) {
                Ok(entries) => {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_file() {
                            files_found += 1;

                            // ファイルサイズ取得
                            let size_mb = match fs::metadata(&path) {
                                Ok(metadata) => metadata.len() as f64 / 1024.0 / 1024.0,
                                Err(_) => 0.0,
                            };

                            // カテゴリ判定
                            let category = if path.to_string_lossy().contains("CrashDumps") {
                                "crash_dump"
                            } else if path.extension().and_then(|e| e.to_str()) == Some("log") {
                                "log"
                            } else {
                                "temp"
                            };

                            // 削除可能性チェック
                            let can_delete = is_deletable_file(&path);

                            if can_delete {
                                total_size_mb += size_mb;
                            }

                            items.push(CleanupItem {
                                path: path.to_string_lossy().to_string(),
                                size_mb,
                                category: category.to_string(),
                                can_delete,
                            });
                        }
                    }
                }
                Err(e) => {
                    warn!("Failed to read directory {:?}: {}", dir_path, e);
                }
            }
        }

        info!(
            dirs_scanned = dirs_scanned,
            files_found = files_found,
            total_size_mb = total_size_mb,
            deletable = items.iter().filter(|i| i.can_delete).count(),
            "scan_temp_files: スキャン完了"
        );

        Ok(CleanupScanResult {
            dirs_scanned,
            files_found,
            total_size_mb,
            items,
        })
    }
    #[cfg(not(windows))]
    {
        // Windows 以外では空の結果を返す
        Ok(CleanupScanResult {
            dirs_scanned: 0,
            files_found: 0,
            total_size_mb: 0.0,
            items: Vec::new(),
        })
    }
}

/// 指定されたパスのファイルを削除する
pub fn delete_temp_files(paths: Vec<String>) -> Result<CleanupResult, AppError> {
    #[cfg(windows)]
    {
        info!(count = paths.len(), "delete_temp_files: 削除開始");

        let mut deleted_count = 0;
        let mut freed_mb = 0.0;
        let mut errors = Vec::new();

        for path_str in paths {
            let path = PathBuf::from(&path_str);

            // セキュリティチェック: TEMP_DIRS 配下のパスのみ許可
            let is_allowed = TEMP_DIRS.iter().any(|dir_pattern| {
                let base_dir = expand_env_path(dir_pattern);
                path.starts_with(&base_dir)
            });

            if !is_allowed {
                let error_msg = format!("Path outside allowed directories: {}", path_str);
                warn!("{}", error_msg);
                errors.push(error_msg);
                continue;
            }

            // ファイルサイズを記録
            let size_mb = match fs::metadata(&path) {
                Ok(metadata) => metadata.len() as f64 / 1024.0 / 1024.0,
                Err(_) => 0.0,
            };

            // 削除実行
            match fs::remove_file(&path) {
                Ok(()) => {
                    deleted_count += 1;
                    freed_mb += size_mb;
                    info!("Deleted file: {:?}", path);
                }
                Err(e) => {
                    let error_msg = format!("Failed to delete {}: {}", path_str, e);
                    warn!("{}", error_msg);
                    errors.push(error_msg);
                }
            }
        }

        info!(
            deleted_count = deleted_count,
            freed_mb = freed_mb,
            errors = errors.len(),
            "delete_temp_files: 削除完了"
        );

        Ok(CleanupResult {
            deleted_count,
            freed_mb,
            errors,
        })
    }
    #[cfg(not(windows))]
    {
        // Windows 以外では空の結果を返す
        Ok(CleanupResult {
            deleted_count: 0,
            freed_mb: 0.0,
            errors: vec!["Platform not supported".to_string()],
        })
    }
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
    fn test_cleanup_scan_result_serialization() {
        let result = CleanupScanResult {
            dirs_scanned: 2,
            files_found: 10,
            total_size_mb: 125.5,
            items: vec![CleanupItem {
                path: "C:\\temp\\test.tmp".to_string(),
                size_mb: 1.5,
                category: "temp".to_string(),
                can_delete: true,
            }],
        };

        let json = serde_json::to_string(&result).expect("シリアライズ失敗");
        let deserialized: CleanupScanResult =
            serde_json::from_str(&json).expect("デシリアライズ失敗");

        assert_eq!(result.dirs_scanned, deserialized.dirs_scanned);
        assert_eq!(result.files_found, deserialized.files_found);
        assert_eq!(result.total_size_mb, deserialized.total_size_mb);
        assert_eq!(result.items.len(), deserialized.items.len());
    }

    #[test]
    fn test_cleanup_result_counts() {
        let result = CleanupResult {
            deleted_count: 5,
            freed_mb: 25.3,
            errors: vec!["Failed to delete locked file".to_string()],
        };

        assert_eq!(result.deleted_count, 5);
        assert_eq!(result.freed_mb, 25.3);
        assert_eq!(result.errors.len(), 1);
    }

    #[test]
    fn test_path_validation_rejects_outside_temp() {
        // TEMP_DIRS 以外のパスを渡した場合にエラーになることを確認
        let paths = vec![
            "C:\\Windows\\System32\\kernel32.dll".to_string(),
            "D:\\important\\data.txt".to_string(),
        ];

        let result = delete_temp_files(paths);

        assert!(result.is_ok());
        let cleanup_result = result.unwrap();
        assert_eq!(cleanup_result.deleted_count, 0);
        assert_eq!(cleanup_result.errors.len(), 2);
        assert!(cleanup_result.errors[0].contains("outside allowed directories"));
    }

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
    fn test_expand_env_path_windows() {
        // Windows 環境変数展開のテスト
        let path = expand_env_path("%TEMP%\\test");

        #[cfg(windows)]
        {
            // 実際の環境変数が設定されている場合
            assert!(path.to_string_lossy().contains("test"));
        }

        #[cfg(not(windows))]
        {
            // Windows 以外では空パス
            assert_eq!(path, PathBuf::new());
        }
    }

    #[test]
    fn test_safe_extensions() {
        // 安全な拡張子リストのテスト
        assert!(SAFE_EXTENSIONS.contains(&"tmp"));
        assert!(SAFE_EXTENSIONS.contains(&"log"));
        assert!(SAFE_EXTENSIONS.contains(&"bak"));
        assert!(!SAFE_EXTENSIONS.contains(&"exe"));
        assert!(!SAFE_EXTENSIONS.contains(&"dll"));
    }
}
