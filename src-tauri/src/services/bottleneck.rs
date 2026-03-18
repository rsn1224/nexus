//! リアルタイムボトルネック判定エンジン
//!
//! ETW フレームタイムデータ + pulse + hardware データを統合し、
//! 現在のボトルネックを判定する。

use serde::{Deserialize, Serialize};

/// ボトルネックの種別
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BottleneckType {
    /// CPU がボトルネック
    Cpu,
    /// GPU がボトルネック
    Gpu,
    /// メモリ（RAM / VRAM）がボトルネック
    Memory,
    /// ストレージ I/O がボトルネック
    Storage,
    /// 判定不能（データ不足）
    Unknown,
    /// バランス良好（明確なボトルネックなし）
    Balanced,
}

/// ボトルネック判定の信頼度
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Confidence {
    High,
    Medium,
    Low,
}

/// ボトルネック判定入力
#[derive(Debug, Clone)]
pub struct BottleneckInput {
    /// 直近 1 秒の平均 FPS（FrameTimeSnapshot から）
    pub avg_fps: f64,
    /// 1% Low FPS
    pub pct_1_low: f64,
    /// スタッター回数
    pub stutter_count: u32,
    /// フレームタイム配列（ms）— 将来の詳細分析用（現在未使用）
    #[allow(dead_code)]
    pub frame_times: Vec<f64>,
    /// CPU 使用率 %（pulse_emitter から）
    pub cpu_percent: f32,
    /// GPU 使用率 %（hardware_emitter から）
    pub gpu_usage_percent: Option<f32>,
    /// GPU 温度（hardware_emitter から）
    pub gpu_temp_c: Option<f32>,
    /// メモリ使用量 MB / 総メモリ MB
    pub mem_used_mb: u64,
    pub mem_total_mb: u64,
    /// GPU VRAM 使用量 / 総量（MB）
    pub gpu_vram_used_mb: Option<u32>,
    pub gpu_vram_total_mb: Option<u32>,
    /// ディスク I/O（KB/s）
    pub disk_read_kb: u64,
    pub disk_write_kb: u64,
}

