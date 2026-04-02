// Windows Wing — Windows設定最適化機能 — 型定義

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WindowsSettings {
    pub power_plan: PowerPlan,
    pub game_mode: bool,
    pub fullscreen_optimization: bool,
    pub hardware_gpu_scheduling: bool,
    pub visual_effects: VisualEffects,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum PowerPlan {
    Balanced,
    HighPerformance,
    PowerSaver,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum VisualEffects {
    BestPerformance,
    Balanced,
    BestAppearance,
}

impl std::fmt::Display for PowerPlan {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PowerPlan::Balanced => write!(f, "Balanced"),
            PowerPlan::HighPerformance => write!(f, "High Performance"),
            PowerPlan::PowerSaver => write!(f, "Power Saver"),
        }
    }
}

impl std::fmt::Display for VisualEffects {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VisualEffects::BestPerformance => write!(f, "Best Performance"),
            VisualEffects::Balanced => write!(f, "Balanced"),
            VisualEffects::BestAppearance => write!(f, "Best Appearance"),
        }
    }
}
