use serde::{Deserialize, Serialize};
use std::process::Command;
use tracing::{info, warn};

use crate::error::AppError;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NetworkAdapter {
    pub name: String,
    pub ip: String,
    pub mac: String,
    pub is_connected: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PingResult {
    pub target: String,
    pub latency_ms: Option<u64>,
    pub success: bool,
}

#[tauri::command]
pub fn get_network_adapters() -> Result<Vec<NetworkAdapter>, AppError> {
    info!("get_network_adapters: fetching network adapters");
    
    let output = Command::new("ipconfig")
        .arg("/all")
        .output()
        .map_err(|e| {
            warn!("Failed to execute ipconfig: {}", e);
            AppError::Command(format!("Failed to execute ipconfig: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!("Ipconfig failed: {}", stderr)));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut adapters = Vec::new();
    let mut current_adapter = NetworkAdapter {
        name: String::new(),
        ip: String::new(),
        mac: String::new(),
        is_connected: false,
    };

    for line in stdout.lines() {
        let trimmed = line.trim();
        
        // アダプター名の検出
        if trimmed.contains(" adapter ") && trimmed.ends_with(':') {
            // 前のアダプターを保存（名前があれば）
            if !current_adapter.name.is_empty() {
                adapters.push(current_adapter.clone());
            }
            
            // アダプター名を取得: 末尾の ':' を除去
            let name = trimmed.trim_end_matches(':');
            // "Ethernet adapter " などのプレフィックスを除去して名前だけ取得
            let name = if let Some(pos) = name.find(" adapter ") {
                name[pos + " adapter ".len()..].trim()
            } else {
                name.trim()
            };
            current_adapter = NetworkAdapter {
                name: name.to_string(),
                ip: String::new(),
                mac: String::new(),
                is_connected: false,
            };
        }
        // IPアドレスの検出
        else if trimmed.starts_with("IPv4 Address. . . . . . . . . . . :") {
            if let Some(ip_part) = trimmed.split(':').nth(1) {
                let ip = ip_part.trim().trim_end_matches("(Preferred)");
                if !ip.is_empty() {
                    current_adapter.ip = ip.to_string();
                    current_adapter.is_connected = true;
                }
            }
        }
        // MACアドレスの検出
        else if trimmed.starts_with("Physical Address. . . . . . . . . :") {
            if let Some(mac_part) = trimmed.split(':').nth(1) {
                let mac = mac_part.trim();
                if !mac.is_empty() {
                    current_adapter.mac = mac.to_string();
                }
            }
        }
    }

    // 最後のアダプターを保存
    if !current_adapter.name.is_empty() {
        adapters.push(current_adapter);
    }

    // 接続されているアダプターのみをフィルタリング
    let connected_adapters: Vec<NetworkAdapter> = adapters
        .into_iter()
        .filter(|adapter| adapter.is_connected && !adapter.ip.is_empty())
        .collect();

    info!("get_network_adapters: found {} connected adapters", connected_adapters.len());
    Ok(connected_adapters)
}

#[tauri::command]
pub fn get_current_dns() -> Result<Vec<String>, AppError> {
    info!("get_current_dns: fetching current DNS servers");
    
    let output = Command::new("netsh")
        .args(["interface", "ip", "show", "dns"])
        .output()
        .map_err(|e| {
            warn!("Failed to execute netsh: {}", e);
            AppError::Command(format!("Failed to execute netsh: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!("Netsh failed: {}", stderr)));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut dns_servers = Vec::new();

    for line in stdout.lines() {
        let trimmed = line.trim();
        
        // DNSサーバーの検出
        if trimmed.contains("DNS servers") || trimmed.contains("DNS サーバー") {
            if let Some(servers_part) = trimmed.split(':').nth(1) {
                let servers = servers_part.trim();
                if !servers.is_empty() && servers != "None" {
                    // カンマまたはスペースで区切られた複数のDNSサーバーを処理
                    for server in servers.split(&[',', ' '][..]) {
                        let server = server.trim();
                        if !server.is_empty() {
                            dns_servers.push(server.to_string());
                        }
                    }
                }
            }
        }
    }

    info!("get_current_dns: found {} DNS servers", dns_servers.len());
    Ok(dns_servers)
}

#[tauri::command]
pub fn set_dns(adapter: String, primary: String, secondary: String) -> Result<(), AppError> {
    info!("set_dns: setting DNS for adapter {}: {}, {}", adapter, primary, secondary);
    
    // プライマリDNSを設定
    let output = Command::new("netsh")
        .args([
            "interface",
            "ip",
            "set",
            "dns",
            &adapter,
            "static",
            &primary,
            "primary",
        ])
        .output()
        .map_err(|e| {
            warn!("Failed to set primary DNS: {}", e);
            AppError::Command(format!("Failed to set primary DNS: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!("Failed to set primary DNS: {}", stderr)));
    }

    // セカンダリDNSが空でない場合のみ設定
    if !secondary.trim().is_empty() {
        let output = Command::new("netsh")
            .args([
                "interface",
                "ip",
                "add",
                "dns",
                &adapter,
                &secondary,
                "index=2",
            ])
            .output()
            .map_err(|e| {
                warn!("Failed to set secondary DNS: {}", e);
                AppError::Command(format!("Failed to set secondary DNS: {}", e))
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Command(format!("Failed to set secondary DNS: {}", stderr)));
        }
    }

    info!("set_dns: DNS settings applied successfully");
    Ok(())
}

#[tauri::command]
pub fn ping_host(target: String) -> Result<PingResult, AppError> {
    info!("ping_host: pinging {}", target);
    
    let output = Command::new("ping")
        .args(["-n", "1", &target])
        .output()
        .map_err(|e| {
            warn!("Failed to execute ping: {}", e);
            AppError::Command(format!("Failed to execute ping: {}", e))
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let success = output.status.success();

    if success {
        // レイテンシを抽出
        if let Some(latency_line) = stdout.lines().find(|line| line.contains("time=")) {
            if let Some(latency_part) = latency_line.split("time=").nth(1) {
                if let Some(latency_str) = latency_part.split("ms").next() {
                    if let Ok(latency) = latency_str.trim().parse::<u64>() {
                        info!("ping_host: ping successful, {}ms", latency);
                        return Ok(PingResult {
                            target,
                            latency_ms: Some(latency),
                            success: true,
                        });
                    }
                }
            }
        }
    }

    info!("ping_host: ping failed or timeout");
    Ok(PingResult {
        target,
        latency_ms: None,
        success,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ping_result_serialization() {
        let result = PingResult {
            target: "8.8.8.8".to_string(),
            latency_ms: Some(12),
            success: true,
        };
        
        let serialized = serde_json::to_string(&result).unwrap();
        let deserialized: PingResult = serde_json::from_str(&serialized).unwrap();
        
        assert_eq!(result.target, deserialized.target);
        assert_eq!(result.latency_ms, deserialized.latency_ms);
        assert_eq!(result.success, deserialized.success);
    }
}
