//! CPU トポロジー検出サービス
//! 仕様: docs/specs/game-enhancement-spec.md §7.2
//!
//! Intel 12世代以降: P-Core（HTあり）/ E-Core（HTなし）を判別
//! AMD Ryzen: CCD（Core Chiplet Die）ごとにグルーピング
//! その他: 全コアを P-Core として扱うフォールバック

use crate::error::AppError;
use crate::types::game::CpuTopology;
use tracing::info;
#[cfg(windows)]
use tracing::warn;

/// CPU トポロジーを検出して返す。
/// Windows 環境では `GetLogicalProcessorInformationEx` を使用。
/// 非 Windows やAPIエラー時はフォールバック（全コア = P-Core）。
pub fn detect_topology() -> Result<CpuTopology, AppError> {
    let logical_cores = num_cpus_logical();
    let physical_cores = num_cpus_physical();
    let (vendor_id, brand) = get_cpu_vendor_brand();

    info!(
        "CPU検出: vendor={}, brand={}, physical={}, logical={}",
        vendor_id, brand, physical_cores, logical_cores
    );

    // Windows 環境では詳細検出を試行
    #[cfg(windows)]
    {
        match detect_topology_windows(logical_cores, physical_cores, &vendor_id, &brand) {
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

/// 論理コア数を取得（sysinfo ベース）
fn num_cpus_logical() -> usize {
    // sysinfo ではなく std::thread で取得（軽量）
    std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1)
}

/// 物理コア数を推定
fn num_cpus_physical() -> usize {
    // sysinfo の System を使わず、環境変数やヒューリスティックで推定
    // Windows では GetLogicalProcessorInformationEx で正確に取得できるが、
    // フォールバック用に論理コア数の半分を使用
    let logical = num_cpus_logical();
    // HT/SMT 有効ときは論理 ÷ 2、無効ときはそのまま
    // 正確な値は detect_topology_windows で上書きする
    logical / 2
}

/// cpuid からベンダーID とブランド名を取得
fn get_cpu_vendor_brand() -> (String, String) {
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    {
        // cpuid crate を使わず、sysinfo の System::cpu_brand() を使う
        // ただし sysinfo の起動コストを避けるため、ここでは簡易的にシステム情報を取得
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

/// Windows 環境での詳細 CPU トポロジー検出
#[cfg(windows)]
fn detect_topology_windows(
    logical_cores: usize,
    _physical_cores: usize,
    vendor_id: &str,
    brand: &str,
) -> Result<CpuTopology, AppError> {
    use windows_sys::Win32::System::SystemInformation::{
        GetLogicalProcessorInformationEx, RelationProcessorCore,
        SYSTEM_LOGICAL_PROCESSOR_INFORMATION_EX,
    };

    // バッファサイズを取得
    let mut buffer_size: u32 = 0;
    unsafe {
        GetLogicalProcessorInformationEx(
            RelationProcessorCore,
            std::ptr::null_mut(),
            &mut buffer_size,
        );
    }

    if buffer_size == 0 {
        return Err(AppError::Win32(
            "GetLogicalProcessorInformationEx: バッファサイズ 0".to_string(),
        ));
    }

    // バッファを確保してデータ取得
    let mut buffer: Vec<u8> = vec![0u8; buffer_size as usize];
    let result = unsafe {
        GetLogicalProcessorInformationEx(
            RelationProcessorCore,
            buffer.as_mut_ptr() as *mut SYSTEM_LOGICAL_PROCESSOR_INFORMATION_EX,
            &mut buffer_size,
        )
    };

    if result == 0 {
        return Err(AppError::Win32(
            "GetLogicalProcessorInformationEx 呼び出し失敗".to_string(),
        ));
    }

    // 結果を解析
    let mut p_cores: Vec<usize> = Vec::new();
    let mut e_cores: Vec<usize> = Vec::new();
    let mut physical_count = 0usize;
    let mut offset = 0usize;

    while offset < buffer_size as usize {
        let info = unsafe {
            &*(buffer.as_ptr().add(offset) as *const SYSTEM_LOGICAL_PROCESSOR_INFORMATION_EX)
        };

        if info.Relationship == RelationProcessorCore {
            physical_count += 1;

            // PROCESSOR_RELATIONSHIP の Flags フィールド
            // LTP_PC_SMT (0x1) = このコアは SMT（HT）をサポート
            let proc_rel = unsafe { &info.Anonymous.Processor };
            let flags = proc_rel.Flags;
            let group_mask = proc_rel.GroupMask[0];
            let mask = group_mask.Mask as usize;

            let core_indices: Vec<usize> = (0..usize::BITS as usize)
                .filter(|&i| mask & (1 << i) != 0)
                .collect();

            // Intel の場合: SMT フラグがあれば P-Core、なければ E-Core
            if vendor_id == "GenuineIntel" {
                if flags & 0x1 != 0 {
                    // SMT 有り = P-Core
                    p_cores.extend(&core_indices);
                } else {
                    // SMT 無し = E-Core
                    e_cores.extend(&core_indices);
                }
            } else {
                // AMD やその他: 全て P-Core として扱う
                p_cores.extend(&core_indices);
            }
        }

        offset += info.Size as usize;
    }

    // E-Core がない場合（SMT なしの旧 Intel / AMD）は全て P-Core
    if p_cores.is_empty() && e_cores.is_empty() {
        p_cores = (0..logical_cores).collect();
    }

    // AMD CCD 検出（NUMA ベース）
    let ccd_groups = if vendor_id == "AuthenticAMD" {
        detect_amd_ccds(logical_cores)
    } else {
        vec![]
    };

    let ht_enabled = logical_cores > physical_count;

    info!(
        "CPU トポロジー検出完了: P-Core={}, E-Core={}, HT={}, CCD={}",
        p_cores.len(),
        e_cores.len(),
        ht_enabled,
        ccd_groups.len()
    );

    Ok(CpuTopology {
        physical_cores: physical_count,
        logical_cores,
        p_cores,
        e_cores,
        ccd_groups,
        hyperthreading_enabled: ht_enabled,
        vendor_id: vendor_id.to_string(),
        brand: brand.to_string(),
    })
}

/// AMD CCD 検出（NUMA ノードベース）
#[cfg(windows)]
fn detect_amd_ccds(logical_cores: usize) -> Vec<Vec<usize>> {
    // 簡易実装: NUMA ノード情報を取得できない場合はフォールバック
    // Ryzen 5000/7000 は通常 1〜2 CCD
    // 正確な検出は GetNumaNodeProcessorMaskEx を使うが、
    // Phase 8b の初期実装では以下のヒューリスティックを使用:
    // - 16コア以上: 8コアずつ2グループに分割（2 CCD 想定）
    // - それ以外: 1グループ（1 CCD）
    if logical_cores >= 16 {
        let half = logical_cores / 2;
        vec![(0..half).collect(), (half..logical_cores).collect()]
    } else {
        vec![(0..logical_cores).collect()]
    }
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_topology_returns_valid_structure() {
        let result = detect_topology();
        assert!(result.is_ok(), "CPU トポロジー検出に失敗");
        let topo = result.unwrap();

        // 基本的な整合性チェック
        assert!(topo.logical_cores > 0, "論理コア数が 0");
        assert!(topo.physical_cores > 0, "物理コア数が 0");
        assert!(
            topo.logical_cores >= topo.physical_cores,
            "論理コア < 物理コア"
        );
        assert!(!topo.p_cores.is_empty(), "P-Core リストが空");

        // P-Core + E-Core のインデックスが全て logical_cores 未満
        for &core in &topo.p_cores {
            assert!(
                core < topo.logical_cores,
                "P-Core インデックス超過: {}",
                core
            );
        }
        for &core in &topo.e_cores {
            assert!(
                core < topo.logical_cores,
                "E-Core インデックス超過: {}",
                core
            );
        }
    }

    #[test]
    fn test_detect_topology_vendor_not_empty() {
        let result = detect_topology().unwrap();
        assert!(!result.vendor_id.is_empty(), "vendor_id が空");
        assert!(!result.brand.is_empty(), "brand が空");
    }

    #[test]
    fn test_num_cpus_logical_positive() {
        assert!(num_cpus_logical() > 0);
    }

    #[test]
    fn test_num_cpus_physical_positive() {
        assert!(num_cpus_physical() > 0);
    }

    #[test]
    fn test_get_cpu_vendor_brand_non_empty() {
        let (vendor, brand) = get_cpu_vendor_brand();
        assert!(!vendor.is_empty());
        assert!(!brand.is_empty());
    }

    #[cfg(windows)]
    #[test]
    fn test_detect_amd_ccds_small_cpu() {
        let groups = detect_amd_ccds(8);
        assert_eq!(groups.len(), 1);
        assert_eq!(groups[0].len(), 8);
    }

    #[cfg(windows)]
    #[test]
    fn test_detect_amd_ccds_large_cpu() {
        let groups = detect_amd_ccds(16);
        assert_eq!(groups.len(), 2);
        assert_eq!(groups[0].len(), 8);
        assert_eq!(groups[1].len(), 8);
    }
}
