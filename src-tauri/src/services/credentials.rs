//! Windows 資格情報マネージャーを使った機密情報の安全な保存
use crate::error::AppError;

const SERVICE_NAME: &str = "nexus-app";

/// API キーを Windows 資格情報マネージャーに保存する
pub fn save_api_key(key_name: &str, value: &str) -> Result<(), AppError> {
    let entry = keyring::Entry::new(SERVICE_NAME, key_name)
        .map_err(|e| AppError::Keyring(format!("Entry作成エラー: {}", e)))?;

    if value.is_empty() {
        // 空文字列の場合は既存エントリを削除
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()), // 元から無い場合は成功扱い
            Err(e) => Err(AppError::Keyring(format!("削除エラー: {}", e))),
        }
    } else {
        entry
            .set_password(value)
            .map_err(|e| AppError::Keyring(format!("保存エラー: {}", e)))
    }
}

/// API キーを Windows 資格情報マネージャーから読み込む
pub fn load_api_key(key_name: &str) -> Result<Option<String>, AppError> {
    let entry = keyring::Entry::new(SERVICE_NAME, key_name)
        .map_err(|e| AppError::Keyring(format!("Entry作成エラー: {}", e)))?;

    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::Keyring(format!("読込エラー: {}", e))),
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_service_name_constant() {
        assert_eq!(super::SERVICE_NAME, "nexus-app");
    }
}
