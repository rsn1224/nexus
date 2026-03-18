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
}
