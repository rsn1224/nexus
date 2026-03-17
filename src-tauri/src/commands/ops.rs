use crate::error::AppError;
use serde::Serialize;

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

// (不要になったヘルパー関数は services/process.rs に移動)

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn list_processes(
    state: tauri::State<'_, crate::SharedState>,
) -> Result<Vec<SystemProcess>, AppError> {
    let data = crate::services::process::list_processes(&state)?;

    Ok(data
        .into_iter()
        .map(|d| SystemProcess {
            pid: d.pid,
            name: d.name,
            cpu_percent: d.cpu_percent,
            mem_mb: d.mem_mb,
            disk_read_kb: d.disk_read_kb,
            disk_write_kb: d.disk_write_kb,
            can_terminate: d.can_terminate,
        })
        .collect())
}

#[tauri::command]
pub fn kill_process(
    state: tauri::State<'_, crate::SharedState>,
    pid: u32,
) -> Result<String, AppError> {
    crate::services::process::kill_process(&state, pid)
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
pub fn get_ai_suggestions(
    state: tauri::State<'_, crate::SharedState>,
) -> Result<Vec<String>, AppError> {
    crate::services::process::get_ai_suggestions(&state)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use crate::constants::is_protected_process;

    #[test]
    fn test_is_protected_process() {
        assert!(is_protected_process("lsass"));
        assert!(is_protected_process("svchost"));
        assert!(!is_protected_process("chrome"));
        assert!(!is_protected_process("notepad"));
    }
}
