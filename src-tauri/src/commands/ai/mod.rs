mod commands;
mod parser;
mod types;

pub use commands::*;

#[cfg(test)]
mod tests {
    use super::parser::parse_ai_recommendations;
    use super::types::*;

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
