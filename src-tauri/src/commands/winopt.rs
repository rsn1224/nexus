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

// ─── Backup Management ─────────────────────────────────────────────────────────

fn backup_path() -> Result<PathBuf, AppError> {
    let appdata = std::env::var("APPDATA")
        .map_err(|e| AppError::Command(format!("APPDATA not found: {e}")))?;
    let dir = PathBuf::from(appdata).join("nexus");
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("winopt_backup.json"))
}

fn load_backup() -> HashMap<String, String> {
    backup_path()
        .ok()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_backup(backup: &HashMap<String, String>) -> Result<(), AppError> {
    let json = serde_json::to_string_pretty(backup)?;
    std::fs::write(backup_path()?, json)?;
    Ok(())
}

// ─── PowerShell Helper ─────────────────────────────────────────────────────────

fn ps(cmd: &str) -> Result<String, AppError> {
    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", cmd])
        .output()
        .map_err(|e| AppError::Command(e.to_string()))?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

// ─── Windows Settings Commands ──────────────────────────────────────────────────

/// Windows設定の現在状態を一覧取得する
#[tauri::command]
pub fn get_win_settings() -> Result<Vec<WinSetting>, AppError> {
    info!("get_win_settings: reading current system settings");
    let backup = load_backup();
    let mut settings = Vec::new();

    // 1. power_plan
    let scheme_out = ps("powercfg /getactivescheme").unwrap_or_default();
    settings.push(WinSetting {
        id: "power_plan".to_string(),
        label: "電源プラン: 高パフォーマンス".to_string(),
        description: "CPU クロックを最大に固定してゲームパフォーマンスを向上".to_string(),
        is_optimized: scheme_out.to_lowercase().contains("8c5e7fda"),
        can_revert: backup.contains_key("power_plan"),
    });

    // 2. game_mode
    let gm = ps("Get-ItemPropertyValue -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -ErrorAction SilentlyContinue")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "game_mode".to_string(),
        label: "ゲームモード: ON".to_string(),
        description: "バックグラウンドアプリを制限してゲームに CPU を優先配分".to_string(),
        is_optimized: gm.trim() == "1",
        can_revert: backup.contains_key("game_mode"),
    });

    // 3. game_dvr
    let dvr = ps("Get-ItemPropertyValue -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -ErrorAction SilentlyContinue")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "game_dvr".to_string(),
        label: "Xbox Game Bar: 無効".to_string(),
        description: "ゲームオーバーレイとキャプチャ機能を無効化してリソースを解放".to_string(),
        is_optimized: dvr.trim() == "0",
        can_revert: backup.contains_key("game_dvr"),
    });

    // 4. mouse_accel
    let ms = ps("Get-ItemPropertyValue -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed'")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "mouse_accel".to_string(),
        label: "マウス加速: OFF".to_string(),
        description: "マウス加速を無効化してエイム精度を向上".to_string(),
        is_optimized: ms.trim() == "0",
        can_revert: backup.contains_key("mouse_speed"),
    });

    // 5. visual_fx
    let vfx = ps("Get-ItemPropertyValue -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -ErrorAction SilentlyContinue")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "visual_fx".to_string(),
        label: "視覚効果: 最小化".to_string(),
        description: "ウィンドウアニメーション等を無効化して CPU・GPU 負荷を削減".to_string(),
        is_optimized: vfx.trim() == "2",
        can_revert: backup.contains_key("visual_fx"),
    });

    info!(count = settings.len(), "get_win_settings: done");
    Ok(settings)
}

