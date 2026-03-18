//! Windows 設定最適化アドバイザーサービス
//! ハードウェア構成を入力として、推奨設定と理由を返す。

use crate::error::AppError;
use crate::types::game::CpuTopology;
use serde::{Deserialize, Serialize};

/// 推奨設定とその理由
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingRecommendation {
    /// 設定 ID（フロントエンドでの紐付け用）
    pub setting_id: String,
    /// 設定の表示名
    pub label: String,
    /// 推奨値
    pub recommended_value: RecommendedValue,
    /// 現在の値
    pub current_value: String,
    /// 推奨理由（日本語）
    pub reason: String,
    /// 重要度（high / medium / low）
    pub importance: String,
    /// 安全性（safe / moderate / advanced）
    pub safety_level: String,
    /// 現在の値が推奨と一致するか
    pub is_optimal: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RecommendedValue {
    Boolean(bool),
    String(String),
    Enum(String),
}

/// アドバイザー結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdvisorResult {
    /// 推奨設定リスト
    pub recommendations: Vec<SettingRecommendation>,
    /// 全体スコア（0-100）— 推奨に合致している割合
    pub optimization_score: u32,
    /// ハードウェアサマリ
    pub hardware_summary: String,
    /// 注意事項
    pub warnings: Vec<String>,
}

/// 現在の Windows 設定スナップショット取得
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowsSettingsSnapshot {
    pub game_mode: bool,
    pub hags: bool,
    pub fullscreen_optimization: bool,
    pub visual_effects: String,
    pub power_plan: String,
    pub memory_integrity: bool,
}

/// ハードウェア情報から推奨設定を生成
pub fn analyze_settings(
    topology: &CpuTopology,
    gpu_name: Option<&str>,
    mem_total_gb: f32,
    current_settings: &WindowsSettingsSnapshot,
) -> AdvisorResult {
    let mut recommendations = Vec::new();

    // ─── Game Mode ─────────────────────────────────────────────────
    // Game Mode は Windows 10 1903+ で安定。有効推奨。
    recommendations.push(SettingRecommendation {
        setting_id: "game_mode".into(),
        label: "Game Mode".into(),
        recommended_value: RecommendedValue::Boolean(true),
        current_value: format!("{}", current_settings.game_mode),
        reason: "Game Mode はバックグラウンドの Windows Update や通知を抑制します。安全に有効化可能です".into(),
        importance: "high".into(),
        safety_level: "safe".into(),
        is_optimal: current_settings.game_mode,
    });

    // ─── HAGS（Hardware Accelerated GPU Scheduling）──────────────
    // NVIDIA RTX 30/40 シリーズでは有効推奨。それ以外は無効推奨。
    let hags_recommended = gpu_name
        .map(|n| n.contains("RTX 30") || n.contains("RTX 40") || n.contains("RTX 50")
            || n.contains("RX 7") || n.contains("RX 9"))
        .unwrap_or(false);
    recommendations.push(SettingRecommendation {
        setting_id: "hags".into(),
        label: "Hardware Accelerated GPU Scheduling (HAGS)".into(),
        recommended_value: RecommendedValue::Boolean(hags_recommended),
        current_value: format!("{}", current_settings.hags),
        reason: if hags_recommended {
            "お使いの GPU は HAGS 対応世代です。有効化で入力遅延が改善する場合があります".into()
        } else {
            "お使いの GPU では HAGS の効果が不安定です。無効を推奨します".into()
        },
        importance: "medium".into(),
        safety_level: "safe".into(),
        is_optimal: current_settings.hags == hags_recommended,
    });

    // ─── Fullscreen Optimization ────────────────────────────────
    // 通常は有効推奨（Windows の最適化されたフリップモデル）
    // ただし、古いゲームでは無効が良い場合も
    recommendations.push(SettingRecommendation {
        setting_id: "fullscreen_opt".into(),
        label: "Fullscreen Optimization".into(),
        recommended_value: RecommendedValue::Boolean(true),
        current_value: format!("{}", current_settings.fullscreen_optimization),
        reason: "フルスクリーン最適化は最新の DirectX フリップモデルを使用し、Alt+Tab 性能を向上させます。古いゲームで問題がある場合のみ無効にしてください".into(),
        importance: "medium".into(),
        safety_level: "safe".into(),
        is_optimal: current_settings.fullscreen_optimization,
    });

    // ─── Visual Effects ─────────────────────────────────────────
    // ゲーミングなら Best Performance 推奨
    recommendations.push(SettingRecommendation {
        setting_id: "visual_effects".into(),
        label: "Visual Effects".into(),
        recommended_value: RecommendedValue::Enum("BestPerformance".into()),
        current_value: current_settings.visual_effects.clone(),
        reason: "視覚効果を最小化するとデスクトップの応答性が向上します。ゲーム中の CPU 負荷も微減します".into(),
        importance: "low".into(),
        safety_level: "safe".into(),
        is_optimal: current_settings.visual_effects == "BestPerformance",
    });

    // ─── Power Plan ─────────────────────────────────────────────
    let power_plan_recommended = if topology.vendor_id.contains("AMD") {
        "AMD Ryzen Balanced"  // AMD は専用プランが最適
    } else {
        "High Performance"
    };
    recommendations.push(SettingRecommendation {
        setting_id: "power_plan".into(),
        label: "Power Plan".into(),
        recommended_value: RecommendedValue::String(power_plan_recommended.into()),
        current_value: current_settings.power_plan.clone(),
        reason: if topology.vendor_id.contains("AMD") {
            "AMD Ryzen プロセッサには専用の Balanced プランが最適です。Ultimate Performance はクロック制御を妨げます".into()
        } else {
            "Intel プロセッサでは High Performance プランでブーストクロックが安定します".into()
        },
        importance: "high".into(),
        safety_level: "safe".into(),
        is_optimal: current_settings.power_plan.contains(power_plan_recommended) 
            || (topology.vendor_id.contains("AMD") && current_settings.power_plan.contains("Balanced")),
    });

    // ─── Core Isolation / Memory Integrity ──────────────────────
    // ゲーミングでは無効推奨（FPS 5-10% 低下の可能性）
    recommendations.push(SettingRecommendation {
        setting_id: "memory_integrity".into(),
        label: "Core Isolation / Memory Integrity (VBS)".into(),
        recommended_value: RecommendedValue::Boolean(false),
        current_value: format!("{}", current_settings.memory_integrity),
        reason: "VBS（仮想化ベースのセキュリティ）はゲーム性能を 5-10% 低下させる場合があります。セキュリティリスクを理解した上で無効化してください".into(),
        importance: "high".into(),
        safety_level: "advanced".into(),
        is_optimal: !current_settings.memory_integrity,
    });

    // ─── スコア計算 ─────────────────────────────────────────────
    let optimal_count = recommendations.iter().filter(|r| r.is_optimal).count();
    let total = recommendations.len();
    let score = if total > 0 { (optimal_count * 100 / total) as u32 } else { 100 };

    let hardware_summary = format!(
        "{} ({} cores / {} threads) + {}{}",
        topology.brand,
        topology.physical_cores,
        topology.logical_cores,
        gpu_name.unwrap_or("GPU 不明"),
        if mem_total_gb > 0.0 { format!(", {:.0}GB RAM", mem_total_gb) } else { String::new() },
    );

    AdvisorResult {
        recommendations,
        optimization_score: score,
        hardware_summary,
        warnings: vec![],
    }
}

