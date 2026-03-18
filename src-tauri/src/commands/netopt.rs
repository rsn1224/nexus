use serde::{Deserialize, Serialize};
use std::net::Ipv4Addr;
use std::process::Command;
use tracing::{info, warn};

use crate::error::AppError;
use crate::services::{network_tuning, network_monitor};

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

// ─── Validation Functions (Phase 1) ─────────────────────────────────────

/// IPv4アドレスのバリデーション
fn validate_ipv4(ip: &str) -> Result<(), AppError> {
    ip.parse::<Ipv4Addr>()
        .map_err(|_| AppError::InvalidInput(format!("Invalid IPv4 address: {}", ip)))?;
    Ok(())
}

/// ネットワークアダプタ名のバリデーション（危険文字の排除）
fn validate_adapter_name(name: &str) -> Result<(), AppError> {
    if name.is_empty() || name.len() > 256 {
        return Err(AppError::InvalidInput(
            "Adapter name must be 1-256 characters".into(),
        ));
    }
    // シェルメタ文字を拒否
    if name.chars().any(|c| {
        matches!(
            c,
            ';' | '|' | '&' | '`' | '$' | '<' | '>' | '"' | '\'' | '\\'
        )
    }) {
        return Err(AppError::InvalidInput(format!(
            "Adapter name contains forbidden characters: {}",
            name
        )));
    }
    Ok(())
}

/// ping対象のバリデーション（IP or ホスト名）
fn validate_ping_target(target: &str) -> Result<(), AppError> {
    if target.is_empty() || target.len() > 253 {
        return Err(AppError::InvalidInput(
            "Target must be 1-253 characters".into(),
        ));
    }
    // IPアドレスとして有効 OR ホスト名として有効
    if target.parse::<Ipv4Addr>().is_ok() {
        return Ok(());
    }
    // ホスト名: 英数字, ハイフン, ドットのみ
    if target
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '.')
    {
        return Ok(());
    }
    Err(AppError::InvalidInput(format!(
        "Invalid ping target: {}. Only IP addresses or hostnames (alphanumeric, '-', '.') are allowed",
        target
    )))
}

#[tauri::command]
pub fn get_network_adapters() -> Result<Vec<NetworkAdapter>, AppError> {
    info!("get_network_adapters: fetching network adapters");

    let output = Command::new("ipconfig").arg("/all").output().map_err(|e| {
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

    info!(
        "get_network_adapters: found {} connected adapters",
        connected_adapters.len()
    );
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
    // ── バリデーション（Phase 1 追加）──
    validate_adapter_name(&adapter)?;
    validate_ipv4(&primary)?;
    if !secondary.trim().is_empty() {
        validate_ipv4(&secondary)?;
    }

    info!(
        "set_dns: setting DNS for adapter {}: {}, {}",
        adapter, primary, secondary
    );

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
        return Err(AppError::Command(format!(
            "Failed to set primary DNS: {}",
            stderr
        )));
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
            return Err(AppError::Command(format!(
                "Failed to set secondary DNS: {}",
                stderr
            )));
        }
    }

    info!("set_dns: DNS settings applied successfully");
    Ok(())
}

