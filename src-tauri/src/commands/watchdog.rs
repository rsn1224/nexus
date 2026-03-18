use crate::error::AppError;
use crate::services::watchdog::{default_presets, WatchdogEngine};
use crate::types::game::WatchdogRule;
use std::sync::{Arc, Mutex};
use tauri::{State, Manager};
use tracing::info;

pub type WatchdogState = Arc<Mutex<WatchdogEngine>>;

#[tauri::command]
pub fn get_watchdog_rules(state: State<'_, WatchdogState>) -> Result<Vec<WatchdogRule>, AppError> {
    info!("get_watchdog_rules: fetching current rules");
    let watchdog = state
        .lock()
        .map_err(|e| AppError::State(format!("Failed to lock watchdog state: {}", e)))?;
    Ok(watchdog.get_rules().to_vec())
}

#[tauri::command]
pub fn add_watchdog_rule(
    state: State<'_, WatchdogState>,
    rule: WatchdogRule,
) -> Result<(), AppError> {
    info!("add_watchdog_rule: adding rule '{}'", rule.id);
    let mut watchdog = state
        .lock()
        .map_err(|e| AppError::State(format!("Failed to lock watchdog state: {}", e)))?;
    
    // ルールを保存
    watchdog.add_rule(rule)?;
    
    // 永続化
    let app = state
        .lock()
        .map_err(|e| AppError::State(format!("Failed to lock watchdog state: {}", e)))?
        .save_rules(state.app_handle())?;
    
    Ok(())
}

#[tauri::command]
pub fn update_watchdog_rule(
    state: State<'_, WatchdogState>,
    rule: WatchdogRule,
) -> Result<(), AppError> {
    info!("update_watchdog_rule: updating rule '{}'", rule.id);
    let mut watchdog = state
        .lock()
        .map_err(|e| AppError::State(format!("Failed to lock watchdog state: {}", e)))?;
    
    // ルールを更新
    watchdog.update_rule(rule)?;
    
    // 永続化
    watchdog.save_rules(state.app_handle())?;
    
    Ok(())
}

#[tauri::command]
pub fn remove_watchdog_rule(
    state: State<'_, WatchdogState>,
    rule_id: String,
) -> Result<(), AppError> {
    info!("remove_watchdog_rule: removing rule '{}'", rule_id);
    let mut watchdog = state
        .lock()
        .map_err(|e| AppError::State(format!("Failed to lock watchdog state: {}", e)))?;
    
    // ルールを削除
    watchdog.remove_rule(&rule_id)?;
    
    // 永続化
    watchdog.save_rules(state.app_handle())?;
    
    Ok(())
}

#[tauri::command]
pub fn get_watchdog_events(state: State<'_, WatchdogState>) -> Result<Vec<crate::types::game::WatchdogEvent>, AppError> {
    info!("get_watchdog_events: fetching event log");
    let watchdog = state
        .lock()
        .map_err(|e| AppError::State(format!("Failed to lock watchdog state: {}", e)))?;
    Ok(watchdog.get_events().to_vec())
}

