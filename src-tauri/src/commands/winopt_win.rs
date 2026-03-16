use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tracing::info;

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WinSetting {
    pub id: String,
    pub label: String,
    pub description: String,
    pub is_optimized: bool,
    pub can_revert: bool,
}

// ─── Backup helpers ───────────────────────────────────────────────────────────

pub fn backup_path() -> Result<PathBuf, AppError> {
    let appdata = std::env::var("APPDATA")
        .map_err(|e| AppError::Command(format!("APPDATA not found: {e}")))?;
    let dir = PathBuf::from(appdata).join("nexus");
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("winopt_backup.json"))
}

pub fn load_backup() -> HashMap<String, String> {
    backup_path()
        .ok()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save_backup(backup: &HashMap<String, String>) -> Result<(), AppError> {
    let json = serde_json::to_string_pretty(backup)?;
    std::fs::write(backup_path()?, json)?;
    Ok(())
}

// ─── PowerShell helper ────────────────────────────────────────────────────────

pub fn ps(cmd: &str) -> Result<String, AppError> {
    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", cmd])
        .output()
        .map_err(|e| AppError::Command(e.to_string()))?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_win_settings() -> Result<Vec<WinSetting>, AppError> {
    info!("get_win_settings: reading current system settings");
    let backup = load_backup();
    let mut settings = Vec::new();

    // 1. power_plan
    let scheme_out = ps("powercfg /getactivescheme").unwrap_or_default();
    settings.push(WinSetting {
        id: "power_plan".to_string(),
        label: "電源プラン: 高パフォーマンス".to_string(),
        description: "CPU クロックを最大に固定してゲームパフォーマンスを向上".to_string(),
        is_optimized: scheme_out.to_lowercase().contains("8c5e7fda"),
        can_revert: backup.contains_key("power_plan"),
    });

    // 2. game_mode
    let gm = ps("Get-ItemPropertyValue -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -ErrorAction SilentlyContinue")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "game_mode".to_string(),
        label: "ゲームモード: ON".to_string(),
        description: "バックグラウンドアプリを制限してゲームに CPU を優先配分".to_string(),
        is_optimized: gm.trim() == "1",
        can_revert: backup.contains_key("game_mode"),
    });

    // 3. game_dvr
    let dvr = ps("Get-ItemPropertyValue -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -ErrorAction SilentlyContinue")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "game_dvr".to_string(),
        label: "Xbox Game Bar: 無効".to_string(),
        description: "ゲームオーバーレイとキャプチャ機能を無効化してリソースを解放".to_string(),
        is_optimized: dvr.trim() == "0",
        can_revert: backup.contains_key("game_dvr"),
    });

    // 4. mouse_accel
    let ms = ps("Get-ItemPropertyValue -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed'")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "mouse_accel".to_string(),
        label: "マウス加速: OFF".to_string(),
        description: "マウス加速を無効化してエイム精度を向上".to_string(),
        is_optimized: ms.trim() == "0",
        can_revert: backup.contains_key("mouse_speed"),
    });

    // 5. visual_fx
    let vfx = ps("Get-ItemPropertyValue -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -ErrorAction SilentlyContinue")
        .unwrap_or_default();
    settings.push(WinSetting {
        id: "visual_fx".to_string(),
        label: "視覚効果: 最小化".to_string(),
        description: "ウィンドウアニメーション等を無効化して CPU・GPU 負荷を削減".to_string(),
        is_optimized: vfx.trim() == "2",
        can_revert: backup.contains_key("visual_fx"),
    });

    info!(count = settings.len(), "get_win_settings: done");
    Ok(settings)
}

#[tauri::command]
pub fn apply_win_setting(id: String) -> Result<(), AppError> {
    info!(id = %id, "apply_win_setting");
    let mut backup = load_backup();

    match id.as_str() {
        "power_plan" => {
            let current = ps("powercfg /getactivescheme")?;
            if let Some(guid) = current.split_whitespace()
                .find(|s| s.len() == 36 && s.contains('-'))
            {
                backup.insert("power_plan".to_string(), guid.to_string());
            }
            ps("powercfg /setactive scheme_min")?;
        }
        "game_mode" => {
            let v = ps("Get-ItemPropertyValue -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -ErrorAction SilentlyContinue")
                .unwrap_or_else(|_| "0".to_string());
            backup.insert("game_mode".to_string(), v);
            ps("Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -Value 1 -Type DWord -Force")?;
        }
        "game_dvr" => {
            let v = ps("Get-ItemPropertyValue -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -ErrorAction SilentlyContinue")
                .unwrap_or_else(|_| "1".to_string());
            backup.insert("game_dvr".to_string(), v);
            ps("Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value 0 -Type DWord -Force")?;
        }
        "mouse_accel" => {
            let sp = ps("Get-ItemPropertyValue -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed'")
                .unwrap_or_else(|_| "1".to_string());
            let t1 = ps("Get-ItemPropertyValue -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1'")
                .unwrap_or_else(|_| "6".to_string());
            let t2 = ps("Get-ItemPropertyValue -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2'")
                .unwrap_or_else(|_| "10".to_string());
            backup.insert("mouse_speed".to_string(), sp);
            backup.insert("mouse_threshold1".to_string(), t1);
            backup.insert("mouse_threshold2".to_string(), t2);
            ps("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value '0'")?;
            ps("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1' -Value '0'")?;
            ps("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2' -Value '0'")?;
        }
        "visual_fx" => {
            let v = ps("Get-ItemPropertyValue -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -ErrorAction SilentlyContinue")
                .unwrap_or_else(|_| "0".to_string());
            backup.insert("visual_fx".to_string(), v);
            ps("Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -Value 2 -Type DWord -Force")?;
        }
        _ => return Err(AppError::InvalidInput(format!("Unknown setting: {id}"))),
    }

    save_backup(&backup)?;
    info!(id = %id, "apply_win_setting: done");
    Ok(())
}

#[tauri::command]
pub fn revert_win_setting(id: String) -> Result<(), AppError> {
    info!(id = %id, "revert_win_setting");
    let mut backup = load_backup();

    match id.as_str() {
        "power_plan" => {
            let guid = backup.remove("power_plan")
                .ok_or_else(|| AppError::NotFound("power_plan backup not found".to_string()))?;
            ps(&format!("powercfg /setactive {guid}"))?;
        }
        "game_mode" => {
            let v = backup.remove("game_mode").unwrap_or_else(|| "0".to_string());
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -Value {v} -Type DWord -Force"))?;
        }
        "game_dvr" => {
            let v = backup.remove("game_dvr").unwrap_or_else(|| "1".to_string());
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value {v} -Type DWord -Force"))?;
        }
        "mouse_accel" => {
            let sp = backup.remove("mouse_speed").unwrap_or_else(|| "1".to_string());
            let t1 = backup.remove("mouse_threshold1").unwrap_or_else(|| "6".to_string());
            let t2 = backup.remove("mouse_threshold2").unwrap_or_else(|| "10".to_string());
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value '{sp}'"))?;
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1' -Value '{t1}'"))?;
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2' -Value '{t2}'"))?;
        }
        "visual_fx" => {
            let v = backup.remove("visual_fx").unwrap_or_else(|| "0".to_string());
            ps(&format!("Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects' -Name 'VisualFXSetting' -Value {v} -Type DWord -Force"))?;
        }
        _ => return Err(AppError::InvalidInput(format!("Unknown setting: {id}"))),
    }

    save_backup(&backup)?;
    info!(id = %id, "revert_win_setting: done");
    Ok(())
}
