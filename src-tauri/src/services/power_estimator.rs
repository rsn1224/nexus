//! 消費電力推定サービス
//! CPU TDP + GPU TDP からリアルタイム消費電力を推定。
//! NVIDIA GPU は NVML 経由で実電力を取得可能。

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// TDP データベース（主要 CPU/GPU の定格 TDP）
/// 完全なリストは不要。パターンマッチで近似値を返す。
fn estimate_cpu_tdp(cpu_name: &str) -> u32 {
    let name = cpu_name.to_lowercase();
    // Intel 14th Gen
    if name.contains("14900") || name.contains("14700") {
        return 253;
    }
    if name.contains("14600") || name.contains("14400") {
        return 154;
    }
    // Intel 13th Gen
    if name.contains("13900") || name.contains("13700") {
        return 253;
    }
    if name.contains("13600") || name.contains("13400") {
        return 154;
    }
    // Intel 12th Gen
    if name.contains("12900") || name.contains("12700") {
        return 241;
    }
    if name.contains("12600") || name.contains("12400") {
        return 150;
    }
    // AMD Ryzen 9000
    if name.contains("9950x") || name.contains("9900x") {
        return 170;
    }
    if name.contains("9700x") || name.contains("9600x") {
        return 65;
    }
    // AMD Ryzen 7000
    if name.contains("7950x") || name.contains("7900x") {
        return 170;
    }
    if name.contains("7800x3d") || name.contains("7700x") {
        return 105;
    }
    if name.contains("7600x") || name.contains("7600") {
        return 105;
    }
    // AMD Ryzen 5000
    if name.contains("5950x") || name.contains("5900x") {
        return 140;
    }
    if name.contains("5800x") || name.contains("5700x") {
        return 105;
    }
    if name.contains("5600x") || name.contains("5600") {
        return 65;
    }
    // デフォルト
    125
}

fn estimate_gpu_tdp(gpu_name: &str) -> u32 {
    let name = gpu_name.to_lowercase();
    // NVIDIA RTX 50 Series
    if name.contains("5090") {
        return 600;
    }
    if name.contains("5080") {
        return 400;
    }
    if name.contains("5070 ti") {
        return 350;
    }
    if name.contains("5070") {
        return 285;
    }
    // NVIDIA RTX 40 Series
    if name.contains("4090") {
        return 450;
    }
    if name.contains("4080") {
        return 320;
    }
    if name.contains("4070 ti super") {
        return 285;
    }
    if name.contains("4070 ti") {
        return 285;
    }
    if name.contains("4070 super") {
        return 220;
    }
    if name.contains("4070") {
        return 200;
    }
    if name.contains("4060 ti") {
        return 165;
    }
    if name.contains("4060") {
        return 115;
    }
    // NVIDIA RTX 30 Series
    if name.contains("3090") {
        return 350;
    }
    if name.contains("3080") {
        return 320;
    }
    if name.contains("3070") {
        return 220;
    }
    if name.contains("3060") {
        return 170;
    }
    // AMD RX 7000 Series
    if name.contains("7900 xtx") {
        return 355;
    }
    if name.contains("7900 xt") {
        return 315;
    }
    if name.contains("7800 xt") {
        return 263;
    }
    if name.contains("7700 xt") {
        return 245;
    }
    if name.contains("7600") {
        return 150;
    }
    // AMD RX 6000 Series
    if name.contains("6950 xt") {
        return 335;
    }
    if name.contains("6900 xt") {
        return 300;
    }
    if name.contains("6800") {
        return 250;
    }
    if name.contains("6700") {
        return 220;
    }
    if name.contains("6600") {
        return 132;
    }
    // デフォルト
    200
}

/// 消費電力推定結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PowerEstimate {
    /// CPU 推定消費電力（W）
    pub cpu_power_w: f32,
    /// GPU 推定消費電力（W）
    pub gpu_power_w: f32,
    /// GPU 実測電力（NVML 経由、NVIDIA のみ。None = 取得不可）
    pub gpu_actual_power_w: Option<f32>,
    /// システム合計推定（CPU + GPU + 周辺 50W）
    pub total_estimated_w: f32,
    /// CPU TDP（定格）
    pub cpu_tdp_w: u32,
    /// GPU TDP（定格）
    pub gpu_tdp_w: u32,
    pub timestamp: u64,
}

/// エコモード設定
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EcoModeConfig {
    /// エコモード有効/無効
    pub enabled: bool,
    /// ターゲット FPS（エコモード時、0 = 制限なし）
    pub target_fps: u32,
    /// 電力プラン（エコモード時は Balanced 推奨）
    pub eco_power_plan: String,
    /// 月額電気代単価（円/kWh）
    pub electricity_rate_yen: f32,
}

/// 月間電気代概算
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyCostEstimate {
    /// 通常モード推定月額（円）
    pub normal_monthly_yen: f32,
    /// エコモード推定月額（円）
    pub eco_monthly_yen: f32,
    /// 節約額（円）
    pub savings_yen: f32,
    /// 前提: 1日のプレイ時間（時間）
    pub assumed_hours_per_day: f32,
}

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
    // 実際はアイドル時は TDP の 10% 程度、フルロードで 100%
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
/// TODO: NVML feature を実装
#[cfg(windows)]
fn get_nvidia_power() -> Option<f32> {
    // NVML が有効な場合のみ実装
    // NVML 経由で実電力を取得
    // ここで NVML ライブラリを使用して GPU 電力を取得
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

/// デフォルトのエコモード設定
impl Default for EcoModeConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            target_fps: 60,
            eco_power_plan: "Balanced".to_string(),
            electricity_rate_yen: 30.0, // 日本の平均電気代
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpu_tdp_estimation() {
        assert_eq!(estimate_cpu_tdp("Intel Core i9-14900K"), 253);
        assert_eq!(estimate_cpu_tdp("Intel Core i5-14600K"), 154);
        assert_eq!(estimate_cpu_tdp("AMD Ryzen 9 7950X"), 170);
        assert_eq!(estimate_cpu_tdp("AMD Ryzen 5 7600X"), 105);
        assert_eq!(estimate_cpu_tdp("Unknown CPU"), 125); // デフォルト値
    }

    #[test]
    fn test_gpu_tdp_estimation() {
        assert_eq!(estimate_gpu_tdp("NVIDIA RTX 4090"), 450);
        assert_eq!(estimate_gpu_tdp("NVIDIA RTX 4070"), 200);
        assert_eq!(estimate_gpu_tdp("NVIDIA RTX 3060"), 170);
        assert_eq!(estimate_gpu_tdp("AMD RX 7900 XTX"), 355);
        assert_eq!(estimate_gpu_tdp("AMD RX 6600"), 132);
        assert_eq!(estimate_gpu_tdp("Unknown GPU"), 200); // デフォルト値
    }

    #[test]
    fn test_power_estimation() {
        let estimate = estimate_power(
            "Intel Core i9-14900K",
            Some("NVIDIA RTX 4090"),
            50.0,       // 50% CPU
            Some(80.0), // 80% GPU
        );

        assert_eq!(estimate.cpu_tdp_w, 253);
        assert_eq!(estimate.gpu_tdp_w, 450);
        assert!(estimate.cpu_power_w > 0.0);
        assert!(estimate.gpu_power_w > 0.0);
        assert!(estimate.total_estimated_w > estimate.cpu_power_w + estimate.gpu_power_w);
        // 周辺機器分（50W）が加算されているはず
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

        // 400W * 3h * 30日 * 30円/kWh = 1080円
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
