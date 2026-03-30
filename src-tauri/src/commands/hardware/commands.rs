// Hardware Wing — ハードウェア情報取得コマンド

use crate::SharedState;
use crate::error::AppError;
use crate::services::power_estimator::{EcoModeConfig, estimate_monthly_cost, estimate_power};
use sysinfo::{Components, DiskKind, Disks, System};
use tauri::{AppHandle, Manager, State};
use tracing::{info, warn};

use super::types::{DiskInfo, HardwareInfo};

#[tauri::command]
pub fn get_hardware_info(state: State<'_, SharedState>) -> Result<HardwareInfo, AppError> {
    info!("get_hardware_info: collecting hardware information");

    let mut s = state
        .lock()
        .map_err(|e| AppError::Command(format!("Stateロックエラー: {}", e)))?;
    s.sys.refresh_cpu_all();
    s.sys.refresh_memory();

    let cpu_name = s
        .sys
        .cpus()
        .first()
        .map(|cpu: &sysinfo::Cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

    let cpu_cores = s.sys.cpus().len() as u32;
    let cpu_threads = cpu_cores;
    let cpu_base_ghz = s
        .sys
        .cpus()
        .first()
        .map(|cpu: &sysinfo::Cpu| cpu.frequency() as f32 / 1000.0)
        .unwrap_or(0.0);

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
    let used_memory = s.sys.used_memory();
    let mem_total_gb = total_memory as f32 / (1024.0 * 1024.0 * 1024.0);
    let mem_used_gb = used_memory as f32 / (1024.0 * 1024.0 * 1024.0);

    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let uptime_secs = System::uptime();
    let boot_time_unix = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        - uptime_secs;

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

    let cpu_name = s
        .sys
        .cpus()
        .first()
        .map(|cpu: &sysinfo::Cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

    let gpu_name = s.gpu_static.as_ref().and_then(|g| g.name.clone());
    let gpu_usage = crate::services::hardware::get_gpu_dynamic_info().usage_percent;

    drop(s);

    let estimate = estimate_power(&cpu_name, gpu_name.as_deref(), cpu_percent, gpu_usage);

    Ok(estimate)
}

#[tauri::command]
pub fn get_monthly_cost_estimate(
    config: EcoModeConfig,
    hours_per_day: f32,
) -> Result<crate::services::power_estimator::MonthlyCostEstimate, AppError> {
    info!("get_monthly_cost_estimate: calculating monthly cost estimate");

    let normal_power_w = 400.0;
    let eco_power_w = 250.0;

    let estimate = estimate_monthly_cost(normal_power_w, eco_power_w, &config, hours_per_day);
    Ok(estimate)
}

#[tauri::command]
pub fn set_eco_mode(enabled: bool, config: EcoModeConfig) -> Result<(), AppError> {
    info!(
        "set_eco_mode: {} eco mode",
        if enabled { "enabling" } else { "disabling" }
    );

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
    Ok(EcoModeConfig::default())
}

#[tauri::command]
pub fn save_eco_mode_config(app: AppHandle, config: EcoModeConfig) -> Result<(), AppError> {
    info!("save_eco_mode_config: saving eco mode configuration");

    let app_data_dir = app
        .path()
        .resolve("app_data", tauri::path::BaseDirectory::AppData)
        .map_err(|_| AppError::Command("Failed to get app data directory".to_string()))?;

    let config_path = app_data_dir.join("eco_config.json");

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| AppError::Command(format!("Failed to create app data directory: {}", e)))?;

    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| AppError::Command(format!("Failed to serialize config: {}", e)))?;

    std::fs::write(&config_path, config_json)
        .map_err(|e| AppError::Command(format!("Failed to save config: {}", e)))?;

    info!("Eco mode configuration saved to: {:?}", config_path);
    Ok(())
}
