//! 最適化項目の一括適用ロジック

use crate::error::AppError;
use crate::types::v4::{AppliedItem, ApplyResult, FailedItem};
use tracing::{info, warn};

/// 選択された最適化を適用する。1 項目でも失敗したら適用済み分をロールバック。
pub fn apply_optimizations(
    ids: &[String],
    app: &tauri::AppHandle,
    state: &tauri::State<'_, crate::state::SharedState>,
) -> Result<ApplyResult, AppError> {
    let mut applied: Vec<AppliedItem> = Vec::new();
    let mut failed: Vec<FailedItem> = Vec::new();

    for id in ids {
        match apply_single(id, state) {
            Ok(item) => {
                info!("optimize: applied {id}");
                applied.push(item);
            }
            Err(e) => {
                warn!("optimize: failed {id}: {e}");
                // ロールバック: 適用済み分を個別にリバート
                let rolled: Vec<String> = applied.iter().map(|a| a.id.clone()).collect();
                for prev_id in &rolled {
                    let rollback = super::revert_store::revert_single_by_id(prev_id);
                    if let Err(re) = rollback {
                        warn!("rollback failed for {prev_id}: {re}");
                    }
                }
                applied.clear();
                info!("optimize: rolled back {rolled:?} due to failure on {id}");
                failed.push(FailedItem {
                    id: id.clone(),
                    reason: e.to_string(),
                });
                break;
            }
        }
    }

    let session_id = super::session::save_session(app, &applied, &failed)?;
    Ok(ApplyResult {
        applied,
        failed,
        session_id,
    })
}

fn apply_single(
    id: &str,
    state: &tauri::State<'_, crate::state::SharedState>,
) -> Result<AppliedItem, AppError> {
    match id {
        "cpu_priority" => apply_cpu_priority(state),
        "nagle_off" => apply_nagle(),
        "dns_optimize" => apply_dns(),
        "power_plan" => apply_power_plan(),
        "reg_responsiveness" | "reg_priority_sep" | "reg_throttle" | "reg_game_dvr" => {
            apply_registry(id)
        }
        "svc_search" => apply_svc_stop(id, "WSearch"),
        "svc_sysmain" => apply_svc_stop(id, "SysMain"),
        "timer_res" => apply_timer(),
        _ => Err(AppError::InvalidInput(format!("Unknown optimization: {id}"))),
    }
}

// ─── 個別適用 ────────────────────────────────────────────────────────────────

fn apply_cpu_priority(
    state: &tauri::State<'_, crate::state::SharedState>,
) -> Result<AppliedItem, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    s.sys.refresh_cpu_all();
    s.sys
        .refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let mut count = 0u32;
    for (pid, proc_info) in s.sys.processes() {
        let name = proc_info.name().to_string_lossy();
        if proc_info.cpu_usage() < 1.0 && !is_protected(&name) {
            #[cfg(windows)]
            {
                let pid_u32 = pid.as_u32();
                // SAFETY: Win32 API calls with valid handle lifecycle
                unsafe {
                    let h = windows_sys::Win32::System::Threading::OpenProcess(
                        windows_sys::Win32::System::Threading::PROCESS_SET_INFORMATION,
                        0,
                        pid_u32,
                    );
                    if !h.is_null() {
                        windows_sys::Win32::System::Threading::SetPriorityClass(
                            h,
                            windows_sys::Win32::System::Threading::IDLE_PRIORITY_CLASS,
                        );
                        windows_sys::Win32::Foundation::CloseHandle(h);
                        count += 1;
                    }
                }
            }
            #[cfg(not(windows))]
            {
                let _ = pid;
                count += 1;
            }
        }
    }

    Ok(AppliedItem {
        id: "cpu_priority".into(),
        before: "Normal".into(),
        after: format!("{count} processes set to IDLE"),
    })
}

fn apply_nagle() -> Result<AppliedItem, AppError> {
    let was_off = crate::services::network_tuning::get_tcp_tuning_state()
        .map(|s| s.nagle_disabled)
        .unwrap_or(false);
    let before = if was_off { "OFF" } else { "ON" };

    #[cfg(windows)]
    crate::services::network_tuning::set_nagle(true)?;

    Ok(AppliedItem {
        id: "nagle_off".into(),
        before: format!("Nagle: {before}"),
        after: "Nagle: OFF".into(),
    })
}