/// Windows設定を適用する（バックアップ後に最適化値を設定）
#[tauri::command]
pub fn apply_win_setting(id: String) -> Result<(), AppError> {
    info!(id = %id, "apply_win_setting");
    let mut backup = load_backup();

    match id.as_str() {
        "power_plan" => {
            let current = ps("powercfg /getactivescheme")?;
            // GUID を抽出: "電源スキーム GUID: xxxxxxxx-xxxx-..." → GUID部分だけ取得
            if let Some(guid) = current.split_whitespace()
                .find(|s| s.len() == 36 && s.contains('-')) {
                backup.insert("power_plan".to_string(), guid.to_string());
            }
            ps("powercfg /setactive scheme_min")?;
        }
        "game_mode" => {
            let v = ps("Get-ItemPropertyValue -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -ErrorAction SilentlyContinue").unwrap_or_else(|_| "0".to_string());
            backup.insert("game_mode".to_string(), v);
            ps("Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -Value 1 -Type DWord -Force")?;
        }
        "game_dvr" => {
            let v = ps("Get-ItemPropertyValue -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -ErrorAction SilentlyContinue").unwrap_or_else(|_| "1".to_string());
            backup.insert("game_dvr".to_string(), v);
            ps("Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value 0 -Type DWord -Force")?;
        }
        "mouse_accel" => {
            let sp = ps("Get-ItemPropertyValue -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed'").unwrap_or_else(|_| "1".to_string());
            let t1 = ps("Get-ItemPropertyValue -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1'").unwrap_or_else(|_| "6".to_string());
            let t2 = ps("Get-ItemPropertyValue -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2'").unwrap_or_else(|_| "10".to_string());
            backup.insert("mouse_speed".to_string(), sp);
            backup.insert("mouse_threshold1".to_string(), t1);
            backup.insert("mouse_threshold2".to_string(), t2);
            ps("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value '0'")?;
            ps("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1' -Value '0'")?;
            ps("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2' -Value '0'")?;
        }
        "visual_fx" => {
            let v = ps("Get-ItemPropertyValue -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -ErrorAction SilentlyContinue").unwrap_or_else(|_| "0".to_string());
            backup.insert("visual_fx".to_string(), v);
            ps("Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -Value 2 -Type DWord -Force")?;
        }
        _ => return Err(AppError::InvalidInput(format!("Unknown setting: {id}"))),
    }

    save_backup(&backup)?;
    info!(id = %id, "apply_win_setting: done");
    Ok(())
}

/// Windows設定を元に戻す
#[tauri::command]
pub fn revert_win_setting(id: String) -> Result<(), AppError> {
    info!(id = %id, "revert_win_setting");
    let mut backup = load_backup();

    match id.as_str() {
        "power_plan" => {
            let guid = backup.remove("power_plan")
                .ok_or_else(|| AppError::NotFound("power_plan backup not found".to_string()))?;
            ps(&format!("powercfg /setactive {guid}"))?;
        }
        "game_mode" => {
            let v = backup.remove("game_mode").unwrap_or_else(|| "0".to_string());
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -Value {v} -Type DWord -Force"))?;
        }
        "game_dvr" => {
            let v = backup.remove("game_dvr").unwrap_or_else(|| "1".to_string());
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value {v} -Type DWord -Force"))?;
        }
        "mouse_accel" => {
            let sp = backup.remove("mouse_speed").unwrap_or_else(|| "1".to_string());
            let t1 = backup.remove("mouse_threshold1").unwrap_or_else(|| "6".to_string());
            let t2 = backup.remove("mouse_threshold2").unwrap_or_else(|| "10".to_string());
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value '{sp}'"))?;
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1' -Value '{t1}'"))?;
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2' -Value '{t2}'"))?;
        }
        "visual_fx" => {
            let v = backup.remove("visual_fx").unwrap_or_else(|| "0".to_string());
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -Value {v} -Type DWord -Force"))?;
        }
        _ => return Err(AppError::InvalidInput(format!("Unknown setting: {id}"))),
    }

    save_backup(&backup)?;
    info!(id = %id, "revert_win_setting: done");
    Ok(())
}

// ─── Network Settings Commands ─────────────────────────────────────────────────

/// ネット最適化設定の現在状態を取得
#[tauri::command]
pub fn get_net_settings() -> Result<Vec<WinSetting>, AppError> {
    info!("get_net_settings");
    let backup = load_backup();
    let mut settings = Vec::new();

    // 1. dns_cloudflare（DNS変更: Cloudflare 1.1.1.1）
    // 現在のDNSを確認（プライマリが 1.1.1.1 なら最適化済み）
    let dns_out = ps("Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses -ne $null} | Select-Object -First 1 -ExpandProperty ServerAddresses")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "dns_cloudflare".to_string(),
        label: "DNS: Cloudflare (1.1.1.1)".to_string(),
        description: "高速・プライバシー重視のDNSに切り替えてレイテンシを削減".to_string(),
        is_optimized: dns_out.contains("1.1.1.1"),
        can_revert: backup.contains_key("dns_adapter"),
    });

    // 2. net_throttling（ネットワークスロットリング解除）
    let throttle = ps("Get-ItemPropertyValue -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -ErrorAction SilentlyContinue")
        .unwrap_or_default();
    let throttle_val: u64 = throttle.trim().parse().unwrap_or(10);
    settings.push(WinSetting {
        id: "net_throttling".to_string(),
        label: "ネットワーク優先度: ゲーム最適化".to_string(),
        description: "Windowsのネットワークスロットリングを解除してゲームトラフィックを優先".to_string(),
        is_optimized: throttle_val == 4294967295,
        can_revert: backup.contains_key("net_throttling"),
    });

    // 3. nagle（Nagleアルゴリズム無効）
    // Nagle は NIC ごとの設定のため、"適用済み" フラグはバックアップ存在で判定
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

