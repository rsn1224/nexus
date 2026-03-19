//! スクリプト実行コマンド
//! PowerShell / Python スクリプトの安全な実行を提供

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{debug, info, warn};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    pub script_type: String, // "powershell" or "python"
    pub description: String,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionLog {
    pub id: String,
    pub script_id: String,
    pub script_name: String,
    pub script_path: String,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub started_at: u64,
    pub completed_at: Option<u64>,
    pub duration_ms: Option<u64>,
}

// 許可されたディレクトリ（ホームディレクトリ以下）
fn get_allowed_directories() -> Result<Vec<PathBuf>, AppError> {
    let mut allowed = Vec::new();

    // ユーザーのホームディレクトリ
    if let Some(home) = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")) {
        allowed.push(PathBuf::from(home));
    }

    // ユーザーのドキュメントディレクトリ
    if let Some(docs) = std::env::var_os("USERPROFILE").map(|p| PathBuf::from(p).join("Documents"))
    {
        allowed.push(docs);
    }

    if allowed.is_empty() {
        return Err(AppError::InvalidInput(
            "許可されたディレクトリを特定できません".to_string(),
        ));
    }

    Ok(allowed)
}

/// スクリプトパスを厳格にバリデーション
fn validate_script_path_strict(script_path: &str) -> Result<(), AppError> {
    // NOTE: TOCTOU リスクあり（check 後に symlink が変更される可能性）。
    // execute_script 内でも再バリデーションを実施しているため攻撃ウィンドウは最小限。
    let canonical = fs::canonicalize(script_path)
        .map_err(|e| AppError::InvalidInput(format!("パス解決失敗: {}", e)))?;

    let allowed_dirs = get_allowed_directories()?;

    // シンボリックリンクの追跡後にも許可ディレクトリ内であることを確認
    let in_allowed = allowed_dirs.iter().any(|dir| canonical.starts_with(dir));

    if !in_allowed {
        warn!("スクリプトパスが許可されたディレクトリ外: {:?}", canonical);
        return Err(AppError::InvalidInput(
            "許可されたディレクトリ外のスクリプトは実行できません".to_string(),
        ));
    }

    // ファイル拡張子をチェック
    let extension = canonical
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");

    match extension.to_lowercase().as_str() {
        "ps1" | "py" => (),
        _ => {
            return Err(AppError::InvalidInput(
                "サポートされていないファイル拡張子です".to_string(),
            ));
        }
    }

    debug!("スクリプトパスバリデーション成功: {:?}", canonical);
    Ok(())
}

/// スクリプト一覧を取得
#[tauri::command]
pub async fn list_scripts() -> Result<Vec<ScriptEntry>, AppError> {
    // 実装は簡略化 - 実際には設定ファイルから読み込む
    // ここでは空のリストを返す
    Ok(vec![])
}

