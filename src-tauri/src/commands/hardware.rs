// Hardware Wing — ハードウェア情報取得機能

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use serde_json;
use sysinfo::{Components, DiskKind, Disks, System};
use tracing::{info, warn};

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

#[tauri::command]
pub fn get_hardware_info() -> Result<HardwareInfo, AppError> {
    info!("get_hardware_info: collecting hardware information");

    let mut sys = System::new_all();
    sys.refresh_all();

    // CPU情報
    let cpu_name = sys
        .cpus()
        .first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

    let cpu_cores = sys.cpus().len() as u32;
    let cpu_threads = cpu_cores; // 物理コア数とスレッド数を同じに（簡略化）
    let cpu_base_ghz = sys
        .cpus()
        .first()
        .map(|cpu| cpu.frequency() as f32 / 1000.0)
        .unwrap_or(0.0);

    // CPU温度取得
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
    let mem_total_gb = total_memory as f32 / (1024.0 * 1024.0 * 1024.0);
    let mem_used_gb = used_memory as f32 / (1024.0 * 1024.0 * 1024.0);

    // OS情報
    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let uptime_secs = System::uptime();
    let boot_time_unix = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        - uptime_secs;

    // ディスク情報
    let mut disks = Vec::new();
    let disks_sys = Disks::new_with_refreshed_list();
    for disk in disks_sys.list() {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total.saturating_sub(available);
        if total == 0 {
            continue;
        }

        let kind = match disk.kind() {
            DiskKind::SSD => "SSD",
            DiskKind::HDD => "HDD",
            _ => "Unknown",
        }
        .to_string();

        disks.push(DiskInfo {
            mount: disk.mount_point().to_string_lossy().to_string(),
            kind,
            total_gb: total as f32 / (1024.0_f32.powi(3)),
            used_gb: used as f32 / (1024.0_f32.powi(3)),
        });
    }
    disks.sort_by(|a, b| a.mount.cmp(&b.mount));

    // GPU名・VRAM取得（PowerShell経由）
    let gpu_info = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive", 
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "Get-CimInstance Win32_VideoController | Select-Object -First 1 Name, AdapterRAM | ConvertTo-Json -Compress"
        ])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    // GPU情報をパース
    let (gpu_name, gpu_vram_total_mb) = if let Some(gpu_json) = gpu_info {
        match serde_json::from_str::<serde_json::Value>(&gpu_json) {
            Ok(value) => {
                let name = value
                    .get("Name")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let vram_bytes = value
                    .get("AdapterRAM")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0);

                let vram_mb = if vram_bytes > 0 {
                    Some(vram_bytes / 1024 / 1024)
                } else {
                    None
                };

                (name, vram_mb)
            }
            Err(_) => {
                // JSONパース失敗時は全てNone
                (None, None)
            }
        }
    } else {
        // PowerShell実行失敗時は全てNone
        (None, None)
    };

    info!(
        cpu_name = %cpu_name,
        cpu_temp = ?cpu_temp_c,
        gpu_name = ?gpu_name,
        gpu_vram_total_mb = ?gpu_vram_total_mb,
        "get_hardware_info: completed"
    );

    // GPU情報が取得できなかった場合に警告ログを出力
    if gpu_name.is_none() || gpu_name.as_ref().is_none_or(|s| s.is_empty()) {
        warn!("hardware: GPU info unavailable");
    }

    Ok(HardwareInfo {
        cpu_name,
        cpu_cores,
        cpu_threads,
        cpu_base_ghz,
        cpu_temp_c,
        mem_total_gb,
        mem_used_gb,
        os_name,
        os_version,
        hostname,
        uptime_secs,
        boot_time_unix,
        disks,
        gpu_name,
        gpu_vram_total_mb,
        gpu_vram_used_mb: None,  // Win32では取得不可
        gpu_temp_c: None,        // Win32では取得不可
        gpu_usage_percent: None, // Win32では取得不可
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_info_gpu_fields_default_none() {
        let info = HardwareInfo {
            cpu_name: "Test CPU".to_string(),
            cpu_cores: 4,
            cpu_threads: 8,
            cpu_base_ghz: 2.5,
            cpu_temp_c: None,
            mem_total_gb: 16.0,
            mem_used_gb: 8.0,
            os_name: "Windows".to_string(),
            os_version: "10".to_string(),
            hostname: "test-pc".to_string(),
            uptime_secs: 3600,
            boot_time_unix: 1640995200,
            disks: vec![],
            gpu_name: None,
            gpu_vram_total_mb: None,
            gpu_vram_used_mb: None,
            gpu_temp_c: None,
            gpu_usage_percent: None,
        };
        assert!(info.gpu_name.is_none());
        assert!(info.gpu_vram_total_mb.is_none());
        assert!(info.gpu_vram_used_mb.is_none());
        assert!(info.gpu_temp_c.is_none());
        assert!(info.gpu_usage_percent.is_none());
    }
}