/// DNSキャッシュをクリアする（revert不要の単発操作）
#[tauri::command]
pub fn flush_dns_cache() -> Result<String, AppError> {
    info!("flush_dns_cache");
    let out = ps("ipconfig /flushdns")?;
    info!("flush_dns_cache: done");
    Ok(out)
}

/// ネット最適化設定を適用する
#[tauri::command]
pub fn apply_net_setting(id: String) -> Result<(), AppError> {
    info!(id = %id, "apply_net_setting");
    let mut backup = load_backup();

    match id.as_str() {
        "dns_cloudflare" => {
            // アクティブなアダプター名を取得
            let adapter = ps("Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Select-Object -First 1 -ExpandProperty Name")
                .unwrap_or_default();
            if adapter.is_empty() {
                return Err(AppError::Command("Active network adapter not found".to_string()));
            }
            // 現在のDNSをバックアップ
            let current_dns = ps(&format!(
                "Get-DnsClientServerAddress -InterfaceAlias '{adapter}' -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses | Join-String -Separator ','"
            )).unwrap_or_default();
            backup.insert("dns_adapter".to_string(), adapter.clone());
            backup.insert("dns_original".to_string(), current_dns);
            // Cloudflare に変更
            ps(&format!(
                "Set-DnsClientServerAddress -InterfaceAlias '{adapter}' -ServerAddresses ('1.1.1.1','1.0.0.1')"
            ))?;
        }
        "net_throttling" => {
            let v = ps("Get-ItemPropertyValue -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -ErrorAction SilentlyContinue")
                .unwrap_or_else(|_| "10".to_string());
            backup.insert("net_throttling".to_string(), v);
            ps("Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value 4294967295 -Type DWord -Force")?;
        }
        "nagle" => {
            // 全NICインターフェースに TcpAckFrequency=1, TCPNoDelay=1 を設定
            let script = r#"
                $interfaces = Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\*'
                foreach ($iface in $interfaces) {
                    $path = $iface.PSPath
                    Set-ItemProperty -Path $path -Name 'TcpAckFrequency' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
                    Set-ItemProperty -Path $path -Name 'TCPNoDelay' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
                }
            "#;
            ps(script)?;
            backup.insert("nagle_applied".to_string(), "1".to_string());
        }
        _ => return Err(AppError::InvalidInput(format!("Unknown setting: {id}"))),
    }

    save_backup(&backup)?;
    info!(id = %id, "apply_net_setting: done");
    Ok(())
}

/// ネット最適化設定を元に戻す
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
                // DHCP に戻す
                ps(&format!("Set-DnsClientServerAddress -InterfaceAlias '{adapter}' -ResetServerAddresses"))?;
            } else {
                let servers = original.split(',')
                    .map(|s| format!("'{}'", s.trim()))
                    .collect::<Vec<_>>()
                    .join(",");
                ps(&format!("Set-DnsClientServerAddress -InterfaceAlias '{adapter}' -ServerAddresses ({servers})"))?;
            }
        }
        "net_throttling" => {
            let v: u64 = backup.remove("net_throttling")
                .and_then(|s| s.parse().ok())
                .unwrap_or(10);
            ps(&format!("Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value {v} -Type DWord -Force"))?;
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
            ps(script)?;
            backup.remove("nagle_applied");
        }
        _ => return Err(AppError::InvalidInput(format!("Unknown setting: {id}"))),
    }

    save_backup(&backup)?;
    info!(id = %id, "revert_net_setting: done");
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
            is_optimized: true,
            can_revert: false,
        };

        let json = serde_json::to_string(&setting).unwrap();
        let deserialized: WinSetting = serde_json::from_str(&json).unwrap();

        assert_eq!(setting.id, deserialized.id);
        assert_eq!(setting.label, deserialized.label);
        assert_eq!(setting.description, deserialized.description);
        assert_eq!(setting.is_optimized, deserialized.is_optimized);
        assert_eq!(setting.can_revert, deserialized.can_revert);
    }
}
