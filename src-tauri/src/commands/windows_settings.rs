// Windows Wing — Windows設定最適化機能

use crate::error::AppError;
use crate::services::settings_advisor::{analyze_settings, get_current_settings_snapshot};
use crate::types::game::CpuTopology;
use serde::{Deserialize, Serialize};
use std::process::Command;
use tracing::{info, warn};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WindowsSettings {
    pub power_plan: PowerPlan,
    pub game_mode: bool,
    pub fullscreen_optimization: bool,
    pub hardware_gpu_scheduling: bool,
    pub visual_effects: VisualEffects,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum PowerPlan {
    Balanced,
    HighPerformance,
    PowerSaver,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum VisualEffects {
    BestPerformance,
    Balanced,
    BestAppearance,
}

impl std::fmt::Display for PowerPlan {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PowerPlan::Balanced => write!(f, "Balanced"),
            PowerPlan::HighPerformance => write!(f, "High Performance"),
            PowerPlan::PowerSaver => write!(f, "Power Saver"),
        }
    }
}

impl std::fmt::Display for VisualEffects {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VisualEffects::BestPerformance => write!(f, "Best Performance"),
            VisualEffects::Balanced => write!(f, "Balanced"),
            VisualEffects::BestAppearance => write!(f, "Best Appearance"),
        }
    }
}

#[tauri::command]
pub fn get_windows_settings() -> Result<WindowsSettings, AppError> {
    info!("get_windows_settings: collecting Windows settings");

    // 電源プラン取得
    let power_plan = get_current_power_plan()?;

    // ゲームモード取得
    let game_mode = get_game_mode_status()?;

    // フルスクリーン最適化取得
    let fullscreen_optimization = get_fullscreen_optimization_status()?;

    // ハードウェアGPUスケジューリング取得
    let hardware_gpu_scheduling = get_hardware_gpu_scheduling_status()?;

    // 視覚効果取得
    let visual_effects = get_visual_effects_setting()?;

    let settings = WindowsSettings {
        power_plan,
        game_mode,
        fullscreen_optimization,
        hardware_gpu_scheduling,
        visual_effects,
    };

    info!(
        power_plan = %settings.power_plan,
        game_mode = settings.game_mode,
        fullscreen_opt = settings.fullscreen_optimization,
        hardware_gpu_sched = settings.hardware_gpu_scheduling,
        visual_effects = %settings.visual_effects,
        "get_windows_settings: completed"
    );

    Ok(settings)
}

