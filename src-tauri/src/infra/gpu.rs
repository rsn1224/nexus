// src-tauri/src/infra/gpu.rs

use crate::error::AppError;
#[cfg(windows)]
use tracing::{info, warn};

/// NVML から取得できる GPU のリアルタイムデータ
#[derive(Debug, Clone)]
pub struct NvmlGpuData {
    pub name: String,
    pub vram_total_mb: u64,
    pub vram_used_mb: u64,
    pub usage_percent: u32,
    pub temperature_c: u32,
}

/// NVML を使って GPU 情報を取得する。
/// NVIDIA GPU が存在しない場合は Ok(None) を返す。
#[cfg(windows)]
pub fn query_nvml_gpu() -> Result<Option<NvmlGpuData>, AppError> {
    use nvml_wrapper::Nvml;

    // NVML 初期化（ドライバ未インストールなら None を返す）
    let nvml = match Nvml::init() {
        Ok(nvml) => nvml,
        Err(nvml_wrapper::error::NvmlError::DriverNotLoaded) => {
            warn!("nvml: NVIDIA ドライバ未検出 — NVML スキップ");
            return Ok(None);
        }
        Err(e) => {
            warn!("nvml: 初期化失敗 — {:?}", e);
            return Ok(None);
        }
    };

    // GPU 数チェック
    let count = nvml
        .device_count()
        .map_err(|e| AppError::Internal(format!("nvml device_count 失敗: {:?}", e)))?;

    if count == 0 {
        return Ok(None);
    }

    // 最初の GPU デバイスを取得
    let device = nvml
        .device_by_index(0)
        .map_err(|e| AppError::Internal(format!("nvml device_by_index(0) 失敗: {:?}", e)))?;

    // GPU 名
    let name = device.name().unwrap_or_else(|_| "NVIDIA GPU".to_string());

    // VRAM 情報
    let mem = device
        .memory_info()
        .map_err(|e| AppError::Internal(format!("nvml memory_info 失敗: {:?}", e)))?;
    let vram_total_mb = mem.total / 1024 / 1024;
    let vram_used_mb = mem.used / 1024 / 1024;

    // 使用率（GPU コア）
    let utilization = device
        .utilization_rates()
        .map_err(|e| AppError::Internal(format!("nvml utilization_rates 失敗: {:?}", e)))?;
    let usage_percent = utilization.gpu;

    // 温度
    use nvml_wrapper::enum_wrappers::device::TemperatureSensor;
    let temperature_c = device.temperature(TemperatureSensor::Gpu).unwrap_or(0);

    info!(
        name = %name,
        vram_used = vram_used_mb,
        vram_total = vram_total_mb,
        usage = usage_percent,
        temp = temperature_c,
        "nvml: GPU 情報取得成功"
    );

    Ok(Some(NvmlGpuData {
        name,
        vram_total_mb,
        vram_used_mb,
        usage_percent,
        temperature_c,
    }))
}

