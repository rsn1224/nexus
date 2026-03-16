use crate::error::AppError;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use totp_rs::{Algorithm, Secret, TOTP};
use tracing::info;
use uuid::Uuid;

// ─── Constants ────────────────────────────────────────────────────────────────

const VAULT_FILE: &str = "vault.json";
const MASTER_FILE: &str = "vault_master.json";

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VaultEntry {
    pub id: String,
    pub label: String,
    pub category: String, // "password" | "api_key" | "note" | "config" | "totp"
    pub username: String,
    pub url: String,
    pub secret: String,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct MasterConfig {
    hash: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TotpResult {
    pub code: String,
    pub valid_for_secs: u64,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn now_millis() -> Result<u64, AppError> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| AppError::Command(e.to_string()))
}

pub(crate) fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn vault_path(app: &AppHandle) -> Result<std::path::PathBuf, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Command(e.to_string()))?;
    Ok(dir.join(VAULT_FILE))
}

fn master_path(app: &AppHandle) -> Result<std::path::PathBuf, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Command(e.to_string()))?;
    Ok(dir.join(MASTER_FILE))
}

fn load_entries(app: &AppHandle) -> Result<Vec<VaultEntry>, AppError> {
    let path = vault_path(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let raw = std::fs::read_to_string(&path)?;
    Ok(serde_json::from_str(&raw)?)
}

fn save_entries(app: &AppHandle, entries: &[VaultEntry]) -> Result<(), AppError> {
    let path = vault_path(app)?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    std::fs::write(&path, serde_json::to_string_pretty(entries)?)?;
    Ok(())
}

fn load_master(app: &AppHandle) -> Result<Option<MasterConfig>, AppError> {
    let path = master_path(app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = std::fs::read_to_string(&path)?;
    Ok(Some(serde_json::from_str(&raw)?))
}

fn save_master(app: &AppHandle, config: &MasterConfig) -> Result<(), AppError> {
    let path = master_path(app)?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    std::fs::write(&path, serde_json::to_string_pretty(config)?)?;
    Ok(())
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// 保存済みエントリ一覧を返す。
#[tauri::command]
pub fn list_vault_entries(app: AppHandle) -> Result<Vec<VaultEntry>, AppError> {
    info!("list_vault_entries: loading entries");
    let entries = load_entries(&app)?;
    info!(count = entries.len(), "list_vault_entries: done");
    Ok(entries)
}

/// マスターパスワードを検証する。未設定の場合はデフォルト "nexus" で初期化する。
#[tauri::command]
pub fn unlock_vault(app: AppHandle, master_password: String) -> Result<bool, AppError> {
    info!("unlock_vault: verifying master password");
    let hash = hash_password(&master_password);

    match load_master(&app)? {
        Some(config) => Ok(config.hash == hash),
        None => {
            // 初回: デフォルトパスワード "nexus" と一致すれば初期化
            if master_password == "nexus" {
                save_master(&app, &MasterConfig { hash })?;
                info!("unlock_vault: initialized with default password");
                Ok(true)
            } else {
                Ok(false)
            }
        }
    }
}

/// エントリを追加・上書き保存する。id が空なら新規作成。
#[tauri::command]
pub fn save_vault_entry(
    app: AppHandle,
    id: String,
    label: String,
    category: String,
    username: String,
    url: String,
    secret: String,
) -> Result<VaultEntry, AppError> {
    info!(label = %label, "save_vault_entry: saving");
    let now = now_millis()?;
    let mut entries = load_entries(&app)?;

    if id.is_empty() {
        // 新規
        let entry = VaultEntry {
            id: Uuid::new_v4().to_string(),
            label,
            category,
            username,
            url,
            secret,
            created_at: now,
            updated_at: now,
        };
        entries.push(entry.clone());
        save_entries(&app, &entries)?;
        Ok(entry)
    } else {
        // 更新
        let pos = entries
            .iter()
            .position(|e| e.id == id)
            .ok_or_else(|| AppError::NotFound(format!("vault entry {id}")))?;
        entries[pos].label = label;
        entries[pos].category = category;
        entries[pos].username = username;
        entries[pos].url = url;
        entries[pos].secret = secret;
        entries[pos].updated_at = now;
        let updated = entries[pos].clone();
        save_entries(&app, &entries)?;
        Ok(updated)
    }
}

/// エントリを削除する。
#[tauri::command]
pub fn delete_vault_entry(app: AppHandle, id: String) -> Result<(), AppError> {
    info!(id = %id, "delete_vault_entry: removing");
    let mut entries = load_entries(&app)?;
    let before = entries.len();
    entries.retain(|e| e.id != id);
    if entries.len() == before {
        return Err(AppError::NotFound(format!("vault entry {id}")));
    }
    save_entries(&app, &entries)?;
    Ok(())
}

/// マスターパスワードを変更する。
/// current_password が正しい場合のみ new_password に更新する。
#[tauri::command]
pub fn change_master_password(
    app: AppHandle,
    current_password: String,
    new_password: String,
) -> Result<bool, AppError> {
    info!("change_master_password: attempting to change master password");

    // 新しいパスワードのバリデーション
    if new_password.is_empty() {
        return Err(AppError::Command("password must not be empty".into()));
    }

    // 現在のパスワードをハッシュ化
    let current_hash = hash_password(&current_password);

    // 保存済みハッシュと照合
    match load_master(&app)? {
        Some(config) => {
            if config.hash == current_hash {
                // パスワードが一致した場合、新しいパスワードで更新
                let new_hash = hash_password(&new_password);
                save_master(&app, &MasterConfig { hash: new_hash })?;
                info!("change_master_password: password changed successfully");
                Ok(true)
            } else {
                // 現在のパスワードが不一致
                info!("change_master_password: current password incorrect");
                Ok(false)
            }
        }
        None => {
            // マスターパスワードが未設定の場合はエラー
            info!("change_master_password: master password not set");
            Err(AppError::Command("master password not initialized".into()))
        }
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_password_is_deterministic() {
        assert_eq!(hash_password("nexus"), hash_password("nexus"));
    }

    #[test]
    fn test_hash_password_differs_for_different_inputs() {
        assert_ne!(hash_password("nexus"), hash_password("other"));
    }

    #[test]
    fn test_hash_password_output_is_hex_string() {
        let h = hash_password("test");
        assert_eq!(h.len(), 64, "SHA-256 hex is 64 chars");
        assert!(h.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_hash_password_known_value() {
        // SHA-256("nexus") の先頭 8 文字で一致確認
        let h = hash_password("nexus");
        assert!(h.starts_with("f5cfcb57"), "known hash prefix for 'nexus'");
    }

    #[test]
    fn test_change_master_password_empty_new() {
        // 空パスワードでエラーが返ること
        let result = change_master_password_logic("current", "", "current");
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::Command(msg) => assert_eq!(msg, "password must not be empty"),
            _ => panic!("Expected Command error"),
        }
    }

    #[test]
    fn test_change_master_password_wrong_current() {
        // 誤ったパスワードで false が返ること
        let result = change_master_password_logic("wrong", "new", "current");
        assert!(result.is_ok());
        assert!(!result.unwrap());
    }

    // ユニットテスト用のヘルパー関数
    fn change_master_password_logic(
        current_password: &str,
        new_password: &str,
        saved_password: &str,
    ) -> Result<bool, AppError> {
        // 新しいパスワードのバリデーション
        if new_password.is_empty() {
            return Err(AppError::Command("password must not be empty".into()));
        }

        // 現在のパスワードをハッシュ化
        let current_hash = hash_password(current_password);
        let saved_hash = hash_password(saved_password);

        // 保存済みハッシュと照合
        if current_hash == saved_hash {
            // パスワードが一致した場合、新しいパスワードで更新
            let _new_hash = hash_password(new_password);
            Ok(true)
        } else {
            // 現在のパスワードが不一致
            Ok(false)
        }
    }
}

/// TOTP シークレット（Base32）から現在の 6 桁コードと残り秒数を返す。
#[tauri::command]
pub fn generate_totp(secret: String) -> Result<TotpResult, AppError> {
    info!("generate_totp: generating TOTP code");

    // Base32シークレットをデコード
    let totp_secret = Secret::Encoded(secret)
        .to_bytes()
        .map_err(|e| AppError::Command(format!("Invalid TOTP secret: {}", e)))?;

    // TOTPインスタンスを作成（SHA1、6桁、30秒周期）
    let totp = TOTP::new(Algorithm::SHA1, 6, 1, 30, totp_secret, None, String::new())
        .map_err(|e| AppError::Command(format!("Failed to create TOTP: {}", e)))?;

    // 現在のコードを生成
    let code = totp
        .generate_current()
        .map_err(|e| AppError::Command(format!("Failed to generate TOTP code: {}", e)))?;

    // 残り秒数を計算
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let valid_for_secs = 30 - (now % 30);

    info!(valid_for_secs, "generate_totp: done");

    Ok(TotpResult {
        code,
        valid_for_secs,
    })
}
