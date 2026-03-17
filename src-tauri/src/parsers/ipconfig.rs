#![allow(dead_code)]

use crate::commands::netopt::NetworkAdapter;

/// ipconfig /all の出力をパースしてアダプタ一覧を返す
pub fn parse_ipconfig_output(stdout: &str) -> Vec<NetworkAdapter> {
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

    if !current_adapter.name.is_empty() {
        adapters.push(current_adapter);
    }

    adapters
        .into_iter()
        .filter(|a| a.is_connected && !a.ip.is_empty())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_english_single_adapter() {
        let output = "\
Ethernet adapter Local Area Connection:

   Connection-specific DNS Suffix  . :
   Physical Address. . . . . . . . . : AA-BB-CC-DD-EE-FF
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
";
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 1);
        assert_eq!(adapters[0].name, "Local Area Connection");
        assert_eq!(adapters[0].ip, "192.168.1.100");
        assert_eq!(adapters[0].mac, "AA-BB-CC-DD-EE-FF");
        assert!(adapters[0].is_connected);
    }

    #[test]
    fn test_parse_multiple_adapters() {
        let output = "\
Ethernet adapter Ethernet:

   Physical Address. . . . . . . . . : 11-22-33-44-55-66
   IPv4 Address. . . . . . . . . . . : 10.0.0.5
   Subnet Mask . . . . . . . . . . . : 255.255.255.0

Wireless LAN adapter Wi-Fi:

   Physical Address. . . . . . . . . : AA-BB-CC-DD-EE-FF
   IPv4 Address. . . . . . . . . . . : 192.168.1.50
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
";
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 2);
        assert_eq!(adapters[0].ip, "10.0.0.5");
        assert_eq!(adapters[1].ip, "192.168.1.50");
    }

    #[test]
    fn test_parse_preferred_suffix_stripped() {
        let output = "\
Ethernet adapter Ethernet:

   Physical Address. . . . . . . . . : 11-22-33-44-55-66
   IPv4 Address. . . . . . . . . . . : 10.0.0.5(Preferred)
";
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 1);
        assert_eq!(adapters[0].ip, "10.0.0.5");
    }

    #[test]
    fn test_disconnected_adapter_filtered() {
        let output = "\
Ethernet adapter Ethernet:

   Media State . . . . . . . . . . . : Media disconnected
   Physical Address. . . . . . . . . : 11-22-33-44-55-66
";
        let adapters = parse_ipconfig_output(output);
        assert!(adapters.is_empty(), "切断済みアダプターは除外されるべき");
    }

    #[test]
    fn test_empty_output() {
        let adapters = parse_ipconfig_output("");
        assert!(adapters.is_empty());
    }

    #[test]
    fn test_no_ip_adapter_filtered() {
        let output = "\
Ethernet adapter Ethernet:

   Physical Address. . . . . . . . . : 11-22-33-44-55-66
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
";
        // IP アドレスがないアダプターは除外される
        let adapters = parse_ipconfig_output(output);
        assert!(adapters.is_empty());
    }
}
