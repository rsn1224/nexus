//! レジストリ最適化の設定テーブル

use crate::error::AppError;

/// レジストリ項目の subkey と value_name を返す
pub(super) fn location(id: &str) -> Result<(&'static str, &'static str), AppError> {
    match id {
        "reg_responsiveness" => Ok((
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile",
            "SystemResponsiveness",
        )),
        "reg_priority_sep" => Ok((
            r"SYSTEM\CurrentControlSet\Control\PriorityControl",
            "Win32PrioritySeparation",
        )),
        "reg_throttle" => Ok((
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile",
            "NetworkThrottlingIndex",
        )),
        "reg_game_dvr" => Ok((
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\GameDVR",
            "AppCaptureEnabled",
        )),
        _ => Err(AppError::InvalidInput(format!("Unknown registry id: {id}"))),
    }
}

/// レジストリ項目の最適化後の目標値を返す
pub(super) fn target_value(id: &str) -> Result<u32, AppError> {
    match id {
        "reg_responsiveness" => Ok(0),
        "reg_priority_sep" => Ok(38),
        "reg_throttle" => Ok(0xFFFF_FFFF),
        "reg_game_dvr" => Ok(0),
        _ => Err(AppError::InvalidInput(format!("Unknown registry id: {id}"))),
    }
}
