use std::process::Command;
use tracing::info;

use crate::error::AppError;

use super::types::{decode_output, validate_adapter_name, validate_ipv4, NetworkAdapter};

#[tauri::command]
pub async fn get_network_adapters() -> Result<Vec<NetworkAdapter>, AppError> {
    info!("get_network_adapters: fetching network adapters");

    tokio::task::spawn_blocking(|| {
        let output = Command::new("ipconfig")
            .arg("/all")
            .output()
            .map_err(|e| AppError::Command(format!("Failed to execute ipconfig: {}", e)))?;

        if !output.status.success() {
            let stderr = decode_output(&output.stderr);
            return Err(AppError::Command(format!("Ipconfig failed: {}", stderr)));
        }

        let stdout = decode_output(&output.stdout);
        let mut adapters = Vec::new();
        let mut current_adapter = NetworkAdapter {
            name: String::new(),
            ip: String::new(),
            mac: String::new(),
            is_connected: false,
        };

        for line in stdout.lines() {
            let trimmed = line.trim();

            if trimmed.contains(" adapter ") && trimmed.ends_with(':') {
                if !current_adapter.name.is_empty() {
                    adapters.push(current_adapter.clone());
                }
                let name = trimmed.trim_end_matches(':');
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
            } else if trimmed.starts_with("IPv4 Address. . . . . . . . . . . :") {
                if let Some(ip_part) = trimmed.split(':').nth(1) {
                    let ip = ip_part.trim().trim_end_matches("(Preferred)");
                    if !ip.is_empty() {
                        current_adapter.ip = ip.to_string();
                        current_adapter.is_connected = true;
                    }
                }
            } else if trimmed.starts_with("Physical Address. . . . . . . . . :") {
                if let Some(mac_part) = trimmed.split(':').nth(1) {
                    let mac = mac_part.trim();
                    if !mac.is_empty() {
                        current_adapter.mac = mac.to_string();
                    }
                }
            }
        }

        if !current_adapter.name.is_empty() {
            adapters.push(current_adapter);
        }

        let connected_adapters: Vec<NetworkAdapter> = adapters
            .into_iter()
            .filter(|adapter| adapter.is_connected && !adapter.ip.is_empty())
            .collect();

        info!(
            "get_network_adapters: found {} connected adapters",
            connected_adapters.len()
        );
        Ok(connected_adapters)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn get_current_dns() -> Result<Vec<String>, AppError> {
    info!("get_current_dns: fetching current DNS servers");

    tokio::task::spawn_blocking(|| {
        let output = Command::new("netsh")
            .args(["interface", "ip", "show", "dns"])
            .output()
            .map_err(|e| AppError::Command(format!("Failed to execute netsh: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Command(format!("Netsh failed: {}", stderr)));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut dns_servers = Vec::new();

        for line in stdout.lines() {
            let trimmed = line.trim();
            if trimmed.contains("DNS servers") || trimmed.contains("DNS サーバー") {
                if let Some(servers_part) = trimmed.split(':').nth(1) {
                    let servers = servers_part.trim();
                    if !servers.is_empty() && servers != "None" {
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
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn set_dns(adapter: String, primary: String, secondary: String) -> Result<(), AppError> {
    validate_adapter_name(&adapter)?;
    validate_ipv4(&primary)?;
    if !secondary.trim().is_empty() {
        validate_ipv4(&secondary)?;
    }

    info!(
        "set_dns: setting DNS for adapter {}: {}, {}",
        adapter, primary, secondary
    );

    tokio::task::spawn_blocking(move || {
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
            .map_err(|e| AppError::Command(format!("Failed to set primary DNS: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Command(format!(
                "Failed to set primary DNS: {}",
                stderr
            )));
        }

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
                .map_err(|e| AppError::Command(format!("Failed to set secondary DNS: {}", e)))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(AppError::Command(format!(
                    "Failed to set secondary DNS: {}",
                    stderr
                )));
            }
        }

        info!("set_dns: DNS settings applied successfully");
        Ok(())
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn ping_host(target: String) -> Result<super::types::PingResult, AppError> {
    super::types::validate_ping_target(&target)?;
    info!("ping_host: pinging {}", target);

    tokio::task::spawn_blocking(move || {
        let output = Command::new("ping")
            .args(["-n", "1", &target])
            .output()
            .map_err(|e| AppError::Command(format!("Failed to execute ping: {}", e)))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let success = output.status.success();

        if success {
            if let Some(latency_line) = stdout.lines().find(|line| line.contains("time=")) {
                if let Some(latency_part) = latency_line.split("time=").nth(1) {
                    if let Some(latency_str) = latency_part.split("ms").next() {
                        if let Ok(latency) = latency_str.trim().parse::<u64>() {
                            info!("ping_host: ping successful, {}ms", latency);
                            return Ok(super::types::PingResult {
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
        Ok(super::types::PingResult {
            target,
            latency_ms: None,
            success,
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}
