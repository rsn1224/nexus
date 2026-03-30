//! 電源プラン操作の便利関数

use crate::error::AppError;
use crate::types::game::PowerPlan;

use super::controller::{PowerPlanController, decode_powercfg};

/// 電源プランを切り替える便利関数
#[cfg(windows)]
pub fn switch_power_plan(plan: PowerPlan) -> Result<Option<String>, AppError> {
    let controller = PowerPlanController::new();
    controller.switch_with_revert(plan)
}

/// 電源プランを元に戻す便利関数
#[cfg(windows)]
pub fn revert_power_plan(guid: Option<String>) -> Result<(), AppError> {
    if let Some(guid) = guid {
        let controller = PowerPlanController::new();
        controller.switch_to_guid(&guid)?;
    }
    Ok(())
}

/// 現在の電源プランを取得する便利関数
#[cfg(windows)]
#[allow(dead_code)] // windows_settings が独自実装を持つため現在未使用
pub fn get_current_power_plan() -> Result<Option<String>, AppError> {
    let controller = PowerPlanController::new();
    controller.get_active_plan_guid()
}

impl PowerPlanController {
    /// 電源プランのGUIDから名前を取得
    #[allow(dead_code)]
    pub fn get_plan_name(&self, guid: &str) -> Result<String, AppError> {
        let output = std::process::Command::new("powercfg")
            .args(["/query", guid])
            .output()
            .map_err(|e| AppError::Power(format!("powercfg実行エラー: {}", e)))?;

        if !output.status.success() {
            let stderr = decode_powercfg(&output.stderr);
            return Err(AppError::Power(format!("電源プラン名取得失敗: {}", stderr)));
        }

        let stdout = decode_powercfg(&output.stdout);

        for line in stdout.lines() {
            let is_scheme_line = Self::GUID_PATTERNS.iter().any(|pat| line.contains(*pat));
            if is_scheme_line {
                if let Some(start) = line.find('(') {
                    if let Some(end) = line.rfind(')') {
                        if start < end {
                            return Ok(line[start + 1..end].to_string());
                        }
                    }
                }
            }
        }

        Err(AppError::Power("電源プラン名の解析に失敗".to_string()))
    }
}
