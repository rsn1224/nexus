use crate::commands::hardware::HardwareInfo;
use std::sync::{LazyLock, Mutex};
use sysinfo::{DiskKind, Disks, System};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{Duration, interval};
use tracing::{debug, error, warn};

/// サーマルアラートの状態管理
#[derive(Debug, Default)]
struct ThermalState {
    last_alerts: Option<Vec<crate::services::thermal_monitor::ThermalAlert>>,
    last_alert_time: u64,
}

static THERMAL_STATE: LazyLock<Mutex<ThermalState>> =
    LazyLock::new(|| Mutex::new(ThermalState::default()));

/// ハードウェア情報を定期的にフロントエンドへ配信する
pub async fn start(app: AppHandle) {
    // ハードウェア更新間隔: 5秒（旧 useHardwareStore の固定値と同じ）
    let mut tick = interval(Duration::from_secs(5));

    loop {
        tick.tick().await;

        let info = collect_hardware_info(&app);

        match info {
            Ok(hw) => {
                // サーマルアラートチェック
                check_and_emit_thermal_alerts(&app, hw.cpu_temp_c, hw.gpu_temp_c);

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

        // CPU トポロジーをキャッシュから取得、なければ検出してキャッシュ
        let (cpu_cores, cpu_threads) = if let Some(ref topology) = s.cpu_topology {
            (
                topology.physical_cores as u32,
                topology.logical_cores as u32,
            )
        } else {
            // CPU トポロジーを検出してキャッシュ
            match crate::services::cpu_topology::detect_topology() {
                Ok(topology) => {
                    let cores = topology.physical_cores as u32;
                    let threads = topology.logical_cores as u32;
                    s.cpu_topology = Some(topology);
                    (cores, threads)
                }
                Err(_) => {
                    // フォールバック: sysinfo の論理コア数を使用
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

    // GPU情報（静的情報はキャッシュ、動的情報は毎回取得）
    let gpu_static = {
        let state = app.state::<Mutex<crate::state::AppState>>();
        let mut s = state
            .lock()
            .map_err(|e| format!("Stateロックエラー: {}", e))?;

        // キャッシュがあれば使用、なければ取得してキャッシュ
        if let Some(ref cached) = s.gpu_static {
            cached.clone()
        } else {
            let info = crate::services::hardware::get_gpu_static_info();
            s.gpu_static = Some(info.clone());
            info
        }
    };

    // GPU名がNoneの場合は再取得を試みる
    let gpu_static = if gpu_static.name.is_none() {
        warn!("hardware_emitter: GPU名がNoneのため再取得を試みます");
        let info = crate::services::hardware::get_gpu_static_info();

        // 再取得した結果をキャッシュに保存
        let state = app.state::<Mutex<crate::state::AppState>>();
        if let Ok(mut s) = state.lock() {
            s.gpu_static = Some(info.clone());
        }

        if info.name.is_none() {
            warn!("hardware_emitter: GPU情報の取得に失敗しました");
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

/// サーマルアラートをチェックしてemitする
/// 同じアラートの連続emitを防止し、最低30秒間隔を空ける
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

    // アラートがない場合、前回のアラートがNormalでなければNormalをemit
    if alerts.is_empty() {
        let mut state = THERMAL_STATE.lock().unwrap();
        if let Some(ref last_alerts) = state.last_alerts {
            // 前回のアラートがあり、すべてNormalでなければ復帰通知
            let has_non_normal = last_alerts.iter().any(|a| {
                !matches!(
                    a.level,
                    crate::services::thermal_monitor::ThermalAlertLevel::Normal
                )
            });
            if has_non_normal && now.saturating_sub(state.last_alert_time) >= 30 {
                // Normalアラートを生成してemit
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
            // 初回または前回アラートなし
            state.last_alerts = None;
        }
        return;
    }

    // アラートがある場合、前回と同じか30秒経過しているかチェック
    let mut state = THERMAL_STATE.lock().unwrap();
    let should_emit = if let Some(ref last_alerts) = state.last_alerts {
        // アラート内容に変化があるかチェック
        let alerts_changed = alerts.len() != last_alerts.len()
            || alerts
                .iter()
                .zip(last_alerts.iter())
                .any(|(current, last)| {
                    current.component != last.component
                        || current.level != last.level
                        || (current.timestamp - last.timestamp) >= 30 // 30秒以上経過
                });

        alerts_changed || now.saturating_sub(state.last_alert_time) >= 30
    } else {
        true // 初回アラート
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
