//! Windows 設定最適化アドバイザーサービス
//! ハードウェア構成を入力として、推奨設定と理由を返す。

mod analyzer;
mod types;

pub use analyzer::*;
pub use types::*;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::game::CpuTopology;

    fn create_test_topology(vendor: &str, brand: &str, cores: u32, threads: u32) -> CpuTopology {
        CpuTopology {
            vendor_id: vendor.to_string(),
            brand: brand.to_string(),
            physical_cores: cores as usize,
            logical_cores: threads as usize,
            p_cores: vec![0, 1, 2, 3],
            e_cores: vec![4, 5, 6, 7],
            ccd_groups: vec![vec![0, 1, 2, 3], vec![4, 5, 6, 7]],
            hyperthreading_enabled: threads > cores,
        }
    }

    #[test]
    fn test_intel_rtx_recommendations() {
        let topology = create_test_topology("GenuineIntel", "Intel Core i9-13900K", 24, 32);
        let current = WindowsSettingsSnapshot {
            game_mode: true,
            hags: true,
            fullscreen_optimization: true,
            visual_effects: "BestPerformance".to_string(),
            power_plan: "High Performance".to_string(),
            memory_integrity: false,
        };

        let result = analyze_settings(&topology, Some("NVIDIA RTX 4070"), 32.0, &current);

        assert_eq!(result.optimization_score, 100);
        assert!(result.hardware_summary.contains("Intel"));
        assert!(result.hardware_summary.contains("RTX 4070"));

        let hags_rec = result
            .recommendations
            .iter()
            .find(|r| r.setting_id == "hags")
            .unwrap();
        assert!(matches!(
            hags_rec.recommended_value,
            RecommendedValue::Boolean(true)
        ));
    }

    #[test]
    fn test_amd_recommendations() {
        let topology = create_test_topology("AuthenticAMD", "AMD Ryzen 9 7950X", 16, 32);
        let current = WindowsSettingsSnapshot {
            game_mode: true,
            hags: false,
            fullscreen_optimization: true,
            visual_effects: "LetWindowsChoose".to_string(),
            power_plan: "AMD Ryzen Balanced".to_string(),
            memory_integrity: true,
        };

        let result = analyze_settings(&topology, Some("AMD RX 7900 XTX"), 64.0, &current);

        let power_rec = result
            .recommendations
            .iter()
            .find(|r| r.setting_id == "power_plan")
            .unwrap();
        assert!(
            matches!(&power_rec.recommended_value, RecommendedValue::String(s) if s.contains("AMD Ryzen Balanced"))
        );

        let hags_rec = result
            .recommendations
            .iter()
            .find(|r| r.setting_id == "hags")
            .unwrap();
        assert!(matches!(
            hags_rec.recommended_value,
            RecommendedValue::Boolean(true)
        ));
    }

    #[test]
    fn test_legacy_gpu_no_hags() {
        let topology = create_test_topology("GenuineIntel", "Intel Core i5-10400", 6, 12);
        let current = WindowsSettingsSnapshot {
            game_mode: false,
            hags: true,
            fullscreen_optimization: false,
            visual_effects: "LetWindowsChoose".to_string(),
            power_plan: "Balanced".to_string(),
            memory_integrity: true,
        };

        let result = analyze_settings(&topology, Some("NVIDIA GTX 1660"), 16.0, &current);

        let hags_rec = result
            .recommendations
            .iter()
            .find(|r| r.setting_id == "hags")
            .unwrap();
        assert!(matches!(
            hags_rec.recommended_value,
            RecommendedValue::Boolean(false)
        ));
        assert!(!hags_rec.is_optimal);
    }
}
