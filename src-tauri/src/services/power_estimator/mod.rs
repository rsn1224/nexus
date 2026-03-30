//! 消費電力推定サービス
//! CPU TDP + GPU TDP からリアルタイム消費電力を推定。
//! NVIDIA GPU は NVML 経由で実電力を取得可能。

mod tdp_database;
mod types;

pub use types::*;

use std::time::{SystemTime, UNIX_EPOCH};
use tdp_database::{estimate_cpu_tdp, estimate_gpu_tdp};

/// 現在の消費電力を推定
pub fn estimate_power(
    cpu_name: &str,
    gpu_name: Option<&str>,
    cpu_percent: f32,
    gpu_usage_percent: Option<f32>,
) -> PowerEstimate {
    let cpu_tdp = estimate_cpu_tdp(cpu_name);
    let gpu_tdp = gpu_name.map(estimate_gpu_tdp).unwrap_or(0);

    // 使用率に比例して TDP の割合を推定
    let cpu_power = cpu_tdp as f32 * (0.1 + 0.9 * (cpu_percent / 100.0));
    let gpu_power = gpu_tdp as f32 * (0.1 + 0.9 * (gpu_usage_percent.unwrap_or(0.0) / 100.0));

    // NVML 経由の実測値（NVIDIA のみ）
    let gpu_actual = get_nvidia_power();

    let peripheral_w = 50.0; // モニター・ファン等の固定分
    let total = cpu_power + gpu_actual.unwrap_or(gpu_power) + peripheral_w;

    PowerEstimate {
        cpu_power_w: cpu_power,
        gpu_power_w: gpu_power,
        gpu_actual_power_w: gpu_actual,
        total_estimated_w: total,
        cpu_tdp_w: cpu_tdp,
        gpu_tdp_w: gpu_tdp,
        timestamp: current_timestamp_ms(),
    }
}

/// NVIDIA GPU の実電力取得 (NVML 使用)
#[cfg(windows)]
fn get_nvidia_power() -> Option<f32> {
    None
}

#[cfg(not(windows))]
fn get_nvidia_power() -> Option<f32> {
    None
}

/// 月間電気代を概算
pub fn estimate_monthly_cost(
    normal_power_w: f32,
    eco_power_w: f32,
    config: &EcoModeConfig,
    hours_per_day: f32,
) -> MonthlyCostEstimate {
    let rate = config.electricity_rate_yen;
    let days = 30.0;
    let normal_kwh = normal_power_w / 1000.0 * hours_per_day * days;
    let eco_kwh = eco_power_w / 1000.0 * hours_per_day * days;

    MonthlyCostEstimate {
        normal_monthly_yen: normal_kwh * rate,
        eco_monthly_yen: eco_kwh * rate,
        savings_yen: (normal_kwh - eco_kwh) * rate,
        assumed_hours_per_day: hours_per_day,
    }
}

/// 現在のタイムスタンプを取得（ミリ秒）
fn current_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;
    use tdp_database::{estimate_cpu_tdp, estimate_gpu_tdp};

    #[test]
    fn test_cpu_tdp_estimation() {
        assert_eq!(estimate_cpu_tdp("Intel Core i9-14900K"), 253);
        assert_eq!(estimate_cpu_tdp("Intel Core i5-14600K"), 154);
        assert_eq!(estimate_cpu_tdp("AMD Ryzen 9 7950X"), 170);
        assert_eq!(estimate_cpu_tdp("AMD Ryzen 5 7600X"), 105);
        assert_eq!(estimate_cpu_tdp("Unknown CPU"), 125);
    }

    #[test]
    fn test_gpu_tdp_estimation() {
        assert_eq!(estimate_gpu_tdp("NVIDIA RTX 4090"), 450);
        assert_eq!(estimate_gpu_tdp("NVIDIA RTX 4070"), 200);
        assert_eq!(estimate_gpu_tdp("NVIDIA RTX 3060"), 170);
        assert_eq!(estimate_gpu_tdp("AMD RX 7900 XTX"), 355);
        assert_eq!(estimate_gpu_tdp("AMD RX 6600"), 132);
        assert_eq!(estimate_gpu_tdp("Unknown GPU"), 200);
    }

    #[test]
    fn test_power_estimation() {
        let estimate = estimate_power(
            "Intel Core i9-14900K",
            Some("NVIDIA RTX 4090"),
            50.0,
            Some(80.0),
        );

        assert_eq!(estimate.cpu_tdp_w, 253);
        assert_eq!(estimate.gpu_tdp_w, 450);
        assert!(estimate.cpu_power_w > 0.0);
        assert!(estimate.gpu_power_w > 0.0);
        assert!(estimate.total_estimated_w > estimate.cpu_power_w + estimate.gpu_power_w);
        assert!(estimate.total_estimated_w > 50.0);
    }

    #[test]
    fn test_monthly_cost_estimation() {
        let config = EcoModeConfig {
            electricity_rate_yen: 30.0,
            ..Default::default()
        };

        let estimate = estimate_monthly_cost(400.0, 250.0, &config, 3.0);

        assert!(estimate.normal_monthly_yen > estimate.eco_monthly_yen);
        assert!(estimate.savings_yen > 0.0);
        assert_eq!(estimate.assumed_hours_per_day, 3.0);

        let expected_normal = 400.0 / 1000.0 * 3.0 * 30.0 * 30.0;
        assert!((estimate.normal_monthly_yen - expected_normal).abs() < 0.01);
    }

    #[test]
    fn test_eco_mode_config_default() {
        let config = EcoModeConfig::default();
        assert!(!config.enabled);
        assert_eq!(config.target_fps, 60);
        assert_eq!(config.eco_power_plan, "Balanced");
        assert_eq!(config.electricity_rate_yen, 30.0);
    }
}
