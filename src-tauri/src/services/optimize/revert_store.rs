//! リバート値の永続化 + revert_all ロジック

use crate::error::AppError;
use crate::types::v4::{FailedItem, RevertResult};
use tracing::warn;

/// リバート値を保存
pub(super) fn save_value(id: &str, value: &str) {
    let path = revert_dir().join(format!("{id}.txt"));
    let _ = std::fs::write(path, value);
}

/// リバート値を読み出し
pub(super) fn load_value(id: &str) -> Option<String> {
    let path = revert_dir().join(format!("{id}.txt"));
    std::fs::read_to_string(path)
        .ok()
        .map(|s| s.trim().to_string())
}

/// 全項目をリバート
pub fn revert_all() -> RevertResult {
    let ids = [
        "timer_res",
        "svc_search",
        "svc_sysmain",
        "reg_game_dvr",
        "reg_throttle",
        "reg_priority_sep",
        "reg_responsiveness",
        "power_plan",
        "dns_optimize",
        "nagle_off",
    ];

    let mut reverted = Vec::new();
    let mut failed = Vec::new();

    for id in &ids {
        match revert_single(id) {
            Ok(()) => reverted.push(id.to_string()),
            Err(e) => {
                warn!("revert failed for {id}: {e}");
                failed.push(FailedItem {
                    id: id.to_string(),
                    reason: e.to_string(),
                });
            }
        }
    }

    // CPU priority はプロセス再起動しないと戻せない
    reverted.push("cpu_priority (requires restart)".into());

    RevertResult { reverted, failed }
}

/// 単一項目のリバート（ロールバック用に公開）
pub(super) fn revert_single_by_id(id: &str) -> Result<(), AppError> {
    revert_single(id)
}

fn revert_single(id: &str) -> Result<(), AppError> {
    match id {
        "nagle_off" => {
            #[cfg(windows)]
            crate::services::network_tuning::set_nagle(false)?;
            Ok(())
        }
        "dns_optimize" => {
            #[cfg(windows)]
            crate::infra::powershell::run_powershell(
                "Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ResetServerAddresses }",
            )?;
            Ok(())
        }
        "power_plan" => {
            #[cfg(windows)]
            if let Some(guid) = load_value("power_plan") {
                let ctrl = crate::infra::power_plan::PowerPlanController::new();
                ctrl.switch_to_guid(&guid)?;
            }
            Ok(())
        }
        "reg_responsiveness" | "reg_priority_sep" | "reg_throttle" | "reg_game_dvr" => {
            #[cfg(windows)]
            if let Some(val_str) = load_value(id) {
                if val_str != "not set" {
                    if let Ok(val) = val_str.parse::<u32>() {
                        let (subkey, vname) = super::registry::location(id)?;
                        crate::infra::registry::set_hklm_dword(subkey, vname, val)?;
                    }
                }
            }
            Ok(())
        }
        "svc_search" => {
            #[cfg(windows)]
            crate::infra::powershell::run_powershell(
                "Start-Service -Name 'WSearch' -ErrorAction SilentlyContinue",
            )?;
            Ok(())
        }
        "svc_sysmain" => {
            #[cfg(windows)]
            crate::infra::powershell::run_powershell(
                "Start-Service -Name 'SysMain' -ErrorAction SilentlyContinue",
            )?;
            Ok(())
        }
        "timer_res" => {
            crate::infra::timer_resolution::restore_resolution()?;
            Ok(())
        }
        _ => Ok(()),
    }
}

fn revert_dir() -> std::path::PathBuf {
    let mut dir = dirs::data_local_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    dir.push("nexus");
    dir.push("revert");
    let _ = std::fs::create_dir_all(&dir);
    dir
}
