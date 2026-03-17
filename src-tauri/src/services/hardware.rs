use crate::infra::powershell;
use sysinfo::Components;
use tracing::warn;

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

/// GPU 情報を PowerShell 経由で取得する
#[allow(dead_code)]
pub fn get_gpu_info() -> (Option<String>, Option<u64>) {
    let gpu_json = powershell::run_powershell(
        "Get-CimInstance Win32_VideoController | Select-Object -First 1 Name, AdapterRAM | ConvertTo-Json -Compress"
    ).ok();

    if let Some(json_str) = gpu_json {
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&json_str) {
            let name = value
                .get("Name")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let vram_bytes = value
                .get("AdapterRAM")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let vram_mb = if vram_bytes > 0 {
                Some(vram_bytes / 1024 / 1024)
            } else {
                None
            };
            return (name, vram_mb);
        }
    }

    warn!("GPU情報の取得に失敗しました");
    (None, None)
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
}
