//! Watchdog デフォルトプリセットルール

use crate::types::game::*;

/// デフォルトプリセットルール
#[allow(dead_code)]
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
            action: WatchdogAction::SetPriority {
                level: "low".to_string(),
            },
            process_filter: ProcessFilter {
                include_names: vec![
                    "wuauserv".to_string(),
                    "tiworker".to_string(),
                    "trustedinstaller".to_string(),
                ],
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
            action: WatchdogAction::SetPriority {
                level: "belowNormal".to_string(),
            },
            process_filter: ProcessFilter {
                include_names: vec![
                    "chrome".to_string(),
                    "firefox".to_string(),
                    "msedge".to_string(),
                ],
                exclude_names: vec![],
            },
            profile_id: None,
            cooldown_secs: 60,
            last_triggered_at: None,
        },
    ]
}