/// ボトルネック判定結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BottleneckResult {
    /// 主要ボトルネック
    pub primary: BottleneckType,
    /// 信頼度
    pub confidence: Confidence,
    /// 各コンポーネントの負荷スコア（0.0〜1.0）
    pub scores: BottleneckScores,
    /// 改善提案（最大 3 件）
    pub suggestions: Vec<BottleneckSuggestion>,
    /// タイムスタンプ（Unix ms）
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BottleneckScores {
    pub cpu: f32,
    pub gpu: f32,
    pub memory: f32,
    pub storage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BottleneckSuggestion {
    /// 提案 ID（フロントエンドでアクション遷移に使用）
    pub id: String,
    /// 提案テキスト
    pub message: String,
    /// 関連アクション（ページ遷移先）
    pub action: Option<String>,
}

/// ボトルネック判定メイン関数
pub fn analyze(input: &BottleneckInput) -> BottleneckResult {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    // ── 各コンポーネントの負荷スコア計算（0.0〜1.0） ──

    // CPU スコア: 使用率をそのまま正規化
    let cpu_score = input.cpu_percent / 100.0;

    // GPU スコア: 使用率がある場合はそのまま、ない場合は 0.0
    let gpu_score = input
        .gpu_usage_percent
        .map(|g| g / 100.0)
        .unwrap_or(0.0);

    // メモリスコア: RAM 使用率 + VRAM 使用率の加重平均
    let ram_usage = if input.mem_total_mb > 0 {
        input.mem_used_mb as f32 / input.mem_total_mb as f32
    } else {
        0.0
    };
    let vram_usage = match (input.gpu_vram_used_mb, input.gpu_vram_total_mb) {
        (Some(used), Some(total)) if total > 0 => used as f32 / total as f32,
        _ => 0.0,
    };
    // RAM 70% + VRAM 30%（VRAM がない場合は RAM のみ）
    let memory_score = if vram_usage > 0.0 {
        ram_usage * 0.7 + vram_usage * 0.3
    } else {
        ram_usage
    };

    // ストレージスコア: Disk I/O から推定
    // 高 I/O（合計 50MB/s 超）は問題になりうる
    let disk_total_kb = input.disk_read_kb + input.disk_write_kb;
    let storage_score = (disk_total_kb as f32 / 51200.0).min(1.0); // 50MB/s で 1.0

    // ── ボトルネック判定ロジック ──
    let scores = BottleneckScores {
        cpu: cpu_score,
        gpu: gpu_score,
        memory: memory_score,
        storage: storage_score,
    };

    // フレームタイムスパイクパターン分析
    let has_spikes = input.stutter_count > 2;
    let fps_instability = if input.avg_fps > 0.0 {
        1.0 - (input.pct_1_low / input.avg_fps) as f32
    } else {
        0.0
    };

    // 判定ルール:
    // 1. GPU 使用率 >= 95% → GPU bound（高信頼度）
    // 2. メモリ使用率 >= 90% かつスパイク多発 → Memory bound
    // 3. GPU 使用率 < 80% かつ CPU >= 80% → CPU bound
    // 4. ストレージ I/O 高 かつ定期的スパイク → Storage bound
    // 5. すべて中程度 → Balanced
    let (primary, confidence) = if gpu_score >= 0.95 {
        (BottleneckType::Gpu, Confidence::High)
    } else if memory_score >= 0.90 && has_spikes {
        (BottleneckType::Memory, Confidence::Medium)
    } else if gpu_score >= 0.85 && cpu_score < 0.70 {
        (BottleneckType::Gpu, Confidence::Medium)
    } else if cpu_score >= 0.80 && gpu_score < 0.80 {
        if cpu_score >= 0.90 {
            (BottleneckType::Cpu, Confidence::High)
        } else {
            (BottleneckType::Cpu, Confidence::Medium)
        }
    } else if storage_score >= 0.70 && has_spikes && fps_instability > 0.3 {
        (BottleneckType::Storage, Confidence::Medium)
    } else if input.avg_fps == 0.0 {
        (BottleneckType::Unknown, Confidence::Low)
    } else {
        (BottleneckType::Balanced, Confidence::High)
    };

    // ── 改善提案生成 ──
    let suggestions = generate_suggestions(&primary, &scores, input);

    BottleneckResult {
        primary,
        confidence,
        scores,
        suggestions,
        timestamp: now,
    }
}

/// ボトルネック種別に応じた改善提案を生成
fn generate_suggestions(
    bottleneck: &BottleneckType,
    scores: &BottleneckScores,
    input: &BottleneckInput,
) -> Vec<BottleneckSuggestion> {
    let mut suggestions = Vec::new();

    match bottleneck {
        BottleneckType::Cpu => {
            suggestions.push(BottleneckSuggestion {
                id: "cpu-affinity".to_string(),
                message: "CPU アフィニティを P コアのみに変更すると改善する可能性があります".to_string(),
                action: Some("boost".to_string()),
            });
            suggestions.push(BottleneckSuggestion {
                id: "cpu-suspend".to_string(),
                message: "バックグラウンドプロセスをサスペンドして CPU リソースを解放してください".to_string(),
                action: Some("boost".to_string()),
            });
            if input.cpu_percent >= 90.0 {
                suggestions.push(BottleneckSuggestion {
                    id: "cpu-priority".to_string(),
                    message: "ゲームプロセスの優先度を High に変更してください".to_string(),
                    action: Some("boost".to_string()),
                });
            }
        }
        BottleneckType::Gpu => {
            suggestions.push(BottleneckSuggestion {
                id: "gpu-settings".to_string(),
                message: "ゲーム内のグラフィック設定（解像度/影品質）を下げると改善します".to_string(),
                action: None,
            });
            if let Some(temp) = input.gpu_temp_c {
                if temp >= 85.0 {
                    suggestions.push(BottleneckSuggestion {
                        id: "gpu-thermal".to_string(),
                        message: format!("GPU 温度 {:.0}℃ — サーマルスロットリングの可能性。冷却を確認してください", temp),
                        action: None,
                    });
                }
            }
        }
        BottleneckType::Memory => {
            suggestions.push(BottleneckSuggestion {
                id: "mem-cleanup".to_string(),
                message: "スタンバイメモリリストのクリーニングを実行してください".to_string(),
                action: Some("boost".to_string()),
            });
            suggestions.push(BottleneckSuggestion {
                id: "mem-suspend".to_string(),
                message: "メモリを多く使用するバックグラウンドプロセスを停止してください".to_string(),
                action: Some("boost".to_string()),
            });
        }
        BottleneckType::Storage => {
            suggestions.push(BottleneckSuggestion {
                id: "storage-check".to_string(),
                message: "ストレージの空き容量を確認してください。断片化がパフォーマンスに影響している可能性があります".to_string(),
                action: Some("storage".to_string()),
            });
        }
        BottleneckType::Balanced => {
            suggestions.push(BottleneckSuggestion {
                id: "balanced-ok".to_string(),
                message: "現在のシステムバランスは良好です。特定のボトルネックは検出されていません".to_string(),
                action: None,
            });
        }
        BottleneckType::Unknown => {
            suggestions.push(BottleneckSuggestion {
                id: "unknown-start".to_string(),
                message: "ゲームを起動するとボトルネック分析が開始されます".to_string(),
                action: None,
            });
        }
    }

    // CPU+GPU 両方高い場合の追加提案
    if scores.cpu >= 0.80 && scores.gpu >= 0.80 {
        suggestions.push(BottleneckSuggestion {
            id: "both-high".to_string(),
            message: "CPU・GPU 両方が高負荷です。FPS キャップの設定を検討してください".to_string(),
            action: None,
        });
    }

    suggestions.truncate(3); // 最大 3 件
    suggestions
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_input(cpu: f32, gpu: Option<f32>, mem_pct: f32) -> BottleneckInput {
        let mem_total = 16384u64; // 16GB
        BottleneckInput {
            avg_fps: 60.0,
            pct_1_low: 45.0,
            stutter_count: 1,
            frame_times: vec![16.6; 60],
            cpu_percent: cpu,
            gpu_usage_percent: gpu,
            gpu_temp_c: Some(70.0),
            mem_used_mb: (mem_total as f32 * mem_pct / 100.0) as u64,
            mem_total_mb: mem_total,
            gpu_vram_used_mb: Some(0), // VRAMを0にしてmemory_scoreを上げる
            gpu_vram_total_mb: Some(8000),
            disk_read_kb: 1024,
            disk_write_kb: 512,
        }
    }

    #[test]
    fn test_gpu_bound() {
        let input = make_input(50.0, Some(98.0), 60.0);
        let result = analyze(&input);
        assert_eq!(result.primary, BottleneckType::Gpu);
        assert_eq!(result.confidence, Confidence::High);
    }

    #[test]
    fn test_cpu_bound() {
        let input = make_input(92.0, Some(60.0), 50.0);
        let result = analyze(&input);
        assert_eq!(result.primary, BottleneckType::Cpu);
        assert_eq!(result.confidence, Confidence::High);
    }

    #[test]
    fn test_balanced() {
        let input = make_input(40.0, Some(50.0), 40.0);
        let result = analyze(&input);
        assert_eq!(result.primary, BottleneckType::Balanced);
    }

    #[test]
    fn test_memory_bound() {
        let mut input = make_input(30.0, Some(30.0), 95.0); // CPU/GPUを低くしてmemory boundを優先
        input.stutter_count = 5; // has_spikes条件を満たす (>2)
        let result = analyze(&input);
        assert_eq!(result.primary, BottleneckType::Memory);
    }

    #[test]
    fn test_unknown_no_fps() {
        let mut input = make_input(30.0, Some(20.0), 40.0);
        input.avg_fps = 0.0;
        let result = analyze(&input);
        assert_eq!(result.primary, BottleneckType::Unknown);
    }

    #[test]
    fn test_suggestions_max_three() {
        let input = make_input(95.0, Some(95.0), 50.0);
        let result = analyze(&input);
        assert!(result.suggestions.len() <= 3);
    }
}
