use crate::error::AppError;
use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};
use sysinfo::Networks;
use tracing::info;

// ─── Types ────────────────────────────────────────────────────────────────────

/// LAN 上のデバイスエントリ。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkDevice {
    pub ip: String,
    pub mac: String,
    pub hostname: String,
    pub vendor: String,
    pub status: String, // "known" | "unknown" | "suspicious"
    pub last_seen: u64,
}

/// ネットワーク送受信バイト数のスナップショット。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrafficSnapshot {
    pub bytes_sent: u64,
    pub bytes_recv: u64,
    pub timestamp: u64,
}

// ─── OUI Vendor Lookup ────────────────────────────────────────────────────────

/// MAC アドレス（AA:BB:CC:DD:EE:FF 形式）から製造ベンダー名を返す。
/// 未知の場合は空文字を返す。
fn lookup_vendor(mac_normalized: &str) -> String {
    // (OUI prefix AA:BB:CC, vendor name)
    const OUI: &[(&str, &str)] = &[
        // Apple
        ("00:03:93", "Apple"),
        ("00:0A:27", "Apple"),
        ("00:0A:95", "Apple"),
        ("00:11:24", "Apple"),
        ("00:14:51", "Apple"),
        ("00:16:CB", "Apple"),
        ("00:17:F2", "Apple"),
        ("00:1B:63", "Apple"),
        ("00:1C:B3", "Apple"),
        ("04:26:65", "Apple"),
        ("04:52:F3", "Apple"),
        ("18:65:90", "Apple"),
        ("18:9E:FC", "Apple"),
        ("1C:91:48", "Apple"),
        ("28:CF:DA", "Apple"),
        ("3C:2E:FF", "Apple"),
        ("40:33:1A", "Apple"),
        ("44:D8:84", "Apple"),
        ("54:AE:27", "Apple"),
        ("54:E4:3A", "Apple"),
        ("58:B0:35", "Apple"),
        ("5C:97:F3", "Apple"),
        ("60:03:08", "Apple"),
        ("60:F4:45", "Apple"),
        ("70:11:24", "Apple"),
        ("78:7B:8A", "Apple"),
        ("7C:04:D0", "Apple"),
        ("80:BE:05", "Apple"),
        ("88:1F:A1", "Apple"),
        ("8C:85:90", "Apple"),
        ("A4:C3:61", "Apple"),
        ("A8:66:7F", "Apple"),
        ("AC:61:EA", "Apple"),
        ("B0:34:95", "Apple"),
        ("BC:52:B7", "Apple"),
        ("C8:2A:14", "Apple"),
        // Raspberry Pi
        ("B8:27:EB", "Raspberry Pi"),
        ("D4:61:9D", "Raspberry Pi"),
        ("DC:A6:32", "Raspberry Pi"),
        ("E4:5F:01", "Raspberry Pi"),
        ("28:CD:C1", "Raspberry Pi"),
        ("D8:3A:DD", "Raspberry Pi"),
        // Intel
        ("00:1B:21", "Intel"),
        ("00:21:6A", "Intel"),
        ("04:0E:3C", "Intel"),
        ("40:8D:5C", "Intel"),
        ("68:05:CA", "Intel"),
        ("8C:8D:28", "Intel"),
        ("A0:C9:A0", "Intel"),
        ("A4:C3:F0", "Intel"),
        ("B8:08:CF", "Intel"),
        // Samsung
        ("00:12:47", "Samsung"),
        ("08:08:C2", "Samsung"),
        ("2C:54:CF", "Samsung"),
        ("40:0E:85", "Samsung"),
        ("50:01:BB", "Samsung"),
        ("78:52:1A", "Samsung"),
        ("84:25:DB", "Samsung"),
        ("94:35:0A", "Samsung"),
        ("CC:07:AB", "Samsung"),
        ("F4:42:8F", "Samsung"),
        // Google / Nest
        ("00:1A:11", "Google"),
        ("3C:5A:B4", "Google"),
        ("54:60:09", "Google"),
        ("6C:AD:F8", "Google"),
        ("94:EB:2C", "Google"),
        ("A4:77:33", "Google"),
        ("F4:F5:D8", "Google"),
        // Amazon / Echo
        ("00:BB:3A", "Amazon"),
        ("34:D2:70", "Amazon"),
        ("40:B4:CD", "Amazon"),
        ("44:65:0D", "Amazon"),
        ("68:37:E9", "Amazon"),
        ("74:C2:46", "Amazon"),
        ("84:D6:D0", "Amazon"),
        ("B4:7C:9C", "Amazon"),
        ("F0:27:2D", "Amazon"),
        ("FC:65:DE", "Amazon"),
        // ASUS
        ("00:1A:92", "ASUS"),
        ("04:92:26", "ASUS"),
        ("08:60:6E", "ASUS"),
        ("10:7B:44", "ASUS"),
        ("14:EB:B6", "ASUS"),
        ("2C:4D:54", "ASUS"),
        ("30:5A:3A", "ASUS"),
        ("38:D5:47", "ASUS"),
        ("50:46:5D", "ASUS"),
        ("74:D0:2B", "ASUS"),
        ("90:E6:BA", "ASUS"),
        ("AC:9E:17", "ASUS"),
        ("E0:CB:4E", "ASUS"),
        ("F8:32:E4", "ASUS"),
        // TP-Link
        ("00:27:19", "TP-Link"),
        ("14:CC:20", "TP-Link"),
        ("18:D6:C7", "TP-Link"),
        ("2C:D0:5A", "TP-Link"),
        ("50:C7:BF", "TP-Link"),
        ("64:70:02", "TP-Link"),
        ("74:EA:3A", "TP-Link"),
        ("A0:F3:C1", "TP-Link"),
        ("B0:BE:76", "TP-Link"),
        ("C4:6E:1F", "TP-Link"),
        ("F8:1A:67", "TP-Link"),
        // Netgear
        ("00:09:5B", "Netgear"),
        ("00:14:6C", "Netgear"),
        ("00:1B:2F", "Netgear"),
        ("20:4E:7F", "Netgear"),
        ("28:C6:8E", "Netgear"),
        ("6C:B0:CE", "Netgear"),
        ("84:1B:5E", "Netgear"),
        ("A0:04:60", "Netgear"),
        ("C4:04:15", "Netgear"),
        // Sony
        ("00:01:4A", "Sony"),
        ("00:13:A9", "Sony"),
        ("00:EB:2D", "Sony"),
        ("10:4F:A8", "Sony"),
        ("28:3F:69", "Sony"),
        ("30:17:C8", "Sony"),
        ("70:3A:CB", "Sony"),
        ("A0:E4:53", "Sony"),
        // Nintendo
        ("00:09:BF", "Nintendo"),
        ("00:17:AB", "Nintendo"),
        ("00:19:1D", "Nintendo"),
        ("00:1A:E9", "Nintendo"),
        ("00:1B:EA", "Nintendo"),
        ("00:1F:32", "Nintendo"),
        ("00:21:47", "Nintendo"),
        ("00:22:AA", "Nintendo"),
        ("58:BD:A3", "Nintendo"),
        ("98:B6:E9", "Nintendo"),
        ("A4:C0:E1", "Nintendo"),
        // VMware / VirtualBox
        ("00:05:69", "VMware"),
        ("00:0C:29", "VMware"),
        ("00:1C:14", "VMware"),
        ("00:50:56", "VMware"),
        ("08:00:27", "VirtualBox"),
        ("0A:00:27", "VirtualBox"),
        // Microsoft
        ("00:03:FF", "Microsoft"),
        ("00:12:5A", "Microsoft"),
        ("00:17:FA", "Microsoft"),
        ("28:18:78", "Microsoft"),
        ("60:45:CB", "Microsoft"),
        ("7C:1E:52", "Microsoft"),
        ("DC:F5:05", "Microsoft"),
        // Cisco
        ("00:00:0C", "Cisco"),
        ("00:01:42", "Cisco"),
        ("00:06:7C", "Cisco"),
        ("00:0A:B8", "Cisco"),
        ("00:1B:D4", "Cisco"),
        ("00:21:A0", "Cisco"),
        ("28:94:0F", "Cisco"),
        ("3C:08:F6", "Cisco"),
        ("58:BC:27", "Cisco"),
        ("AC:F2:C5", "Cisco"),
        // Synology / QNAP
        ("00:11:32", "Synology"),
        ("BC:99:11", "Synology"),
        ("00:08:9B", "QNAP"),
        ("24:5E:BE", "QNAP"),
        // Ubiquiti
        ("00:27:22", "Ubiquiti"),
        ("04:18:D6", "Ubiquiti"),
        ("24:A4:3C", "Ubiquiti"),
        ("44:D9:E7", "Ubiquiti"),
        ("68:72:51", "Ubiquiti"),
        ("78:8A:20", "Ubiquiti"),
        ("B4:FB:E4", "Ubiquiti"),
        ("DC:9F:DB", "Ubiquiti"),
        // Xiaomi
        ("00:9E:C8", "Xiaomi"),
        ("18:59:36", "Xiaomi"),
        ("28:6C:07", "Xiaomi"),
        ("34:80:B3", "Xiaomi"),
        ("50:64:2B", "Xiaomi"),
        ("58:44:98", "Xiaomi"),
        ("64:09:80", "Xiaomi"),
        ("74:23:44", "Xiaomi"),
        ("AC:C1:EE", "Xiaomi"),
        ("F4:8B:32", "Xiaomi"),
    ];
    let prefix = mac_normalized.get(..8).unwrap_or("").to_ascii_uppercase();
    OUI.iter()
        .find(|(oui, _)| oui.eq_ignore_ascii_case(&prefix))
        .map(|(_, vendor)| vendor.to_string())
        .unwrap_or_default()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn now_millis() -> Result<u64, AppError> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| AppError::Command(e.to_string()))
}

