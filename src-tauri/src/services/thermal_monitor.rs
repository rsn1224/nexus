//! サーマルスロットリング検知サービス
//!
//! hardware_emitter から受け取った温度データを監視し、
//! 閾値超過・スロットリング発生を検知する。

use serde::{Deserialize, Serialize};

/// スロットリングアラートの種別
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ThermalAlertLevel {
    /// 警告（閾値超過、まだスロットリングは未発生）
    Warning,
    /// クリティカル（スロットリングが発生中）
    Critical,
    /// 正常（閾値以下に復帰）
    Normal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThermalAlert {
    pub component: String, // "CPU" or "GPU"
    pub level: ThermalAlertLevel,
    pub current_temp_c: f32,
    pub threshold_c: f32,
    pub message: String,
    pub timestamp: u64,
}

// constants.rsのThermalThresholdsを再エクスポート
pub use crate::constants::ThermalThresholds;

/// 温度をチェックしてアラートを生成
pub fn check_thermal(
    cpu_temp_c: Option<f32>,
    gpu_temp_c: Option<f32>,
    thresholds: &ThermalThresholds,
) -> Vec<ThermalAlert> {
    let mut alerts = Vec::new();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    if let Some(temp) = cpu_temp_c {
        if temp >= thresholds.cpu_critical_c {
            alerts.push(ThermalAlert {
                component: "CPU".to_string(),
                level: ThermalAlertLevel::Critical,
                current_temp_c: temp,
                threshold_c: thresholds.cpu_critical_c,
                message: format!(
                    "CPU 温度が {}℃ に達しました。サーマルスロットリングが発生している可能性があります",
                    temp as u32
                ),
                timestamp: now,
            });
        } else if temp >= thresholds.cpu_warning_c {
            alerts.push(ThermalAlert {
                component: "CPU".to_string(),
                level: ThermalAlertLevel::Warning,
                current_temp_c: temp,
                threshold_c: thresholds.cpu_warning_c,
                message: format!(
                    "CPU 温度が {}℃ です。冷却状態を確認してください",
                    temp as u32
                ),
                timestamp: now,
            });
        }
    }

    if let Some(temp) = gpu_temp_c {
        if temp >= thresholds.gpu_critical_c {
            alerts.push(ThermalAlert {
                component: "GPU".to_string(),
                level: ThermalAlertLevel::Critical,
                current_temp_c: temp,
                threshold_c: thresholds.gpu_critical_c,
                message: format!(
                    "GPU 温度が {}℃ に達しました。サーマルスロットリングが発生している可能性があります",
                    temp as u32
                ),
                timestamp: now,
            });
        } else if temp >= thresholds.gpu_warning_c {
            alerts.push(ThermalAlert {
                component: "GPU".to_string(),
                level: ThermalAlertLevel::Warning,
                current_temp_c: temp,
                threshold_c: thresholds.gpu_warning_c,
                message: format!(
                    "GPU 温度が {}℃ です。冷却状態を確認してください",
                    temp as u32
                ),
                timestamp: now,
            });
        }
    }

    alerts
}
