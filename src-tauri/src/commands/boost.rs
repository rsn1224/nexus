use crate::commands::ops::{list_processes, set_process_priority};
use crate::error::AppError;
use serde::Serialize;
use std::time::Instant;

// ─── Types ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BoostAction {
    pub label: String,
    pub action_type: String,
    pub success: bool,
    pub detail: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BoostResult {
    pub actions: Vec<BoostAction>,
    pub duration_ms: u64,
    pub score_delta: i32,
}

// ─── Commands ───────────────────────────────────────────────────────────────

/// CPU 使用率が閾値以上の非保護プロセスを IDLE 優先度に下げる
#[tauri::command]
pub fn run_boost(threshold_percent: Option<f32>) -> Result<BoostResult, AppError> {
    let start_time = Instant::now();
    let threshold = threshold_percent.unwrap_or(15.0);
    
    let processes = list_processes()?;
    let mut actions = Vec::new();
    
    for process in processes {
        if process.cpu_percent >= threshold && process.can_terminate {
            let label = format!("{} (CPU {}%)", process.name, process.cpu_percent);
            
            match set_process_priority(process.pid, "idle".to_string()) {
                Ok(()) => {
                    actions.push(BoostAction {
                        label,
                        action_type: "set_priority".to_string(),
                        success: true,
                        detail: "OK".to_string(),
                    });
                }
                Err(e) => {
                    actions.push(BoostAction {
                        label,
                        action_type: "set_priority".to_string(),
                        success: false,
                        detail: e.to_string(),
                    });
                }
            }
        }
    }
    
    let duration_ms = start_time.elapsed().as_millis() as u64;
    let score_delta = actions.len() as i32;
    
    Ok(BoostResult {
        actions,
        duration_ms,
        score_delta,
    })
}

// ─── Tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run_boost_high_threshold() {
        // 閾値∞ならどのプロセスも対象にならない → actions.len() == 0 が保証される
        let result = run_boost(Some(f32::INFINITY));
        assert!(result.is_ok());
        let r = result.unwrap(); // OK in tests: verifying success path
        assert_eq!(r.actions.len(), 0);
    }
}
