// Log Wing — ログ管理機能

use crate::error::AppError;
#[cfg(windows)]
use crate::infra::powershell;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing::info;
#[cfg(windows)]
use tracing::warn;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub timestamp: String,
    pub level: LogLevel,
    pub message: String,
    pub source: String,
    pub process_id: Option<u32>,
    pub thread_id: Option<u32>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogAnalysis {
    pub total_entries: usize,
    pub error_count: usize,
    pub warning_count: usize,
    pub info_count: usize,
    pub debug_count: usize,
    pub time_range: String,
    pub top_sources: Vec<(String, usize)>,
}

#[tauri::command]
#[cfg(windows)]
pub fn get_system_logs(
    level: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<LogEntry>, AppError> {
    info!(
        "get_system_logs: fetching system logs with level: {:?}, limit: {:?}",
        level, limit
    );

    let mut logs = Vec::new();

    // Windowsイベントログから取得（PowerShell使用）
    let command = "Get-WinEvent -LogName Application -MaxEvents 1000 | Where-Object {$_.TimeCreated -gt (Get-Date).AddHours(-24)} | Select-Object TimeCreated, LevelDisplayName, Message, ProviderName | ConvertTo-Json -Depth 1";
    let stdout_output = powershell::run_powershell(command)?;
    let stdout_str = stdout_output.trim();
    if !stdout_str.is_empty() {
        match serde_json::from_str::<Vec<serde_json::Value>>(stdout_str) {
            Ok(entries) => {
                for value in entries {
                    if let Ok(entry) = parse_windows_log_value(&value) {
                        // レベルフィルタリング
                        if let Some(ref filter_level) = level {
                            if matches_log_level(&entry.level, filter_level) {
                                logs.push(entry);
                            }
                        } else {
                            logs.push(entry);
                        }
                    }
                }
            }
            Err(e) => {
                warn!("Failed to parse PowerShell JSON output: {}", e);
            }
        }
    }

    // 制限を適用
    if let Some(limit_val) = limit {
        logs.truncate(limit_val);
    }

    // タイムスタンプでソート（新しい順）
    logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    info!("get_system_logs: fetched {} log entries", logs.len());
    Ok(logs)
}

#[tauri::command]
#[cfg(not(windows))]
pub fn get_system_logs(
    _level: Option<String>,
    _limit: Option<usize>,
) -> Result<Vec<LogEntry>, AppError> {
    info!("get_system_logs: stub implementation for non-Windows");
    Ok(Vec::new())
}

// RFC 4180 準拠のCSVフィールドエスケープ関数
fn escape_csv_field(field: &str) -> String {
    if field.contains(',') || field.contains('"') || field.contains('\n') || field.contains('\r') {
        format!("\"{}\"", field.replace('"', "\"\""))
    } else {
        field.to_string()
    }
}

#[tauri::command]
pub fn get_application_logs(
    app_name: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<LogEntry>, AppError> {
    let app_name = app_name.unwrap_or_else(|| "nexus".to_string());
    info!(
        "get_application_logs: fetching logs for app: {}, limit: {:?}",
        app_name, limit
    );

    let mut logs = Vec::new();

    // アプリケーションログファイルのパスを検索
    let log_paths = vec![
        format!(r"C:\ProgramData\{}\logs\*.log", app_name),
        format!(
            r"C:\Users\{}\AppData\Local\{}\logs\*.log",
            std::env::var("USERNAME").unwrap_or_else(|_| "Default".to_string()),
            app_name
        ),
        format!(r"C:\Program Files\{}\logs\*.log", app_name),
    ];

    for log_pattern in &log_paths {
        // glob パターンからディレクトリ部分を抽出
        let dir = std::path::Path::new(log_pattern)
            .parent()
            .unwrap_or(std::path::Path::new("."));
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() && path.extension().is_some_and(|ext| ext == "log") {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        for line in content.lines().take(limit.unwrap_or(1000)) {
                            if let Ok(entry) = parse_log_line(line, &app_name) {
                                logs.push(entry);
                            }
                        }
                    }
                }
            }
        }
    }

    // タイムスタンプでソート（新しい順）
    logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    info!("get_application_logs: fetched {} log entries", logs.len());
    Ok(logs)
}

#[tauri::command]
pub fn analyze_logs(logs: Vec<LogEntry>) -> Result<LogAnalysis, AppError> {
    info!("analyze_logs: analyzing {} log entries", logs.len());

    let mut error_count = 0;
    let mut warning_count = 0;
    let mut info_count = 0;
    let mut debug_count = 0;
    let mut source_counts = std::collections::HashMap::new();

    let mut earliest_time: Option<DateTime<Utc>> = None;
    let mut latest_time: Option<DateTime<Utc>> = None;

    for entry in &logs {
        // レベル別カウント
        match entry.level {
            LogLevel::Error => error_count += 1,
            LogLevel::Warn => warning_count += 1,
            LogLevel::Info => info_count += 1,
            LogLevel::Debug => debug_count += 1,
        }

        // ソース別カウント
        *source_counts.entry(entry.source.clone()).or_insert(0) += 1;

        // タイムスタンプ解析
        if let Ok(parsed_time) = DateTime::parse_from_rfc3339(&entry.timestamp) {
            let utc_time = parsed_time.with_timezone(&Utc);
            match earliest_time {
                None => earliest_time = Some(utc_time),
                Some(t) if utc_time < t => earliest_time = Some(utc_time),
                _ => {}
            }
            match latest_time {
                None => latest_time = Some(utc_time),
                Some(t) if utc_time > t => latest_time = Some(utc_time),
                _ => {}
            }
        }
    }

    // トップソースを取得
    let mut top_sources: Vec<(String, usize)> = source_counts.into_iter().collect();
    top_sources.sort_by(|a, b| b.1.cmp(&a.1));
    top_sources.truncate(5);

    let time_range = match (earliest_time, latest_time) {
        (Some(earliest), Some(latest)) => {
            format!(
                "{} - {}",
                earliest.format("%Y-%m-%d %H:%M"),
                latest.format("%Y-%m-%d %H:%M")
            )
        }
        _ => "Unknown".to_string(),
    };

    let analysis = LogAnalysis {
        total_entries: logs.len(),
        error_count,
        warning_count,
        info_count,
        debug_count,
        time_range,
        top_sources,
    };

    info!(
        "analyze_logs: analysis complete - {} total entries",
        analysis.total_entries
    );
    Ok(analysis)
}

