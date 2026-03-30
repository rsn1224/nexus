//! CPU トポロジー検出サービス
//! Intel 12世代以降: P-Core / E-Core 判別
//! AMD Ryzen: CCD グルーピング
//! その他: フォールバック

use crate::error::AppError;
use crate::types::game::CpuTopology;
use tracing::info;
#[cfg(windows)]
use tracing::warn;

/// CPU トポロジーを検出して返す。
pub fn detect_topology() -> Result<CpuTopology, AppError> {
    let logical_cores = num_cpus_logical();
    let physical_cores = num_cpus_physical();
    let (vendor_id, brand) = get_cpu_vendor_brand();

    info!(
        "CPU検出: vendor={}, brand={}, physical={}, logical={}",
        vendor_id, brand, physical_cores, logical_cores
    );

    #[cfg(windows)]
    {
        match super::windows::detect_topology_windows(
            logical_cores,
            physical_cores,
            &vendor_id,
            &brand,
        ) {
            Ok(topo) => return Ok(topo),
            Err(e) => {
                warn!("Windows CPU トポロジー検出失敗、フォールバック使用: {}", e);
            }
        }
    }

    // フォールバック: 全コアを P-Core として扱う
    Ok(CpuTopology {
        physical_cores,
        logical_cores,
        p_cores: (0..logical_cores).collect(),
        e_cores: vec![],
        ccd_groups: vec![],
        hyperthreading_enabled: logical_cores > physical_cores,
        vendor_id,
        brand,
    })
}

/// 論理コア数を取得
pub(super) fn num_cpus_logical() -> usize {
    std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1)
}

/// 物理コア数を推定
pub(super) fn num_cpus_physical() -> usize {
    let logical = num_cpus_logical();
    logical / 2
}

/// cpuid からベンダーID とブランド名を取得
pub(super) fn get_cpu_vendor_brand() -> (String, String) {
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    {
        let mut sys = sysinfo::System::new();
        sys.refresh_cpu_all();
        let cpus = sys.cpus();
        if let Some(cpu) = cpus.first() {
            let brand = cpu.brand().to_string();
            let vendor_id = if brand.contains("Intel") {
                "GenuineIntel".to_string()
            } else if brand.contains("AMD") {
                "AuthenticAMD".to_string()
            } else {
                "Unknown".to_string()
            };
            return (vendor_id, brand);
        }
    }
    ("Unknown".to_string(), "Unknown CPU".to_string())
}
