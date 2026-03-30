//! AI関連型定義（Perplexity API プロキシ）

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct PerplexityRequest {
    pub model: String,
    pub messages: Vec<PerplexityMessage>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct PerplexityMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct PerplexityResponse {
    pub choices: Vec<PerplexityChoice>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct PerplexityChoice {
    pub message: PerplexityMessageContent,
}

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct PerplexityMessageContent {
    pub content: String,
}

/// AI ボトルネック分析リクエスト
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiBottleneckRequest {
    /// ゲーム名（プロファイルの displayName）
    pub game_name: String,
    /// ボトルネック種別（"cpu" / "gpu" / "memory" / "storage" / "balanced" / "unknown"）
    pub bottleneck_type: String,
    /// CPU 名（HardwareInfo.cpuName）
    pub cpu_name: String,
    /// GPU 名（HardwareInfo.gpuName）
    pub gpu_name: Option<String>,
    /// 平均 FPS
    pub avg_fps: f64,
    /// 1% Low FPS
    pub pct_1_low: f64,
    /// CPU 使用率 %
    pub cpu_percent: f32,
    /// GPU 使用率 %
    pub gpu_usage_percent: Option<f32>,
    /// GPU 温度
    pub gpu_temp_c: Option<f32>,
    /// メモリ（GB）
    pub mem_total_gb: f32,
    pub mem_used_gb: f32,
}

/// AI ボトルネック分析結果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiBottleneckResponse {
    /// 全文分析テキスト
    pub analysis: String,
    /// 具体的な推奨設定（最大 5 件）
    pub recommendations: Vec<AiRecommendation>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiRecommendation {
    /// 推奨タイトル
    pub title: String,
    /// 詳細説明
    pub description: String,
    /// nexus 内で適用可能か（CPU アフィニティ、優先度、サスペンド、タイマー、電源プラン関連ならtrue）
    pub applicable_in_nexus: bool,
    /// nexus 内アクション遷移先（"boost" など）
    pub action: Option<String>,
}