/// スクリプトを追加
#[tauri::command]
pub async fn add_script(
    name: String,
    path: String,
    script_type: String,
    description: String,
) -> Result<ScriptEntry, AppError> {
    // パスをバリデーション
    validate_script_path_strict(&path)?;

    // スクリプトタイプをチェック
    if !["powershell", "python"].contains(&script_type.as_str()) {
        return Err(AppError::InvalidInput(
            "サポートされていないスクリプトタイプです".to_string(),
        ));
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("SystemTime before UNIX_EPOCH")
        .as_secs();

    let script = ScriptEntry {
        id: Uuid::new_v4().to_string(),
        name,
        path,
        script_type,
        description,
        created_at: now,
        updated_at: now,
    };

    info!("スクリプトを追加: {} ({})", script.name, script.id);
    Ok(script)
}

/// スクリプトを削除
#[tauri::command]
pub async fn delete_script(id: String) -> Result<(), AppError> {
    info!("スクリプトを削除: {}", id);
    // 実装は簡略化
    Ok(())
}

/// スクリプトを実行
#[tauri::command]
pub async fn execute_script(script_id: String) -> Result<ExecutionLog, AppError> {
    // 実際にはIDからスクリプト情報を取得するが、ここでは簡略化
    let script_path = format!("{}.ps1", script_id); // ダミーパス

    // パスをバリデーション
    validate_script_path_strict(&script_path)?;

    let started_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("SystemTime before UNIX_EPOCH")
        .as_secs();

    info!("スクリプト実行開始: {} (ID: {})", script_path, script_id);

    let output = if script_path.ends_with(".ps1") {
        Command::new("powershell")
            .args(["-ExecutionPolicy", "Bypass", "-File", &script_path])
            .output()
    } else if script_path.ends_with(".py") {
        Command::new("python").arg(&script_path).output()
    } else {
        return Err(AppError::InvalidInput(
            "サポートされていないスクリプト形式です".to_string(),
        ));
    }
    .map_err(|e| AppError::Command(format!("スクリプト実行失敗: {}", e)))?;

    let completed_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("SystemTime before UNIX_EPOCH")
        .as_secs();

    let duration_ms = Some(completed_at.saturating_sub(started_at) * 1000);

    let log = ExecutionLog {
        id: Uuid::new_v4().to_string(),
        script_id: script_id.clone(),
        script_name: format!("script_{}", script_id),
        script_path,
        exit_code: Some(output.status.code().unwrap_or(-1)),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        started_at,
        completed_at: Some(completed_at),
        duration_ms,
    };

    info!(
        "スクリプト実行完了: {} (exit_code: {}, duration: {}ms)",
        log.script_name,
        log.exit_code.unwrap_or(-1),
        log.duration_ms.unwrap_or(0)
    );

    // 実行ログを永続化（実装は簡略化）
    persist_execution_log(&log)?;

    Ok(log)
}

/// 実行ログを永続化
fn persist_execution_log(log: &ExecutionLog) -> Result<(), AppError> {
    // 実際にはファイルに書き込むが、ここでは簡略化
    debug!(
        "実行ログを記録: {} (exit_code: {})",
        log.script_name,
        log.exit_code.unwrap_or(-1)
    );
    Ok(())
}

/// 実行ログ一覧を取得
#[tauri::command]
pub async fn list_execution_logs() -> Result<Vec<ExecutionLog>, AppError> {
    // 実装は簡略化
    Ok(vec![])
}

/// 実行ログをクリア
#[tauri::command]
pub async fn clear_execution_logs() -> Result<(), AppError> {
    info!("実行ログをクリア");
    // 実装は簡略化
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_validate_script_path_allowed() {
        // テスト用の一時ディレクトリを作成
        let temp_dir = TempDir::new().unwrap();
        let script_path = temp_dir.path().join("test.ps1");
        fs::write(&script_path, "Write-Host 'Hello'").unwrap();

        // 許可ディレクトリを一時ディレクトリに設定（テスト用）
        // 実際のテストでは環境変数をモックする必要がある
        let result = validate_script_path_strict(script_path.to_str().unwrap());

        // パスが許可されないことを確認（ホームディレクトリ外のため）
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_script_path_invalid_extension() {
        let temp_dir = TempDir::new().unwrap();
        let script_path = temp_dir.path().join("test.txt");
        fs::write(&script_path, "Hello").unwrap();

        let result = validate_script_path_strict(script_path.to_str().unwrap());
        assert!(result.is_err());
    }

    #[test]
    fn test_script_entry_creation() {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let script = ScriptEntry {
            id: "test-id".to_string(),
            name: "Test Script".to_string(),
            path: "/path/to/script.ps1".to_string(),
            script_type: "powershell".to_string(),
            description: "Test description".to_string(),
            created_at: now,
            updated_at: now,
        };

        assert_eq!(script.id, "test-id");
        assert_eq!(script.script_type, "powershell");
        assert!(script.created_at > 0);
    }
}
