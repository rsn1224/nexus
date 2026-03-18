use crate::error::AppError;
use crate::infra::powershell::run_powershell as ps_run;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tracing::info;

// ─── Constants ───────────────────────────────────────────────────────────────

const NETWORK_THROTTLE_DISABLED: u32 = 0xFFFF_FFFF;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WinSetting {
    pub id: String,
    pub label: String,
    pub description: String,
    pub is_optimized: bool, // 現在最適化済みかどうか
    pub can_revert: bool,   // バックアップが存在するかどうか
}

// ─── Backup Management ────────────────────────────────────────────────────────────

fn backup_path() -> Result<PathBuf, AppError> {
    let mut path = std::env::var("LOCALAPPDATA").map_err(|_| {
        AppError::Command("Cannot get LOCALAPPDATA environment variable".to_string())
    })?;
    path.push_str("\\nexus\\winopt_backup.json");
    Ok(PathBuf::from(path))
}

fn load_backup() -> Result<HashMap<String, String>, AppError> {
    let path = backup_path()?;
    if !path.exists() {
        return Ok(HashMap::new());
    }

    let content = std::fs::read_to_string(path)
        .map_err(|e| AppError::Io(format!("Failed to read backup file: {}", e)))?;

    serde_json::from_str(&content)
        .map_err(|e| AppError::Serialization(format!("Failed to parse backup file: {}", e)))
}

fn save_backup(backup: &HashMap<String, String>) -> Result<(), AppError> {
    let path = backup_path()?;

    // Create directory if it doesn't exist
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| AppError::Io(format!("Failed to create backup directory: {}", e)))?;
    }

    let content = serde_json::to_string_pretty(backup)
        .map_err(|e| AppError::Serialization(format!("Failed to serialize backup: {}", e)))?;

    std::fs::write(path, content)
        .map_err(|e| AppError::Io(format!("Failed to write backup file: {}", e)))?;

    Ok(())
}

// ─── PowerShell Helper ────────────────────────────────────────────────────────────

fn run_powershell(command: &str) -> Result<String, AppError> {
    info!(
        "Executing PowerShell: {}",
        &command[..command.len().min(100)]
    );
    ps_run(command)
}

// ─── Validation Functions (Phase 1) ─────────────────────────────────────

/// GUIDバリデーション（8-4-4-4-12 形式）
fn validate_guid(s: &str) -> Result<&str, AppError> {
    let trimmed = s.trim();
    if trimmed.len() == 36
        && trimmed.chars().filter(|&c| c == '-').count() == 4
        && trimmed.chars().all(|c| c.is_ascii_hexdigit() || c == '-')
    {
        Ok(trimmed)
    } else {
        Err(AppError::InvalidInput(format!(
            "Invalid GUID format: {}",
            s
        )))
    }
}

/// u32数値のバリデーション（PowerShell の -Value に渡す整数値）
fn validate_u32_value(s: &str) -> Result<u32, AppError> {
    s.trim()
        .parse::<u32>()
        .map_err(|_| AppError::InvalidInput(format!("Invalid numeric value: {}", s)))
}

