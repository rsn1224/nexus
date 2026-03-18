use crate::commands::ops::SystemProcess;
use crate::constants::is_protected_process;
use std::sync::Mutex;
use sysinfo::{Process, ProcessesToUpdate};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{interval, Duration};
use tracing::{debug, error};

/// プロセス一覧を定期的にフロントエンドへ配信する
pub async fn start(app: AppHandle) {
    // プロセス更新間隔: 3秒（旧 useOpsStore の固定値と同じ）
    let mut tick = interval(Duration::from_secs(3));

    loop {
        tick.tick().await;

        let processes = {
            let state = app.state::<Mutex<crate::state::AppState>>();
            let mut s = match state.lock() {
                Ok(s) => s,
                Err(e) => {
                    error!("ops_emitter: Stateロックエラー: {}", e);
                    continue;
                }
            };

            s.sys.refresh_processes(ProcessesToUpdate::All, true);

            let mut list: Vec<SystemProcess> = s
                .sys
                .processes()
                .values()
                .map(|p: &Process| {
                    let name = p.name().to_string_lossy().to_string();
                    let can_terminate = !is_protected_process(&name);
                    SystemProcess {
                        pid: p.pid().as_u32(),
                        name,
                        cpu_percent: p.cpu_usage(),
                        mem_mb: p.memory() as f64 / 1024.0 / 1024.0,
                        disk_read_kb: p.disk_usage().read_bytes as f64 / 1024.0,
                        disk_write_kb: p.disk_usage().written_bytes as f64 / 1024.0,
                        can_terminate,
                    }
                })
                .collect();

            list.sort_by(|a, b| {
                b.cpu_percent
                    .partial_cmp(&a.cpu_percent)
                    .unwrap_or(std::cmp::Ordering::Equal)
            });
            list.truncate(100);
            list
        };

        if let Err(e) = app.emit("nexus://ops", &processes) {
            error!("ops_emitter: イベント送信失敗: {}", e);
        } else {
            debug!(count = processes.len(), "ops_emitter: プロセス一覧配信");
        }
    }
}
