use crate::constants::is_protected_process;
use crate::error::AppError;
use serde::Serialize;
use std::time::Instant;
#[cfg(windows)]
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

// ─── Helpers ────────────────────────────────────────────────────────────────

/// CPU 使用率が閾値以上の候補プロセスを収集する（SharedState ロック内で呼ぶ）
#[cfg(windows)]
fn collect_boost_candidates(sys: &System, threshold: f32) -> Vec<(u32, String, bool)> {
    sys.processes()
        .iter()
        .filter(|(_, process)| {
            process.status() == ProcessStatus::Run && process.cpu_usage() > threshold
        })
        .map(|(pid, process)| {
            let name = process.name().to_string_lossy().to_string();
            let is_protected = is_protected_process(&name);
            (pid.as_u32(), name, is_protected)
        })
        .collect()
}

// ─── Commands ───────────────────────────────────────────────────────────────

/// CPU 使用率が閾値以上の非保護プロセスを IDLE 優先度に下げる
#[tauri::command]
pub fn run_boost(
    threshold_percent: Option<f32>,
    state: tauri::State<'_, crate::state::SharedState>,
) -> Result<BoostResult, AppError> {
    let start = Instant::now();
    let _threshold = threshold_percent.unwrap_or(5.0);

    #[cfg(windows)]
    {
        // プロセスデータ収集: ロックを最小限の範囲で保持し、すぐ解放する
        let process_data: Vec<(u32, String, bool)> = {
            let app_state = state
                .lock()
                .map_err(|e| AppError::Internal(format!("ブーストロックエラー: {}", e)))?;
            collect_boost_candidates(&app_state.sys, _threshold)
        }; // ロックをここで解放してから Win32 API を呼ぶ

        let mut actions = Vec::new();

        for (pid_u32, process_name, is_protected) in process_data {
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
                // SAFETY: Windows API SetPriorityClass 呼び出し。
                // handle は直前の OpenProcess で取得した有効なハンドル。使用後に CloseHandle で閉じる。
                let success = unsafe {
                    use windows_sys::Win32::Foundation::BOOL;
                    use windows_sys::Win32::System::Threading::{
                        IDLE_PRIORITY_CLASS, PROCESS_SET_INFORMATION, SetPriorityClass,
                    };
                    let handle = windows_sys::Win32::System::Threading::OpenProcess(
                        PROCESS_SET_INFORMATION,
                        BOOL::from(false),
                        pid_u32,
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
                        format!("PID {} の優先度を IDLE に変更", pid_u32)
                    } else {
                        format!("PID {} の優先度変更に失敗", pid_u32)
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
        let _ = &state;
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

    /// Windows: SharedState を経由した本番コードと同じフィルター条件をテスト
    /// テスト用: SharedState を使わずに直接 System インスタンス化
    #[cfg(windows)]
    #[test]
    fn test_collect_boost_candidates_high_threshold() {
        let mut sys = System::new_all();
        sys.refresh_all();
        // 無限大閾値 → どのプロセスも引っかからない
        let candidates = collect_boost_candidates(&sys, f32::INFINITY);
        assert_eq!(candidates.len(), 0);
    }

    #[cfg(not(windows))]
    #[test]
    fn test_sim_entries_protected_count() {
        // 非 Windows シミュレーションデータの検証
        let sim_entries: &[(&str, bool)] = &[
            ("システム最適化", false),
            ("explorer.exe", true),
            ("svchost.exe", true),
            ("chrome.exe", false),
        ];
        let actions: Vec<BoostAction> = sim_entries
            .iter()
            .map(|(name, _)| {
                let is_protected = is_protected_process(name);
                BoostAction {
                    label: name.to_string(),
                    action_type: if is_protected {
                        "skipped_protected".to_string()
                    } else {
                        "skipped".to_string()
                    },
                    success: true,
                    detail: String::new(),
                    is_protected,
                }
            })
            .collect();

        assert_eq!(actions.len(), 4);
        let protected: Vec<_> = actions.iter().filter(|a| a.is_protected).collect();
        assert_eq!(protected.len(), 2);
        assert!(
            protected
                .iter()
                .all(|a| a.action_type == "skipped_protected")
        );
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