/// 全 GPU の情報を取得（マルチ GPU 対応）
/// 将来 services/hardware.rs から使用予定
#[cfg(windows)]
#[allow(dead_code)] // services/hardware.rs からの統合待ち
pub fn query_all_gpus() -> Result<Vec<NvmlGpuData>, AppError> {
    use nvml_wrapper::Nvml;

    // NVML 初期化（ドライバ未インストールなら空 Vec を返す）
    let nvml = match Nvml::init() {
        Ok(nvml) => nvml,
        Err(nvml_wrapper::error::NvmlError::DriverNotLoaded) => {
            warn!("nvml: NVIDIA ドライバ未検出 — 空 Vec を返す");
            return Ok(Vec::new());
        }
        Err(e) => {
            warn!("nvml: 初期化失敗 — 空 Vec を返す: {:?}", e);
            return Ok(Vec::new());
        }
    };

    // GPU 数チェック
    let count = nvml
        .device_count()
        .map_err(|e| AppError::Internal(format!("nvml device_count 失敗: {:?}", e)))?;

    if count == 0 {
        return Ok(Vec::new());
    }

    let mut gpus = Vec::new();

    // 各 GPU をイテレーション
    for i in 0..count {
        let device = nvml.device_by_index(i).map_err(|e| {
            warn!("nvml device_by_index({}) 失敗: {:?}", i, e);
            AppError::Internal(format!("nvml device_by_index({}) 失敗: {:?}", i, e))
        })?;

        // GPU 名
        let name = device
            .name()
            .unwrap_or_else(|_| format!("NVIDIA GPU {}", i));

        // VRAM 情報
        let mem = device.memory_info().map_err(|e| {
            warn!("GPU {} memory_info 失敗: {:?}", i, e);
            AppError::Internal(format!("GPU {} memory_info 失敗: {:?}", i, e))
        })?;
        let vram_total_mb = mem.total / 1024 / 1024;
        let vram_used_mb = mem.used / 1024 / 1024;

        // 使用率（GPU コア）
        let utilization = device.utilization_rates().map_err(|e| {
            warn!("GPU {} utilization_rates 失敗: {:?}", i, e);
            AppError::Internal(format!("GPU {} utilization_rates 失敗: {:?}", i, e))
        })?;
        let usage_percent = utilization.gpu;

        // 温度
        use nvml_wrapper::enum_wrappers::device::TemperatureSensor;
        let temperature_c = device.temperature(TemperatureSensor::Gpu).unwrap_or(0);

        info!(
            name = %name,
            index = i,
            vram_used = vram_used_mb,
            vram_total = vram_total_mb,
            usage = usage_percent,
            temp = temperature_c,
            "nvml: GPU {} 情報取得成功", i
        );

        gpus.push(NvmlGpuData {
            name,
            vram_total_mb,
            vram_used_mb,
            usage_percent,
            temperature_c,
        });
    }

    Ok(gpus)
}

/// Windows 以外のスタブ
#[cfg(not(windows))]
#[allow(dead_code)]
pub fn query_all_gpus() -> Result<Vec<NvmlGpuData>, AppError> {
    Ok(Vec::new())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_all_gpus_returns_vec() {
        // 非 Windows 環境では空 Vec を返すことを確認
        #[cfg(not(windows))]
        {
            let result = query_all_gpus();
            assert!(result.is_ok());
            let gpus = result.unwrap();
            assert_eq!(gpus.len(), 0);
        }

        // Windows 環境でもエラーにならないことを確認
        #[cfg(windows)]
        {
            let result = query_all_gpus();
            // エラーにならないこと、または空 Vec が返ることを確認
            match result {
                Ok(gpus) => {
                    // GPU があってもなくても Vec が返る
                    println!("Found {} GPUs", gpus.len());
                }
                Err(e) => {
                    println!("GPU query error (acceptable): {:?}", e);
                }
            }
        }
    }

    #[test]
    fn test_query_nvml_gpu_smoke() {
        // NVIDIA GPU があるかどうかに関わらず、パニックしないことを確認
        let result = query_nvml_gpu();

        // Ok(None) が返ってくるか、エラーが返ってくるかのどちらか
        // パニックしてはならない
        match result {
            Ok(Some(_)) => {
                // GPU が見つかった場合
                println!("NVIDIA GPU が検出されました");
            }
            Ok(None) => {
                // GPU がない場合（正常）
                println!("NVIDIA GPU が未検出または NVML 不可");
            }
            Err(_) => {
                // エラーが返ってきてもパニックしなければ OK
                println!("NVML エラー（正常なフォールバック）");
            }
        }
    }

    #[test]
    fn test_nvml_gpu_data_creation() {
        // NvmlGpuData 構造体の生成テスト
        let data = NvmlGpuData {
            name: "Test GPU".to_string(),
            vram_total_mb: 8192,
            vram_used_mb: 4096,
            usage_percent: 75,
            temperature_c: 65,
        };

        assert_eq!(data.name, "Test GPU");
        assert_eq!(data.vram_total_mb, 8192);
        assert_eq!(data.vram_used_mb, 4096);
        assert_eq!(data.usage_percent, 75);
        assert_eq!(data.temperature_c, 65);
    }
}
