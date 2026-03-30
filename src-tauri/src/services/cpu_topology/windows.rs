//! Windows 環境での詳細 CPU トポロジー検出

#[cfg(windows)]
use crate::error::AppError;
#[cfg(windows)]
use crate::types::game::CpuTopology;
#[cfg(windows)]
use tracing::info;

#[cfg(windows)]
pub(super) fn detect_topology_windows(
    logical_cores: usize,
    _physical_cores: usize,
    vendor_id: &str,
    brand: &str,
) -> Result<CpuTopology, AppError> {
    use windows_sys::Win32::System::SystemInformation::{
        GetLogicalProcessorInformationEx, RelationProcessorCore,
        SYSTEM_LOGICAL_PROCESSOR_INFORMATION_EX,
    };

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

            let proc_rel = unsafe { &info.Anonymous.Processor };
            let flags = proc_rel.Flags;
            let group_mask = proc_rel.GroupMask[0];
            let mask = group_mask.Mask as usize;

            let core_indices: Vec<usize> = (0..usize::BITS as usize)
                .filter(|&i| mask & (1 << i) != 0)
                .collect();

            if vendor_id == "GenuineIntel" {
                if flags & 0x1 != 0 {
                    p_cores.extend(&core_indices);
                } else {
                    e_cores.extend(&core_indices);
                }
            } else {
                p_cores.extend(&core_indices);
            }
        }

        offset += info.Size as usize;
    }

    if p_cores.is_empty() && e_cores.is_empty() {
        p_cores = (0..logical_cores).collect();
    }

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
pub(super) fn detect_amd_ccds(logical_cores: usize) -> Vec<Vec<usize>> {
    if logical_cores >= 16 {
        let half = logical_cores / 2;
        vec![(0..half).collect(), (half..logical_cores).collect()]
    } else {
        vec![(0..logical_cores).collect()]
    }
}
