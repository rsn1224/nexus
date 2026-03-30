//! 消費電力推定の型定義

use serde::{Deserialize, Serialize};

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
