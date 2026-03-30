//! Windows 設定の取得・適用・リバートコマンド

use crate::error::AppError;
use serde::{Deserialize, Serialize};

use super::backup::{
    load_backup, run_powershell, save_backup, validate_guid, validate_mouse_speed,
    validate_u32_value,
};

// ─── Types ───────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WinSetting {
    pub id: String,
    pub label: String,
    pub description: String,
    pub is_optimized: bool, // 現在最適化済みかどうか
    pub can_revert: bool,   // バックアップが存在するかどうか
}

// ─── Windows Settings Commands ───────────────────────────────────────────────────

#[tauri::command]
pub fn get_win_settings() -> Result<Vec<WinSetting>, AppError> {
    let backup = load_backup()?;

    let mut settings = vec![
        WinSetting {
            id: "power_plan".to_string(),
            label: "高パフォーマンス電源プラン".to_string(),
            description: "システムを高パフォーマンスモードに設定".to_string(),
            is_optimized: backup.contains_key("power_plan"),
            can_revert: backup.contains_key("power_plan"),
        },
        WinSetting {
            id: "game_mode".to_string(),
            label: "ゲームモード".to_string(),
            description: "Windowsゲームモードを有効化".to_string(),
            is_optimized: backup.contains_key("game_mode"),
            can_revert: backup.contains_key("game_mode"),
        },
        WinSetting {
            id: "game_dvr".to_string(),
            label: "ゲームDVR無効化".to_string(),
            description: "ゲーム録画機能を無効化してパフォーマンス向上".to_string(),
            is_optimized: backup.contains_key("game_dvr"),
            can_revert: backup.contains_key("game_dvr"),
        },
        WinSetting {
            id: "mouse_acceleration".to_string(),
            label: "マウス加速無効化".to_string(),
            description: "マウスポインターの加速を無効化".to_string(),
            is_optimized: backup.contains_key("mouse_acceleration"),
            can_revert: backup.contains_key("mouse_acceleration"),
        },
        WinSetting {
            id: "visual_effects".to_string(),
            label: "視覚効果最適化".to_string(),
            description: "パフォーマンス重視の視覚効果設定".to_string(),
            is_optimized: backup.contains_key("visual_effects"),
            can_revert: backup.contains_key("visual_effects"),
        },
    ];

    // Check current system state for non-backup settings
    // findstr returns exit code 1 when no match found — use unwrap_or_default to avoid propagating
    let power_plan_check =
        run_powershell("powercfg /getactivescheme | findstr /C:\"High performance\"")
            .unwrap_or_default();
    if power_plan_check.contains("High performance") {
        if let Some(setting) = settings.iter_mut().find(|s| s.id == "power_plan") {
            setting.is_optimized = true;
        }
    }

    Ok(settings)
}

#[tauri::command]
pub fn apply_win_setting(id: &str) -> Result<(), AppError> {
    let mut backup = load_backup()?;

    match id {
        "power_plan" => {
            // Backup current power plan — store GUID only
            let current_plan_output = run_powershell("powercfg /getactivescheme")?;
            let guid = current_plan_output
                .split_whitespace()
                .find(|s| s.len() == 36 && s.chars().filter(|&c| c == '-').count() == 4)
                .unwrap_or("SCHEME_BALANCED")
                .to_string();
            backup.insert("power_plan".to_string(), guid);

            // Set high performance
            run_powershell("powercfg /setactive SCHEME_MIN")?;
        }
        "game_mode" => {
            // Backup current game mode setting
            let current_value = run_powershell(
                "Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty AllowAutoGameMode",
            )?;
            backup.insert("game_mode".to_string(), current_value);

            // Enable game mode
            run_powershell(
                "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -Value 1 -Type DWord -Force",
            )?;
        }
        "game_dvr" => {
            // Backup current game DVR setting
            let current_value = run_powershell(
                "Get-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty GameDVR_Enabled",
            )?;
            backup.insert("game_dvr".to_string(), current_value);

            // Disable game DVR
            run_powershell(
                "Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value 0 -Type DWord -Force",
            )?;
            // HKLM requires admin — best-effort, ignore failure
            let _ = run_powershell(
                "if (-not (Test-Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR')) { New-Item -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR' -Force | Out-Null }; Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR' -Name 'AllowGameDVR' -Value 0 -Type DWord -Force",
            );
        }
        "mouse_acceleration" => {
            // Backup current mouse settings
            let current_value = run_powershell(
                "Get-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MouseSpeed",
            )?;
            backup.insert("mouse_acceleration".to_string(), current_value);

            // Disable mouse acceleration
            run_powershell(
                "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value 0 -Type String -Force; Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1' -Value 0 -Type String -Force; Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2' -Value 0 -Type String -Force",
            )?;
        }
        "visual_effects" => {
            // Backup current visual effects setting
            let current_value = run_powershell(
                "Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty VisualFXSetting",
            )?;
            backup.insert("visual_effects".to_string(), current_value);

            // Set performance mode
            run_powershell(
                "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -Value 2 -Type DWord -Force",
            )?;
        }
        _ => {
            return Err(AppError::Command(format!(
                "Unknown Windows setting: {}",
                id
            )));
        }
    }

    save_backup(&backup)?;
    Ok(())
}

#[tauri::command]
pub fn revert_win_setting(id: &str) -> Result<(), AppError> {
    let mut backup = load_backup()?;

    if let Some(original_value) = backup.remove(id) {
        match id {
            "power_plan" => {
                // Extract GUID from stored value (handles both "GUID-only" and full powercfg output)
                let guid = original_value
                    .split_whitespace()
                    .find(|s| s.len() == 36 && s.chars().filter(|&c| c == '-').count() == 4)
                    .unwrap_or("SCHEME_BALANCED");
                let validated_guid = validate_guid(guid)?;
                run_powershell(&format!("powercfg /setactive {}", validated_guid))?;
            }
            "game_mode" => {
                // Restore original game mode setting
                let value = validate_u32_value(&original_value)?;
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            "game_dvr" => {
                // Restore original game DVR setting
                let value = validate_u32_value(&original_value)?;
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            "mouse_acceleration" => {
                // Restore original mouse settings
                let value = validate_mouse_speed(&original_value)?;
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value '{}' -Type String -Force",
                    value
                ))?;
            }
            "visual_effects" => {
                // Restore original visual effects setting
                let value = validate_u32_value(&original_value)?;
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            _ => {
                return Err(AppError::Command(format!(
                    "Unknown Windows setting: {}",
                    id
                )));
            }
        }

        save_backup(&backup)?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_win_setting_serialization() {
        let setting = WinSetting {
            id: "test".to_string(),
            label: "Test Setting".to_string(),
            description: "Test Description".to_string(),
            is_optimized: false,
            can_revert: false,
        };

        // Test serialization
        let json = serde_json::to_string(&setting).unwrap();
        assert!(json.contains("test"));
        assert!(json.contains("Test Setting"));

        // Test deserialization
        let deserialized: WinSetting = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, setting.id);
        assert_eq!(deserialized.label, setting.label);
    }
}
