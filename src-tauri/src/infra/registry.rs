#![allow(dead_code)]

use crate::error::AppError;
use winreg::RegKey;
use winreg::enums::*;

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

/// HKLM レジストリキーの DWORD 値を設定する
pub fn set_hklm_dword(subkey: &str, value_name: &str, value: u32) -> Result<(), AppError> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm.create_subkey(subkey).map_err(|e| {
        AppError::Registry(format!(
            "レジストリキー '{}' の作成/オープンに失敗: {}",
            subkey, e
        ))
    })?;
    key.0.set_value(value_name, &value).map_err(|e| {
        AppError::Registry(format!(
            "値 '{}\\{}' の設定に失敗: {}",
            subkey, value_name, e
        ))
    })
}

/// HKLM レジストリキーの DWORD 値を取得（キーが存在しない場合は None）
pub fn get_dword_value(subkey: &str, value_name: &str) -> Option<u32> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(key) = hklm.open_subkey(subkey) {
        if let Ok(value) = key.get_value::<u32, _>(value_name) {
            return Some(value);
        }
    }
    None
}

/// HKLM レジストリキーの DWORD 値を設定
pub fn set_dword_value(subkey: &str, value_name: &str, value: u32) -> Result<(), AppError> {
    set_hklm_dword(subkey, value_name, value)
}

/// レジストリキーのサブキー一覧を取得
pub fn enumerate_subkeys(subkey: &str) -> Result<Vec<String>, AppError> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm.open_subkey(subkey).map_err(|e| {
        AppError::Registry(format!(
            "レジストリキー '{}' のオープンに失敗: {}",
            subkey, e
        ))
    })?;

    let mut subkeys = Vec::new();
    for subkey_name in key.enum_keys().flatten() {
        subkeys.push(subkey_name);
    }

    Ok(subkeys)
}
