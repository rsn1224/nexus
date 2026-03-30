mod advisor;
mod commands;
mod helpers;
mod types;

pub use advisor::*;
pub use commands::*;

#[cfg(test)]
mod tests {
    use super::types::*;

    #[test]
    fn test_power_plan_display() {
        assert_eq!(PowerPlan::Balanced.to_string(), "Balanced");
        assert_eq!(PowerPlan::HighPerformance.to_string(), "High Performance");
        assert_eq!(PowerPlan::PowerSaver.to_string(), "Power Saver");
    }

    #[test]
    fn test_visual_effects_display() {
        assert_eq!(
            VisualEffects::BestPerformance.to_string(),
            "Best Performance"
        );
        assert_eq!(VisualEffects::Balanced.to_string(), "Balanced");
        assert_eq!(VisualEffects::BestAppearance.to_string(), "Best Appearance");
    }

    #[test]
    fn test_windows_settings_serialization() {
        let settings = WindowsSettings {
            power_plan: PowerPlan::HighPerformance,
            game_mode: true,
            fullscreen_optimization: false,
            hardware_gpu_scheduling: true,
            visual_effects: VisualEffects::Balanced,
        };

        // シリアライズ・デシリアライズテスト
        let json = serde_json::to_string(&settings).unwrap();
        let deserialized: WindowsSettings = serde_json::from_str(&json).unwrap();

        assert_eq!(settings.power_plan, deserialized.power_plan);
        assert_eq!(settings.game_mode, deserialized.game_mode);
        assert_eq!(
            settings.fullscreen_optimization,
            deserialized.fullscreen_optimization
        );
        assert_eq!(
            settings.hardware_gpu_scheduling,
            deserialized.hardware_gpu_scheduling
        );
        assert_eq!(settings.visual_effects, deserialized.visual_effects);
    }
}
