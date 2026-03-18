//! AI関連コマンド（Perplexity API プロキシ）
//! フロントエンドからAPIキーを隠蔽し、Rust側でAPI通信を行う

use crate::error::AppError;
use crate::services::credentials;
use serde::{Deserialize, Serialize};
use tracing::{debug, error, info};

#[derive(Debug, Serialize, Deserialize)]
struct PerplexityRequest {
    model: String,
    messages: Vec<PerplexityMessage>,
    max_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PerplexityMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct PerplexityResponse {
    choices: Vec<PerplexityChoice>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PerplexityChoice {
    message: PerplexityMessageContent,
}

#[derive(Debug, Serialize, Deserialize)]
struct PerplexityMessageContent {
    content: String,
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

/// プロセス最適化提案を取得
#[tauri::command]
pub async fn get_optimization_suggestions(
    process_names: Vec<String>,
) -> Result<Vec<String>, AppError> {
    let api_key = credentials::load_api_key("perplexity_api_key")?
        .ok_or_else(|| AppError::InvalidInput("Perplexity API キーが未設定です".to_string()))?;

    let prompt = format!(
        "以下は現在 CPU を多く使用しているプロセスです:\n{}\n\nこれらのプロセスについて、パフォーマンス最適化の観点からアドバイスを3点、日本語で簡潔に教えてください。",
        process_names.join(", ")
    );

    let request = PerplexityRequest {
        model: "sonar".to_string(),
        messages: vec![PerplexityMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        max_tokens: Some(500),
    };

    info!("Sending request to Perplexity API");
    debug!(
        "Request: model={}, process_count={}",
        request.model,
        process_names.len()
    );

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.perplexity.ai/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("API リクエスト失敗: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        error!("Perplexity API error: {}", status);
        return Err(AppError::Network(format!(
            "Perplexity API エラー: {}",
            status
        )));
    }

    let data: PerplexityResponse = response
        .json()
        .await
        .map_err(|e| AppError::Network(format!("レスポンス解析失敗: {}", e)))?;

    let content: Option<&str> = data
        .choices
        .first()
        .map(|choice| choice.message.content.as_str());

    let content: &str = content
        .ok_or_else(|| AppError::Network("レスポンスにコンテンツがありません".to_string()))?;

    // 番号付きリストを配列に変換
    let suggestions: Vec<String> = content
        .split('\n')
        .filter_map(|line: &str| {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                None
            } else {
                // 先頭の番号を除去
                Some(
                    trimmed
                        .chars()
                        .skip_while(|c: &char| c.is_numeric() || *c == '.' || *c == ' ')
                        .collect::<String>()
                        .trim()
                        .to_string(),
                )
            }
        })
        .filter(|s: &String| !s.is_empty())
        .take(3)
        .collect();

    info!("Received {} suggestions from Perplexity", suggestions.len());
    Ok(suggestions)
}

/// APIキーの有効性をテスト
#[tauri::command]
pub async fn test_api_key() -> Result<bool, AppError> {
    let api_key = credentials::load_api_key("perplexity_api_key")?
        .ok_or_else(|| AppError::InvalidInput("Perplexity API キーが未設定です".to_string()))?;

    let request = PerplexityRequest {
        model: "sonar".to_string(),
        messages: vec![PerplexityMessage {
            role: "user".to_string(),
            content: "Hello".to_string(),
        }],
        max_tokens: Some(1),
    };

    info!("Testing Perplexity API key");

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.perplexity.ai/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("API リクエスト失敗: {}", e)))?;

    match response.status().as_u16() {
        200 => {
            info!("API key test successful");
            Ok(true)
        }
        401 => {
            error!("API key test failed: Invalid key");
            Err(AppError::InvalidInput("APIキーが無効です".to_string()))
        }
        status => {
            error!("API key test failed: HTTP {}", status);
            Err(AppError::Network(format!("HTTP {}", status)))
        }
    }
}

/// AI ボトルネック分析を実行
#[tauri::command]
pub async fn analyze_bottleneck_ai(
    request: AiBottleneckRequest,
) -> Result<AiBottleneckResponse, AppError> {
    let api_key = credentials::load_api_key("perplexity_api_key")?
        .ok_or_else(|| AppError::InvalidInput("Perplexity API キーが未設定です".to_string()))?;

    let prompt = format!(
        r#"あなたは PC ゲーミングの最適化エキスパートです。以下のシステム情報とパフォーマンスデータを分析し、最適化提案を日本語で提供してください。

【ゲーム】{game_name}
【ボトルネック】{bottleneck_type}
【ハードウェア】
- CPU: {cpu_name}（使用率: {cpu_pct:.0}%）
- GPU: {gpu_name}（使用率: {gpu_pct}、温度: {gpu_temp}）
- メモリ: {mem_used:.1}GB / {mem_total:.1}GB

【パフォーマンス】
- 平均 FPS: {avg_fps:.0}
- 1% Low FPS: {pct_1_low:.0}

以下の形式で回答してください:
1. 原因分析（2-3文）
2. 推奨設定（最大5件、各1行）— nexus で適用可能なもの（CPU アフィニティ、プロセス優先度、バックグラウンドサスペンド、タイマーリゾリューション、電源プラン）を優先
3. ゲーム内設定の調整提案（該当する場合）"#,
        game_name = request.game_name,
        bottleneck_type = request.bottleneck_type,
        cpu_name = request.cpu_name,
        cpu_pct = request.cpu_percent,
        gpu_name = request.gpu_name.as_deref().unwrap_or("N/A"),
        gpu_pct = request
            .gpu_usage_percent
            .map(|g| format!("{:.0}%", g))
            .unwrap_or_else(|| "N/A".to_string()),
        gpu_temp = request
            .gpu_temp_c
            .map(|t| format!("{:.0}℃", t))
            .unwrap_or_else(|| "N/A".to_string()),
        mem_used = request.mem_used_gb,
        mem_total = request.mem_total_gb,
        avg_fps = request.avg_fps,
        pct_1_low = request.pct_1_low,
    );

    // 既存の PerplexityRequest 構造体を再利用
    let api_request = PerplexityRequest {
        model: "sonar".to_string(),
        messages: vec![PerplexityMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        max_tokens: Some(800),
    };

    info!("AI ボトルネック分析を Perplexity API に送信");

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.perplexity.ai/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&api_request)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("API リクエスト失敗: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        error!("Perplexity API error: {}", status);
        return Err(AppError::Network(format!(
            "Perplexity API エラー: {}",
            status
        )));
    }

    let data: PerplexityResponse = response
        .json()
        .await
        .map_err(|e| AppError::Network(format!("レスポンス解析失敗: {}", e)))?;

    let content = data
        .choices
        .first()
        .map(|c| c.message.content.as_str())
        .ok_or_else(|| AppError::Network("レスポンスにコンテンツがありません".to_string()))?;

    let recommendations = parse_ai_recommendations(content);

    info!(
        "AI ボトルネック分析完了: {} 件の推奨事項",
        recommendations.len()
    );

    Ok(AiBottleneckResponse {
        analysis: content.to_string(),
        recommendations,
    })
}

/// AI レスポンスから推奨事項を抽出するヘルパー
fn parse_ai_recommendations(content: &str) -> Vec<AiRecommendation> {
    let mut recommendations = Vec::new();
    let nexus_keywords = [
        "アフィニティ",
        "優先度",
        "サスペンド",
        "タイマー",
        "電源プラン",
        "ブースト",
        "メモリクリーン",
        "リゾリューション",
        "プロセス停止",
    ];

    for line in content.lines() {
        let trimmed = line.trim();
        // 番号付き行を検出（1. 2. 等、全角数字含む）
        let is_numbered = trimmed.len() > 2
            && (trimmed.starts_with(|c: char| c.is_ascii_digit())
                || trimmed.starts_with(|c: char| ('１'..='９').contains(&c)))
            && (trimmed.chars().nth(1) == Some('.')
                || trimmed.chars().nth(1) == Some('．')
                || trimmed.chars().nth(1) == Some('、'));

        if is_numbered {
            // 先頭の番号部分を除去
            let text: String = trimmed
                .chars()
                .skip_while(|c| {
                    c.is_ascii_digit()
                        || *c == '.'
                        || *c == '．'
                        || *c == '、'
                        || *c == ' '
                        || *c == '　'
                        || ('０'..='９').contains(c)
                })
                .collect::<String>()
                .trim()
                .to_string();

            if text.is_empty() {
                continue;
            }

            let applicable = nexus_keywords.iter().any(|kw| text.contains(kw));
            let action = if applicable {
                Some("boost".to_string())
            } else {
                None
            };

            recommendations.push(AiRecommendation {
                title: text,
                description: String::new(),
                applicable_in_nexus: applicable,
                action,
            });
        }
    }

    recommendations.truncate(5);
    recommendations
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_perplexity_request_serialization() {
        let request = PerplexityRequest {
            model: "sonar".to_string(),
            messages: vec![PerplexityMessage {
                role: "user".to_string(),
                content: "test".to_string(),
            }],
            max_tokens: Some(100),
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("sonar"));
        assert!(json.contains("test"));
    }

    #[test]
    fn test_parse_suggestions() {
        let content = "1. 最初の提案\n2. 二番目の提案\n3. 三番目の提案";
        let suggestions = content
            .split('\n')
            .filter_map(|line| {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(
                        trimmed
                            .chars()
                            .skip_while(|c| c.is_numeric() || *c == '.' || *c == ' ')
                            .collect::<String>()
                            .trim()
                            .to_string(),
                    )
                }
            })
            .filter(|s| !s.is_empty())
            .take(3)
            .collect::<Vec<_>>();

        assert_eq!(suggestions.len(), 3);
        assert_eq!(suggestions[0], "最初の提案");
        assert_eq!(suggestions[1], "二番目の提案");
        assert_eq!(suggestions[2], "三番目の提案");
    }

