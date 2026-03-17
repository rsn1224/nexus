#![allow(dead_code)]

use crate::commands::log::{LogEntry, LogLevel};
use chrono::Utc;

/// Windows イベントログ JSON エントリをパースする
pub fn parse_windows_log_value(
    json: &serde_json::Value,
) -> Option<LogEntry> {
    let timestamp = json["TimeCreated"].as_str().unwrap_or("").to_string();
    let level_str = json["LevelDisplayName"].as_str().unwrap_or("Info");
    let message = json["Message"].as_str().unwrap_or("").to_string();
    let source = json["ProviderName"]
        .as_str()
        .unwrap_or("Unknown")
        .to_string();

    let level = match level_str {
        "Error" => LogLevel::Error,
        "Warning" => LogLevel::Warn,
        "Information" => LogLevel::Info,
        _ => LogLevel::Debug,
    };

    Some(LogEntry {
        timestamp,
        level,
        message,
        source,
        process_id: None,
        thread_id: None,
    })
}

/// 一般的なログ行をパースする
pub fn parse_log_line(line: &str, app_name: &str) -> Option<LogEntry> {
    // 一般的なログフォーマットを解析
    let parts: Vec<&str> = line.splitn(4, ' ').collect();

    if parts.len() >= 3 {
        let timestamp = format!("{}T{}Z", parts[0], parts[1]);
        let level_str = parts[2];
        let message = parts.get(3).unwrap_or(&"").to_string();

        let level = match level_str.to_uppercase().as_str() {
            "ERROR" => LogLevel::Error,
            "WARN" | "WARNING" => LogLevel::Warn,
            "INFO" => LogLevel::Info,
            _ => LogLevel::Debug,
        };

        Some(LogEntry {
            timestamp,
            level,
            message,
            source: app_name.to_string(),
            process_id: None,
            thread_id: None,
        })
    } else {
        // フォーマットが不明な場合はデフォルトエントリ
        Some(LogEntry {
            timestamp: Utc::now().to_rfc3339(),
            level: LogLevel::Info,
            message: line.to_string(),
            source: app_name.to_string(),
            process_id: None,
            thread_id: None,
        })
    }
}
