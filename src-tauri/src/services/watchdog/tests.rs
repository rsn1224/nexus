//! Watchdog エンジンのテスト

use super::engine::*;
use crate::commands::ops::SystemProcess;
use crate::types::game::*;

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
    engine
        .cooldowns_mut()
        .insert(("test".to_string(), 1234).into(), now - 1000);
    assert!(engine.is_in_cooldown("test", 1234, 2, now)); // 2秒クールダウン

    // クールダウン期間外
    engine
        .cooldowns_mut()
        .insert(("test".to_string(), 1234).into(), now - 5000);
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

    let conditions_fail = vec![WatchdogCondition {
        metric: WatchdogMetric::CpuPercent,
        operator: WatchdogOperator::LessThan,
        threshold: 50.0,
    }];

    assert!(!engine.evaluate_conditions(&conditions_fail, &process));
}

#[test]
fn test_evaluate_no_match() {
    let mut engine = WatchdogEngine::new();
    let processes = vec![create_test_process(1234, "chrome.exe", 5.0, 512.0)];

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
        engine.event_log_mut().push(WatchdogEvent {
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
    let _events = engine.evaluate(&processes, None);

    assert!(engine.get_events().len() <= 500);
}
