use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};

use sysinfo::{DiskKind, Disks, Process, ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::Duration;
use tracing::{debug, error, info, warn};

use crate::commands::hardware::HardwareInfo;
use crate::commands::ops::SystemProcess;
use crate::commands::pulse::ResourceSnapshot;
use crate::constants::is_protected_process;
use crate::services::game_monitor::ActiveGame;
use crate::state::AppState;

type ProcData = Option<(Vec<SystemProcess>, Vec<(u32, String)>)>;

#[derive(Debug, Default)]
struct ThermalState {
    last_alerts: Option<Vec<crate::services::thermal_monitor::ThermalAlert>>,
    last_alert_time: u64,
}

static THERMAL_STATE: LazyLock<Mutex<ThermalState>> =
    LazyLock::new(|| Mutex::new(ThermalState::default()));

pub async fn start(app: AppHandle) {
    const BASE_MS: u64 = 1000;
    let mut tick: u32 = 0;
    let state = app.state::<Mutex<AppState>>();
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
            };

            let procs: ProcData = if need_processes {
                let mut ops_list: Vec<SystemProcess> = s
                    .sys
                    .processes()
                    .values()
                    .map(|p: &Process| {
                        let name = p.name().to_string_lossy().to_string();
                        let can_terminate = !is_protected_process(&name);
                        // sysinfo の cpu_usage() はコアごとの使用率を返す（16コアなら最大1600%）
                        // タスクマネージャーと同じ「全体に対する割合」に正規化する
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

fn collect_hardware_info(app: &AppHandle) -> Result<HardwareInfo, String> {
    let (cpu_name, cpu_cores, cpu_threads, cpu_base_ghz, mem_total_gb, mem_used_gb, uptime_secs) = {
        let state = app.state::<Mutex<AppState>>();
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

        let (cpu_cores, cpu_threads) = if let Some(ref topology) = s.cpu_topology {
            (
                topology.physical_cores as u32,
                topology.logical_cores as u32,
            )
        } else {
            match crate::services::cpu_topology::detect_topology() {
                Ok(topology) => {
                    let cores = topology.physical_cores as u32;
                    let threads = topology.logical_cores as u32;
                    s.cpu_topology = Some(topology);
                    (cores, threads)
                }
                Err(_) => {
                    let logical = s.sys.cpus().len() as u32;
                    (logical, logical)
                }
            }
        };

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

    let cpu_temp_c = crate::services::hardware::get_cpu_temperature();
    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
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
        disks.push(crate::commands::hardware::DiskInfo {
            mount: disk.mount_point().to_string_lossy().to_string(),
            kind,
            total_gb: total as f32 / (1024.0_f32.powi(3)),
            used_gb: used as f32 / (1024.0_f32.powi(3)),
        });
    }
    disks.sort_by(|a, b| a.mount.cmp(&b.mount));

    let gpu_static = {
        let state = app.state::<Mutex<AppState>>();
        let mut s = state
            .lock()
            .map_err(|e| format!("Stateロックエラー: {}", e))?;

        if let Some(ref cached) = s.gpu_static {
            cached.clone()
        } else {
            let info = crate::services::hardware::get_gpu_static_info();
            s.gpu_static = Some(info.clone());
            info
        }
    };

    let gpu_static = if gpu_static.name.is_none() {
        warn!("unified_emitter: GPU名がNoneのため再取得を試みます");
        let info = crate::services::hardware::get_gpu_static_info();

        let state = app.state::<Mutex<AppState>>();
        if let Ok(mut s) = state.lock() {
            s.gpu_static = Some(info.clone());
        }

        if info.name.is_none() {
            warn!("unified_emitter: GPU情報の取得に失敗しました");
        }
        info
    } else {
        gpu_static
    };

    let gpu_dynamic = crate::services::hardware::get_gpu_dynamic_info();

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
        gpu_name: gpu_static.name,
        gpu_vram_total_mb: gpu_static.vram_total_mb,
        gpu_vram_used_mb: gpu_dynamic.vram_used_mb,
        gpu_temp_c: gpu_dynamic.temperature_c,
        gpu_usage_percent: gpu_dynamic.usage_percent,
    })
}

fn check_and_emit_thermal_alerts(
    app: &AppHandle,
    cpu_temp_c: Option<f32>,
    gpu_temp_c: Option<f32>,
) {
    let thresholds = &crate::constants::THERMAL_THRESHOLDS;
    let alerts =
        crate::services::thermal_monitor::check_thermal(cpu_temp_c, gpu_temp_c, thresholds);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    if alerts.is_empty() {
        let mut state = THERMAL_STATE.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(ref last_alerts) = state.last_alerts {
            let has_non_normal = last_alerts.iter().any(|a| {
                !matches!(
                    a.level,
                    crate::services::thermal_monitor::ThermalAlertLevel::Normal
                )
            });
            if has_non_normal && now.saturating_sub(state.last_alert_time) >= 30 {
                let normal_alerts = vec![
                    crate::services::thermal_monitor::ThermalAlert {
                        component: "CPU".to_string(),
                        level: crate::services::thermal_monitor::ThermalAlertLevel::Normal,
                        current_temp_c: cpu_temp_c.unwrap_or(0.0),
                        threshold_c: thresholds.cpu_warning_c,
                        message: "温度が正常範囲に戻りました".to_string(),
                        timestamp: now,
                    },
                    crate::services::thermal_monitor::ThermalAlert {
                        component: "GPU".to_string(),
                        level: crate::services::thermal_monitor::ThermalAlertLevel::Normal,
                        current_temp_c: gpu_temp_c.unwrap_or(0.0),
                        threshold_c: thresholds.gpu_warning_c,
                        message: "温度が正常範囲に戻りました".to_string(),
                        timestamp: now,
                    },
                ];

                for alert in &normal_alerts {
                    if let Err(e) = app.emit("nexus://thermal-alert", alert) {
                        error!("thermal_alert: イベント送信失敗: {}", e);
                    }
                }

                state.last_alerts = Some(normal_alerts);
                state.last_alert_time = now;
            }
        } else {
            state.last_alerts = None;
        }
        return;
    }

    let mut state = THERMAL_STATE.lock().unwrap_or_else(|e| e.into_inner());
    let should_emit = if let Some(ref last_alerts) = state.last_alerts {
        let alerts_changed = alerts.len() != last_alerts.len()
            || alerts
                .iter()
                .zip(last_alerts.iter())
                .any(|(current, last)| {
                    current.component != last.component
                        || current.level != last.level
                        || (current.timestamp - last.timestamp) >= 30
                });

        alerts_changed || now.saturating_sub(state.last_alert_time) >= 30
    } else {
        true
    };

    if should_emit {
        for alert in &alerts {
            if let Err(e) = app.emit("nexus://thermal-alert", alert) {
                error!("thermal_alert: イベント送信失敗: {}", e);
            } else {
                debug!(
                    component = %alert.component,
                    level = ?alert.level,
                    temp = alert.current_temp_c,
                    "thermal_alert: アラート送信"
                );
            }
        }

        state.last_alerts = Some(alerts);
        state.last_alert_time = now;
    }
}
