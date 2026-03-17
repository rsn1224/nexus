#![allow(dead_code)]

use crate::commands::netopt::NetworkAdapter;

/// アダプター名の検出パターン（英語 + 日本語）
const ADAPTER_PATTERNS: &[&str] = &[
    " adapter ",    // 英語: "Ethernet adapter Local Area Connection:"
    " アダプター ", // 日本語: "イーサネット アダプター ローカル エリア接続:"
];

/// IPv4 アドレスの検出パターン
const IPV4_PATTERNS: &[&str] = &[
    "IPv4 Address",  // 英語
    "IPv4 アドレス", // 日本語
];

/// MAC アドレスの検出パターン
const MAC_PATTERNS: &[&str] = &[
    "Physical Address", // 英語
    "物理アドレス",     // 日本語
];

/// ipconfig /all の出力をパースしてアダプタ一覧を返す
/// 英語・日本語ロケール両対応
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

        // アダプター名の検出（英語 + 日本語）
        let adapter_match = ADAPTER_PATTERNS.iter().find_map(|pattern| {
            if trimmed.contains(pattern) && trimmed.ends_with(':') {
                let name = trimmed.trim_end_matches(':');
                let name = if let Some(pos) = name.find(pattern) {
                    name[pos + pattern.len()..].trim()
                } else {
                    name.trim()
                };
                Some(name.to_string())
            } else {
                None
            }
        });

        if let Some(name) = adapter_match {
            // 前のアダプターを保存（名前があれば）
            if !current_adapter.name.is_empty() {
                adapters.push(current_adapter.clone());
            }
            current_adapter = NetworkAdapter {
                name,
                ip: String::new(),
                mac: String::new(),
                is_connected: false,
            };
            continue;
        }

        // IPv4 アドレスの検出（英語 + 日本語）
        let is_ipv4 = IPV4_PATTERNS.iter().any(|p| trimmed.contains(p));
        if is_ipv4 {
            // コロンの後の値を取得（ラベル内にドット区切りがあるため、最後のコロン以降を取る）
            if let Some(ip_part) = trimmed.rsplit_once(':').map(|(_, v)| v) {
                let ip = ip_part
                    .trim()
                    .trim_end_matches("(Preferred)")
                    .trim_end_matches("(優先)")
                    .trim();
                if !ip.is_empty() {
                    current_adapter.ip = ip.to_string();
                    current_adapter.is_connected = true;
                }
            }
            continue;
        }

        // MAC アドレスの検出（英語 + 日本語）
        let is_mac = MAC_PATTERNS.iter().any(|p| trimmed.contains(p));
        if is_mac {
            // MAC アドレスは "XX-XX-XX-XX-XX-XX" 形式
            // rsplit_once(':') で最後のコロン以降を取得
            if let Some(mac_part) = trimmed.rsplit_once(':').map(|(_, v)| v) {
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

    // ─── 既存テスト（英語）─────────────────────────────────────

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
        let adapters = parse_ipconfig_output(output);
        assert!(adapters.is_empty());
    }

    // ─── 日本語ロケールテスト ────────────────────────────────

    #[test]
    fn test_parse_japanese_ethernet() {
        let output = "\
イーサネット アダプター イーサネット:

   接続固有の DNS サフィックス . . . . .:
   物理アドレス. . . . . . . . . . . . .: AA-BB-CC-DD-EE-FF
   IPv4 アドレス . . . . . . . . . . . .: 192.168.1.100
   サブネット マスク . . . . . . . . . .: 255.255.255.0
   デフォルト ゲートウェイ . . . . . . .: 192.168.1.1
";
        let adapters = parse_ipconfig_output(output);
        assert_eq!(
            adapters.len(),
            1,
            "日本語イーサネットアダプターが検出されるべき"
        );
        assert_eq!(adapters[0].name, "イーサネット");
        assert_eq!(adapters[0].ip, "192.168.1.100");
        assert_eq!(adapters[0].mac, "AA-BB-CC-DD-EE-FF");
        assert!(adapters[0].is_connected);
    }

    #[test]
    fn test_parse_japanese_wifi() {
        let output = "\
無線 LAN アダプター Wi-Fi:

   接続固有の DNS サフィックス . . . . .:
   物理アドレス. . . . . . . . . . . . .: 11-22-33-44-55-66
   IPv4 アドレス . . . . . . . . . . . .: 10.0.0.50
   サブネット マスク . . . . . . . . . .: 255.255.255.0
";
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 1, "日本語 Wi-Fi アダプターが検出されるべき");
        assert_eq!(adapters[0].name, "Wi-Fi");
        assert_eq!(adapters[0].ip, "10.0.0.50");
    }

    #[test]
    fn test_parse_japanese_preferred_suffix() {
        let output = "\
イーサネット アダプター イーサネット:

   物理アドレス. . . . . . . . . . . . .: AA-BB-CC-DD-EE-FF
   IPv4 アドレス . . . . . . . . . . . .: 192.168.1.5(優先)
";
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 1);
        assert_eq!(
            adapters[0].ip, "192.168.1.5",
            "「(優先)」サフィックスが除去されるべき"
        );
    }

    #[test]
    fn test_parse_japanese_disconnected() {
        let output = "\
無線 LAN アダプター Wi-Fi:

   メディアの状態. . . . . . . . . . . .: メディアは接続されていません
   物理アドレス. . . . . . . . . . . . .: 11-22-33-44-55-66
";
        let adapters = parse_ipconfig_output(output);
        assert!(
            adapters.is_empty(),
            "日本語の切断済みアダプターも除外されるべき"
        );
    }

    #[test]
    fn test_parse_mixed_english_japanese() {
        let output = "\
Ethernet adapter Ethernet:

   Physical Address. . . . . . . . . : AA-BB-CC-DD-EE-FF
   IPv4 Address. . . . . . . . . . . : 10.0.0.1

無線 LAN アダプター Wi-Fi:

   物理アドレス. . . . . . . . . . . . .: 11-22-33-44-55-66
   IPv4 アドレス . . . . . . . . . . . .: 192.168.1.50
";
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 2, "英語・日本語混在でも両方検出されるべき");
        assert_eq!(adapters[0].ip, "10.0.0.1");
        assert_eq!(adapters[1].ip, "192.168.1.50");
    }
}
