//! メイン emitter ループ（1秒サイクル）

use std::collections::HashMap;

use sysinfo::{Process, ProcessesToUpdate};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::Duration;
use tracing::{debug, error, info};

use crate::commands::ops::SystemProcess;
use crate::commands::pulse::ResourceSnapshot;
use crate::constants::is_protected_process;
use crate::services::game_monitor::ActiveGame;
use crate::state::AppState;

use super::hardware_collector::collect_hardware_info;
use super::thermal::check_and_emit_thermal_alerts;

pub(super) type ProcData = Option<(Vec<SystemProcess>, Vec<(u32, String)>)>;

pub async fn start(app: AppHandle) {
    const BASE_MS: u64 = 1000;
    let mut tick: u32 = 0;
    let state = app.state::<std::sync::Mutex<AppState>>();
    let mut active_games: HashMap<u32, ActiveGame> = HashMap::new();

    info!("unified_emitter: 起動（base=1s, pulse=2s, ops=3s, hardware=5s）");

    loop {
        let cycle_start = tokio::time::Instant::now();
        tick = tick.wrapping_add(1);

        // ─── [1] CPU 1回目（ロック取得・即解放）────────────────────────────
        {
            let mut s = state.lock().unwrap_or_else(|e| e.into_inner());
            s.sys.refresh_cpu_all();
            s.sys.refresh_memory();
        }

        // ─── [2] 200ms 待機（ロックの外 — 他コマンドを通す）────────────────
        tokio::time::sleep(Duration::from_millis(200)).await;

        // ─── [3] CPU 2回目 + 共通データ収集 ─────────────────────────────────
        let need_processes = tick.is_multiple_of(2) || tick.is_multiple_of(3);

        let (snapshot, maybe_procs, game_monitor_active) = {
            let mut s = state.lock().unwrap_or_else(|e| e.into_inner());
            s.sys.refresh_cpu_all();
            if need_processes {
                s.sys.refresh_processes(ProcessesToUpdate::All, true);
            }
            s.networks.refresh();

            let cpu_percent = s.sys.global_cpu_usage();
            let cpu_temp_c = crate::services::hardware::get_cpu_temperature();

            let total_memory = s.sys.total_memory();
            let available_memory = s.sys.available_memory();
            let used_memory = total_memory.saturating_sub(available_memory);

            // Disk I/O: pulse 間隔（tick%2==0）のみ更新して 2 秒デルタを維持
            let (disk_read_kb, disk_write_kb) = if tick.is_multiple_of(2) {
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
                let read_kb = current_read.saturating_sub(s.last_disk_read) / 1024;
                let write_kb = current_write.saturating_sub(s.last_disk_write) / 1024;
                s.last_disk_read = current_read;
                s.last_disk_write = current_write;
                (read_kb, write_kb)
            } else {
                (0u64, 0u64)
            };

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

            // GPU 動的データを取得
            let gpu_dynamic = crate::services::hardware::get_gpu_dynamic_info();

            let snap = ResourceSnapshot {
                timestamp,
                cpu_percent,
                cpu_temp_c,
                mem_used_mb: used_memory / (1024 * 1024),
                mem_total_mb: total_memory / (1024 * 1024),
                disk_read_kb,
                disk_write_kb,
                net_recv_kb,
                net_sent_kb,
                gpu_usage_percent: gpu_dynamic.usage_percent,
                gpu_temp_c: gpu_dynamic.temperature_c,
                gpu_vram_used_mb: gpu_dynamic.vram_used_mb,
            };

            let procs: ProcData = if need_processes {
                let mut ops_list: Vec<SystemProcess> = s
                    .sys
                    .processes()
                    .values()
                    .map(|p: &Process| {
                        let name = p.name().to_string_lossy().to_string();
                        let can_terminate = !is_protected_process(&name);
                        let num_cpus = s.sys.cpus().len().max(1) as f32;
                        SystemProcess {
                            pid: p.pid().as_u32(),
                            name,
                            cpu_percent: p.cpu_usage() / num_cpus,
                            mem_mb: p.memory() as f64 / 1024.0 / 1024.0,
                            disk_read_kb: p.disk_usage().read_bytes as f64 / 1024.0,
                            disk_write_kb: p.disk_usage().written_bytes as f64 / 1024.0,
                            can_terminate,
                        }
                    })
                    .collect();
                ops_list.sort_by(|a, b| {
                    b.cpu_percent
                        .partial_cmp(&a.cpu_percent)
                        .unwrap_or(std::cmp::Ordering::Equal)
                });
                ops_list.truncate(100);

                let pid_names: Vec<(u32, String)> = s
                    .sys
                    .processes()
                    .values()
                    .map(|p: &Process| (p.pid().as_u32(), p.name().to_string_lossy().to_string()))
                    .collect();

                Some((ops_list, pid_names))
            } else {
                None
            };

            (snap, procs, s.game_monitor_active)
        };

        // ─── [4] Pulse emit（tick % 2 == 0 → 2 秒）──────────────────────────
        if tick.is_multiple_of(2) {
            if let Err(e) = app.emit("nexus://pulse", &snapshot) {
                error!("unified_emitter: pulse 送信失敗: {}", e);
            } else {
                debug!(
                    cpu = snapshot.cpu_percent,
                    mem = snapshot.mem_used_mb,
                    "unified_emitter: pulse emit"
                );
            }
        }

        // ─── [5] Ops + game_monitor（tick % 3 == 0 → 3 秒）──────────────────
        if tick.is_multiple_of(3) {
            if let Some((ref ops_list, ref pid_names)) = maybe_procs {
                if let Err(e) = app.emit("nexus://ops", ops_list) {
                    error!("unified_emitter: ops 送信失敗: {}", e);
                } else {
                    debug!(count = ops_list.len(), "unified_emitter: ops emit");
                }
                if game_monitor_active {
                    crate::services::game_monitor::check_once(pid_names, &app, &mut active_games)
                        .await;
                }
            }
        }

        // ─── [6] Hardware + thermal（tick % 5 == 0 → 5 秒）──────────────────
        if tick.is_multiple_of(5) {
            match collect_hardware_info(&app) {
                Ok(hw) => {
                    check_and_emit_thermal_alerts(&app, hw.cpu_temp_c, hw.gpu_temp_c);
                    if let Err(e) = app.emit("nexus://hardware", &hw) {
                        error!("unified_emitter: hardware 送信失敗: {}", e);
                    } else {
                        debug!(cpu = %hw.cpu_name, "unified_emitter: hardware emit");
                    }
                }
                Err(e) => error!("unified_emitter: hardware 収集失敗: {}", e),
            }
        }

        // ─── [7] 残余 sleep（1 秒サイクルを維持）────────────────────────────
        let elapsed = cycle_start.elapsed();
        let remaining = Duration::from_millis(BASE_MS).saturating_sub(elapsed);
        if !remaining.is_zero() {
            tokio::time::sleep(remaining).await;
        }
    }
}
