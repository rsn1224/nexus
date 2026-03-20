#![allow(dead_code)]

use chrono::Utc;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum LogLevel {
    Error,
    Warn,
    Info,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: LogLevel,
    pub message: String,
    pub source: String,
    pub process_id: Option<u32>,
    pub thread_id: Option<u32>,
}

/// Windows イベントログ JSON エントリをパースする
pub fn parse_windows_log_value(json: &serde_json::Value) -> Option<LogEntry> {
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
        _ => LogLevel::Info, // デフォルトを Info に変更
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
            _ => LogLevel::Info, // デフォルトを Info に変更
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_windows_log_value() {
        let json = serde_json::json!({
            "TimeCreated": "2026-03-18T12:00:00Z",
            "LevelDisplayName": "Error",
            "Message": "テストエラーメッセージ",
            "ProviderName": "TestProvider"
        });
        let entry = parse_windows_log_value(&json).unwrap();
        assert_eq!(entry.timestamp, "2026-03-18T12:00:00Z");
        assert!(matches!(entry.level, LogLevel::Error));
        assert_eq!(entry.message, "テストエラーメッセージ");
        assert_eq!(entry.source, "TestProvider");
    }

    #[test]
    fn test_parse_windows_log_value_defaults() {
        let json = serde_json::json!({});
        let entry = parse_windows_log_value(&json).unwrap();
        assert_eq!(entry.timestamp, "");
        assert!(matches!(entry.level, LogLevel::Info)); // デフォルト
        assert_eq!(entry.message, "");
        assert_eq!(entry.source, "Unknown");
    }

    #[test]
    fn test_parse_log_line_standard_format() {
        let line = "2026-03-18 12:00:00 ERROR something went wrong";
        let entry = parse_log_line(line, "test-app").unwrap();
        assert!(matches!(entry.level, LogLevel::Error));
        assert_eq!(entry.message, "something went wrong");
        assert_eq!(entry.source, "test-app");
    }

    #[test]
    fn test_parse_log_line_warn_level() {
        let line = "2026-03-18 12:00:00 WARN disk space low";
        let entry = parse_log_line(line, "test-app").unwrap();
        assert!(matches!(entry.level, LogLevel::Warn));
    }

    #[test]
    fn test_parse_log_line_unknown_format() {
        let line = "unknown format log line";
        let entry = parse_log_line(line, "fallback").unwrap();
        assert!(matches!(entry.level, LogLevel::Info));
        assert_eq!(entry.source, "fallback");
    }
}
