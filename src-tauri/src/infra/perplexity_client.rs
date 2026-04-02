//! Perplexity API HTTP クライアント（薄いラッパー）

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use tracing::debug;

const PERPLEXITY_ENDPOINT: &str = "https://api.perplexity.ai/chat/completions";

#[derive(Debug, Serialize)]
pub struct PerplexityMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
struct PerplexityRequest {
    model: String,
    messages: Vec<PerplexityMessage>,
    max_tokens: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct PerplexityResponse {
    choices: Vec<PerplexityChoice>,
}

#[derive(Debug, Deserialize)]
struct PerplexityChoice {
    message: PerplexityMessageContent,
}

#[derive(Debug, Deserialize)]
struct PerplexityMessageContent {
    content: String,
}

/// Perplexity Chat Completions API を呼び出し、最初のレスポンス本文を返す
pub async fn call_api(
    api_key: &str,
    model: &str,
    messages: Vec<PerplexityMessage>,
    max_tokens: Option<u32>,
) -> Result<String, AppError> {
    debug!(
        "Perplexity API リクエスト: model={}, messages={}",
        model,
        messages.len()
    );

    let request = PerplexityRequest {
        model: model.to_string(),
        messages,
        max_tokens,
    };

    let client = reqwest::Client::new();
    let response = client
        .post(PERPLEXITY_ENDPOINT)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("API リクエスト失敗: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        return Err(AppError::Network(format!(
            "Perplexity API エラー: {}",
            status
        )));
    }

    let data: PerplexityResponse = response
        .json()
        .await
        .map_err(|e| AppError::Network(format!("レスポンス解析失敗: {}", e)))?;

    data.choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .ok_or_else(|| AppError::Network("レスポンスにコンテンツがありません".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_perplexity_message_serialization() {
        let msg = PerplexityMessage {
            role: "user".to_string(),
            content: "テスト".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("user"));
        assert!(json.contains("テスト"));
    }

    #[test]
    fn test_perplexity_request_serialization() {
        let msgs = vec![PerplexityMessage {
            role: "user".to_string(),
            content: "Hello".to_string(),
        }];
        let req = PerplexityRequest {
            model: "sonar".to_string(),
            messages: msgs,
            max_tokens: Some(100),
        };
        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains("sonar"));
        assert!(json.contains("max_tokens"));
        assert!(json.contains("100"));
    }

    #[test]
    fn test_empty_choices_returns_error() {
        let data = PerplexityResponse { choices: vec![] };
        let result: Result<String, _> = data
            .choices
            .into_iter()
            .next()
            .map(|c| c.message.content)
            .ok_or_else(|| crate::error::AppError::Network("empty".to_string()));
        assert!(result.is_err());
    }
}
