//! サーマルアラート処理

use std::sync::{LazyLock, Mutex};

use tauri::{AppHandle, Emitter};
use tracing::{debug, error};

#[derive(Debug, Default)]
struct ThermalState {
    last_alerts: Option<Vec<crate::services::thermal_monitor::ThermalAlert>>,
    last_alert_time: u64,
}

static THERMAL_STATE: LazyLock<Mutex<ThermalState>> =
    LazyLock::new(|| Mutex::new(ThermalState::default()));

pub(super) fn check_and_emit_thermal_alerts(
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
