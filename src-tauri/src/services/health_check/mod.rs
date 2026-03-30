//! ゲーム起動前ヘルスチェックサービス
//!
//! ストレージ空き容量、温度、メモリ、バックグラウンドプロセスを
//! チェックし、問題があれば警告を返す。

mod checks;
mod types;

pub use checks::*;
pub use types::*;

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