#[tauri::command]
pub fn ping_host(target: String) -> Result<PingResult, AppError> {
    validate_ping_target(&target)?; // ← 追加
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

// ─── TCP Tuning Commands (Phase δ-2) ─────────────────────────────────────

#[tauri::command]
pub fn get_tcp_tuning_state() -> Result<network_tuning::TcpTuningState, AppError> {
    info!("get_tcp_tuning_state: fetching current TCP tuning state");
    network_tuning::get_tcp_tuning_state()
}

#[tauri::command]
pub fn set_nagle_disabled(disabled: bool) -> Result<(), AppError> {
    info!("set_nagle_disabled: {}", disabled);
    network_tuning::set_nagle(disabled)
}

#[tauri::command]
pub fn set_delayed_ack_disabled(disabled: bool) -> Result<(), AppError> {
    info!("set_delayed_ack_disabled: {}", disabled);
    network_tuning::set_delayed_ack(disabled)
}

#[tauri::command]
pub fn set_network_throttling(index: i32) -> Result<(), AppError> {
    info!("set_network_throttling: {}", index);
    network_tuning::set_network_throttling(index)
}

#[tauri::command]
pub fn set_qos_reserved_bandwidth(percent: u32) -> Result<(), AppError> {
    info!("set_qos_reserved_bandwidth: {}%", percent);
    network_tuning::set_qos_reserved_bandwidth(percent)
}

#[tauri::command]
pub fn set_tcp_auto_tuning(level: String) -> Result<(), AppError> {
    info!("set_tcp_auto_tuning: {}", level);
    let tuning_level = match level.as_str() {
        "normal" => network_tuning::TcpAutoTuningLevel::Normal,
        "disabled" => network_tuning::TcpAutoTuningLevel::Disabled,
        "highlyRestricted" => network_tuning::TcpAutoTuningLevel::HighlyRestricted,
        "restricted" => network_tuning::TcpAutoTuningLevel::Restricted,
        "experimental" => network_tuning::TcpAutoTuningLevel::Experimental,
        _ => return Err(AppError::InvalidInput(
            "Invalid TCP auto-tuning level".into(),
        )),
    };
    network_tuning::set_tcp_auto_tuning(tuning_level)
}

#[tauri::command]
pub fn apply_gaming_network_preset() -> Result<network_tuning::TcpTuningState, AppError> {
    info!("apply_gaming_network_preset: applying gaming preset");
    network_tuning::apply_gaming_preset()
}

#[tauri::command]
pub fn reset_network_defaults() -> Result<network_tuning::TcpTuningState, AppError> {
    info!("reset_network_defaults: resetting to defaults");
    network_tuning::reset_to_defaults()
}

// ─── Network Quality Commands (Phase δ-2) ─────────────────────────────

#[tauri::command]
pub fn measure_network_quality(target: String, count: u32) -> Result<network_monitor::NetworkQualitySnapshot, AppError> {
    info!("measure_network_quality: target={}, count={}", target, count);
    network_monitor::measure_network_quality(&target, count)
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

    // --- set_dns バリデーション ---
    #[test]
    fn test_validate_ipv4_valid() {
        assert!(validate_ipv4("8.8.8.8").is_ok());
        assert!(validate_ipv4("192.168.1.1").is_ok());
        assert!(validate_ipv4("0.0.0.0").is_ok());
        assert!(validate_ipv4("255.255.255.255").is_ok());
    }

    #[test]
    fn test_validate_ipv4_invalid() {
        assert!(validate_ipv4("").is_err());
        assert!(validate_ipv4("not-an-ip").is_err());
        assert!(validate_ipv4("256.1.1.1").is_err());
        assert!(validate_ipv4("1.2.3").is_err());
        assert!(validate_ipv4("; rm -rf /").is_err());
        assert!(validate_ipv4("8.8.8.8; whoami").is_err());
    }

    #[test]
    fn test_validate_adapter_name_valid() {
        assert!(validate_adapter_name("Ethernet").is_ok());
        assert!(validate_adapter_name("Wi-Fi").is_ok());
        assert!(validate_adapter_name("イーサネット").is_ok());
        assert!(validate_adapter_name("Local Area Connection 2").is_ok());
    }

    #[test]
    fn test_validate_adapter_name_injection() {
        assert!(validate_adapter_name("eth0; whoami").is_err());
        assert!(validate_adapter_name("eth0 | cat /etc/passwd").is_err());
        assert!(validate_adapter_name("eth0 & dir").is_err());
        assert!(validate_adapter_name("").is_err());
    }

    // --- ping_host バリデーション ---
    #[test]
    fn test_validate_ping_target_valid() {
        assert!(validate_ping_target("8.8.8.8").is_ok());
        assert!(validate_ping_target("google.com").is_ok());
        assert!(validate_ping_target("sub.domain.example.com").is_ok());
    }

    #[test]
    fn test_validate_ping_target_invalid() {
        assert!(validate_ping_target("").is_err());
        assert!(validate_ping_target("; whoami").is_err());
        assert!(validate_ping_target("google.com; ls").is_err());
        assert!(validate_ping_target("test space.com").is_err());
    }

    // --- TCP Tuning バリデーション ---
    #[test]
    fn test_set_qos_bandwidth_validation() {
        // 無効な値のみテスト（有効な値は環境依存のためスキップ）
        assert!(matches!(
            set_qos_reserved_bandwidth(101),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_set_network_throttling_validation() {
        // 無効な値のみテスト（有効な値は環境依存のためスキップ）
        assert!(matches!(
            set_network_throttling(-2),
            Err(AppError::InvalidInput(_))
        ));
        assert!(matches!(
            set_network_throttling(71),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_set_tcp_auto_tuning_validation() {
        // 無効な値のみテスト（有効な値は環境依存のためスキップ）
        assert!(matches!(
            set_tcp_auto_tuning("invalid".to_string()),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_measure_network_quality_validation() {
        // 有効な値
        assert!(measure_network_quality("8.8.8.8".to_string(), 10).is_ok()); // 環境依存
        
        // 無効な値
        assert!(measure_network_quality("".to_string(), 10).is_err());
        assert!(measure_network_quality("8.8.8.8".to_string(), 0).is_err());
        assert!(measure_network_quality("8.8.8.8".to_string(), 51).is_err());
    }
}
