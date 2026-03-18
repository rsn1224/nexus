//! ゲーム起動前ヘルスチェックサービス
//!
//! ストレージ空き容量、温度、メモリ、バックグラウンドプロセスを
//! チェックし、問題があれば警告を返す。

use serde::{Deserialize, Serialize};

/// ヘルスチェック結果の重要度
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum HealthSeverity {
    Ok,
    Warning,
    Critical,
}

/// 個別チェック項目の結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckItem {
    pub id: String,
    pub label: String,
    pub severity: HealthSeverity,
    pub message: String,
    pub fix_action: Option<HealthFixAction>,
}

/// 修正アクション
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthFixAction {
    /// アクション ID（フロントエンドでディスパッチ用）
    pub id: String,
    /// ボタンラベル
    pub label: String,
}

/// ヘルスチェック全体の結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckResult {
    pub items: Vec<HealthCheckItem>,
    pub overall: HealthSeverity,
    pub timestamp: u64,
}

/// ヘルスチェック入力（フロントエンドから渡す）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckInput {
    pub disk_free_gb: f32,
    pub disk_total_gb: f32,
    pub cpu_temp_c: Option<f32>,
    pub gpu_temp_c: Option<f32>,
    pub mem_used_mb: u64,
    pub mem_total_mb: u64,
    pub heavy_processes: Vec<HeavyProcess>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeavyProcess {
    pub name: String,
    pub cpu_percent: f32,
    #[allow(dead_code)]
    pub mem_mb: u64,
}

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

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_input() -> HealthCheckInput {
        HealthCheckInput {
            disk_free_gb: 100.0,
            disk_total_gb: 500.0,
            cpu_temp_c: Some(55.0),
            gpu_temp_c: Some(60.0),
            mem_used_mb: 8192,
            mem_total_mb: 16384,
            heavy_processes: vec![],
        }
    }

    #[test]
    fn test_all_ok() {
        let input = make_input();
        let result = run_health_check(&input);
        assert_eq!(result.overall, HealthSeverity::Ok);
        assert!(
            result
                .items
                .iter()
                .all(|i| i.severity == HealthSeverity::Ok)
        );
    }

    #[test]
    fn test_storage_critical() {
        let mut input = make_input();
        input.disk_free_gb = 5.0;
        let result = run_health_check(&input);
        assert_eq!(result.overall, HealthSeverity::Critical);
        assert!(result.items.iter().any(|i| i.id == "storage-low"));
    }

    #[test]
    fn test_gpu_temp_warning() {
        let mut input = make_input();
        input.gpu_temp_c = Some(88.0);
        let result = run_health_check(&input);
        assert!(result.items.iter().any(|i| i.id == "gpu-temp-warn"));
    }

    #[test]
    fn test_memory_critical() {
        let mut input = make_input();
        input.mem_used_mb = 15000;
        let result = run_health_check(&input);
        assert!(result.items.iter().any(|i| i.id == "mem-critical"));
    }

    #[test]
    fn test_heavy_processes() {
        let mut input = make_input();
        input.heavy_processes = vec![
            HeavyProcess {
                name: "chrome.exe".into(),
                cpu_percent: 25.0,
                mem_mb: 500,
            },
            HeavyProcess {
                name: "discord.exe".into(),
                cpu_percent: 18.0,
                mem_mb: 300,
            },
            HeavyProcess {
                name: "spotify.exe".into(),
                cpu_percent: 16.0,
                mem_mb: 200,
            },
        ];
        let result = run_health_check(&input);
        assert!(result.items.iter().any(|i| i.id == "process-heavy"));
    }

    #[test]
    fn test_overall_uses_worst_severity() {
        let mut input = make_input();
        input.disk_free_gb = 5.0; // Critical
        input.gpu_temp_c = Some(88.0); // Warning
        let result = run_health_check(&input);
        assert_eq!(result.overall, HealthSeverity::Critical);
    }
}
