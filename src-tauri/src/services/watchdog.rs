//! Watchdog ルールエンジン
//! ops_emitter の出力を入力として、ルール条件に合致するプロセスにアクションを適用。
//! 3秒ごとの ops_emitter サイクルと同期して実行。

use crate::commands::ops::SystemProcess;
use crate::constants::is_protected_process;
use crate::error::AppError;
use crate::infra::process_control;
use crate::types::game::*;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tracing::info;

/// 現在時刻を Unix タイムスタンプ（ミリ秒）で取得
fn current_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub struct WatchdogEngine {
    rules: Vec<WatchdogRule>,
    event_log: Vec<WatchdogEvent>,
    /// プロセス別のクールダウン管理: (rule_id, pid) → last_action_time
    cooldowns: HashMap<(String, u32), u64>,
}

impl WatchdogEngine {
    pub fn new() -> Self {
        Self {
            rules: Vec::new(),
            event_log: Vec::new(),
            cooldowns: HashMap::new(),
        }
    }

    /// ルール CRUD
    pub fn add_rule(&mut self, rule: WatchdogRule) -> Result<(), AppError> {
        // ID 重複チェック
        if self.rules.iter().any(|r| r.id == rule.id) {
            return Err(AppError::InvalidInput(
                format!("Rule ID '{}' already exists", rule.id),
            ));
        }
        self.rules.push(rule);
        Ok(())
    }

    pub fn update_rule(&mut self, rule: WatchdogRule) -> Result<(), AppError> {
        let index = self
            .rules
            .iter()
            .position(|r| r.id == rule.id)
            .ok_or_else(|| {
                AppError::InvalidInput(format!("Rule ID '{}' not found", rule.id))
            })?;
        self.rules[index] = rule;
        Ok(())
    }

    pub fn remove_rule(&mut self, rule_id: &str) -> Result<(), AppError> {
        let index = self
            .rules
            .iter()
            .position(|r| r.id == rule_id)
            .ok_or_else(|| {
                AppError::InvalidInput(format!("Rule ID '{}' not found", rule_id))
            })?;
        self.rules.remove(index);
        Ok(())
    }

    pub fn get_rules(&self) -> &[WatchdogRule] {
        &self.rules
    }

    /// 評価実行（3秒ごとに呼ばれる）
    /// processes: 現在のプロセスリスト
    /// active_profile_id: 現在アクティブなゲームプロファイル ID
    /// 戻り値: 実行されたアクションのイベントログ
    pub fn evaluate(
        &mut self,
        processes: &[SystemProcess],
        active_profile_id: Option<&str>,
    ) -> Vec<WatchdogEvent> {
        let mut events = Vec::new();
        let now = current_timestamp_ms();

        for i in 0..self.rules.len() {
            let rule = self.rules[i].clone();
            if !rule.enabled {
                continue;
            }
            // プロファイル連動チェック
            if let Some(ref profile_id) = rule.profile_id {
                if active_profile_id != Some(profile_id.as_str()) {
                    continue;
                }
            }

            for process in processes {
                // 保護プロセスチェック（常にスキップ）
                if is_protected_process(&process.name) {
                    continue;
                }
                // フィルタチェック
                if !self.matches_filter(&rule.process_filter, &process.name) {
                    continue;
                }
                // クールダウンチェック
                if self.is_in_cooldown(&rule.id, process.pid, rule.cooldown_secs, now) {
                    continue;
                }
                // 条件評価（全条件 AND）
                if self.evaluate_conditions(&rule.conditions, process) {
                    // アクション実行
                    let event = self.execute_action(&rule, process, now);
                    events.push(event);
                }
            }
        }

        self.event_log.extend(events.clone());
        // ログを最大 500 件に制限
        if self.event_log.len() > 500 {
            self.event_log.drain(0..self.event_log.len() - 500);
        }
        events
    }

    /// プロセスフィルタのマッチング
    fn matches_filter(&self, filter: &ProcessFilter, process_name: &str) -> bool {
        let name_lower = process_name.to_lowercase();
        
        // 除外リストチェック
        if filter.exclude_names.iter().any(|exclude| {
            name_lower.contains(&exclude.to_lowercase())
        }) {
            return false;
        }
        
        // 包含リストが空の場合は全プロセス対象
        if filter.include_names.is_empty() {
            return true;
        }
        
        // 包含リストチェック
        filter.include_names.iter().any(|include| {
            name_lower.contains(&include.to_lowercase())
        })
    }

    /// クールダウンチェック
    fn is_in_cooldown(&self, rule_id: &str, pid: u32, cooldown_secs: u32, now: u64) -> bool {
        if let Some(&last_time) = self.cooldowns.get(&(rule_id.to_string(), pid)) {
            let cooldown_ms = cooldown_secs as u64 * 1000;
            now < last_time + cooldown_ms
        } else {
            false
        }
    }

