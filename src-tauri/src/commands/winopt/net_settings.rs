//! ネットワーク設定の取得・適用・リバートコマンド

use crate::error::AppError;

use super::backup::{load_backup, run_powershell, save_backup};
use super::win_settings::WinSetting;

// ─── Constants ───────────────────────────────────────────────────────────────

const NETWORK_THROTTLE_DISABLED: u32 = 0xFFFF_FFFF;

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
