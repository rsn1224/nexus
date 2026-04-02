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
        _ => Err(AppError::InvalidInput(format!("不明なレジストリ ID です: {id}"))),
    }
}

/// レジストリ項目の最適化後の目標値を返す
pub(super) fn target_value(id: &str) -> Result<u32, AppError> {
    match id {
        "reg_responsiveness" => Ok(0),
        "reg_priority_sep" => Ok(38),
        "reg_throttle" => Ok(0xFFFF_FFFF),
        "reg_game_dvr" => Ok(0),
        _ => Err(AppError::InvalidInput(format!("不明なレジストリ ID です: {id}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const KNOWN_IDS: &[&str] = &[
        "reg_responsiveness",
        "reg_priority_sep",
        "reg_throttle",
        "reg_game_dvr",
    ];

    #[test]
    fn test_location_known_ids() {
        for id in KNOWN_IDS {
            assert!(location(id).is_ok(), "location({id}) が失敗");
        }
    }

    #[test]
    fn test_target_value_known_ids() {
        for id in KNOWN_IDS {
            assert!(target_value(id).is_ok(), "target_value({id}) が失敗");
        }
    }

    #[test]
    fn test_location_unknown_id() {
        assert!(matches!(
            location("unknown_id"),
            Err(crate::error::AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_target_value_unknown_id() {
        assert!(matches!(
            target_value("unknown_id"),
            Err(crate::error::AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_target_values_correct() {
        assert_eq!(target_value("reg_responsiveness").unwrap(), 0);
        assert_eq!(target_value("reg_priority_sep").unwrap(), 38);
        assert_eq!(target_value("reg_throttle").unwrap(), 0xFFFF_FFFF);
        assert_eq!(target_value("reg_game_dvr").unwrap(), 0);
    }
}
