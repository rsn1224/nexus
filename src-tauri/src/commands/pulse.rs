use serde::{Deserialize, Serialize};

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
    // ── GPU データ追加 ──
    pub gpu_usage_percent: Option<f32>,
    pub gpu_temp_c: Option<f32>,
    pub gpu_vram_used_mb: Option<u64>,
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
            // ── GPU データ ──
            gpu_usage_percent: Some(45.0),
            gpu_temp_c: Some(72.0),
            gpu_vram_used_mb: Some(4096),
        };

        let json = serde_json::to_string(&snapshot).expect("snapshot should be serializable");
        assert!(json.contains("timestamp"));
        assert!(json.contains("cpuPercent"));
        assert!(json.contains("gpuUsagePercent"));

        let deserialized: ResourceSnapshot =
            serde_json::from_str(&json).expect("json should be deserializable");
        assert_eq!(deserialized.timestamp, snapshot.timestamp);
        assert_eq!(deserialized.cpu_percent, snapshot.cpu_percent);
        assert_eq!(deserialized.gpu_usage_percent, snapshot.gpu_usage_percent);
    }
}
