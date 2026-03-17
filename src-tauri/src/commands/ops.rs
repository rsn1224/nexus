use crate::error::AppError;
use serde::Serialize;
use sysinfo::{Process, ProcessesToUpdate, System};

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemProcess {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub mem_mb: f64,
    pub disk_read_kb: f64,
    pub disk_write_kb: f64,
    pub can_terminate: bool,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROTECTED_NAMES: &[&str] = &[
    "System", "Registry", "smss", "csrss", "wininit", "winlogon", "lsass", "services", "svchost",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn process_name(p: &Process) -> String {
    p.name().to_string_lossy().to_string()
}

fn is_protected(name: &str) -> bool {
    PROTECTED_NAMES.iter().any(|n| n.eq_ignore_ascii_case(name))
}

fn fresh_system() -> System {
    let mut sys = System::new_all();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    sys
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn list_processes() -> Result<Vec<SystemProcess>, AppError> {
    let sys = fresh_system();

    let mut processes: Vec<SystemProcess> = sys
        .processes()
        .values()
        .map(|p: &Process| {
            let name = process_name(p);
            let can_terminate = !is_protected(&name);
            SystemProcess {
                pid: p.pid().as_u32(),
                name,
                cpu_percent: p.cpu_usage(),
                mem_mb: p.memory() as f64 / 1024.0 / 1024.0,
                disk_read_kb: p.disk_usage().read_bytes as f64 / 1024.0,
                disk_write_kb: p.disk_usage().written_bytes as f64 / 1024.0,
                can_terminate,
            }
        })
        .collect();

    // Sort by CPU usage descending, take top 50
    processes.sort_by(|a, b| {
        b.cpu_percent
            .partial_cmp(&a.cpu_percent)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    processes.truncate(50);

    Ok(processes)
}

#[tauri::command]
pub fn kill_process(pid: u32) -> Result<String, AppError> {
    let sys = fresh_system();

    let sysinfo_pid = sysinfo::Pid::from(pid as usize);

    if let Some(process) = sys.process(sysinfo_pid) {
        let name = process_name(process);
        if is_protected(&name) {
            return Err(AppError::Command("Protected process".to_string()));
        }
        if process.kill() {
            Ok(format!("Process {} killed successfully", pid))
        } else {
            Err(AppError::Command(format!("Failed to kill process {}", pid)))
        }
    } else {
        Err(AppError::Command("Process not found".to_string()))
    }
}

#[tauri::command]
pub fn set_process_priority(pid: u32, priority: &str) -> Result<String, AppError> {
    let priority_class = match priority {
        "high" => "AboveNormal",
        "normal" => "Normal",
        "idle" => "Idle",
        _ => {
            return Err(AppError::Command(
                "Invalid priority. Use 'high', 'normal', or 'idle'".to_string(),
            ))
        }
    };

    let command = format!(
        "$p = Get-Process -Id {}; $p.PriorityClass = '{}'",
        pid, priority_class
    );

    let output = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            &command,
        ])
        .output()
        .map_err(|e| AppError::Command(format!("Failed to execute PowerShell: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(AppError::Command(format!(
            "Failed to set process priority: {}",
            stderr.trim()
        )))
    } else {
        Ok(format!("Process {} priority set to {}", pid, priority))
    }
}

#[tauri::command]
pub fn get_ai_suggestions() -> Result<Vec<String>, AppError> {
    let sys = fresh_system();

    let mut processes: Vec<(String, f32)> = sys
        .processes()
        .values()
        .map(|p: &Process| (process_name(p), p.cpu_usage()))
        .filter(|(name, _)| !is_protected(name))
        .collect();

    // Sort by CPU descending
    processes.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    // Deduplicate and take top 5
    let mut seen = std::collections::HashSet::new();
    let suggestions = processes
        .into_iter()
        .filter_map(|(name, _)| {
            if seen.insert(name.clone()) {
                Some(name)
            } else {
                None
            }
        })
        .take(5)
        .collect();

    Ok(suggestions)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_protected() {
        assert!(is_protected("lsass"));
        assert!(is_protected("svchost"));
        assert!(!is_protected("chrome"));
        assert!(!is_protected("notepad"));
    }

    #[test]
    fn test_list_processes_returns_results() {
        let result = list_processes();
        assert!(result.is_ok());
        let processes = result.unwrap();
        assert!(processes.len() <= 50);
    }
}
