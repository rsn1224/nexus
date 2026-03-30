//! Windows 設定最適化アドバイザーの型定義

use serde::{Deserialize, Serialize};

/// 推奨設定とその理由
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(not(windows), allow(dead_code))]
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
#[cfg_attr(not(windows), allow(dead_code))]
pub enum RecommendedValue {
    Boolean(bool),
    String(String),
    Enum(String),
}

/// アドバイザー結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(not(windows), allow(dead_code))]
pub struct AdvisorResult {
    /// 推奨設定リスト
    pub recommendations: Vec<SettingRecommendation>,
    /// 全体スコア（0-100）
    pub optimization_score: u32,
    /// ハードウェアサマリ
    pub hardware_summary: String,
    /// 注意事項
    pub warnings: Vec<String>,
}

/// 現在の Windows 設定スナップショット取得
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(not(windows), allow(dead_code))]
pub struct WindowsSettingsSnapshot {
    pub game_mode: bool,
    pub hags: bool,
    pub fullscreen_optimization: bool,
    pub visual_effects: String,
    pub power_plan: String,
    pub memory_integrity: bool,
}
