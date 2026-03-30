//! 個別ヘルスチェック実装

use super::types::*;

/// ヘルスチェックを実行
pub fn run_health_check(input: &HealthCheckInput) -> HealthCheckResult {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let mut items = Vec::new();

    // 1. ストレージ空き容量
    items.push(check_storage(input.disk_free_gb, input.disk_total_gb));

    // 2. GPU 温度
    if let Some(temp) = input.gpu_temp_c {
        items.push(check_gpu_temp(temp));
    }

    // 3. CPU 温度
    if let Some(temp) = input.cpu_temp_c {
        items.push(check_cpu_temp(temp));
    }

    // 4. メモリ使用率
    items.push(check_memory(input.mem_used_mb, input.mem_total_mb));

    // 5. 重いバックグラウンドプロセス
    items.push(check_heavy_processes(&input.heavy_processes));

    // 全体の重要度
    let overall = items
        .iter()
        .map(|item| item.severity)
        .max()
        .unwrap_or(HealthSeverity::Ok);

    HealthCheckResult {
        items,
        overall,
        timestamp: now,
    }
}

fn check_storage(free_gb: f32, total_gb: f32) -> HealthCheckItem {
    let usage_pct = if total_gb > 0.0 {
        ((total_gb - free_gb) / total_gb * 100.0) as u32
    } else {
        0
    };

    if free_gb < 10.0 {
        HealthCheckItem {
            id: "storage-low".into(),
            label: "ストレージ空き容量".into(),
            severity: HealthSeverity::Critical,
            message: format!(
                "空き容量 {:.1}GB — ゲームの動作に影響する可能性があります",
                free_gb
            ),
            fix_action: Some(HealthFixAction {
                id: "navigate-storage".into(),
                label: "ストレージ管理".into(),
            }),
        }
    } else if free_gb < 30.0 {
        HealthCheckItem {
            id: "storage-warn".into(),
            label: "ストレージ空き容量".into(),
            severity: HealthSeverity::Warning,
            message: format!("空き容量 {:.1}GB — 余裕を持たせることを推奨します", free_gb),
            fix_action: Some(HealthFixAction {
                id: "navigate-storage".into(),
                label: "ストレージ管理".into(),
            }),
        }
    } else {
        HealthCheckItem {
            id: "storage-ok".into(),
            label: "ストレージ空き容量".into(),
            severity: HealthSeverity::Ok,
            message: format!("空き容量 {:.1}GB（使用率 {}%）", free_gb, usage_pct),
            fix_action: None,
        }
    }
}

fn check_gpu_temp(temp: f32) -> HealthCheckItem {
    let thresholds = &crate::constants::THERMAL_THRESHOLDS;
    if temp >= thresholds.gpu_critical_c {
        HealthCheckItem {
            id: "gpu-temp-critical".into(),
            label: "GPU 温度".into(),
            severity: HealthSeverity::Critical,
            message: format!("GPU {:.0}℃ — ゲーム起動前に冷却を確認してください", temp),
            fix_action: None,
        }
    } else if temp >= thresholds.gpu_warning_c {
        HealthCheckItem {
            id: "gpu-temp-warn".into(),
            label: "GPU 温度".into(),
            severity: HealthSeverity::Warning,
            message: format!(
                "GPU {:.0}℃ — やや高めです。ファンの状態を確認してください",
                temp
            ),
            fix_action: None,
        }
    } else {
        HealthCheckItem {
            id: "gpu-temp-ok".into(),
            label: "GPU 温度".into(),
            severity: HealthSeverity::Ok,
            message: format!("GPU {:.0}℃ — 正常範囲", temp),
            fix_action: None,
        }
    }
}

fn check_cpu_temp(temp: f32) -> HealthCheckItem {
    let thresholds = &crate::constants::THERMAL_THRESHOLDS;
    if temp >= thresholds.cpu_critical_c {
        HealthCheckItem {
            id: "cpu-temp-critical".into(),
            label: "CPU 温度".into(),
            severity: HealthSeverity::Critical,
            message: format!("CPU {:.0}℃ — ゲーム起動前に冷却を確認してください", temp),
            fix_action: None,
        }
    } else if temp >= thresholds.cpu_warning_c {
        HealthCheckItem {
            id: "cpu-temp-warn".into(),
            label: "CPU 温度".into(),
            severity: HealthSeverity::Warning,
            message: format!("CPU {:.0}℃ — やや高めです", temp),
            fix_action: None,
        }
    } else {
        HealthCheckItem {
            id: "cpu-temp-ok".into(),
            label: "CPU 温度".into(),
            severity: HealthSeverity::Ok,
            message: format!("CPU {:.0}℃ — 正常範囲", temp),
            fix_action: None,
        }
    }
}

fn check_memory(used_mb: u64, total_mb: u64) -> HealthCheckItem {
    let usage_pct = if total_mb > 0 {
        (used_mb as f32 / total_mb as f32 * 100.0) as u32
    } else {
        0
    };

    if usage_pct >= 90 {
        HealthCheckItem {
            id: "mem-critical".into(),
            label: "メモリ使用率".into(),
            severity: HealthSeverity::Critical,
            message: format!(
                "メモリ使用率 {}% — ゲームに十分なメモリがありません",
                usage_pct
            ),
            fix_action: Some(HealthFixAction {
                id: "memory-cleanup".into(),
                label: "メモリクリーニング".into(),
            }),
        }
    } else if usage_pct >= 75 {
        HealthCheckItem {
            id: "mem-warn".into(),
            label: "メモリ使用率".into(),
            severity: HealthSeverity::Warning,
            message: format!(
                "メモリ使用率 {}% — ブーストでメモリを解放することを推奨",
                usage_pct
            ),
            fix_action: Some(HealthFixAction {
                id: "navigate-boost".into(),
                label: "ブースト".into(),
            }),
        }
    } else {
        HealthCheckItem {
            id: "mem-ok".into(),
            label: "メモリ使用率".into(),
            severity: HealthSeverity::Ok,
            message: format!("メモリ使用率 {}% — 十分な空きがあります", usage_pct),
            fix_action: None,
        }
    }
}

fn check_heavy_processes(processes: &[HeavyProcess]) -> HealthCheckItem {
    let heavy: Vec<&HeavyProcess> = processes.iter().filter(|p| p.cpu_percent >= 15.0).collect();

    if heavy.len() >= 3 {
        let names: Vec<String> = heavy.iter().take(3).map(|p| p.name.clone()).collect();
        HealthCheckItem {
            id: "process-heavy".into(),
            label: "バックグラウンドプロセス".into(),
            severity: HealthSeverity::Warning,
            message: format!("CPU を消費中: {} — サスペンドを推奨", names.join(", ")),
            fix_action: Some(HealthFixAction {
                id: "navigate-boost".into(),
                label: "ブースト".into(),
            }),
        }
    } else if !heavy.is_empty() {
        let names: Vec<String> = heavy.iter().map(|p| p.name.clone()).collect();
        HealthCheckItem {
            id: "process-moderate".into(),
            label: "バックグラウンドプロセス".into(),
            severity: HealthSeverity::Ok,
            message: format!("軽度の負荷: {}", names.join(", ")),
            fix_action: None,
        }
    } else {
        HealthCheckItem {
            id: "process-ok".into(),
            label: "バックグラウンドプロセス".into(),
            severity: HealthSeverity::Ok,
            message: "重いバックグラウンドプロセスはありません".into(),
            fix_action: None,
        }
    }
}
