// Hardware Wing — ハードウェア情報取得機能

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use sysinfo::{Components, System};
use tracing::info;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareInfo {
    pub cpu_name: String,
    pub cpu_temp_c: Option<f32>,
    pub gpu_name: Option<String>,
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

    // GPU名取得（PowerShell経由）
    let gpu_name = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive", 
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "(Get-CimInstance Win32_VideoController | Select-Object -First 1 -ExpandProperty Name)"
        ])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    info!(
        cpu_name = %cpu_name,
        cpu_temp = ?cpu_temp_c,
        "get_hardware_info: completed"
    );

    Ok(HardwareInfo {
        cpu_name,
        cpu_temp_c,
        gpu_name,
    })
}
