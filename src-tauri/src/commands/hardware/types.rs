// Hardware Wing の型定義

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HardwareInfo {
    pub cpu_name: String,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub cpu_base_ghz: f32,
    pub cpu_temp_c: Option<f32>,
    pub mem_total_gb: f32,
    pub mem_used_gb: f32,
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub uptime_secs: u64,
    pub boot_time_unix: u64,
    pub disks: Vec<DiskInfo>,
    pub gpu_name: Option<String>,
    pub gpu_vram_total_mb: Option<u64>,
    pub gpu_vram_used_mb: Option<u64>,
    pub gpu_temp_c: Option<f32>,
    pub gpu_usage_percent: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub mount: String,
    pub kind: String,
    pub total_gb: f32,
    pub used_gb: f32,
}
