#![allow(dead_code)]

use crate::error::AppError;
use winreg::enums::*;
use winreg::RegKey;

/// HKCU レジストリキーの DWORD 値を読み取る
pub fn read_hkcu_dword(subkey: &str, value_name: &str) -> Result<u32, AppError> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu.open_subkey(subkey).map_err(|e| {
        AppError::Registry(format!(
            "レジストリキー '{}' の読み取りに失敗: {}",
            subkey, e
        ))
    })?;
    key.get_value::<u32, _>(value_name).map_err(|e| {
        AppError::Registry(format!(
            "値 '{}\\{}' の読み取りに失敗: {}",
            subkey, value_name, e
        ))
    })
}

/// HKCU レジストリキーの DWORD 値を読み取り、キーが存在しない場合はデフォルト値を返す
pub fn read_hkcu_dword_or(subkey: &str, value_name: &str, default: u32) -> u32 {
    read_hkcu_dword(subkey, value_name).unwrap_or(default)
}

/// HKLM レジストリキーの DWORD 値を読み取る
pub fn read_hklm_dword(subkey: &str, value_name: &str) -> Result<u32, AppError> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm.open_subkey(subkey).map_err(|e| {
        AppError::Registry(format!(
            "レジストリキー '{}' の読み取りに失敗: {}",
            subkey, e
        ))
    })?;
    key.get_value::<u32, _>(value_name).map_err(|e| {
        AppError::Registry(format!(
            "値 '{}\\{}' の読み取りに失敗: {}",
            subkey, value_name, e
        ))
    })
}

/// HKLM レジストリキーの DWORD 値を読み取り、キーが存在しない場合はデフォルト値を返す
pub fn read_hklm_dword_or(subkey: &str, value_name: &str, default: u32) -> u32 {
    read_hklm_dword(subkey, value_name).unwrap_or(default)
}

/// HKCU レジストリキーの文字列値を読み取る
pub fn read_hkcu_string(subkey: &str, value_name: &str) -> Result<String, AppError> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu.open_subkey(subkey).map_err(|e| {
        AppError::Registry(format!(
            "レジストリキー '{}' の読み取りに失敗: {}",
            subkey, e
        ))
    })?;
    key.get_value::<String, _>(value_name).map_err(|e| {
        AppError::Registry(format!(
            "値 '{}\\{}' の読み取りに失敗: {}",
            subkey, value_name, e
        ))
    })
}