/// 現在の Windows 設定スナップショット取得
pub fn get_current_settings_snapshot() -> Result<WindowsSettingsSnapshot, AppError> {
    // 各レジストリ値・powercfg から現在値を収集
    // TODO: 実装 - いったんダミー値を返す
    Ok(WindowsSettingsSnapshot {
        game_mode: false,
        hags: false,
        fullscreen_optimization: true,
        visual_effects: "LetWindowsChoose".to_string(),
        power_plan: "Balanced".to_string(),
        memory_integrity: true,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

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
        
        // HAGS should be recommended for RTX 40 series
        let hags_rec = result.recommendations.iter().find(|r| r.setting_id == "hags").unwrap();
        assert!(matches!(hags_rec.recommended_value, RecommendedValue::Boolean(true)));
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
        
        // Power plan should recommend AMD Balanced
        let power_rec = result.recommendations.iter().find(|r| r.setting_id == "power_plan").unwrap();
        assert!(matches!(&power_rec.recommended_value, RecommendedValue::String(s) if s.contains("AMD Ryzen Balanced")));
        
        // HAGS should be recommended for RX 7 series
        let hags_rec = result.recommendations.iter().find(|r| r.setting_id == "hags").unwrap();
        assert!(matches!(hags_rec.recommended_value, RecommendedValue::Boolean(true)));
    }

    #[test]
    fn test_legacy_gpu_no_hags() {
        let topology = create_test_topology("GenuineIntel", "Intel Core i5-10400", 6, 12);
        let current = WindowsSettingsSnapshot {
            game_mode: false,
            hags: true,  // Currently enabled but not recommended
            fullscreen_optimization: false,
            visual_effects: "LetWindowsChoose".to_string(),
            power_plan: "Balanced".to_string(),
            memory_integrity: true,
        };

        let result = analyze_settings(&topology, Some("NVIDIA GTX 1660"), 16.0, &current);
        
        // HAGS should NOT be recommended for GTX series
        let hags_rec = result.recommendations.iter().find(|r| r.setting_id == "hags").unwrap();
        assert!(matches!(hags_rec.recommended_value, RecommendedValue::Boolean(false)));
        assert!(!hags_rec.is_optimal);  // Currently enabled but not recommended
    }
}