    #[test]
    fn test_parse_ai_recommendations() {
        let content = "1. CPU アフィニティを P コアのみに設定\n2. グラフィック品質を Medium に下げる\n3. タイマーリゾリューションを 0.5ms に設定\n4. VRAM 使用量を減らすためテクスチャ品質を Low に";
        let recs = parse_ai_recommendations(content);
        assert_eq!(recs.len(), 4);
        assert!(recs[0].applicable_in_nexus); // アフィニティ
        assert!(!recs[1].applicable_in_nexus); // グラフィック品質
        assert!(recs[2].applicable_in_nexus); // タイマー
        assert!(!recs[3].applicable_in_nexus); // テクスチャ品質
    }

    #[test]
    fn test_parse_ai_recommendations_empty() {
        let content = "特に問題は見つかりませんでした。現在の設定で十分です。";
        let recs = parse_ai_recommendations(content);
        assert_eq!(recs.len(), 0);
    }

    #[test]
    fn test_ai_bottleneck_request_serialization() {
        let request = AiBottleneckRequest {
            game_name: "Cyberpunk 2077".to_string(),
            bottleneck_type: "gpu".to_string(),
            cpu_name: "Intel Core i7-14700K".to_string(),
            gpu_name: Some("NVIDIA GeForce RTX 4070".to_string()),
            avg_fps: 45.0,
            pct_1_low: 30.0,
            cpu_percent: 55.0,
            gpu_usage_percent: Some(98.0),
            gpu_temp_c: Some(78.0),
            mem_total_gb: 32.0,
            mem_used_gb: 18.5,
        };
        let json = serde_json::to_string(&request);
        assert!(json.is_ok());
    }
}
