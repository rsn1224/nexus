//! Watchdog アクション実行・フィルタ・条件評価・永続化

use crate::commands::ops::SystemProcess;
use crate::error::AppError;
use crate::infra::process_control;
use crate::types::game::*;
use tauri::{AppHandle, Manager};
use tracing::info;

use super::engine::WatchdogEngine;

impl WatchdogEngine {
    /// プロセスフィルタのマッチング
    pub(crate) fn matches_filter(&self, filter: &ProcessFilter, process_name: &str) -> bool {
        let name_lower = process_name.to_lowercase();

        // 除外リストチェック
        if filter
            .exclude_names
            .iter()
            .any(|exclude| name_lower.contains(&exclude.to_lowercase()))
        {
            return false;
        }

        // 包含リストが空の場合は全プロセス対象
        if filter.include_names.is_empty() {
            return true;
        }

        // 包含リストチェック
        filter
            .include_names
            .iter()
            .any(|include| name_lower.contains(&include.to_lowercase()))
    }

    /// クールダウンチェック
    pub(crate) fn is_in_cooldown(
        &self,
        rule_id: &str,
        pid: u32,
        cooldown_secs: u32,
        now: u64,
    ) -> bool {
        if let Some(&last_time) = self.cooldowns.get(&(rule_id.to_string(), pid)) {
            let cooldown_ms = cooldown_secs as u64 * 1000;
            now < last_time + cooldown_ms
        } else {
            false
        }
    }

    /// 条件評価
    pub(crate) fn evaluate_conditions(
        &self,
        conditions: &[WatchdogCondition],
        process: &SystemProcess,
    ) -> bool {
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
    pub(crate) fn execute_action(
        &mut self,
        rule: &WatchdogRule,
        process: &SystemProcess,
        now: u64,
    ) -> WatchdogEvent {
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

    /// ルール永続化
    pub fn save_rules(&self, app: &AppHandle) -> Result<(), AppError> {
        let app_data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Io(format!("Failed to get app data dir: {}", e)))?;

        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| AppError::Io(format!("Failed to create app data dir: {}", e)))?;

        let rules_path = app_data_dir.join("watchdog_rules.json");
        let json = serde_json::to_string_pretty(&self.rules)
            .map_err(|e| AppError::Io(format!("Failed to serialize rules: {}", e)))?;

        std::fs::write(&rules_path, json)
            .map_err(|e| AppError::Io(format!("Failed to write rules file: {}", e)))?;

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

        let json = std::fs::read_to_string(&rules_path)
            .map_err(|e| AppError::Io(format!("Failed to read rules file: {}", e)))?;

        let rules: Vec<WatchdogRule> = serde_json::from_str(&json)
            .map_err(|e| AppError::Io(format!("Failed to deserialize rules: {}", e)))?;

        info!("Watchdog rules loaded from {:?}", rules_path);
        Ok(rules)
    }
}
