use crate::error::AppError;
use super::winopt_win::{WinSetting, load_backup, save_backup, ps};
use tracing::info;

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_net_settings() -> Result<Vec<WinSetting>, AppError> {
    info!("get_net_settings");
    let backup = load_backup();
    let mut settings = Vec::new();

    // 1. dns_cloudflare
    let dns_out = ps("Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses -ne $null} | Select-Object -First 1 -ExpandProperty ServerAddresses")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "dns_cloudflare".to_string(),
        label: "DNS: Cloudflare (1.1.1.1)".to_string(),
        description: "高速・プライバシー重視のDNSに切り替えてレイテンシを削減".to_string(),
        is_optimized: dns_out.contains("1.1.1.1"),
        can_revert: backup.contains_key("dns_adapter"),
    });

    // 2. net_throttling
    let throttle = ps("Get-ItemPropertyValue -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -ErrorAction SilentlyContinue")
        .unwrap_or_default();
    let throttle_val: u64 = throttle.trim().parse().unwrap_or(10);
    settings.push(WinSetting {
        id: "net_throttling".to_string(),
        label: "ネットワーク優先度: ゲーム最適化".to_string(),
        description: "Windowsのネットワークスロットリングを解除してゲームトラフィックを優先".to_string(),
        is_optimized: throttle_val == 0xFFFF_FFFF,
        can_revert: backup.contains_key("net_throttling"),
    });

    // 3. nagle
    settings.push(WinSetting {
        id: "nagle".to_string(),
        label: "Nagleアルゴリズム: 無効".to_string(),
        description: "TCPパケット遅延を排除してゲームの応答速度を向上 (TcpNoDelay)".to_string(),
        is_optimized: backup.contains_key("nagle_applied"),
        can_revert: backup.contains_key("nagle_applied"),
    });

    info!(count = settings.len(), "get_net_settings: done");
    Ok(settings)
}

#[tauri::command]
pub fn flush_dns_cache() -> Result<String, AppError> {
    info!("flush_dns_cache");
    let out = ps("ipconfig /flushdns")?;
    info!("flush_dns_cache: done");
    Ok(out)
}

#[tauri::command]
pub fn apply_net_setting(id: String) -> Result<(), AppError> {
    info!(id = %id, "apply_net_setting");
    let mut backup = load_backup();

    match id.as_str() {
        "dns_cloudflare" => {
            let adapter = ps("Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Select-Object -First 1 -ExpandProperty Name")
                .unwrap_or_default();
            if adapter.is_empty() {
                return Err(AppError::Command("Active network adapter not found".to_string()));
            }
            let current_dns = ps(&format!(
                "Get-DnsClientServerAddress -InterfaceAlias '{adapter}' -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses | Join-String -Separator ','"
            )).unwrap_or_default();
            backup.insert("dns_adapter".to_string(), adapter.clone());
            backup.insert("dns_original".to_string(), current_dns);
            ps(&format!(
                "Set-DnsClientServerAddress -InterfaceAlias '{adapter}' -ServerAddresses ('1.1.1.1','1.0.0.1')"
            ))?;
        }
        "net_throttling" => {
            let v = ps("Get-ItemPropertyValue -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -ErrorAction SilentlyContinue")
                .unwrap_or_else(|_| "10".to_string());
            backup.insert("net_throttling".to_string(), v);
            // 0xFFFFFFFF = 4294967295 (u32::MAX) — PowerShell に10進数で渡す
            ps("Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value 4294967295 -Type DWord -Force")
                .map_err(|_| AppError::Command("管理者権限が必要です".to_string()))?;
        }
        "nagle" => {
            let script = r#"
                $interfaces = Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\*'
                foreach ($iface in $interfaces) {
                    $path = $iface.PSPath
                    Set-ItemProperty -Path $path -Name 'TcpAckFrequency' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
                    Set-ItemProperty -Path $path -Name 'TCPNoDelay' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
                }
            "#;
            ps(script).map_err(|_| AppError::Command("管理者権限が必要です".to_string()))?;
            backup.insert("nagle_applied".to_string(), "1".to_string());
        }
        _ => return Err(AppError::InvalidInput(format!("Unknown setting: {id}"))),
    }

    save_backup(&backup)?;
    info!(id = %id, "apply_net_setting: done");
    Ok(())
}

#[tauri::command]
pub fn revert_net_setting(id: String) -> Result<(), AppError> {
    info!(id = %id, "revert_net_setting");
    let mut backup = load_backup();

    match id.as_str() {
        "dns_cloudflare" => {
            let adapter = backup.remove("dns_adapter")
                .ok_or_else(|| AppError::NotFound("dns_adapter backup not found".to_string()))?;
            let original = backup.remove("dns_original").unwrap_or_default();
            if original.is_empty() {
                ps(&format!("Set-DnsClientServerAddress -InterfaceAlias '{adapter}' -ResetServerAddresses"))?;
            } else {
                let servers = original
                    .split(',')
                    .map(|s| format!("'{}'", s.trim()))
                    .collect::<Vec<_>>()
                    .join(",");
                ps(&format!("Set-DnsClientServerAddress -InterfaceAlias '{adapter}' -ServerAddresses ({servers})"))?;
            }
        }
        "net_throttling" => {
            let v: u64 = backup
                .remove("net_throttling")
                .and_then(|s| s.parse().ok())
                .unwrap_or(10);
            ps(&format!("Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value {v} -Type DWord -Force"))
                .map_err(|_| AppError::Command("管理者権限が必要です".to_string()))?;
        }
        "nagle" => {
            let script = r#"
                $interfaces = Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\*'
                foreach ($iface in $interfaces) {
                    $path = $iface.PSPath
                    Remove-ItemProperty -Path $path -Name 'TcpAckFrequency' -ErrorAction SilentlyContinue
                    Remove-ItemProperty -Path $path -Name 'TCPNoDelay' -ErrorAction SilentlyContinue
                }
            "#;
            ps(script).map_err(|_| AppError::Command("管理者権限が必要です".to_string()))?;
            backup.remove("nagle_applied");
        }
        _ => return Err(AppError::InvalidInput(format!("Unknown setting: {id}"))),
    }

    save_backup(&backup)?;
    info!(id = %id, "revert_net_setting: done");
    Ok(())
}
