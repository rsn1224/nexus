// Windows設定ヘルパー関数

use crate::error::AppError;
use std::process::Command;
use tracing::warn;

use super::types::{PowerPlan, VisualEffects};

pub(super) fn get_current_power_plan() -> Result<PowerPlan, AppError> {
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

pub(super) fn get_game_mode_status() -> Result<bool, AppError> {
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

pub(super) fn get_fullscreen_optimization_status() -> Result<bool, AppError> {
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

pub(super) fn get_hardware_gpu_scheduling_status() -> Result<bool, AppError> {
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

pub(super) fn get_visual_effects_setting() -> Result<VisualEffects, AppError> {
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
