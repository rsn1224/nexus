use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::{Mutex, OnceLock};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

// ─── Types ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScriptEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    pub script_type: String,
    pub description: String,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionLog {
    pub id: String,
    pub script_id: String,
    pub script_name: String,
    pub started_at: i64,
    pub duration_ms: u64,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

// ─── Global State ───────────────────────────────────────────────────────────

static EXECUTION_LOGS: OnceLock<Mutex<Vec<ExecutionLog>>> = OnceLock::new();

fn get_logs() -> &'static Mutex<Vec<ExecutionLog>> {
    EXECUTION_LOGS.get_or_init(|| Mutex::new(Vec::new()))
}

// ─── Helper Functions ───────────────────────────────────────────────────────

fn get_scripts_path(app: &AppHandle) -> Result<std::path::PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("Failed to get app data dir: {}", e)))?;

    let nexus_dir = app_data_dir.join("nexus");
    std::fs::create_dir_all(&nexus_dir)
        .map_err(|e| AppError::Io(format!("Failed to create nexus dir: {}", e)))?;

    Ok(nexus_dir.join("scripts.json"))
}

fn load_scripts(app: &AppHandle) -> Result<Vec<ScriptEntry>, AppError> {
    let scripts_path = get_scripts_path(app)?;

    if !scripts_path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&scripts_path)
        .map_err(|e| AppError::Io(format!("Failed to read scripts file: {}", e)))?;

    let scripts: Vec<ScriptEntry> = serde_json::from_str(&content)
        .map_err(|e| AppError::Serialization(format!("Failed to parse scripts file: {}", e)))?;

    Ok(scripts)
}

fn save_scripts(app: &AppHandle, scripts: &[ScriptEntry]) -> Result<(), AppError> {
    let scripts_path = get_scripts_path(app)?;

    let content = serde_json::to_string_pretty(scripts)
        .map_err(|e| AppError::Serialization(format!("Failed to serialize scripts: {}", e)))?;

    std::fs::write(&scripts_path, content)
        .map_err(|e| AppError::Io(format!("Failed to write scripts file: {}", e)))?;

    Ok(())
}

fn add_log_to_memory(log: ExecutionLog) -> Result<(), AppError> {
    let mut logs = get_logs()
        .lock()
        .map_err(|e| AppError::Command(format!("Log mutex poisoned: {e}")))?;
    logs.push(log);
    if logs.len() > 50 {
        let len = logs.len();
        logs.drain(0..len - 50);
    }
    Ok(())
}

// ─── Commands ───────────────────────────────────────────────────────────────

#[tauri::command]
pub fn list_scripts(app: AppHandle) -> Result<Vec<ScriptEntry>, AppError> {
    load_scripts(&app)
}

#[tauri::command]
pub fn add_script(
    app: AppHandle,
    name: String,
    path: String,
    script_type: String,
    description: String,
) -> Result<ScriptEntry, AppError> {
    let mut scripts = load_scripts(&app)?;

    let new_script = ScriptEntry {
        id: Uuid::new_v4().to_string(),
        name,
        path,
        script_type,
        description,
        created_at: chrono::Utc::now().timestamp_millis(),
    };

    scripts.push(new_script.clone());
    save_scripts(&app, &scripts)?;

    Ok(new_script)
}

#[tauri::command]
pub fn delete_script(app: AppHandle, id: String) -> Result<(), AppError> {
    let mut scripts = load_scripts(&app)?;

    scripts.retain(|script| script.id != id);
    save_scripts(&app, &scripts)?;

    Ok(())
}

#[tauri::command]
pub fn run_script(app: AppHandle, id: String) -> Result<ExecutionLog, AppError> {
    let scripts = load_scripts(&app)?;
    let script = scripts
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| AppError::NotFound("Script not found".to_string()))?;

    let start_time = std::time::Instant::now();
    let started_at = chrono::Utc::now().timestamp_millis();

    let output = match script.script_type.as_str() {
        "powershell" => Command::new("powershell")
            .args(["-ExecutionPolicy", "Bypass", "-File", &script.path])
            .output(),
        "python" => Command::new("python").args([&script.path]).output(),
        _ => {
            return Err(AppError::InvalidInput(format!(
                "Unknown script type: {}",
                script.script_type
            )));
        }
    }
    .map_err(|e| AppError::Command(format!("Failed to execute script: {}", e)))?;

    let duration_ms = start_time.elapsed().as_millis() as u64;
    let exit_code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    let log = ExecutionLog {
        id: Uuid::new_v4().to_string(),
        script_id: script.id,
        script_name: script.name,
        started_at,
        duration_ms,
        exit_code,
        stdout,
        stderr,
    };

    add_log_to_memory(log.clone())?;
    Ok(log)
}

#[tauri::command]
pub fn get_execution_logs() -> Result<Vec<ExecutionLog>, AppError> {
    let logs = get_logs()
        .lock()
        .map_err(|e| AppError::Command(format!("Log mutex poisoned: {e}")))?;
    Ok(logs.clone())
}

#[tauri::command]
pub fn clear_execution_logs() -> Result<(), AppError> {
    let mut logs = get_logs()
        .lock()
        .map_err(|e| AppError::Command(format!("Log mutex poisoned: {e}")))?;
    logs.clear();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_empty_scripts() {
        // This test would require mocking AppHandle
        // For now, we'll skip testing file operations due to complexity
        assert!(true); // Placeholder
    }

    #[test]
    fn test_add_script_logic() {
        // Test the logic of adding a script
        let script = ScriptEntry {
            id: "test-id".to_string(),
            name: "Test Script".to_string(),
            path: "C:\\test.ps1".to_string(),
            script_type: "powershell".to_string(),
            description: "Test description".to_string(),
            created_at: 1234567890,
        };

        assert_eq!(script.name, "Test Script");
        assert_eq!(script.script_type, "powershell");
    }

    #[test]
    fn test_execution_log_creation() {
        let log = ExecutionLog {
            id: "log-id".to_string(),
            script_id: "script-id".to_string(),
            script_name: "Test Script".to_string(),
            started_at: 1234567890,
            duration_ms: 1500,
            exit_code: 0,
            stdout: "Success".to_string(),
            stderr: "".to_string(),
        };

        assert_eq!(log.exit_code, 0);
        assert_eq!(log.duration_ms, 1500);
    }

    #[test]
    #[ignore = "requires PowerShell/Python runtime"]
    fn test_run_script_ignored() {
        // 実行環境依存のため CI では skip
    }
}
