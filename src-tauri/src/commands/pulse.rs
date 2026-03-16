use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use sysinfo::{Components, System};
use tracing::info;

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResourceSnapshot {
    pub timestamp: u64,
    pub cpu_percent: f32,        // global CPU 使用率
    pub cpu_temp_c: Option<f32>, // CPU 温度（取得不可なら None）
    pub mem_used_mb: u64,
    pub mem_total_mb: u64,
    pub disk_read_kb: u64,  // 全ディスク合計読み取り
    pub disk_write_kb: u64, // 全ディスク合計書き込み
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn now_millis() -> Result<u64, AppError> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| AppError::Command(e.to_string()))
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// リソース使用率のスナップショットを取得する。
#[tauri::command]
pub fn get_resource_snapshot() -> Result<ResourceSnapshot, AppError> {
    info!("get_resource_snapshot: collecting system metrics");

    let mut sys = System::new();
    sys.refresh_cpu_all();
    
    // sysinfoはrefresh後に少し待たないと正確なCPU使用率が取れない
    std::thread::sleep(std::time::Duration::from_millis(200));
    
    sys.refresh_cpu_all();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    sys.refresh_memory();

    // CPU使用率（グローバル）
    let cpu_percent = sys.global_cpu_usage();

    // CPU 温度（"CPU" または "Core" ラベルのコンポーネントの平均）
    let cpu_temp_c = {
        let components = Components::new_with_refreshed_list();
        let temps: Vec<f32> = components
            .iter()
            .filter(|c| {
                let label = c.label();
                label.contains("CPU") || label.contains("Core")
            })
            .map(|c| c.temperature())
            .collect();
        if temps.is_empty() {
            None
        } else {
            Some(temps.iter().sum::<f32>() / temps.len() as f32)
        }
    };

    // メモリ情報
    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();

    // ディスクI/O情報（全プロセスのディスク使用量を合計）
    let disk_read_kb: u64 = sys.processes()
        .values()
        .map(|p| p.disk_usage().read_bytes / 1024) // bytes to KB
        .sum();
    let disk_write_kb: u64 = sys.processes()
        .values()
        .map(|p| p.disk_usage().written_bytes / 1024) // bytes to KB
        .sum();

    let snapshot = ResourceSnapshot {
        timestamp: now_millis()?,
        cpu_percent,
        cpu_temp_c,
        mem_used_mb: used_memory / (1024 * 1024), // bytes to MB
        mem_total_mb: total_memory / (1024 * 1024), // bytes to MB
        disk_read_kb,
        disk_write_kb,
    };

    info!(
        cpu = snapshot.cpu_percent,
        cpu_temp = ?snapshot.cpu_temp_c,
        mem_used = snapshot.mem_used_mb,
        mem_total = snapshot.mem_total_mb,
        disk_read = snapshot.disk_read_kb,
        disk_write = snapshot.disk_write_kb,
        "get_resource_snapshot: done"
    );

    Ok(snapshot)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_resource_snapshot_returns_valid_data() {
        let snapshot = get_resource_snapshot().unwrap();

        // 基本的なデータ検証
        assert!(snapshot.timestamp > 0);
        assert!(snapshot.cpu_percent >= 0.0);
        assert!(snapshot.cpu_percent <= 100.0);
        assert!(snapshot.mem_used_mb > 0);
        assert!(snapshot.mem_total_mb > 0);
        assert!(snapshot.mem_used_mb <= snapshot.mem_total_mb);
    }

    #[test]
    fn test_now_millis_returns_positive_timestamp() {
        let timestamp = now_millis().unwrap();
        assert!(timestamp > 0);

        // 2020年以降のタイムスタンプであることを確認
        assert!(timestamp > 1577836800000); // 2020-01-01 00:00:00 UTC
    }

    #[test]
    fn test_resource_snapshot_serialization() {
        let snapshot = ResourceSnapshot {
            timestamp: 1640995200000, // 2022-01-01 00:00:00 UTC
            cpu_percent: 25.5,
            cpu_temp_c: Some(65.0),
            mem_used_mb: 4096,
            mem_total_mb: 8192,
            disk_read_kb: 1024,
            disk_write_kb: 2048,
        };

        // JSONシリアライズが成功することを確認
        let json = serde_json::to_string(&snapshot).unwrap();
        assert!(json.contains("timestamp"));
        assert!(json.contains("cpuPercent"));

        // デシリアライズが成功することを確認
        let deserialized: ResourceSnapshot = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.timestamp, snapshot.timestamp);
        assert_eq!(deserialized.cpu_percent, snapshot.cpu_percent);
    }
}
