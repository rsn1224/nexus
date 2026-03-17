use crate::error::AppError;
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::info;

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResourceSnapshot {
    pub timestamp: u64,
    pub cpu_percent: f32,
    pub cpu_temp_c: Option<f32>,
    pub mem_used_mb: u64,
    pub mem_total_mb: u64,
    pub disk_read_kb: u64,
    pub disk_write_kb: u64,
    pub net_recv_kb: u64,
    pub net_sent_kb: u64,
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_resource_snapshot(
    state: State<'_, crate::SharedState>,
) -> Result<ResourceSnapshot, AppError> {
    info!("get_resource_snapshot: collecting system metrics");

    let data = crate::services::system_monitor::collect_snapshot(&state)?;

    Ok(ResourceSnapshot {
        timestamp: data.timestamp,
        cpu_percent: data.cpu_percent,
        cpu_temp_c: data.cpu_temp_c,
        mem_used_mb: data.mem_used_mb,
        mem_total_mb: data.mem_total_mb,
        disk_read_kb: data.disk_read_kb,
        disk_write_kb: data.disk_write_kb,
        net_recv_kb: data.net_recv_kb,
        net_sent_kb: data.net_sent_kb,
    })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resource_snapshot_serialization() {
        let snapshot = ResourceSnapshot {
            timestamp: 1_640_995_200_000,
            cpu_percent: 25.5,
            cpu_temp_c: Some(65.0),
            mem_used_mb: 4096,
            mem_total_mb: 8192,
            disk_read_kb: 1024,
            disk_write_kb: 2048,
            net_recv_kb: 0,
            net_sent_kb: 0,
        };

        let json = serde_json::to_string(&snapshot).expect("snapshot should be serializable");
        assert!(json.contains("timestamp"));
        assert!(json.contains("cpuPercent"));

        let deserialized: ResourceSnapshot =
            serde_json::from_str(&json).expect("json should be deserializable");
        assert_eq!(deserialized.timestamp, snapshot.timestamp);
        assert_eq!(deserialized.cpu_percent, snapshot.cpu_percent);
    }
}
