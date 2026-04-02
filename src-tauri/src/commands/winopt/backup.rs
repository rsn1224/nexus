//! バックアップ管理・PowerShell ヘルパー・バリデーション

use crate::error::AppError;
use crate::infra::powershell::run_powershell as ps_run;
use std::collections::HashMap;
use std::path::PathBuf;
use tracing::info;

// ─── Backup Management ────────────────────────────────────────────────────────────

pub(crate) fn backup_path() -> Result<PathBuf, AppError> {
    let mut path = std::env::var("LOCALAPPDATA").map_err(|_| {
        AppError::Command("LOCALAPPDATA 環境変数の取得に失敗しました".to_string())
    })?;
    path.push_str("\\nexus\\winopt_backup.json");
    Ok(PathBuf::from(path))
}

pub(crate) fn load_backup() -> Result<HashMap<String, String>, AppError> {
    let path = backup_path()?;
    if !path.exists() {
        return Ok(HashMap::new());
    }

    let content = std::fs::read_to_string(path)
        .map_err(|e| AppError::Io(format!("バックアップファイルの読み込みに失敗しました: {}", e)))?;

    serde_json::from_str(&content)
        .map_err(|e| AppError::Serialization(format!("バックアップファイルの解析に失敗しました: {}", e)))
}

pub(crate) fn save_backup(backup: &HashMap<String, String>) -> Result<(), AppError> {
    let path = backup_path()?;

    // Create directory if it doesn't exist
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| AppError::Io(format!("バックアップディレクトリの作成に失敗しました: {}", e)))?;
    }

    let content = serde_json::to_string_pretty(backup)
        .map_err(|e| AppError::Serialization(format!("バックアップのシリアライズに失敗しました: {}", e)))?;

    std::fs::write(path, content)
        .map_err(|e| AppError::Io(format!("バックアップファイルの書き込みに失敗しました: {}", e)))?;

    Ok(())
}

// ─── PowerShell Helper ────────────────────────────────────────────────────────────

pub(crate) fn run_powershell(command: &str) -> Result<String, AppError> {
    info!(
        "Executing PowerShell: {}",
        &command[..command.len().min(100)]
    );
    ps_run(command)
}

// ─── Validation Functions (Phase 1) ─────────────────────────────────────

/// GUIDバリデーション（8-4-4-4-12 形式）
pub(crate) fn validate_guid(s: &str) -> Result<&str, AppError> {
    let trimmed = s.trim();
    if trimmed.len() == 36
        && trimmed.chars().filter(|&c| c == '-').count() == 4
        && trimmed.chars().all(|c| c.is_ascii_hexdigit() || c == '-')
    {
        Ok(trimmed)
    } else {
        Err(AppError::InvalidInput(format!(
            "無効な GUID 形式です: {}",
            s
        )))
    }
}

/// u32数値のバリデーション（PowerShell の -Value に渡す整数値）
pub(crate) fn validate_u32_value(s: &str) -> Result<u32, AppError> {
    s.trim()
        .parse::<u32>()
        .map_err(|_| AppError::InvalidInput(format!("無効な数値です: {}", s)))
}

/// マウス速度値のバリデーション（"0" or "1" or "2"）
pub(crate) fn validate_mouse_speed(s: &str) -> Result<&str, AppError> {
    let trimmed = s.trim();
    match trimmed {
        "0" | "1" | "2" => Ok(trimmed),
        _ => Err(AppError::InvalidInput(format!(
            "無効なマウス速度値です: {}（0、1、2 のいずれかを指定してください）",
            s
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backup_path_creation() {
        // Test that backup path can be created
        let path = backup_path();
        assert!(path.is_ok());
        let binding = path.unwrap();
        let path_str = binding.to_string_lossy();
        assert!(path_str.contains("nexus"));
        assert!(path_str.contains("winopt_backup.json"));
    }

    // --- PowerShell インジェクション対策バリデーション ---
    #[test]
    fn test_validate_guid_valid() {
        assert!(validate_guid("381b4222-f694-41f0-9685-ff5bb260df2e").is_ok());
    }

    #[test]
    fn test_validate_guid_injection() {
        assert!(validate_guid("'; Remove-Item -Recurse C:\\; '").is_err());
        assert!(validate_guid("not-a-guid").is_err());
        assert!(validate_guid("").is_err());
    }

    #[test]
    fn test_validate_u32_value_valid() {
        assert_eq!(validate_u32_value("0").unwrap(), 0);
        assert_eq!(validate_u32_value("1").unwrap(), 1);
        assert_eq!(validate_u32_value(" 42 ").unwrap(), 42);
    }

    #[test]
    fn test_validate_u32_value_injection() {
        assert!(validate_u32_value("1; whoami").is_err());
        assert!(validate_u32_value("-1").is_err());
        assert!(validate_u32_value("abc").is_err());
    }

    #[test]
    fn test_validate_mouse_speed_valid() {
        assert!(validate_mouse_speed("0").is_ok());
        assert!(validate_mouse_speed("1").is_ok());
        assert!(validate_mouse_speed("2").is_ok());
    }

    #[test]
    fn test_validate_mouse_speed_injection() {
        assert!(validate_mouse_speed("0'; whoami; echo '").is_err());
        assert!(validate_mouse_speed("3").is_err());
    }
}
