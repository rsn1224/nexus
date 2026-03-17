// Hardware Wing — ハードウェア情報取得機能

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use serde_json;
use sysinfo::{Components, System};
use tracing::{info, warn};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareInfo {
    pub cpu_name: String,
    pub cpu_temp_c: Option<f32>,
    pub gpu_name: Option<String>,
    pub gpu_vram_total_mb: Option<u64>,
    pub gpu_vram_used_mb: Option<u64>,
    pub gpu_temp_c: Option<f32>,
    pub gpu_usage_percent: Option<f32>,
}

#[tauri::command]
pub fn get_hardware_info() -> Result<HardwareInfo, AppError> {
    info!("get_hardware_info: collecting hardware information");

    let mut sys = System::new();
    sys.refresh_cpu_all();
    
    // CPU名取得
    let cpu_name = sys.cpus()
        .first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

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
                let name = value.get("Name")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
                
                let vram_bytes = value.get("AdapterRAM")
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
        cpu_temp_c,
        gpu_name,
        gpu_vram_total_mb,
        gpu_vram_used_mb: None,    // Win32では取得不可
        gpu_temp_c: None,             // Win32では取得不可
        gpu_usage_percent: None,       // Win32では取得不可
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_info_gpu_fields_default_none() {
        let info = HardwareInfo {
            cpu_name: "Test CPU".to_string(),
            cpu_temp_c: None,
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