fn apply_dns() -> Result<AppliedItem, AppError> {
    let before = crate::infra::powershell::run_powershell(
        "(Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses} | Select-Object -First 1).ServerAddresses -join ','",
    )
    .unwrap_or_else(|_| "Unknown".into())
    .trim()
    .to_string();

    #[cfg(windows)]
    crate::infra::powershell::run_powershell(
        "Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses ('1.1.1.1','1.0.0.1') }",
    )?;

    Ok(AppliedItem {
        id: "dns_optimize".into(),
        before,
        after: "1.1.1.1".into(),
    })
}

fn apply_power_plan() -> Result<AppliedItem, AppError> {
    #[cfg(windows)]
    {
        let ctrl = crate::infra::power_plan::PowerPlanController::new();
        let before_guid = ctrl.get_active_plan_guid()?.unwrap_or_default();
        let before_name = super::candidates::get_candidates()
            .iter()
            .find(|c| c.id == "power_plan")
            .map(|c| c.current_state.clone())
            .unwrap_or_else(|| before_guid.clone());

        super::revert_store::save_value("power_plan", &before_guid);

        // Ultimate Performance が未インストールの環境では duplicatescheme で作成し、
        // 失敗時は High Performance にフォールバックする
        let target_guid = ctrl.ensure_ultimate_performance()?;
        let after_name = if target_guid
            .to_lowercase()
            .starts_with("8c5e7fda")
        {
            "High Performance (fallback)"
        } else {
            "Ultimate Performance"
        };

        ctrl.switch_to_guid(&target_guid)?;

        Ok(AppliedItem {
            id: "power_plan".into(),
            before: before_name,
            after: after_name.into(),
        })
    }
    #[cfg(not(windows))]
    Ok(AppliedItem {
        id: "power_plan".into(),
        before: "N/A".into(),
        after: "N/A".into(),
    })
}

fn apply_registry(id: &str) -> Result<AppliedItem, AppError> {
    let (subkey, vname) = super::registry::location(id)?;
    let new_val = super::registry::target_value(id)?;

    #[cfg(windows)]
    {
        let before_raw = crate::infra::registry::read_hklm_dword_or(subkey, vname, u32::MAX);
        let before_str = if before_raw == u32::MAX {
            "not set".to_string()
        } else {
            before_raw.to_string()
        };
        super::revert_store::save_value(id, &before_str);
        crate::infra::registry::set_hklm_dword(subkey, vname, new_val)?;

        Ok(AppliedItem {
            id: id.into(),
            before: before_str,
            after: new_val.to_string(),
        })
    }
    #[cfg(not(windows))]
    {
        let _ = (subkey, vname, new_val);
        Ok(AppliedItem {
            id: id.into(),
            before: "N/A".into(),
            after: "N/A".into(),
        })
    }
}

fn apply_svc_stop(id: &str, svc_name: &str) -> Result<AppliedItem, AppError> {
    #[cfg(windows)]
    {
        let before = crate::infra::powershell::run_powershell(&format!(
            "(Get-Service -Name '{svc_name}' -ErrorAction SilentlyContinue).Status"
        ))
        .unwrap_or_else(|_| "Unknown".into())
        .trim()
        .to_string();

        if before == "Running" {
            crate::infra::powershell::run_powershell(&format!(
                "Stop-Service -Name '{svc_name}' -Force -ErrorAction Stop"
            ))?;
        }

        Ok(AppliedItem {
            id: id.into(),
            before: format!("{svc_name}: {before}"),
            after: format!("{svc_name}: Stopped"),
        })
    }
    #[cfg(not(windows))]
    {
        let _ = svc_name;
        Ok(AppliedItem {
            id: id.into(),
            before: "N/A".into(),
            after: "N/A".into(),
        })
    }
}

fn apply_timer() -> Result<AppliedItem, AppError> {
    let before = crate::infra::timer_resolution::query_resolution()?;
    let before_ms = before.current_100ns as f64 / 10000.0;
    crate::infra::timer_resolution::set_resolution(5000)?;

    Ok(AppliedItem {
        id: "timer_res".into(),
        before: format!("{before_ms:.1}ms"),
        after: "0.5ms".into(),
    })
}

fn is_protected(name: &str) -> bool {
    const LIST: &[&str] = &[
        "explorer.exe",
        "csrss.exe",
        "svchost.exe",
        "services.exe",
        "lsass.exe",
        "smss.exe",
        "wininit.exe",
        "winlogon.exe",
        "dwm.exe",
        "System",
        "RuntimeBroker.exe",
    ];
    LIST.iter().any(|p| p.eq_ignore_ascii_case(name))
}