#[tauri::command]
pub fn export_logs(logs: Vec<LogEntry>, format: String) -> Result<String, AppError> {
    info!(
        "export_logs: exporting {} logs in {} format",
        logs.len(),
        format
    );

    let content = match format.as_str() {
        "json" => serde_json::to_string_pretty(&logs).map_err(|e| {
            AppError::Serialization(format!("Failed to serialize logs to JSON: {}", e))
        })?,
        "csv" => {
            let mut csv_content = "Timestamp,Level,Message,Source,ProcessID,ThreadID\n".to_string();
            for entry in logs {
                csv_content.push_str(&format!(
                    "{},{},{},{},{},{}\n",
                    escape_csv_field(&entry.timestamp),
                    escape_csv_field(match entry.level {
                        LogLevel::Debug => "Debug",
                        LogLevel::Info => "Info",
                        LogLevel::Warn => "Warn",
                        LogLevel::Error => "Error",
                    }),
                    escape_csv_field(&entry.message),
                    escape_csv_field(&entry.source),
                    escape_csv_field(&entry.process_id.unwrap_or(0).to_string()),
                    escape_csv_field(&entry.thread_id.unwrap_or(0).to_string())
                ));
            }
            csv_content
        }
        _ => {
            return Err(AppError::InvalidInput(
                "Unsupported export format".to_string(),
            ));
        }
    };

    // 一時ファイルに保存
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join(format!("nexus_logs_export.{}", format));
    std::fs::write(&file_path, content)
        .map_err(|e| AppError::Io(format!("Failed to write export file: {}", e)))?;

    info!("export_logs: exported to {:?}", file_path);
    Ok(file_path.to_string_lossy().to_string())
}

#[cfg(windows)]
fn parse_windows_log_value(
    json: &serde_json::Value,
) -> Result<LogEntry, Box<dyn std::error::Error>> {
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

    Ok(LogEntry {
        timestamp,
        level,
        message,
        source,
        process_id: None,
        thread_id: None,
    })
}

fn parse_log_line(line: &str, app_name: &str) -> Result<LogEntry, Box<dyn std::error::Error>> {
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

        Ok(LogEntry {
            timestamp,
            level,
            message,
            source: app_name.to_string(),
            process_id: None,
            thread_id: None,
        })
    } else {
        // フォーマットが不明な場合はデフォルトエントリ
        Ok(LogEntry {
            timestamp: Utc::now().to_rfc3339(),
            level: LogLevel::Info,
            message: line.to_string(),
            source: app_name.to_string(),
            process_id: None,
            thread_id: None,
        })
    }
}

#[cfg(windows)]
fn matches_log_level(entry_level: &LogLevel, filter: &str) -> bool {
    match filter.to_lowercase().as_str() {
        "error" => matches!(entry_level, LogLevel::Error),
        "warn" | "warning" => matches!(entry_level, LogLevel::Warn),
        "info" => matches!(entry_level, LogLevel::Info),
        "debug" => matches!(entry_level, LogLevel::Debug),
        _ => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_log_entry_serialization() {
        let entry = LogEntry {
            timestamp: "2023-01-01T12:00:00Z".to_string(),
            level: LogLevel::Error,
            message: "Test error message".to_string(),
            source: "TestApp".to_string(),
            process_id: Some(1234),
            thread_id: Some(5678),
        };

        let serialized = serde_json::to_string(&entry).unwrap();
        let deserialized: LogEntry = serde_json::from_str(&serialized).unwrap();

        assert_eq!(entry.message, deserialized.message);
        assert_eq!(entry.source, deserialized.source);
    }

    #[test]
    fn test_log_analysis() {
        let logs = vec![
            LogEntry {
                timestamp: "2023-01-01T12:00:00Z".to_string(),
                level: LogLevel::Error,
                message: "Error 1".to_string(),
                source: "App1".to_string(),
                process_id: None,
                thread_id: None,
            },
            LogEntry {
                timestamp: "2023-01-01T12:01:00Z".to_string(),
                level: LogLevel::Info,
                message: "Info 1".to_string(),
                source: "App2".to_string(),
                process_id: None,
                thread_id: None,
            },
        ];

        let analysis = analyze_logs(logs).unwrap();
        assert_eq!(analysis.total_entries, 2);
        assert_eq!(analysis.error_count, 1);
        assert_eq!(analysis.info_count, 1);
    }
}
