// Hardware Wing — ハードウェア情報取得機能

mod commands;
mod types;

pub use commands::*;
pub use types::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_info_gpu_fields_default_none() {
        let info = HardwareInfo {
            cpu_name: "Test CPU".to_string(),
            cpu_cores: 4,
            cpu_threads: 8,
            cpu_base_ghz: 2.5,
            cpu_temp_c: None,
            mem_total_gb: 16.0,
            mem_used_gb: 8.0,
            os_name: "Windows".to_string(),
            os_version: "10".to_string(),
            hostname: "test-pc".to_string(),
            uptime_secs: 3600,
            boot_time_unix: 1640995200,
            disks: vec![],
            gpu_name: None,
            gpu_vram_total_mb: None,
            gpu_vram_used_mb: None,
            gpu_temp_c: None,
            gpu_usage_percent: None,
        };
        assert!(info.gpu_name.is_none());
        assert!(info.gpu_vram_total_mb.is_none());
        assert!(info.gpu_vram_used_mb.is_none());
        assert!(info.gpu_temp_c.is_none());
        assert!(info.gpu_usage_percent.is_none());
    }
}
