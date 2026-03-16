use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tracing::info;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WinSetting {
    pub id: String,
    pub label: String,
    pub description: String,
    pub is_optimized: bool,  // 現在最適化済みかどうか
    pub can_revert: bool,    // バックアップが存在するかどうか
}

// ─── Backup Management ────────────────────────────────────────────────────────────

fn backup_path() -> Result<PathBuf, AppError> {
    let mut path = std::env::var("LOCALAPPDATA")
        .map_err(|_| AppError::Command("Cannot get LOCALAPPDATA environment variable".to_string()))?;
    path.push_str("\\nexus\\winopt_backup.json");
    Ok(PathBuf::from(path))
}

fn load_backup() -> Result<HashMap<String, String>, AppError> {
    let path = backup_path()?;
    if !path.exists() {
        return Ok(HashMap::new());
    }
    
    let content = std::fs::read_to_string(path).map_err(|e| {
        AppError::Io(format!("Failed to read backup file: {}", e))
    })?;
    
    serde_json::from_str(&content).map_err(|e| {
        AppError::Serialization(format!("Failed to parse backup file: {}", e))
    })
}

fn save_backup(backup: &HashMap<String, String>) -> Result<(), AppError> {
    let path = backup_path()?;
    
    // Create directory if it doesn't exist
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            AppError::Io(format!("Failed to create backup directory: {}", e))
        })?;
    }
    
    let content = serde_json::to_string_pretty(backup).map_err(|e| {
        AppError::Serialization(format!("Failed to serialize backup: {}", e))
    })?;
    
    std::fs::write(path, content).map_err(|e| {
        AppError::Io(format!("Failed to write backup file: {}", e))
    })?;
    
    Ok(())
}

// ─── PowerShell Helper ────────────────────────────────────────────────────────────

fn run_powershell(command: &str) -> Result<String, AppError> {
    info!("Executing PowerShell: {}", command);
    
    let output = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            command,
        ])
        .output()
        .map_err(|e| {
            AppError::Command(format!("Failed to execute PowerShell: {}", e))
        })?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!("PowerShell failed: {}", stderr)));
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.trim().to_string())
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
    let power_plan_check = run_powershell("powercfg /getactivescheme | findstr /C:\"(High performance)\"")?;
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
            // Backup current power plan
            let current_plan = run_powershell("powercfg /getactivescheme")?;
            backup.insert("power_plan".to_string(), current_plan);
            
            // Set high performance
            run_powershell("powercfg /setactive SCHEME_MIN")?;
        }
        "game_mode" => {
            // Backup current game mode setting
            let current_value = run_powershell(
                "Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty AllowAutoGameMode"
            )?;
            backup.insert("game_mode".to_string(), current_value);
            
            // Enable game mode
            run_powershell(
                "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -Value 1 -Type DWord -Force"
            )?;
        }
        "game_dvr" => {
            // Backup current game DVR setting
            let current_value = run_powershell(
                "Get-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty GameDVR_Enabled"
            )?;
            backup.insert("game_dvr".to_string(), current_value);
            
            // Disable game DVR
            run_powershell(
                "Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value 0 -Type DWord -Force"
            )?;
            run_powershell(
                "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR' -Name 'AllowGameDVR' -Value 0 -Type DWord -Force"
            )?;
        }
        "mouse_acceleration" => {
            // Backup current mouse settings
            let current_value = run_powershell(
                "Get-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MouseSpeed"
            )?;
            backup.insert("mouse_acceleration".to_string(), current_value);
            
            // Disable mouse acceleration
            run_powershell(
                "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value 0 -Type String -Force; Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1' -Value 0 -Type String -Force; Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2' -Value 0 -Type String -Force"
            )?;
        }
        "visual_effects" => {
            // Backup current visual effects setting
            let current_value = run_powershell(
                "Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty VisualFXSetting"
            )?;
            backup.insert("visual_effects".to_string(), current_value);
            
            // Set performance mode
            run_powershell(
                "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -Value 2 -Type DWord -Force"
            )?;
        }
        _ => return Err(AppError::Command(format!("Unknown Windows setting: {}", id))),
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
                // Restore original power plan
                run_powershell(&format!("powercfg /setactive {}", original_value.trim()))?;
            }
            "game_mode" => {
                // Restore original game mode setting
                let value: u32 = original_value.trim().parse().unwrap_or(0);
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            "game_dvr" => {
                // Restore original game DVR setting
                let value: u32 = original_value.trim().parse().unwrap_or(1);
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            "mouse_acceleration" => {
                // Restore original mouse settings
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value '{}' -Type String -Force",
                    original_value.trim()
                ))?;
            }
            "visual_effects" => {
                // Restore original visual effects setting
                let value: u32 = original_value.trim().parse().unwrap_or(0);
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            _ => return Err(AppError::Command(format!("Unknown Windows setting: {}", id))),
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
            // Backup current DNS settings
            let current_dns = run_powershell(
                "Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses | Out-String"
            )?;
            backup.insert("dns_google".to_string(), current_dns);
            
            // Set Google DNS
            run_powershell("Set-DnsClientServerAddress -InterfaceAlias '*' -ServerAddresses '8.8.8.8','8.8.4.4'")?;
        }
        "network_throttle" => {
            // Backup current throttle settings
            let current_throttle = run_powershell(
                "Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty NetworkThrottlingIndex"
            )?;
            backup.insert("network_throttle".to_string(), current_throttle);
            
            // Disable network throttling
            run_powershell(
                "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value 0xFFFFFFFF -Type DWord -Force"
            )?;
        }
        "nagle_algorithm" => {
            // Backup current Nagle setting
            let current_nagle = run_powershell(
                "Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'TcpAckFrequency' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty TcpAckFrequency"
            )?;
            backup.insert("nagle_algorithm".to_string(), current_nagle);
            
            // Disable Nagle algorithm
            run_powershell(
                "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'TcpAckFrequency' -Value 1 -Type DWord -Force; Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'TCPNoDelay' -Value 1 -Type DWord -Force"
            )?;
        }
        _ => return Err(AppError::Command(format!("Unknown network setting: {}", id))),
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
                // Restore original DNS settings
                run_powershell("Set-DnsClientServerAddress -InterfaceAlias '*' -ResetServerAddresses")?;
            }
            "network_throttle" => {
                // Restore original throttle setting
                let value: u32 = original_value.trim().parse().unwrap_or(10);
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            "nagle_algorithm" => {
                // Restore original Nagle setting
                let value: u32 = original_value.trim().parse().unwrap_or(2);
                run_powershell(&format!(
                    "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters' -Name 'TcpAckFrequency' -Value {} -Type DWord -Force",
                    value
                ))?;
            }
            _ => return Err(AppError::Command(format!("Unknown network setting: {}", id))),
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
}