fn is_valid_ip(ip: &str) -> bool {
    ip.parse::<std::net::IpAddr>().is_ok()
}

fn is_valid_mac(mac: &str) -> bool {
    let hex: String = mac.chars().filter(|c| c.is_ascii_hexdigit()).collect();
    hex.len() == 12 && hex != "ffffffffffff" && hex != "000000000000"
}

/// ARP コマンド出力を `NetworkDevice` リストに変換する。
pub(crate) fn parse_arp_output(output: &str, timestamp: u64) -> Vec<NetworkDevice> {
    output
        .lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 2 {
                return None;
            }
            let ip = parts[0];
            let mac = parts[1];
            if !is_valid_ip(ip) || !is_valid_mac(mac) {
                return None;
            }
            let mac_normalized = mac.replace('-', ":").to_uppercase();
            let vendor = lookup_vendor(&mac_normalized);
            Some(NetworkDevice {
                ip: ip.to_string(),
                mac: mac_normalized,
                hostname: String::new(),
                vendor,
                status: "unknown".to_string(),
                last_seen: timestamp,
            })
        })
        .collect()
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// ARP キャッシュから LAN デバイス一覧を返す。
#[tauri::command]
pub fn scan_network() -> Result<Vec<NetworkDevice>, AppError> {
    info!("scan_network: reading ARP cache");
    let ts = now_millis()?;

    let output = std::process::Command::new("arp")
        .arg("-a")
        .output()
        .map_err(|e| AppError::Command(e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let devices = parse_arp_output(&stdout, ts);

    info!(count = devices.len(), "scan_network: done");
    Ok(devices)
}

/// 指定 IP に ping を送り、往復遅延（ms）を返す。タイムアウトは 0 を返す。
#[tauri::command]
pub fn ping_device(ip: String) -> Result<u32, AppError> {
    info!(%ip, "ping_device: start");
    let output = std::process::Command::new("ping")
        .args(["-n", "1", "-w", "1000", &ip])
        .output()
        .map_err(|e| AppError::Command(e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        // "time<1ms" → 1ms 未満として 1 を返す
        if line.contains("time<") {
            info!(%ip, rtt_ms = 1u32, "ping_device: done");
            return Ok(1);
        }
        // "time=Xms"
        if let Some(pos) = line.find("time=") {
            let rest = &line[pos + 5..];
            let ms_str: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
            if let Ok(ms) = ms_str.parse::<u32>() {
                info!(%ip, rtt_ms = ms, "ping_device: done");
                return Ok(ms);
            }
        }
    }
    info!(%ip, rtt_ms = 0u32, "ping_device: timeout");
    Ok(0)
}

/// 指定 IP の DNS 逆引きホスト名を返す。解決できない場合は空文字を返す。
#[tauri::command]
pub fn resolve_hostname(ip: String) -> Result<String, AppError> {
    info!(%ip, "resolve_hostname: start");
    let output = std::process::Command::new("nslookup")
        .arg(&ip)
        .output()
        .map_err(|e| AppError::Command(e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        let trimmed = line.trim();
        // "Name:    hostname.local" 形式をパース
        if let Some(rest) = trimmed.strip_prefix("Name:") {
            let name = rest.trim().to_string();
            if !name.is_empty() {
                info!(%ip, %name, "resolve_hostname: resolved");
                return Ok(name);
            }
        }
    }
    info!(%ip, "resolve_hostname: not resolved");
    Ok(String::new())
}

/// 全インターフェースの累積送受信バイト数を返す。
#[tauri::command]
pub fn get_traffic_snapshot() -> Result<TrafficSnapshot, AppError> {
    info!("get_traffic_snapshot: reading network stats");
    let networks = Networks::new_with_refreshed_list();

    let (bytes_sent, bytes_recv) = networks
        .iter()
        .fold((0u64, 0u64), |(sent, recv), (_, net)| {
            (sent + net.total_transmitted(), recv + net.total_received())
        });

    let timestamp = now_millis()?;
    info!(bytes_sent, bytes_recv, "get_traffic_snapshot: done");
    Ok(TrafficSnapshot {
        bytes_sent,
        bytes_recv,
        timestamp,
    })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_network_returns_ok() {
        assert!(scan_network().is_ok());
    }

    #[test]
    fn test_get_traffic_snapshot_returns_ok() {
        assert!(get_traffic_snapshot().is_ok());
    }

    #[test]
    fn test_traffic_snapshot_has_timestamp() {
        let snap = get_traffic_snapshot().expect("should succeed"); // OK in tests
        assert!(snap.timestamp > 0, "timestamp should be non-zero");
    }

    #[test]
    fn test_parse_arp_windows_format() {
        let input = "  192.168.1.1          aa-bb-cc-dd-ee-ff     dynamic\n  192.168.1.100       11-22-33-44-55-66     dynamic";
        let devices = parse_arp_output(input, 1000);
        assert_eq!(devices.len(), 2);
        assert_eq!(devices[0].ip, "192.168.1.1");
        assert_eq!(devices[0].mac, "AA:BB:CC:DD:EE:FF");
        assert_eq!(devices[0].last_seen, 1000);
    }

    #[test]
    fn test_parse_arp_filters_broadcast() {
        let input = "  255.255.255.255      ff-ff-ff-ff-ff-ff     static\n  192.168.1.1          aa-bb-cc-dd-ee-ff     dynamic";
        let devices = parse_arp_output(input, 0);
        assert_eq!(devices.len(), 1, "broadcast MAC should be filtered");
        assert_eq!(devices[0].ip, "192.168.1.1");
    }

    #[test]
    fn test_parse_arp_filters_invalid_rows() {
        let input = "Interface: 192.168.1.50\n  Internet Address      Physical Address      Type\n  192.168.1.1          aa-bb-cc-dd-ee-ff     dynamic";
        let devices = parse_arp_output(input, 0);
        assert_eq!(devices.len(), 1, "header rows should be filtered");
    }

    #[test]
    fn test_parse_arp_empty_input() {
        let devices = parse_arp_output("", 0);
        assert!(devices.is_empty());
    }

    #[test]
    fn test_is_valid_ip() {
        assert!(is_valid_ip("192.168.1.1"));
        assert!(is_valid_ip("10.0.0.1"));
        assert!(!is_valid_ip("Interface:"));
        assert!(!is_valid_ip("not-an-ip"));
    }

    #[test]
    fn test_is_valid_mac() {
        assert!(is_valid_mac("aa-bb-cc-dd-ee-ff"));
        assert!(is_valid_mac("aa:bb:cc:dd:ee:ff"));
        assert!(!is_valid_mac("ff-ff-ff-ff-ff-ff")); // broadcast
        assert!(!is_valid_mac("00-00-00-00-00-00")); // zero
        assert!(!is_valid_mac("Physical"));
    }
}