    /// 条件評価
    fn evaluate_conditions(&self, conditions: &[WatchdogCondition], process: &SystemProcess) -> bool {
        conditions.iter().all(|condition| {
            let metric_value = match condition.metric {
                WatchdogMetric::CpuPercent => process.cpu_percent as f64,
                WatchdogMetric::MemoryMb => process.mem_mb,
                WatchdogMetric::DiskReadKb => process.disk_read_kb,
                WatchdogMetric::DiskWriteKb => process.disk_write_kb,
            };
            
            match condition.operator {
                WatchdogOperator::GreaterThan => metric_value > condition.threshold,
                WatchdogOperator::LessThan => metric_value < condition.threshold,
                WatchdogOperator::Equals => (metric_value - condition.threshold).abs() < 0.001,
            }
        })
    }

    /// アクション実行
    fn execute_action(&mut self, rule: &WatchdogRule, process: &SystemProcess, now: u64) -> WatchdogEvent {
        let mut event = WatchdogEvent {
            timestamp: now,
            rule_id: rule.id.clone(),
            rule_name: rule.name.clone(),
            process_name: process.name.clone(),
            pid: process.pid,
            action_taken: String::new(),
            metric_value: 0.0,
            threshold: 0.0,
            success: false,
            detail: String::new(),
        };

        // 最初の条件からメトリック値と閾値を取得
        if let Some(condition) = rule.conditions.first() {
            event.metric_value = match condition.metric {
                WatchdogMetric::CpuPercent => process.cpu_percent as f64,
                WatchdogMetric::MemoryMb => process.mem_mb,
                WatchdogMetric::DiskReadKb => process.disk_read_kb,
                WatchdogMetric::DiskWriteKb => process.disk_write_kb,
            };
            event.threshold = condition.threshold;
        }

        let result = match &rule.action {
            WatchdogAction::SetPriority { level } => {
                let priority = match level.as_str() {
                    "idle" | "low" => crate::types::game::ProcessPriority::Idle,
                    "belowNormal" => crate::types::game::ProcessPriority::BelowNormal,
                    "high" => crate::types::game::ProcessPriority::High,
                    "realtime" => crate::types::game::ProcessPriority::Realtime,
                    _ => crate::types::game::ProcessPriority::Normal,
                };
                event.action_taken = format!("SetPriority({})", level);
                process_control::set_process_priority_class(process.pid, priority)
            }
            WatchdogAction::SetAffinity { cores } => {
                let usize_cores: Vec<usize> = cores.iter().map(|&c| c as usize).collect();
                event.action_taken = format!("SetAffinity({:?})", cores);
                crate::infra::cpu_affinity::set_affinity(process.pid, &usize_cores)
            }
            WatchdogAction::Suspend => {
                event.action_taken = "Suspend".to_string();
                process_control::suspend_process(process.pid)
            }
            WatchdogAction::Terminate => {
                event.action_taken = "Terminate".to_string();
                process_control::terminate_process(process.pid, 1)
            }
        };

        match result {
            Ok(()) => {
                event.success = true;
                event.detail = "Action executed successfully".to_string();
                // クールダウンを記録
                self.cooldowns.insert((rule.id.clone(), process.pid), now);
            }
            Err(e) => {
                event.success = false;
                event.detail = format!("Failed to execute action: {}", e);
            }
        }

        info!(
            "Watchdog action: {} on {} (pid: {}) - {}",
            event.action_taken,
            event.process_name,
            event.pid,
            if event.success { "SUCCESS" } else { "FAILED" }
        );

        event
    }

    /// イベントログ取得
    pub fn get_events(&self) -> &[WatchdogEvent] {
        &self.event_log
    }

    /// ルール永続化
    pub fn save_rules(&self, app: &AppHandle) -> Result<(), AppError> {
        let app_data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Io(format!("Failed to get app data dir: {}", e)))?;
        
        std::fs::create_dir_all(&app_data_dir).map_err(|e| {
            AppError::Io(format!("Failed to create app data dir: {}", e))
        })?;
        
        let rules_path = app_data_dir.join("watchdog_rules.json");
        let json = serde_json::to_string_pretty(&self.rules).map_err(|e| {
            AppError::Io(format!("Failed to serialize rules: {}", e))
        })?;
        
        std::fs::write(&rules_path, json).map_err(|e| {
            AppError::Io(format!("Failed to write rules file: {}", e))
        })?;
        
