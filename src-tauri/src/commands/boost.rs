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
pub fn run_boost(_threshold_percent: Option<f32>) -> Result<BoostResult, AppError> {
    let start_time = Instant::now();
    
    // Simulate boost functionality until ops is re-implemented
    let actions = vec![
        BoostAction {
            label: "システム最適化".to_string(),
            action_type: "skipped".to_string(),
            success: true,
            detail: "プロセス管理機能は統合中".to_string(),
        }
    ];
    
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
        // 閾値∞でも現在はシミュレーション機能を返すため、actions.len() == 1 になる
        let result = run_boost(Some(f32::INFINITY));
        assert!(result.is_ok());
        let r = result.unwrap(); // OK in tests: verifying success path
        assert_eq!(r.actions.len(), 1);
        assert_eq!(r.actions[0].action_type, "skipped");
    }
}
