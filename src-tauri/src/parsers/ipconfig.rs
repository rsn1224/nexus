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