        info!("Watchdog rules saved to {:?}", rules_path);
        Ok(())
    }

    /// ルール読み込み
    pub fn load_rules(app: &AppHandle) -> Result<Vec<WatchdogRule>, AppError> {
        let app_data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Io(format!("Failed to get app data dir: {}", e)))?;
        
        let rules_path = app_data_dir.join("watchdog_rules.json");
        
        if !rules_path.exists() {
            return Ok(Vec::new());
        }
        
        let json = std::fs::read_to_string(&rules_path).map_err(|e| {
            AppError::Io(format!("Failed to read rules file: {}", e))
        })?;
        
        let rules: Vec<WatchdogRule> = serde_json::from_str(&json).map_err(|e| {
            AppError::Io(format!("Failed to deserialize rules: {}", e))
        })?;
        
        info!("Watchdog rules loaded from {:?}", rules_path);
        Ok(rules)
    }
}

/// デフォルトプリセットルール
pub fn default_presets() -> Vec<WatchdogRule> {
    vec![
        WatchdogRule {
            id: "preset-windows-update".to_string(),
            name: "Windows Update を低優先度に".to_string(),
            enabled: false, // デフォルトは無効
            conditions: vec![WatchdogCondition {
                metric: WatchdogMetric::CpuPercent,
                operator: WatchdogOperator::GreaterThan,
                threshold: 10.0,
            }],
            action: WatchdogAction::SetPriority { level: "low".to_string() },
            process_filter: ProcessFilter {
                include_names: vec!["wuauserv".to_string(), "tiworker".to_string(), "trustedinstaller".to_string()],
                exclude_names: vec![],
            },
            profile_id: None,
            cooldown_secs: 30,
            last_triggered_at: None,
        },
        WatchdogRule {
            id: "preset-browser-throttle".to_string(),
            name: "ゲーム中のブラウザを低優先度に".to_string(),
            enabled: false,
            conditions: vec![WatchdogCondition {
                metric: WatchdogMetric::CpuPercent,
                operator: WatchdogOperator::GreaterThan,
                threshold: 15.0,
            }],
            action: WatchdogAction::SetPriority { level: "belowNormal".to_string() },
            process_filter: ProcessFilter {
                include_names: vec!["chrome".to_string(), "firefox".to_string(), "msedge".to_string()],
                exclude_names: vec![],
            },
            profile_id: None,
            cooldown_secs: 60,
            last_triggered_at: None,
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::ops::SystemProcess;

    fn create_test_process(pid: u32, name: &str, cpu: f32, mem: f64) -> SystemProcess {
        SystemProcess {
            pid,
            name: name.to_string(),
            cpu_percent: cpu,
            mem_mb: mem,
            disk_read_kb: 0.0,
            disk_write_kb: 0.0,
            can_terminate: true,
        }
    }

    #[test]
    fn test_add_rule() {
        let mut engine = WatchdogEngine::new();
        let rule = WatchdogRule {
            id: "test-rule".to_string(),
            name: "Test Rule".to_string(),
            enabled: true,
            conditions: vec![],
            action: WatchdogAction::Suspend,
            process_filter: ProcessFilter {
                include_names: vec![],
                exclude_names: vec![],
            },
            profile_id: None,
            cooldown_secs: 30,
            last_triggered_at: None,
        };

        assert!(engine.add_rule(rule.clone()).is_ok());
        assert_eq!(engine.get_rules().len(), 1);
        
        // 重複テスト
        assert!(engine.add_rule(rule).is_err());
    }

    #[test]
    fn test_update_rule() {
        let mut engine = WatchdogEngine::new();
        let rule = WatchdogRule {
            id: "test-rule".to_string(),
            name: "Test Rule".to_string(),
            enabled: true,
            conditions: vec![],
            action: WatchdogAction::Suspend,
            process_filter: ProcessFilter {
                include_names: vec![],
                exclude_names: vec![],
            },
            profile_id: None,
            cooldown_secs: 30,
            last_triggered_at: None,
        };

        engine.add_rule(rule).unwrap();
        
        let mut updated_rule = engine.get_rules()[0].clone();
        updated_rule.name = "Updated Rule".to_string();
        
        assert!(engine.update_rule(updated_rule.clone()).is_ok());
        assert_eq!(engine.get_rules()[0].name, "Updated Rule");
        
        // 存在しないルール
        let nonexistent_rule = WatchdogRule {
            id: "nonexistent".to_string(),
            name: "Nonexistent".to_string(),
            enabled: true,
            conditions: vec![],
            action: WatchdogAction::Suspend,
            process_filter: ProcessFilter {
                include_names: vec![],
                exclude_names: vec![],
            },
            profile_id: None,
            cooldown_secs: 30,
            last_triggered_at: None,
        };
        assert!(engine.update_rule(nonexistent_rule).is_err());
    }

    #[test]
    fn test_remove_rule() {
        let mut engine = WatchdogEngine::new();
        let rule = WatchdogRule {
            id: "test-rule".to_string(),
            name: "Test Rule".to_string(),
            enabled: true,
            conditions: vec![],
            action: WatchdogAction::Suspend,
            process_filter: ProcessFilter {
                include_names: vec![],
                exclude_names: vec![],
            },
            profile_id: None,
            cooldown_secs: 30,
            last_triggered_at: None,
        };

        engine.add_rule(rule).unwrap();
        assert_eq!(engine.get_rules().len(), 1);
        
        assert!(engine.remove_rule("test-rule").is_ok());
        assert_eq!(engine.get_rules().len(), 0);
        
        // 存在しないルール
        assert!(engine.remove_rule("nonexistent").is_err());
    }

    #[test]
    fn test_matches_filter() {
        let engine = WatchdogEngine::new();
        
        let filter_all = ProcessFilter {
            include_names: vec![],
            exclude_names: vec![],
        };
        assert!(engine.matches_filter(&filter_all, "chrome.exe"));
        
        let filter_include = ProcessFilter {
            include_names: vec!["chrome".to_string()],
            exclude_names: vec![],
        };
        assert!(engine.matches_filter(&filter_include, "chrome.exe"));
        assert!(!engine.matches_filter(&filter_include, "firefox.exe"));
        
        let filter_exclude = ProcessFilter {
            include_names: vec![],
            exclude_names: vec!["chrome".to_string()],
        };
        assert!(!engine.matches_filter(&filter_exclude, "chrome.exe"));
        assert!(engine.matches_filter(&filter_exclude, "firefox.exe"));
    }

    #[test]
    fn test_cooldown() {
        let mut engine = WatchdogEngine::new();
        let now = current_timestamp_ms();
        
        // クールダウン期間内
        engine.cooldowns.insert(("test".to_string(), 1234).into(), now - 1000);
        assert!(engine.is_in_cooldown("test", 1234, 2, now)); // 2秒クールダウン
        
        // クールダウン期間外
        engine.cooldowns.insert(("test".to_string(), 1234).into(), now - 5000);
        assert!(!engine.is_in_cooldown("test", 1234, 2, now));
    }

    #[test]
    fn test_evaluate_conditions() {
        let engine = WatchdogEngine::new();
        let process = create_test_process(1234, "test.exe", 80.0, 1024.0);
        
        let conditions = vec![
            WatchdogCondition {
                metric: WatchdogMetric::CpuPercent,
                operator: WatchdogOperator::GreaterThan,
                threshold: 50.0,
            },
            WatchdogCondition {
                metric: WatchdogMetric::MemoryMb,
                operator: WatchdogOperator::GreaterThan,
                threshold: 500.0,
            },
        ];
        
        assert!(engine.evaluate_conditions(&conditions, &process));
        
        let conditions_fail = vec![
            WatchdogCondition {
                metric: WatchdogMetric::CpuPercent,
                operator: WatchdogOperator::LessThan,
                threshold: 50.0,
            },
        ];
        
        assert!(!engine.evaluate_conditions(&conditions_fail, &process));
    }

    #[test]
    fn test_evaluate_no_match() {
        let mut engine = WatchdogEngine::new();
        let processes = vec![
            create_test_process(1234, "chrome.exe", 5.0, 512.0),
        ];
        
        let rule = WatchdogRule {
            id: "test-rule".to_string(),
            name: "Test Rule".to_string(),
            enabled: true,
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
            cooldown_secs: 0,
            last_triggered_at: None,
        };
        
        engine.add_rule(rule).unwrap();
        let events = engine.evaluate(&processes, None);
        assert_eq!(events.len(), 0);
    }

    #[test]
    fn test_evaluate_protected_process() {
        let mut engine = WatchdogEngine::new();
        let processes = vec![
            create_test_process(1234, "svchost.exe", 80.0, 512.0), // 保護プロセス
        ];
        
        let rule = WatchdogRule {
            id: "test-rule".to_string(),
            name: "Test Rule".to_string(),
            enabled: true,
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
            cooldown_secs: 0,
            last_triggered_at: None,
        };
        
        engine.add_rule(rule).unwrap();
        let events = engine.evaluate(&processes, None);
        assert_eq!(events.len(), 0); // 保護プロセスはスキップされる
    }

    #[test]
    fn test_event_log_limit() {
        let mut engine = WatchdogEngine::new();
        
        // 500件以上のイベントを追加
        for i in 0..600 {
            engine.event_log.push(WatchdogEvent {
                timestamp: i,
                rule_id: format!("rule-{}", i),
                rule_name: format!("Rule {}", i),
                process_name: "test.exe".to_string(),
                pid: 1234,
                action_taken: "Test".to_string(),
                metric_value: 50.0,
                threshold: 30.0,
                success: true,
                detail: "Test".to_string(),
            });
        }
        
        // evaluate を呼ぶとログが制限される
        let processes = vec![];
        let events = engine.evaluate(&processes, None);
        
        assert!(engine.event_log.len() <= 500);
    }
}
