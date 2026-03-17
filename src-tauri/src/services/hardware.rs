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
            let name = value.get("Name").and_then(|v| v.as_str()).map(|s| s.to_string());
            let vram_bytes = value.get("AdapterRAM").and_then(|v| v.as_u64()).unwrap_or(0);
            let vram_mb = if vram_bytes > 0 { Some(vram_bytes / 1024 / 1024) } else { None };
            return (name, vram_mb);
        }
    }

    warn!("GPU情報の取得に失敗しました");
    (None, None)
}
