//! v4 SystemStatus 構築サービス
//! AppState の sysinfo::System + infra::gpu から統合ステータスを返す

use crate::error::AppError;
use crate::state::SharedState;
use crate::types::v4::SystemStatus;
use tauri::State;

pub fn get_system_status(state: &State<'_, SharedState>) -> Result<SystemStatus, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    s.sys.refresh_cpu_all();
    let cpu_percent = s.sys.global_cpu_usage();

    s.sys.refresh_memory();
    let ram_total_gb = s.sys.total_memory() as f32 / 1_073_741_824.0;
    let ram_used_gb = s.sys.used_memory() as f32 / 1_073_741_824.0;

    let disks = sysinfo::Disks::new_with_refreshed_list();
    let disk_free_gb =
        disks.iter().map(|d| d.available_space()).sum::<u64>() as f32 / 1_073_741_824.0;

    // sysinfo ロックを解放してから GPU 情報を取得
    drop(s);

    let gpu = crate::services::hardware::get_gpu_dynamic_info();

    Ok(SystemStatus {
        cpu_percent,
        gpu_percent: gpu.usage_percent.unwrap_or(0.0),
        gpu_temp_c: gpu.temperature_c.unwrap_or(0.0),
        ram_used_gb,
        ram_total_gb,
        disk_free_gb,
    })
}
