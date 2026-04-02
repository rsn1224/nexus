//! AI関連コマンド（Perplexity API プロキシ）
//! フロントエンドからAPIキーを隠蔽し、Rust側でAPI通信を行う

use crate::error::AppError;
use crate::infra::perplexity_client::{self, PerplexityMessage};
use crate::services::credentials;
use tracing::{error, info};

use super::parser::parse_ai_recommendations;
use super::types::{AiBottleneckRequest, AiBottleneckResponse};

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

    info!(
        "Perplexity API に最適化提案リクエスト送信: プロセス数={}",
        process_names.len()
    );

    let content = perplexity_client::call_api(
        &api_key,
        "sonar",
        vec![PerplexityMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        Some(500),
    )
    .await?;

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

    info!("Perplexity API から {} 件の提案を受信", suggestions.len());
    Ok(suggestions)
}

/// APIキーの有効性をテスト
#[tauri::command]
pub async fn test_api_key() -> Result<bool, AppError> {
    let api_key = credentials::load_api_key("perplexity_api_key")?
        .ok_or_else(|| AppError::InvalidInput("Perplexity API キーが未設定です".to_string()))?;

    info!("Perplexity API キーをテスト中");

    match perplexity_client::call_api(
        &api_key,
        "sonar",
        vec![PerplexityMessage {
            role: "user".to_string(),
            content: "Hello".to_string(),
        }],
        Some(1),
    )
    .await
    {
        Ok(_) => {
            info!("API キーテスト成功");
            Ok(true)
        }
        Err(AppError::Network(msg)) if msg.contains("401") => {
            error!("API キーテスト失敗: 無効なキー");
            Err(AppError::InvalidInput("APIキーが無効です".to_string()))
        }
        Err(e) => Err(e),
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

    info!("AI ボトルネック分析を Perplexity API に送信");

    let content = perplexity_client::call_api(
        &api_key,
        "sonar",
        vec![PerplexityMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        Some(800),
    )
    .await?;

    let recommendations = parse_ai_recommendations(&content);

    info!(
        "AI ボトルネック分析完了: {} 件の推奨事項",
        recommendations.len()
    );

    Ok(AiBottleneckResponse {
        analysis: content,
        recommendations,
    })
}
