//! v4 L1 ルールベース診断サービス
//! SystemStatus に閾値ルールを適用して DiagnosticAlert を返す

use crate::types::v4::{DiagnosticAlert, Severity, SystemStatus};

pub fn diagnose(status: &SystemStatus) -> Vec<DiagnosticAlert> {
    let mut alerts = Vec::new();

    // GPU temp > 90°C → サーマルスロットリング
    if status.gpu_temp_c > 90.0 {
        alerts.push(DiagnosticAlert {
            severity: Severity::Danger,
            title: "GPU thermal throttling".to_string(),
            detail: format!("{:.0}°C exceeds 90°C threshold", status.gpu_temp_c),
        });
    } else if status.gpu_temp_c > 80.0 {
        alerts.push(DiagnosticAlert {
            severity: Severity::Warning,
            title: "GPU high temperature".to_string(),
            detail: format!("{:.0}°C exceeds 80°C threshold", status.gpu_temp_c),
        });
    }

    // RAM > 90%
    if status.ram_total_gb > 0.0 {
        let ram_pct = status.ram_used_gb / status.ram_total_gb * 100.0;
        if ram_pct > 90.0 {
            alerts.push(DiagnosticAlert {
                severity: Severity::Warning,
                title: "Memory pressure".to_string(),
                detail: format!(
                    "{:.0}% used ({:.1}/{:.1} GB)",
                    ram_pct, status.ram_used_gb, status.ram_total_gb
                ),
            });
        }
    }

    // Disk free < 20GB → danger, < 50GB → warning
    if status.disk_free_gb < 20.0 {
        alerts.push(DiagnosticAlert {
            severity: Severity::Danger,
            title: "Storage critically low".to_string(),
            detail: format!("{:.1} GB free", status.disk_free_gb),
        });
    } else if status.disk_free_gb < 50.0 {
        alerts.push(DiagnosticAlert {
            severity: Severity::Warning,
            title: "Storage low".to_string(),
            detail: format!("{:.1} GB free", status.disk_free_gb),
        });
    }

    alerts
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_status(gpu_temp: f32, ram_used: f32, ram_total: f32, disk_free: f32) -> SystemStatus {
        SystemStatus {
            cpu_percent: 50.0,
            gpu_percent: 50.0,
            gpu_temp_c: gpu_temp,
            ram_used_gb: ram_used,
            ram_total_gb: ram_total,
            disk_free_gb: disk_free,
        }
    }

    #[test]
    fn test_no_alerts_for_healthy_system() {
        let alerts = diagnose(&make_status(60.0, 8.0, 32.0, 200.0));
        assert!(alerts.is_empty());
    }

    #[test]
    fn test_gpu_warning_at_85c() {
        let alerts = diagnose(&make_status(85.0, 8.0, 32.0, 200.0));
        assert_eq!(alerts.len(), 1);
        assert_eq!(alerts[0].severity, Severity::Warning);
    }

    #[test]
    fn test_gpu_danger_at_95c() {
        let alerts = diagnose(&make_status(95.0, 8.0, 32.0, 200.0));
        assert_eq!(alerts.len(), 1);
        assert_eq!(alerts[0].severity, Severity::Danger);
    }

    #[test]
    fn test_ram_warning_above_90_pct() {
        let alerts = diagnose(&make_status(60.0, 29.5, 32.0, 200.0));
        assert_eq!(alerts.len(), 1);
        assert!(alerts[0].title.contains("Memory"));
    }

    #[test]
    fn test_disk_danger_below_20gb() {
        let alerts = diagnose(&make_status(60.0, 8.0, 32.0, 10.0));
        assert_eq!(alerts.len(), 1);
        assert_eq!(alerts[0].severity, Severity::Danger);
    }

    #[test]
    fn test_disk_warning_below_50gb() {
        let alerts = diagnose(&make_status(60.0, 8.0, 32.0, 40.0));
        assert_eq!(alerts.len(), 1);
        assert_eq!(alerts[0].severity, Severity::Warning);
    }

    #[test]
    fn test_multiple_alerts() {
        let alerts = diagnose(&make_status(92.0, 30.0, 32.0, 10.0));
        assert_eq!(alerts.len(), 3); // GPU danger + RAM warning + Disk danger
    }
}
