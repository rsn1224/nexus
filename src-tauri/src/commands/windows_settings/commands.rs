// Windows Wing — Windows設定コマンド

use crate::error::AppError;
use std::process::Command;
use tracing::{info, warn};

use super::helpers::*;
use super::types::{PowerPlan, VisualEffects, WindowsSettings};

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
            AppError::Command(format!("電源プランの設定に失敗しました: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!("powercfg が失敗しました: {}", stderr)));
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
            AppError::Command(format!("ゲームモードの切り替えに失敗しました: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "ゲームモードの切り替えに失敗しました: {}",
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
            AppError::Command(format!("フルスクリーン最適化の切り替えに失敗しました: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "フルスクリーン最適化の切り替えに失敗しました: {}",
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
            AppError::Command(format!("ハードウェア GPU スケジューリングの切り替えに失敗しました: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "ハードウェア GPU スケジューリングの切り替えに失敗しました: {}",
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
            AppError::Command(format!("視覚効果の設定に失敗しました: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "視覚効果の設定に失敗しました: {}",
            stderr
        )));
    }

    info!(
        "set_visual_effects: successfully set visual effects to {}",
        effect
    );
    Ok(())
}
