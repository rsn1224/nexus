// ─── Settings Advisor Commands ─────────────────────────────────────

use crate::error::AppError;
use crate::services::settings_advisor::{analyze_settings, get_current_settings_snapshot};
use crate::types::game::CpuTopology;
use tracing::{info, warn};

use super::commands::{
    set_power_plan, set_visual_effects, toggle_fullscreen_optimization, toggle_game_mode,
    toggle_hardware_gpu_scheduling,
};
use super::types::{PowerPlan, VisualEffects};

#[tauri::command]
pub fn get_settings_advice() -> Result<crate::services::settings_advisor::AdvisorResult, AppError> {
    info!("get_settings_advice: generating settings recommendations");

    // Get CPU topology
    let topology = CpuTopology {
        physical_cores: 0,
        logical_cores: 0,
        p_cores: Vec::new(),
        e_cores: Vec::new(),
        ccd_groups: Vec::new(),
        hyperthreading_enabled: false,
        vendor_id: String::new(),
        brand: String::new(),
    };

    // Get hardware info for GPU and memory
    let gpu_name = None; // NOTE: v2 予定 — hardware service から取得
    let mem_total_gb = 0.0; // NOTE: v2 予定 — hardware service から取得

    // Get current settings
    let current_settings = get_current_settings_snapshot()
        .map_err(|e| AppError::Internal(format!("現在の設定の取得に失敗しました: {}", e)))?;

    // Convert to snapshot format expected by analyzer
    let snapshot = crate::services::settings_advisor::WindowsSettingsSnapshot {
        game_mode: current_settings.game_mode,
        hags: current_settings.hags,
        fullscreen_optimization: current_settings.fullscreen_optimization,
        visual_effects: current_settings.visual_effects.to_string(),
        power_plan: current_settings.power_plan.to_string(),
        memory_integrity: false, // NOTE: v2 予定 — メモリ整合性チェック
    };

    let result = analyze_settings(&topology, gpu_name, mem_total_gb, &snapshot);
    Ok(result)
}

#[tauri::command]
pub fn apply_recommendation(setting_id: String) -> Result<(), AppError> {
    info!("apply_recommendation: applying setting {}", setting_id);

    match setting_id.as_str() {
        "game_mode" => toggle_game_mode().map(|_| ()),
        "hags" => toggle_hardware_gpu_scheduling().map(|_| ()),
        "fullscreen_optimization" => toggle_fullscreen_optimization().map(|_| ()),
        "visual_effects" => set_visual_effects(VisualEffects::BestPerformance),
        "power_plan" => set_power_plan(PowerPlan::HighPerformance),
        "memory_integrity" => {
            // NOTE: v2 予定 — メモリ整合性設定
            warn!("Memory integrity setting not yet implemented");
            Ok(())
        }
        _ => Err(AppError::InvalidInput(format!(
            "Unknown setting ID: {}",
            setting_id
        ))),
    }
}
