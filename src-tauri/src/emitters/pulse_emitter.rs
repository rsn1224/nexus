use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{Duration, interval};
use tracing::{debug, error};

/// Pulse（リソーススナップショット）を定期的にフロントエンドへ配信する
///
/// setup フックから `tauri::async_runtime::spawn` で起動する。
/// `services::system_monitor::collect_snapshot` は `tauri::State` を要求するため、
/// ここでは `AppHandle::state::<SharedState>()` を使って直接 Managed State を取得する。
pub async fn start(app: AppHandle) {
    // Pulse 間隔: 2秒（旧 useSettingsStore.pollIntervalMs のデフォルト値）
    let mut tick = interval(Duration::from_secs(2));

    loop {
        tick.tick().await;

        let snapshot = {
            let state = app.state::<Mutex<crate::state::AppState>>();

            // 1st lock: CPU refresh 1回目
            {
                let mut s = match state.lock() {
                    Ok(s) => s,
                    Err(e) => {
                        error!("pulse_emitter: Stateロックエラー: {}", e);
                        continue;
                    }
                };
                s.sys.refresh_cpu_all();
                s.sys.refresh_memory();
            }

            // Mutex の外で sleep（他コマンドをブロックしない）
            tokio::time::sleep(Duration::from_millis(200)).await;

            // 2nd lock: CPU refresh 2回目 + メトリクス収集
            let mut s = match state.lock() {
                Ok(s) => s,
                Err(e) => {
                    error!("pulse_emitter: Stateロックエラー: {}", e);
                    continue;
                }
            };

            s.sys.refresh_cpu_all();
            s.sys
                .refresh_processes(sysinfo::ProcessesToUpdate::All, true);

            let cpu_percent = s.sys.global_cpu_usage();
            let cpu_temp_c = crate::services::hardware::get_cpu_temperature();

            let total_memory = s.sys.total_memory();
            let available_memory = s.sys.available_memory();
            let used_memory = total_memory.saturating_sub(available_memory);

            // Disk I/O 集計: 全プロセスの read/write bytes を合計し、前回値との差分で算出
            // sysinfo の Disks はディスク別の統計しか提供しないため、プロセス別から集計
            // refresh_processes() でプロセス情報は更新済みなので、追加コストは最小限
            let current_read: u64 = s
                .sys
                .processes()
                .values()
                .map(|p: &sysinfo::Process| p.disk_usage().read_bytes)
                .sum();
            let current_write: u64 = s
                .sys
                .processes()
                .values()
                .map(|p: &sysinfo::Process| p.disk_usage().written_bytes)
                .sum();

            let disk_read_kb = current_read.saturating_sub(s.last_disk_read) / 1024;
            let disk_write_kb = current_write.saturating_sub(s.last_disk_write) / 1024;

            s.last_disk_read = current_read;
            s.last_disk_write = current_write;

            s.networks.refresh();
            let net_recv_kb: u64 = s
                .networks
                .values()
                .map(|n: &sysinfo::NetworkData| n.received())
                .sum::<u64>()
                / 1024;
            let net_sent_kb: u64 = s
                .networks
                .values()
                .map(|n: &sysinfo::NetworkData| n.transmitted())
                .sum::<u64>()
                / 1024;

            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);

            crate::commands::pulse::ResourceSnapshot {
                timestamp,
                cpu_percent,
                cpu_temp_c,
                mem_used_mb: used_memory / (1024 * 1024),
                mem_total_mb: total_memory / (1024 * 1024),
                disk_read_kb,
                disk_write_kb,
                net_recv_kb,
                net_sent_kb,
            }
        };

        if let Err(e) = app.emit("nexus://pulse", &snapshot) {
            error!("pulse_emitter: イベント送信失敗: {}", e);
        } else {
            debug!(
                cpu = snapshot.cpu_percent,
                mem = snapshot.mem_used_mb,
                "pulse_emitter: スナップショット配信"
            );
        }
    }
}