#[tauri::command]
pub fn get_watchdog_presets() -> Result<Vec<WatchdogRule>, AppError> {
    info!("get_watchdog_presets: returning default presets");
    Ok(default_presets())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::watchdog::{WatchdogEngine, WatchdogEvent};
    use crate::types::game::{SystemProcess, WatchdogAction, WatchdogCondition, WatchdogMetric, WatchdogOperator, ProcessFilter};
    use std::sync::{Arc, Mutex};
    use tauri::Manager;

    fn create_test_rule(id: &str, enabled: bool) -> WatchdogRule {
        WatchdogRule {
            id: id.to_string(),
            name: format!("Test Rule {}", id),
            enabled,
            conditions: vec![WatchdogCondition {
                metric: WatchdogMetric::CpuPercent,
                operator: WatchdogOperator::GreaterThan,
                threshold: 50.0,
            }],
            action: WatchdogAction::Suspend,
            process_filter: ProcessFilter {
                include_names: vec![],
                exclude_names: vec![],
            },
            profile_id: None,
            cooldown_secs: 30,
            last_triggered_at: None,
        }
    }

    fn create_test_process(pid: u32, name: &str, cpu: f32, mem: f64) -> SystemProcess {
        SystemProcess {
            pid,
            name: name.to_string(),
            cpu_percent: cpu,
            memory_mb: mem,
            disk_read_kb: 0.0,
            disk_write_kb: 0.0,
            can_terminate: true,
        }
    }

    #[test]
    fn test_get_watchdog_rules_empty() {
        let engine = WatchdogEngine::new();
        let state = WatchdogState::new(Mutex::new(engine));
        
        let rules = get_watchdog_rules(&state).unwrap();
        assert_eq!(rules.len(), 0);
    }

    #[test]
    fn test_add_watchdog_rule() {
        let mut engine = WatchdogEngine::new();
        let state = WatchdogState::new(Mutex::new(engine));
        
        let rule = create_test_rule("test-rule", true);
        
        // Note: このテストでは永続化部分をスキップ（AppHandle が必要なため）
        // 実際のアプリケーションでは永続化も行われる
        let result = {
            let mut watchdog = state.lock().unwrap();
            watchdog.add_rule(rule.clone())
        };
        
        assert!(result.is_ok());
        
        let rules = get_watchdog_rules(&state).unwrap();
        assert_eq!(rules.len(), 1);
        assert_eq!(rules[0].id, "test-rule");
    }

    #[test]
    fn test_update_watchdog_rule() {
        let mut engine = WatchdogEngine::new();
        let state = WatchdogState::new(Mutex::new(engine));
        
        let rule = create_test_rule("test-rule", true);
        {
            let mut watchdog = state.lock().unwrap();
            watchdog.add_rule(rule).unwrap();
        }
        
        let mut updated_rule = create_test_rule("test-rule", false);
        updated_rule.name = "Updated Rule".to_string();
        
        let result = {
            let mut watchdog = state.lock().unwrap();
            watchdog.update_rule(updated_rule.clone())
        };
        
        assert!(result.is_ok());
        
        let rules = get_watchdog_rules(&state).unwrap();
        assert_eq!(rules.len(), 1);
        assert_eq!(rules[0].name, "Updated Rule");
        assert!(!rules[0].enabled);
    }

    #[test]
    fn test_remove_watchdog_rule() {
        let mut engine = WatchdogEngine::new();
        let state = WatchdogState::new(Mutex::new(engine));
        
        let rule = create_test_rule("test-rule", true);
        {
            let mut watchdog = state.lock().unwrap();
            watchdog.add_rule(rule).unwrap();
        }
        
        assert_eq!(get_watchdog_rules(&state).unwrap().len(), 1);
        
        let result = {
            let mut watchdog = state.lock().unwrap();
            watchdog.remove_rule("test-rule")
        };
        
        assert!(result.is_ok());
        assert_eq!(get_watchdog_rules(&state).unwrap().len(), 0);
    }

    #[test]
    fn test_get_watchdog_events_empty() {
        let engine = WatchdogEngine::new();
        let state = WatchdogState::new(Mutex::new(engine));
        
        let events = get_watchdog_events(&state).unwrap();
        assert_eq!(events.len(), 0);
    }

    #[test]
    fn test_get_watchdog_presets() {
        let presets = get_watchdog_presets().unwrap();
        assert!(!presets.is_empty());
        
        // プリセットルールの検証
        for preset in &presets {
            assert!(!preset.id.is_empty());
            assert!(!preset.name.is_empty());
            assert!(!preset.conditions.is_empty());
            assert!(!preset.include_names.is_empty() || !preset.exclude_names.is_empty());
        }
    }

    #[test]
    fn test_add_duplicate_rule() {
        let mut engine = WatchdogEngine::new();
        let state = WatchdogState::new(Mutex::new(engine));
        
        let rule = create_test_rule("test-rule", true);
        
        // 最初の追加
        {
            let mut watchdog = state.lock().unwrap();
            assert!(watchdog.add_rule(rule.clone()).is_ok());
        }
        
        // 重複追加
        let result = {
            let mut watchdog = state.lock().unwrap();
            watchdog.add_rule(rule)
        };
        
        assert!(result.is_err());
    }

    #[test]
    fn test_update_nonexistent_rule() {
        let engine = WatchdogEngine::new();
        let state = WatchdogState::new(Mutex::new(engine));
        
        let rule = create_test_rule("nonexistent", true);
        
        let result = {
            let mut watchdog = state.lock().unwrap();
            watchdog.update_rule(rule)
        };
        
        assert!(result.is_err());
    }

    #[test]
    fn test_remove_nonexistent_rule() {
        let engine = WatchdogEngine::new();
        let state = WatchdogState::new(Mutex::new(engine));
        
        let result = {
            let mut watchdog = state.lock().unwrap();
            watchdog.remove_rule("nonexistent")
        };
        
        assert!(result.is_err());
    }
}
