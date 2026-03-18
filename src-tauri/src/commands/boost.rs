use crate::constants::is_protected_process;
use crate::error::AppError;
use serde::Serialize;
use std::time::Instant;
use sysinfo::{ProcessStatus, System};

// ─── Types ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BoostAction {
    pub label: String,
    pub action_type: String,
    pub success: bool,
    pub detail: String,
    pub is_protected: bool,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BoostResult {
    pub actions: Vec<BoostAction>,
    pub duration_ms: u64,
    pub score_delta: i32,
    pub is_simulation: bool,
}

// ─── Commands ───────────────────────────────────────────────────────────────

/// CPU 使用率が閾値以上の非保護プロセスを IDLE 優先度に下げる
#[tauri::command]
pub fn run_boost(threshold_percent: Option<f32>) -> Result<BoostResult, AppError> {
    let start = Instant::now();
    let threshold = threshold_percent.unwrap_or(5.0);

    #[cfg(windows)]
    {
        let mut sys = System::new_all();
        sys.refresh_all();

        // CPU 使用率が閾値以上のプロセスを取得
        let high_cpu_processes: Vec<_> = sys
            .processes()
            .iter()
            .filter(|(_, process)| {
                // 実行中のプロセスのみ対象
                process.status() == ProcessStatus::Run && process.cpu_usage() > threshold
            })
            .collect();

        let mut actions = Vec::new();

        for (pid, process) in high_cpu_processes {
            let process_name = process.name().to_string_lossy().to_string();
            let is_protected = is_protected_process(&process_name);

            if is_protected {
                actions.push(BoostAction {
                    label: process_name,
                    action_type: "skipped_protected".to_string(),
                    success: true,
                    detail: "保護済みプロセス — スキップ".to_string(),
                    is_protected,
                });
            } else {
                // Windows API で優先度を変更
                let success = unsafe {
                    use windows_sys::Win32::Foundation::BOOL;
                    use windows_sys::Win32::System::Threading::{
                        IDLE_PRIORITY_CLASS, PROCESS_SET_INFORMATION, SetPriorityClass,
                    };
                    let handle = windows_sys::Win32::System::Threading::OpenProcess(
                        PROCESS_SET_INFORMATION,
                        BOOL::from(false),
                        pid.as_u32(),
                    );

                    if !handle.is_null() {
                        let result = SetPriorityClass(handle, IDLE_PRIORITY_CLASS);
                        windows_sys::Win32::Foundation::CloseHandle(handle);
                        result != 0
                    } else {
                        false
                    }
                };

                actions.push(BoostAction {
                    label: process_name,
                    action_type: "set_priority".to_string(),
                    success,
                    detail: if success {
                        format!("PID {} の優先度を IDLE に変更", pid)
                    } else {
                        format!("PID {} の優先度変更に失敗", pid)
                    },
                    is_protected,
                });
            }
        }

        let duration_ms = start.elapsed().as_millis() as u64;
        let score_delta = actions
            .iter()
            .filter(|a| a.success && !a.is_protected)
            .count() as i32;

        Ok(BoostResult {
            actions,
            duration_ms,
            score_delta,
            is_simulation: false,
        })
    }

    #[cfg(not(windows))]
    {
        // 非 Windows プラットフォームではシミュレーションを維持
        let sim_entries: &[(&str, bool)] = &[
            ("システム最適化", false),
            ("explorer.exe", true),
            ("svchost.exe", true),
            ("chrome.exe", false),
        ];

        let actions: Vec<BoostAction> = sim_entries
            .iter()
            .map(|(name, _protected)| {
                let is_protected = is_protected_process(name);

                BoostAction {
                    label: name.to_string(),
                    action_type: if is_protected {
                        "skipped_protected".to_string()
                    } else {
                        "skipped".to_string()
                    },
                    success: true,
                    detail: if is_protected {
                        "保護済みプロセス — スキップ".to_string()
                    } else {
                        "非 Windows プラットフォーム — シミュレーション".to_string()
                    },
                    is_protected,
                }
            })
            .collect();

        let duration_ms = start.elapsed().as_millis() as u64;
        let score_delta = actions.len() as i32;

        Ok(BoostResult {
            actions,
            duration_ms,
            score_delta,
            is_simulation: true,
        })
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run_boost_high_threshold() {
        let result = run_boost(Some(f32::INFINITY));
        assert!(result.is_ok());
        let r = result.unwrap();

        #[cfg(windows)]
        {
            // Windows: 実際の実装 - 高閾値なので空のアクションリスト
            assert_eq!(r.actions.len(), 0);
            assert!(!r.is_simulation);
            assert_eq!(r.score_delta, 0);
        }

        #[cfg(not(windows))]
        {
            // 非 Windows: シミュレーション - 4件の固定エントリ
            assert_eq!(r.actions.len(), 4);
            assert!(r.is_simulation);
            // explorer.exe と svchost.exe は skipped_protected
            let protected: Vec<_> = r.actions.iter().filter(|a| a.is_protected).collect();
            assert_eq!(protected.len(), 2);
            assert!(
                protected
                    .iter()
                    .all(|a| a.action_type == "skipped_protected")
            );
        }
    }

    #[test]
    fn test_protected_processes_list_not_empty() {
        assert!(is_protected_process("system.exe"));
    }

    #[test]
    fn test_nexus_exe_is_protected() {
        assert!(is_protected_process("nexus.exe"));
    }

    #[test]
    fn test_critical_system_processes_protected() {
        let must_protect = ["lsass.exe", "csrss.exe", "winlogon.exe", "explorer.exe"];
        for p in must_protect {
            assert!(is_protected_process(p), "{} should be protected", p);
        }
    }
}
