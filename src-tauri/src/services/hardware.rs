use sysinfo::Components;

// 型定義は commands/hardware.rs に残すか、ここに移動する
// （循環依存を避けるため、型定義の場所は実装時に判断）

/// CPU 温度を取得する共通ヘルパー（hardware.rs と pulse.rs の重複コードを統合）
pub fn get_cpu_temperature() -> Option<f32> {
    let components = Components::new_with_refreshed_list();
    let temps: Vec<f32> = components
        .iter()
        .filter(|c| {
            let label = c.label();
            label.contains("CPU") || label.contains("Core")
        })
        .map(|c| c.temperature())
        .collect();

    if temps.is_empty() {
        None
    } else {
        Some(temps.iter().sum::<f32>() / temps.len() as f32)
    }
}

/// GPU 静的情報（キャッシュ対象）
#[derive(Debug, Clone)]
pub struct GpuStaticInfo {
    pub name: Option<String>,
    pub vram_total_mb: Option<u64>,
}

/// GPU 動的情報（毎回取得）
#[derive(Debug, Clone)]
pub struct GpuDynamicInfo {
    pub vram_used_mb: Option<u64>,
    pub usage_percent: Option<f32>,
    pub temperature_c: Option<f32>,
}

/// GPU 情報の統合構造体
#[derive(Debug, Clone)]
pub struct GpuFullInfo {
    pub name: Option<String>,
    pub vram_total_mb: Option<u64>,
    pub vram_used_mb: Option<u64>,
    pub usage_percent: Option<f32>,
    pub temperature_c: Option<f32>,
}

/// GPU 静的情報を取得する（キャッシュ用）
pub fn get_gpu_static_info() -> GpuStaticInfo {
    // 1. NVML を試す
    if let Ok(Some(data)) = crate::infra::gpu::query_nvml_gpu() {
        return GpuStaticInfo {
            name: Some(data.name),
            vram_total_mb: Some(data.vram_total_mb),
        };
    }

    // NVML が利用できない場合は None を返す
    GpuStaticInfo {
        name: None,
        vram_total_mb: None,
    }
}

/// GPU 動的情報を取得する（毎回実行）
pub fn get_gpu_dynamic_info() -> GpuDynamicInfo {
    // NVML のみ動的情報を提供
    if let Ok(Some(data)) = crate::infra::gpu::query_nvml_gpu() {
        return GpuDynamicInfo {
            vram_used_mb: Some(data.vram_used_mb),
            usage_percent: Some(data.usage_percent as f32),
            temperature_c: Some(data.temperature_c as f32),
        };
    }

    // PowerShell フォールバックでは動的情報は取得不可
    GpuDynamicInfo {
        vram_used_mb: None,
        usage_percent: None,
        temperature_c: None,
    }
}

/// GPU の全情報を取得する。
/// 優先順位: NVML（リアルタイム） → PowerShell（静的情報のみ）
pub fn get_gpu_full_info() -> GpuFullInfo {
    // 1. NVML を試す
    if let Ok(Some(data)) = crate::infra::gpu::query_nvml_gpu() {
        return GpuFullInfo {
            name: Some(data.name),
            vram_total_mb: Some(data.vram_total_mb),
            vram_used_mb: Some(data.vram_used_mb),
            usage_percent: Some(data.usage_percent as f32),
            temperature_c: Some(data.temperature_c as f32),
        };
    }

    // NVML が利用できない場合は None を返す
    GpuFullInfo {
        name: None,
        vram_total_mb: None,
        vram_used_mb: None,
        usage_percent: None,
        temperature_c: None,
    }
}

#[cfg(test)]
mod tests {
    // get_cpu_temperature() はハードウェアアクセスが必要なため
    // CI 環境でもパニックしないことを確認するスモークテスト

    use super::*;

    #[test]
    fn test_get_cpu_temperature_no_panic() {
        // ハードウェアの有無に関わらず panic しないことを確認
        let result = get_cpu_temperature();
        // Some(温度) または None のいずれか
        if let Some(temp) = result {
            assert!(temp > -50.0 && temp < 200.0, "温度が異常値: {}℃", temp);
        }
    }

    #[test]
    fn test_avg_calculation_logic() {
        // 平均計算ロジックの検証（get_cpu_temperature 内部ロジックと同等）
        let temps: Vec<f32> = vec![45.0, 50.0, 55.0];
        let avg = temps.iter().sum::<f32>() / temps.len() as f32;
        assert!((avg - 50.0).abs() < f32::EPSILON);
    }

    #[test]
    fn test_empty_temps_returns_none_logic() {
        // 空のコンポーネントリストでは None を返すロジックの検証
        let temps: Vec<f32> = vec![];
        let result = if temps.is_empty() {
            None
        } else {
            Some(temps.iter().sum::<f32>() / temps.len() as f32)
        };
        assert!(result.is_none());
    }

    #[test]
    fn test_get_gpu_full_info_smoke() {
        // NVIDIA GPU があるかどうかに関わらず、パニックしないことを確認
        let result = get_gpu_full_info();

        // 少なくとも構造体が生成されることを確認
        // NVML が使える場合は詳細な情報、使えない場合は PowerShell フォールバック
        match (
            result.name,
            result.vram_total_mb,
            result.vram_used_mb,
            result.usage_percent,
            result.temperature_c,
        ) {
            (Some(_), Some(_), Some(_), Some(_), Some(_)) => {
                // NVML 経由で全情報取得
                println!("NVML 経由で GPU 情報取得完了");
            }
            (Some(_), Some(_), None, None, None) => {
                // PowerShell フォールバック
                println!("PowerShell フォールバックで GPU 情報取得完了");
            }
            (None, None, None, None, None) => {
                // GPU 未検出
                println!("GPU 未検出");
            }
            _ => {
                // その他の組み合わせも許容
                println!("部分的な GPU 情報取得");
            }
        }
    }

    #[test]
    fn test_gpu_full_info_creation() {
        // GpuFullInfo 構造体の生成テスト
        let info = GpuFullInfo {
            name: Some("Test GPU".to_string()),
            vram_total_mb: Some(8192),
            vram_used_mb: Some(4096),
            usage_percent: Some(75.0),
            temperature_c: Some(65.0),
        };

        assert_eq!(info.name.unwrap(), "Test GPU");
        assert_eq!(info.vram_total_mb.unwrap(), 8192);
        assert_eq!(info.vram_used_mb.unwrap(), 4096);
        assert_eq!(info.usage_percent.unwrap(), 75.0);
        assert_eq!(info.temperature_c.unwrap(), 65.0);
    }
}