/// マウス速度値のバリデーション（"0" or "1" or "2"）
fn validate_mouse_speed(s: &str) -> Result<&str, AppError> {
    let trimmed = s.trim();
    match trimmed {
        "0" | "1" | "2" => Ok(trimmed),
        _ => Err(AppError::InvalidInput(format!(
            "Invalid mouse speed value: {}. Expected 0, 1, or 2",
            s
        ))),
    }
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
                let validated_guid = validate_guid(guid)?; // ← 追加
                run_powershell(&format!("powercfg /setactive {}", validated_guid))?;
            }
            "game_mode" => {
                // Restore original game mode setting
                let value = validate_u32_value(&original_value)?; // ← 追加
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            "game_dvr" => {
                // Restore original game DVR setting
                let value = validate_u32_value(&original_value)?; // ← 追加
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            "mouse_acceleration" => {
                // Restore original mouse settings
                let value = validate_mouse_speed(&original_value)?; // ← 追加
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value '{}' -Type String -Force",
                    value
                ))?;
            }
            "visual_effects" => {
                // Restore original visual effects setting
                let value = validate_u32_value(&original_value)?; // ← 追加
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

// ─── Network Settings Commands ───────────────────────────────────────────────────

#[tauri::command]
pub fn get_net_settings() -> Result<Vec<WinSetting>, AppError> {
    let backup = load_backup()?;

    let settings = vec![
        WinSetting {
            id: "dns_google".to_string(),
            label: "Google DNS (8.8.8.8)".to_string(),
            description: "DNSサーバーをGoogle Public DNSに変更".to_string(),
            is_optimized: backup.contains_key("dns_google"),
            can_revert: backup.contains_key("dns_google"),
        },
        WinSetting {
            id: "network_throttle".to_string(),
            label: "ネットワークスロットリング無効化".to_string(),
            description: "Windowsのネットワーク帯域制限を無効化".to_string(),
            is_optimized: backup.contains_key("network_throttle"),
            can_revert: backup.contains_key("network_throttle"),
        },
        WinSetting {
            id: "nagle_algorithm".to_string(),
            label: "Nagleアルゴリズム無効化".to_string(),
            description: "TCP Nagleアルゴリズムを無効化して遅延削減".to_string(),
            is_optimized: backup.contains_key("nagle_algorithm"),
            can_revert: backup.contains_key("nagle_algorithm"),
        },
    ];

    Ok(settings)
}

#[tauri::command]
pub fn flush_dns_cache() -> Result<String, AppError> {
    let result = run_powershell("ipconfig /flushdns")?;
    Ok(result)
}

#[tauri::command]
pub fn apply_net_setting(id: &str) -> Result<(), AppError> {
    let mut backup = load_backup()?;

    match id {
        "dns_google" => {
            // Backup current DNS settings (requires admin)
            let current_dns = run_powershell(
                "Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses | Out-String"
            ).map_err(|_| AppError::Command("管理者権限が必要です。nexus を管理者として実行してください。".to_string()))?;
            backup.insert("dns_google".to_string(), current_dns);

            // Set Google DNS (requires admin)
            run_powershell("Set-DnsClientServerAddress -InterfaceAlias '*' -ServerAddresses '8.8.8.8','8.8.4.4'")
            .map_err(|_| AppError::Command("管理者権限が必要です。nexus を管理者として実行してください。".to_string()))?;
        }
        "network_throttle" => {
            // Backup current throttle settings — property may not exist, use unwrap_or_default
            let current_throttle = run_powershell(
                "Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty NetworkThrottlingIndex"
            ).unwrap_or_default();
            backup.insert("network_throttle".to_string(), current_throttle);

            // Disable network throttling (requires admin)
            run_powershell(&format!(
                "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value {} -Type DWord -Force",
                NETWORK_THROTTLE_DISABLED
            )).map_err(|_| AppError::Command("管理者権限が必要です。nexus を管理者として実行してください。".to_string()))?;
        }
        "nagle_algorithm" => {
            // Backup current Nagle setting — property may not exist, use unwrap_or_default
            let current_nagle = run_powershell(
                "Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'TcpAckFrequency' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty TcpAckFrequency"
            ).unwrap_or_default();
            backup.insert("nagle_algorithm".to_string(), current_nagle);

            // Disable Nagle algorithm (requires admin)
            run_powershell(
                "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'TcpAckFrequency' -Value 1 -Type DWord -Force; Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'TCPNoDelay' -Value 1 -Type DWord -Force"
            ).map_err(|_| AppError::Command("管理者権限が必要です。nexus を管理者として実行してください。".to_string()))?;
        }
        _ => {
            return Err(AppError::Command(format!(
                "Unknown network setting: {}",
                id
            )));
        }
    }

    save_backup(&backup)?;
    Ok(())
}

#[tauri::command]
pub fn revert_net_setting(id: &str) -> Result<(), AppError> {
    let mut backup = load_backup()?;

    if let Some(original_value) = backup.remove(id) {
        match id {
            "dns_google" => {
                // Restore original DNS settings (requires admin)
                run_powershell(
                    "Set-DnsClientServerAddress -InterfaceAlias '*' -ResetServerAddresses",
                )
                .map_err(|_| {
                    AppError::Command(
                        "管理者権限が必要です。nexus を管理者として実行してください。".to_string(),
                    )
                })?;
            }
            "network_throttle" => {
                // Restore original throttle setting (requires admin)
                let value: u32 = original_value.trim().parse().unwrap_or(10);
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value {} -Type DWord -Force",
                    value
                )).map_err(|_| AppError::Command("管理者権限が必要です。nexus を管理者として実行してください。".to_string()))?;
            }
            "nagle_algorithm" => {
                // Restore original Nagle setting (requires admin)
                let value: u32 = original_value.trim().parse().unwrap_or(2);
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'TcpAckFrequency' -Value {} -Type DWord -Force",
                    value
                )).map_err(|_| AppError::Command("管理者権限が必要です。nexus を管理者として実行してください。".to_string()))?;
            }
            _ => {
                return Err(AppError::Command(format!(
                    "Unknown network setting: {}",
                    id
                )));
            }
        }

        save_backup(&backup)?;
    }

    Ok(())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

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
