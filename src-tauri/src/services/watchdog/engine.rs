//! Watchdog ルールエンジン本体
//! ops_emitter の出力を入力として、ルール条件に合致するプロセスにアクションを適用。
//! 3秒ごとの ops_emitter サイクルと同期して実行。

use crate::commands::ops::SystemProcess;
use crate::constants::is_protected_process;
use crate::error::AppError;
use crate::types::game::*;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

/// 現在時刻を Unix タイムスタンプ（ミリ秒）で取得
pub(crate) fn current_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub struct WatchdogEngine {
    pub(crate) rules: Vec<WatchdogRule>,
    pub(crate) event_log: Vec<WatchdogEvent>,
    /// プロセス別のクールダウン管理: (rule_id, pid) → last_action_time
    pub(crate) cooldowns: HashMap<(String, u32), u64>,
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
            return Err(AppError::InvalidInput(format!(
                "Rule ID '{}' already exists",
                rule.id
            )));
        }
        self.rules.push(rule);
        Ok(())
    }

    pub fn update_rule(&mut self, rule: WatchdogRule) -> Result<(), AppError> {
        let index = self
            .rules
            .iter()
            .position(|r| r.id == rule.id)
            .ok_or_else(|| AppError::InvalidInput(format!("Rule ID '{}' not found", rule.id)))?;
        self.rules[index] = rule;
        Ok(())
    }

    pub fn remove_rule(&mut self, rule_id: &str) -> Result<(), AppError> {
        let index = self
            .rules
            .iter()
            .position(|r| r.id == rule_id)
            .ok_or_else(|| AppError::InvalidInput(format!("Rule ID '{}' not found", rule_id)))?;
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

    /// イベントログ取得
    pub fn get_events(&self) -> &[WatchdogEvent] {
        &self.event_log
    }

    // Expose cooldowns for testing
    #[cfg(test)]
    pub(crate) fn cooldowns_mut(&mut self) -> &mut HashMap<(String, u32), u64> {
        &mut self.cooldowns
    }

    #[cfg(test)]
    pub(crate) fn event_log_mut(&mut self) -> &mut Vec<WatchdogEvent> {
        &mut self.event_log
    }
}
