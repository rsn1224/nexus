// Hardware Wing — ハードウェア情報取得機能

use crate::SharedState;
use crate::error::AppError;
use crate::services::power_estimator::{EcoModeConfig, estimate_monthly_cost, estimate_power};
use serde::{Deserialize, Serialize};
use sysinfo::{Components, DiskKind, Disks, System};
use tauri::{AppHandle, Manager, State};
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
pub fn get_hardware_info(state: State<'_, SharedState>) -> Result<HardwareInfo, AppError> {
    info!("get_hardware_info: collecting hardware information");

    let mut s = state
        .lock()
        .map_err(|e| AppError::Command(format!("Stateロックエラー: {}", e)))?;
    s.sys.refresh_cpu_all();
    s.sys.refresh_memory();

    // CPU情報
    let cpu_name = s
        .sys
        .cpus()
        .first()
        .map(|cpu: &sysinfo::Cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

    let cpu_cores = s.sys.cpus().len() as u32;
    let cpu_threads = cpu_cores; // 物理コア数とスレッド数を同じに（簡略化）
    let cpu_base_ghz = s
        .sys
        .cpus()
        .first()
        .map(|cpu: &sysinfo::Cpu| cpu.frequency() as f32 / 1000.0)
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
    let total_memory = s.sys.total_memory();
    let used_memory = s.sys.used_memory();
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

    // GPU情報（NVML → PowerShell フォールバック）
    let gpu = crate::services::hardware::get_gpu_full_info();

    info!(
        cpu_name = %cpu_name,
        cpu_temp = ?cpu_temp_c,
        gpu_name = ?gpu.name,
        gpu_vram_total_mb = ?gpu.vram_total_mb,
        gpu_usage_percent = ?gpu.usage_percent,
        gpu_temp_c = ?gpu.temperature_c,
        "get_hardware_info: completed"
    );

    // GPU情報が取得できなかった場合に警告ログを出力
    if gpu.name.is_none() || gpu.name.as_ref().is_none_or(|s| s.is_empty()) {
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
        gpu_name: gpu.name,
        gpu_vram_total_mb: gpu.vram_total_mb,
        gpu_vram_used_mb: gpu.vram_used_mb,
        gpu_temp_c: gpu.temperature_c,
        gpu_usage_percent: gpu.usage_percent,
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

// ─── Power Estimation Commands ─────────────────────────────────────

#[tauri::command]
pub fn get_power_estimate(
    state: State<'_, SharedState>,
) -> Result<crate::services::power_estimator::PowerEstimate, AppError> {
    info!("get_power_estimate: estimating current power consumption");

    let mut s = state
        .lock()
        .map_err(|e| AppError::Command(format!("Stateロックエラー: {}", e)))?;

    s.sys.refresh_cpu_all();
    let cpu_percent = s.sys.global_cpu_usage();

    // CPU 名を軽量に取得（get_hardware_info の再帰呼び出しを回避）
    let cpu_name = s
        .sys
        .cpus()
        .first()
        .map(|cpu: &sysinfo::Cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

    // GPU 情報はキャッシュから取得（NVML 呼び出しを回避）
    let gpu_name = s.gpu_static.as_ref().and_then(|g| g.name.clone());
    let gpu_usage = crate::services::hardware::get_gpu_dynamic_info().usage_percent;

    drop(s); // ロック早期解放

    let estimate = estimate_power(&cpu_name, gpu_name.as_deref(), cpu_percent, gpu_usage);

    Ok(estimate)
}

#[tauri::command]
pub fn get_monthly_cost_estimate(
    config: EcoModeConfig,
    hours_per_day: f32,
) -> Result<crate::services::power_estimator::MonthlyCostEstimate, AppError> {
    info!("get_monthly_cost_estimate: calculating monthly cost estimate");

    // Use typical power values for estimation
    let normal_power_w = 400.0; // Typical gaming PC under load
    let eco_power_w = 250.0; // Eco mode reduced power

    let estimate = estimate_monthly_cost(normal_power_w, eco_power_w, &config, hours_per_day);
    Ok(estimate)
}

#[tauri::command]
pub fn set_eco_mode(enabled: bool, config: EcoModeConfig) -> Result<(), AppError> {
    info!(
        "set_eco_mode: {} eco mode",
        if enabled { "enabling" } else { "disabling" }
    );

    // NOTE: v2 予定 — エコモード設定の実装
    // - Change power plan to config.eco_power_plan
    // - Set FPS limit via GPU driver or game overlay
    // - Enable NVML power limits if available

    if enabled {
        info!(
            "Eco mode enabled: target FPS={}, power plan={}",
            config.target_fps, config.eco_power_plan
        );
    } else {
        info!("Eco mode disabled");
    }

    Ok(())
}

#[tauri::command]
pub fn get_eco_mode_config(_app: AppHandle) -> Result<EcoModeConfig, AppError> {
    info!("get_eco_mode_config: loading saved eco mode configuration");

    // NOTE: v2 予定 — app data からの読み込み
    // For now, return default config
    Ok(EcoModeConfig::default())
}

#[tauri::command]
pub fn save_eco_mode_config(app: AppHandle, config: EcoModeConfig) -> Result<(), AppError> {
    info!("save_eco_mode_config: saving eco mode configuration");

    // NOTE: v2 予定 — app data への保存
    let app_data_dir = app
        .path()
        .resolve("app_data", tauri::path::BaseDirectory::AppData)
        .map_err(|_| AppError::Command("Failed to get app data directory".to_string()))?;

    let config_path = app_data_dir.join("eco_config.json");

    // Ensure directory exists
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| AppError::Command(format!("Failed to create app data directory: {}", e)))?;

    // Save config as JSON
    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| AppError::Command(format!("Failed to serialize config: {}", e)))?;

    std::fs::write(&config_path, config_json)
        .map_err(|e| AppError::Command(format!("Failed to save config: {}", e)))?;

    info!("Eco mode configuration saved to: {:?}", config_path);
    Ok(())
}
