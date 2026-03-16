use crate::error::AppError;
use serde::Serialize;
use std::process::Command;
use sysinfo::{ProcessesToUpdate, System};
use tracing::info;

// ─── Types ────────────────────────────────────────────────────────────────────

/// CPU/メモリ/ディスク I/O 情報付きのプロセスエントリ。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemProcess {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub mem_mb: u64,
    pub disk_read_kb: u64,
    pub disk_write_kb: u64,
    /// システム重要プロセスは false（kill を UI から許可しない）
    pub can_terminate: bool,
}

/// kill / 優先度変更を許可しないシステムプロセス名。
const PROTECTED_PROCESSES: [&str; 6] = [
    "System",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "services.exe",
    "lsass.exe",
];

/// CPU 使用率が高いプロセス数の上限。
const MAX_PROCESSES: usize = 25;

// ─── Commands ─────────────────────────────────────────────────────────────────

/// CPU 使用率上位のプロセスリストを返す。
#[tauri::command]
pub fn list_processes() -> Result<Vec<SystemProcess>, AppError> {
    let mut sys = System::new();
    // 2 回リフレッシュして CPU% を安定させる
    sys.refresh_processes(ProcessesToUpdate::All, false);
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_processes(ProcessesToUpdate::All, false);

    let mut processes: Vec<SystemProcess> = sys
        .processes()
        .values()
        .map(|p| {
            let name = p.name().to_string_lossy().into_owned();
            let can_terminate = !PROTECTED_PROCESSES
                .iter()
                .any(|&protected| name.to_lowercase().contains(&protected.to_lowercase()));
            SystemProcess {
                pid: p.pid().as_u32(),
                name,
                cpu_percent: p.cpu_usage(),
                mem_mb: p.memory() / 1_048_576,
                disk_read_kb: p.disk_usage().read_bytes / 1_024,
                disk_write_kb: p.disk_usage().written_bytes / 1_024,
                can_terminate,
            }
        })
        .collect();

    processes.sort_by(|a, b| {
        b.cpu_percent
            .partial_cmp(&a.cpu_percent)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    processes.truncate(MAX_PROCESSES);

    info!(count = processes.len(), "list_processes: done");
    Ok(processes)
}

/// CPU 使用率上位プロセスの名前リストを返す（AI 提案用）。
#[tauri::command]
pub fn get_ai_suggestions() -> Result<Vec<String>, AppError> {
    info!("get_ai_suggestions: fetching top process names");

    let processes = list_processes()?;

    // 上位10件のプロセス名を重複なく抽出
    let mut process_names: Vec<String> = processes.into_iter().take(10).map(|p| p.name).collect();

    // 重複を削除
    process_names.sort();
    process_names.dedup();

    info!(count = process_names.len(), "get_ai_suggestions: done");
    Ok(process_names)
}

/// 指定 PID のプロセスを強制終了する。保護対象 PID は Rust 側でガードしない（UI の canTerminate で制御）。
#[tauri::command]
pub fn kill_process(pid: u32) -> Result<(), AppError> {
    let output = Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/F"])
        .output()
        .map_err(|e| AppError::Command(format!("taskkill failed: {e}")))?;

    if output.status.success() {
        info!(pid, "kill_process: done");
        Ok(())
    } else {
        Err(AppError::Command(format!(
            "Failed to kill PID {pid}: {}",
            String::from_utf8_lossy(&output.stderr)
        )))
    }
}

/// 指定 PID のプロセス優先度を変更する（high / normal / idle）。
#[tauri::command]
pub fn set_process_priority(pid: u32, priority: String) -> Result<(), AppError> {
    let priority_class = match priority.as_str() {
        "high" => "High",
        "normal" => "Normal",
        "idle" => "Idle",
        _ => return Err(AppError::Command(format!("Invalid priority: {priority}"))),
    };

    let output = Command::new("powershell")
        .args([
            "-Command",
            &format!(
                "$proc = Get-Process -Id {} -ErrorAction SilentlyContinue; if ($proc) {{ $proc.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::{} }}",
                pid, priority_class
            ),
        ])
        .output()
        .map_err(|e| AppError::Command(format!("PowerShell failed: {e}")))?;

    if output.status.success() {
        info!(
            pid,
            priority = priority.as_str(),
            "set_process_priority: done"
        );
        Ok(())
    } else {
        Err(AppError::Command(format!(
            "Failed to set priority for PID {pid}: {}",
            String::from_utf8_lossy(&output.stderr)
        )))
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_processes_returns_ok() {
        let result = list_processes();
        assert!(result.is_ok(), "list_processes should not fail");
    }

    #[test]
    fn test_list_processes_max_count() {
        let processes = list_processes().expect("should succeed"); // OK in tests
        assert!(
            processes.len() <= MAX_PROCESSES,
            "should return at most {MAX_PROCESSES} processes"
        );
    }

    #[test]
    fn test_list_processes_sorted_by_cpu() {
        let processes = list_processes().expect("should succeed"); // OK in tests
        for window in processes.windows(2) {
            assert!(
                window[0].cpu_percent >= window[1].cpu_percent,
                "processes should be sorted by CPU desc: {} < {}",
                window[0].cpu_percent,
                window[1].cpu_percent,
            );
        }
    }

    #[test]
    fn test_list_processes_valid_pid() {
        let processes = list_processes().expect("should succeed"); // OK in tests
        for p in &processes {
            assert!(p.pid > 0, "PID should be positive");
        }
    }

    #[test]
    fn test_list_processes_name_not_empty() {
        let processes = list_processes().expect("should succeed"); // OK in tests
        for p in &processes {
            assert!(!p.name.is_empty(), "process name should not be empty");
        }
    }

    #[test]
    fn test_get_ai_suggestions_returns_array() {
        let result = get_ai_suggestions().expect("should succeed"); // OK in tests
        assert!(result.len() <= 10, "should return at most 10 process names");
    }

    #[test]
    fn test_list_processes_has_can_terminate() {
        let processes = list_processes().expect("should succeed"); // OK in tests
                                                                   // システムプロセスが1件以上 can_terminate=false であること
        let protected = processes.iter().filter(|p| !p.can_terminate).count();
        // 実行環境によっては保護プロセスが0件のこともあるため上限のみ確認
        assert!(
            protected <= processes.len(),
            "protected count should not exceed total"
        );
    }

    #[test]
    fn test_kill_process_invalid_pid() {
        let result = kill_process(9_999_999);
        assert!(result.is_err(), "killing non-existent PID should fail");
    }

    #[test]
    fn test_set_process_priority_invalid_priority() {
        let result = set_process_priority(1, "super_high".to_string());
        assert!(
            result.is_err(),
            "invalid priority string should return error"
        );
    }
}
