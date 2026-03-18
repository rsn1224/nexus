use crate::commands::hardware::HardwareInfo;
use std::sync::Mutex;
use sysinfo::{DiskKind, Disks, System};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{interval, Duration};
use tracing::{debug, error, warn};

/// ハードウェア情報を定期的にフロントエンドへ配信する
pub async fn start(app: AppHandle) {
    // ハードウェア更新間隔: 5秒（旧 useHardwareStore の固定値と同じ）
    let mut tick = interval(Duration::from_secs(5));

    loop {
        tick.tick().await;

        let info = collect_hardware_info(&app);

        match info {
            Ok(hw) => {
                if let Err(e) = app.emit("nexus://hardware", &hw) {
                    error!("hardware_emitter: イベント送信失敗: {}", e);
                } else {
                    debug!(
                        cpu = %hw.cpu_name,
                        "hardware_emitter: ハードウェア情報配信"
                    );
                }
            }
            Err(e) => {
                error!("hardware_emitter: 収集失敗: {}", e);
            }
        }
    }
}

/// ハードウェア情報を収集する
/// `commands/hardware.rs::get_hardware_info` と同じロジックだが、
/// `tauri::State` の代わりに `AppHandle` 経由でアクセスする
fn collect_hardware_info(app: &AppHandle) -> Result<HardwareInfo, String> {
    // System インスタンスから CPU/メモリ情報を取得
    let (cpu_name, cpu_cores, cpu_threads, cpu_base_ghz, mem_total_gb, mem_used_gb, uptime_secs) = {
        let state = app.state::<Mutex<crate::state::AppState>>();
        let mut s = state
            .lock()
            .map_err(|e| format!("Stateロックエラー: {}", e))?;
        s.sys.refresh_memory();
        s.sys.refresh_cpu_all();

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

        let total_memory = s.sys.total_memory();
        let used_memory = s.sys.used_memory();
        let mem_total_gb = total_memory as f32 / (1024.0 * 1024.0 * 1024.0);
        let mem_used_gb = used_memory as f32 / (1024.0 * 1024.0 * 1024.0);
        let uptime_secs = System::uptime();

        (
            cpu_name,
            cpu_cores,
            cpu_threads,
            cpu_base_ghz,
            mem_total_gb,
            mem_used_gb,
            uptime_secs,
        )
    };
    // ロック解放後に重い処理を実行

    // CPU温度
    let cpu_temp_c = crate::services::hardware::get_cpu_temperature();

    // OS情報
    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
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
        disks.push(crate::commands::hardware::DiskInfo {
            mount: disk.mount_point().to_string_lossy().to_string(),
            kind,
            total_gb: total as f32 / (1024.0_f32.powi(3)),
            used_gb: used as f32 / (1024.0_f32.powi(3)),
        });
    }
    disks.sort_by(|a, b| a.mount.cmp(&b.mount));

    // GPU情報（NVML → PowerShell フォールバック — 時間がかかるため Mutex の外で実行）
    let gpu = crate::services::hardware::get_gpu_full_info();

    if gpu.name.is_none() {
        warn!("hardware_emitter: GPU情報の取得に失敗しました");
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
