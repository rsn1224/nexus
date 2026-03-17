use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use sysinfo::{Components, Process};
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn now_millis() -> Result<u64, AppError> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| AppError::Command(e.to_string()))
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_resource_snapshot(
    state: State<'_, Mutex<crate::PulseState>>,
) -> Result<ResourceSnapshot, AppError> {
    info!("get_resource_snapshot: collecting system metrics");

    // ── 1st lock: CPU refresh 1回目 + メモリ ──
    {
        let mut s = state
            .lock()
            .map_err(|e| AppError::Command(format!("State lock poisoned: {}", e)))?;
        s.sys.refresh_cpu_all();
        s.sys.refresh_memory();
    } // ← ここで Mutex 解放

    // ── sleep: Mutex の外で待機（他コマンドをブロックしない）──
    std::thread::sleep(std::time::Duration::from_millis(200));

    // ── 2nd lock: CPU refresh 2回目 + 残りのメトリクス収集 ──
    let mut s = state
        .lock()
        .map_err(|e| AppError::Command(format!("State lock poisoned: {}", e)))?;

    s.sys.refresh_cpu_all();
    s.sys
        .refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let cpu_percent = s.sys.global_cpu_usage();

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

    let total_memory = s.sys.total_memory();
    let available_memory = s.sys.available_memory();
    let used_memory = total_memory.saturating_sub(available_memory);

    let current_read: u64 = s
        .sys
        .processes()
        .values()
        .map(|p: &Process| p.disk_usage().read_bytes)
        .sum();
    let current_write: u64 = s
        .sys
        .processes()
        .values()
        .map(|p: &Process| p.disk_usage().written_bytes)
        .sum();

    let disk_read_kb = current_read.saturating_sub(s.last_disk_read) / 1024;
    let disk_write_kb = current_write.saturating_sub(s.last_disk_write) / 1024;

    s.last_disk_read = current_read;
    s.last_disk_write = current_write;

    s.networks.refresh();
    let net_recv_kb: u64 = s.networks.values().map(|n| n.received()).sum::<u64>() / 1024;
    let net_sent_kb: u64 = s.networks.values().map(|n| n.transmitted()).sum::<u64>() / 1024;

    let snapshot = ResourceSnapshot {
        timestamp: now_millis()?,
        cpu_percent,
        cpu_temp_c,
        mem_used_mb: used_memory / (1024 * 1024),
        mem_total_mb: total_memory / (1024 * 1024),
        disk_read_kb,
        disk_write_kb,
        net_recv_kb,
        net_sent_kb,
    };

    info!(
        cpu = snapshot.cpu_percent,
        cpu_temp = ?snapshot.cpu_temp_c,
        mem_used = snapshot.mem_used_mb,
        mem_total = snapshot.mem_total_mb,
        disk_read = snapshot.disk_read_kb,
        disk_write = snapshot.disk_write_kb,
        net_recv = snapshot.net_recv_kb,
        net_sent = snapshot.net_sent_kb,
        "get_resource_snapshot: done"
    );

    Ok(snapshot)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_now_millis_returns_positive_timestamp() {
        let timestamp = now_millis().expect("now_millis should return valid timestamp");
        assert!(timestamp > 0);
        assert!(timestamp > 1_577_836_800_000); // 2020-01-01 00:00:00 UTC
    }

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
