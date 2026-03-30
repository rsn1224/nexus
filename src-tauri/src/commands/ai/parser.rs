//! AI レスポンスパーサー

use super::types::AiRecommendation;

/// AI レスポンスから推奨事項を抽出するヘルパー
pub(super) fn parse_ai_recommendations(content: &str) -> Vec<AiRecommendation> {
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
