use crate::error::AppError;
use crate::services::hardware::get_cpu_temperature;
use crate::state::SharedState;
use sysinfo::Process;
use tauri::State;

pub struct SnapshotData {
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

/// リソーススナップショットを収集する
/// CPU 使用率の正確な計測のため、2回 refresh の間に sleep を挟む
pub fn collect_snapshot(state: &State<'_, SharedState>) -> Result<SnapshotData, AppError> {
    // 1st lock: CPU refresh 1回目
    {
        let mut s = state
            .lock()
            .map_err(|e| AppError::Command(format!("Stateロックエラー: {}", e)))?;
        s.sys.refresh_cpu_all();
        s.sys.refresh_memory();
    }

    // Mutex の外で sleep（他コマンドをブロックしない）
    std::thread::sleep(std::time::Duration::from_millis(200));

    // 2nd lock: CPU refresh 2回目 + メトリクス収集
    let mut s = state
        .lock()
        .map_err(|e| AppError::Command(format!("Stateロックエラー: {}", e)))?;

    s.sys.refresh_cpu_all();
    s.sys
        .refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let cpu_percent = s.sys.global_cpu_usage();
    let cpu_temp_c = get_cpu_temperature();

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

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| AppError::Command(e.to_string()))?;

    Ok(SnapshotData {
        timestamp,
        cpu_percent,
        cpu_temp_c,
        mem_used_mb: used_memory / (1024 * 1024),
        mem_total_mb: total_memory / (1024 * 1024),
        disk_read_kb,
        disk_write_kb,
        net_recv_kb,
        net_sent_kb,
    })
}
