//! ボトルネック判定コマンド

use crate::error::AppError;
use crate::services::bottleneck::{self, BottleneckInput, BottleneckResult};
use serde::Deserialize;

/// フロントエンドから受け取るボトルネック判定リクエスト
/// pulse + hardware + frameTime のデータを統合して渡す
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BottleneckRequest {
    pub avg_fps: f64,
    pub pct_1_low: f64,
    pub stutter_count: u32,
    pub frame_times: Vec<f64>,
    pub cpu_percent: f32,
    pub gpu_usage_percent: Option<f32>,
    pub gpu_temp_c: Option<f32>,
    pub mem_used_mb: u64,
    pub mem_total_mb: u64,
    pub gpu_vram_used_mb: Option<u32>,
    pub gpu_vram_total_mb: Option<u32>,
    pub disk_read_kb: u64,
    pub disk_write_kb: u64,
}

/// ボトルネック判定を実行
#[tauri::command]
pub fn analyze_bottleneck(request: BottleneckRequest) -> Result<BottleneckResult, AppError> {
    let input = BottleneckInput {
        avg_fps: request.avg_fps,
        pct_1_low: request.pct_1_low,
        stutter_count: request.stutter_count,
        frame_times: request.frame_times,
        cpu_percent: request.cpu_percent,
        gpu_usage_percent: request.gpu_usage_percent,
        gpu_temp_c: request.gpu_temp_c,
        mem_used_mb: request.mem_used_mb,
        mem_total_mb: request.mem_total_mb,
        gpu_vram_used_mb: request.gpu_vram_used_mb,
        gpu_vram_total_mb: request.gpu_vram_total_mb,
        disk_read_kb: request.disk_read_kb,
        disk_write_kb: request.disk_write_kb,
    };

    Ok(bottleneck::analyze(&input))
}