#[tauri::command]
pub fn set_power_plan(plan: PowerPlan) -> Result<(), AppError> {
    info!("set_power_plan: setting power plan to {}", plan);

    let plan_guid = match plan {
        PowerPlan::Balanced => "381b4222-f694-41f0-9685-ff5bb260df2e",
        PowerPlan::HighPerformance => "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
        PowerPlan::PowerSaver => "a1841308-3541-4fab-bc81-f71556f20b4a",
    };

    let output = Command::new("powercfg")
        .args(["/setactive", plan_guid])
        .output()
        .map_err(|e| {
            warn!("Failed to set power plan: {}", e);
            AppError::Command(format!("Failed to set power plan: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!("Powercfg failed: {}", stderr)));
    }

    info!("set_power_plan: successfully set power plan to {}", plan);
    Ok(())
}

#[tauri::command]
pub fn toggle_game_mode() -> Result<bool, AppError> {
    info!("toggle_game_mode: toggling game mode");

    let current_status = get_game_mode_status()?;
    let new_status = !current_status;

    let reg_value = if new_status { "1" } else { "0" };

    let output = Command::new("reg")
        .args([
            "add",
            "HKCU\\SOFTWARE\\Microsoft\\GameBar",
            "/v",
            "AllowAutoGameMode",
            "/t",
            "REG_DWORD",
            "/d",
            reg_value,
            "/f",
        ])
        .output()
        .map_err(|e| {
            warn!("Failed to toggle game mode: {}", e);
            AppError::Command(format!("Failed to toggle game mode: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "Game mode toggle failed: {}",
            stderr
        )));
    }

    info!(
        "toggle_game_mode: successfully set game mode to {}",
        new_status
    );
    Ok(new_status)
}

#[tauri::command]
pub fn toggle_fullscreen_optimization() -> Result<bool, AppError> {
    info!("toggle_fullscreen_optimization: toggling fullscreen optimization");

    let current_status = get_fullscreen_optimization_status()?;
    let new_status = !current_status;

    let reg_value = if new_status { "1" } else { "0" };

    let output = Command::new("reg")
        .args([
            "add",
            "HKCU\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers",
            "/v",
            "DwmFlushEnabled",
            "/t",
            "REG_DWORD",
            "/d",
            reg_value,
            "/f",
        ])
        .output()
        .map_err(|e| {
            warn!("Failed to toggle fullscreen optimization: {}", e);
            AppError::Command(format!("Failed to toggle fullscreen optimization: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "Fullscreen optimization toggle failed: {}",
            stderr
        )));
    }

    info!(
        "toggle_fullscreen_optimization: successfully set fullscreen optimization to {}",
        new_status
    );
    Ok(new_status)
}

#[tauri::command]
pub fn toggle_hardware_gpu_scheduling() -> Result<bool, AppError> {
    info!("toggle_hardware_gpu_scheduling: toggling hardware GPU scheduling");

    let current_status = get_hardware_gpu_scheduling_status()?;
    let new_status = !current_status;

    let reg_value = if new_status { "1" } else { "0" };

    let output = Command::new("reg")
        .args([
            "add",
            "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers",
            "/v",
            "HwSchMode",
            "/t",
            "REG_DWORD",
            "/d",
            reg_value,
            "/f",
        ])
        .output()
        .map_err(|e| {
            warn!("Failed to toggle hardware GPU scheduling: {}", e);
            AppError::Command(format!("Failed to toggle hardware GPU scheduling: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "Hardware GPU scheduling toggle failed: {}",
            stderr
        )));
    }

    info!(
        "toggle_hardware_gpu_scheduling: successfully set hardware GPU scheduling to {}",
        new_status
    );
    Ok(new_status)
}

#[tauri::command]
pub fn set_visual_effects(effect: VisualEffects) -> Result<(), AppError> {
    info!("set_visual_effects: setting visual effects to {}", effect);

    let reg_value = match effect {
        VisualEffects::BestPerformance => "2",
        VisualEffects::Balanced => "1",
        VisualEffects::BestAppearance => "0",
    };

    let output = Command::new("reg")
        .args([
            "add",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects",
            "/v",
            "VisualFXSetting",
            "/t",
            "REG_DWORD",
            "/d",
            reg_value,
            "/f",
        ])
        .output()
        .map_err(|e| {
            warn!("Failed to set visual effects: {}", e);
            AppError::Command(format!("Failed to set visual effects: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "Visual effects setting failed: {}",
            stderr
        )));
    }

    info!(
        "set_visual_effects: successfully set visual effects to {}",
        effect
    );
    Ok(())
}

// ヘルパー関数
fn get_current_power_plan() -> Result<PowerPlan, AppError> {
    let output = Command::new("powercfg")
        .args(["/getactivescheme"])
        .output()
        .map_err(|e| AppError::Command(format!("Failed to get power plan: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!("Powercfg failed: {}", stderr)));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // 出力から電源プラン名を抽出
    if stdout.contains("High Performance") || stdout.contains("高性能") {
        Ok(PowerPlan::HighPerformance)
    } else if stdout.contains("Power Saver") || stdout.contains("節電") {
        Ok(PowerPlan::PowerSaver)
    } else {
        Ok(PowerPlan::Balanced)
    }
}

fn get_game_mode_status() -> Result<bool, AppError> {
    let output = Command::new("reg")
        .args([
            "query",
            "HKCU\\SOFTWARE\\Microsoft\\GameBar",
            "/v",
            "AllowAutoGameMode",
        ])
        .output()
        .map_err(|e| AppError::Command(format!("Failed to query game mode: {}", e)))?;

    if !output.status.success() {
        // レジストリキーが存在しない場合、デフォルトで有効とみなす
        warn!("Game mode registry key not found, assuming enabled");
        return Ok(true);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.contains("0x1"))
}

fn get_fullscreen_optimization_status() -> Result<bool, AppError> {
    let output = Command::new("reg")
        .args([
            "query",
            "HKCU\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers",
            "/v",
            "DwmFlushEnabled",
        ])
        .output()
        .map_err(|e| {
            AppError::Command(format!("Failed to query fullscreen optimization: {}", e))
        })?;

    if !output.status.success() {
        // レジストリキーが存在しない場合、デフォルトで有効とみなす
        warn!("Fullscreen optimization registry key not found, assuming enabled");
        return Ok(true);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.contains("0x1"))
}

fn get_hardware_gpu_scheduling_status() -> Result<bool, AppError> {
    let output = Command::new("reg")
        .args([
            "query",
            "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers",
            "/v",
            "HwSchMode",
        ])
        .output()
        .map_err(|e| {
            AppError::Command(format!("Failed to query hardware GPU scheduling: {}", e))
        })?;

    if !output.status.success() {
        // レジストリキーが存在しない場合、デフォルトで無効とみなす
        warn!("Hardware GPU scheduling registry key not found, assuming disabled");
        return Ok(false);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.contains("0x1"))
}

fn get_visual_effects_setting() -> Result<VisualEffects, AppError> {
    let output = Command::new("reg")
        .args([
            "query",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects",
            "/v",
            "VisualFXSetting",
        ])
        .output()
        .map_err(|e| AppError::Command(format!("Failed to query visual effects: {}", e)))?;

    if !output.status.success() {
        // レジストリキーが存在しない場合、デフォルトでBalancedとみなす
        warn!("Visual effects registry key not found, assuming balanced");
        return Ok(VisualEffects::Balanced);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // 出力に "0x2" を含む → BestPerformance
    // 出力に "0x0" を含む → BestAppearance
    // それ以外 → Balanced
    if stdout.contains("0x2") {
        Ok(VisualEffects::BestPerformance)
    } else if stdout.contains("0x0") {
        Ok(VisualEffects::BestAppearance)
    } else {
        Ok(VisualEffects::Balanced)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_power_plan_display() {
        assert_eq!(PowerPlan::Balanced.to_string(), "Balanced");
        assert_eq!(PowerPlan::HighPerformance.to_string(), "High Performance");
        assert_eq!(PowerPlan::PowerSaver.to_string(), "Power Saver");
    }

    #[test]
    fn test_visual_effects_display() {
        assert_eq!(
            VisualEffects::BestPerformance.to_string(),
            "Best Performance"
        );
        assert_eq!(VisualEffects::Balanced.to_string(), "Balanced");
        assert_eq!(VisualEffects::BestAppearance.to_string(), "Best Appearance");
    }

    #[test]
    fn test_windows_settings_serialization() {
        let settings = WindowsSettings {
            power_plan: PowerPlan::HighPerformance,
            game_mode: true,
            fullscreen_optimization: false,
            hardware_gpu_scheduling: true,
            visual_effects: VisualEffects::Balanced,
        };

        // シリアライズ・デシリアライズテスト
        let json = serde_json::to_string(&settings).unwrap();
        let deserialized: WindowsSettings = serde_json::from_str(&json).unwrap();

        assert_eq!(settings.power_plan, deserialized.power_plan);
        assert_eq!(settings.game_mode, deserialized.game_mode);
        assert_eq!(
            settings.fullscreen_optimization,
            deserialized.fullscreen_optimization
        );
        assert_eq!(
            settings.hardware_gpu_scheduling,
            deserialized.hardware_gpu_scheduling
        );
        assert_eq!(settings.visual_effects, deserialized.visual_effects);
    }
}

// ─── Settings Advisor Commands ─────────────────────────────────────

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
    let gpu_name = None; // TODO: Get from hardware service
    let mem_total_gb = 0.0; // TODO: Get from hardware service

    // Get current settings
    let current_settings = get_current_settings_snapshot()
        .map_err(|e| AppError::Internal(format!("Failed to get current settings: {}", e)))?;

    // Convert to snapshot format expected by analyzer
    let snapshot = crate::services::settings_advisor::WindowsSettingsSnapshot {
        game_mode: current_settings.game_mode,
        hags: current_settings.hags,
        fullscreen_optimization: current_settings.fullscreen_optimization,
        visual_effects: current_settings.visual_effects.to_string(),
        power_plan: current_settings.power_plan.to_string(),
        memory_integrity: false, // TODO: Implement memory integrity check
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
            // TODO: Implement memory integrity setting
            warn!("Memory integrity setting not yet implemented");
            Ok(())
        }
        _ => Err(AppError::InvalidInput(format!(
            "Unknown setting ID: {}",
            setting_id
        ))),
    }
}
