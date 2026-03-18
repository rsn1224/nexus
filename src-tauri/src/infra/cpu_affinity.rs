//! CPU アフィニティ FFI ラッパー
//! 仕様: docs/specs/game-enhancement-spec.md §7.1

#[cfg(windows)]
mod platform {
    use crate::error::AppError;
    use tracing::info;
    use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::System::Threading::{
        GetProcessAffinityMask, OpenProcess, SetProcessAffinityMask, PROCESS_QUERY_INFORMATION,
        PROCESS_SET_INFORMATION,
    };

    /// プロセスのアフィニティマスクを設定する。
    /// `cores`: 使用するコアのインデックスリスト（0-indexed）
    pub fn set_affinity(pid: u32, cores: &[usize]) -> Result<(), AppError> {
        if cores.is_empty() {
            return Err(AppError::InvalidInput("コアリストが空です".to_string()));
        }

        let mask: usize = cores.iter().fold(0usize, |acc, &core| acc | (1 << core));

        // SAFETY: Windows API 呼び出し。handle は使用後に CloseHandle で閉じる
        unsafe {
            let handle = OpenProcess(
                PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION,
                0, // inherit = false
                pid,
            );
            if handle == INVALID_HANDLE_VALUE || handle.is_null() {
                return Err(AppError::Win32(format!("OpenProcess 失敗: PID {}", pid)));
            }

            let result = SetProcessAffinityMask(handle, mask);
            CloseHandle(handle);

            if result == 0 {
                return Err(AppError::Win32(format!(
                    "SetProcessAffinityMask 失敗: PID {}, mask=0x{:X}",
                    pid, mask
                )));
            }
        }

        info!(
            "アフィニティ設定完了: PID={}, cores={:?}, mask=0x{:X}",
            pid, cores, mask
        );
        Ok(())
    }

    /// プロセスの現在のアフィニティマスクを取得し、コアインデックスリストとして返す。
    pub fn get_affinity(pid: u32) -> Result<Vec<usize>, AppError> {
        unsafe {
            let handle = OpenProcess(PROCESS_QUERY_INFORMATION, 0, pid);
            if handle == INVALID_HANDLE_VALUE || handle.is_null() {
                return Err(AppError::Win32(format!("OpenProcess 失敗: PID {}", pid)));
            }

            let mut process_mask: usize = 0;
            let mut system_mask: usize = 0;
            let result = GetProcessAffinityMask(
                handle,
                &mut process_mask as *mut usize,
                &mut system_mask as *mut usize,
            );
            CloseHandle(handle);

            if result == 0 {
                return Err(AppError::Win32(format!(
                    "GetProcessAffinityMask 失敗: PID {}",
                    pid
                )));
            }

            let cores: Vec<usize> = (0..usize::BITS as usize)
                .filter(|&i| process_mask & (1 << i) != 0)
                .collect();

            Ok(cores)
        }
    }

    /// アフィニティマスク（ビットフィールド）をコアインデックスリストに変換する。
    pub fn mask_to_cores(mask: usize) -> Vec<usize> {
        (0..usize::BITS as usize)
            .filter(|&i| mask & (1 << i) != 0)
            .collect()
    }

    /// コアインデックスリストをアフィニティマスク（ビットフィールド）に変換する。
    pub fn cores_to_mask(cores: &[usize]) -> usize {
        cores.iter().fold(0usize, |acc, &core| acc | (1 << core))
    }
}

/// 非 Windows プラットフォーム用スタブ実装
#[cfg(not(windows))]
mod platform {
    use crate::error::AppError;

    pub fn set_affinity(_pid: u32, _cores: &[usize]) -> Result<(), AppError> {
        Err(AppError::Win32(
            "CPU アフィニティ設定は Windows のみサポートされています".to_string(),
        ))
    }

    pub fn get_affinity(_pid: u32) -> Result<Vec<usize>, AppError> {
        Err(AppError::Win32(
            "CPU アフィニティ取得は Windows のみサポートされています".to_string(),
        ))
    }

    pub fn mask_to_cores(mask: usize) -> Vec<usize> {
        (0..usize::BITS as usize)
            .filter(|&i| mask & (1 << i) != 0)
            .collect()
    }

    pub fn cores_to_mask(cores: &[usize]) -> usize {
        cores.iter().fold(0usize, |acc, &core| acc | (1 << core))
    }
}

// プラットフォーム関数を再エクスポート
#[cfg(windows)]
pub use platform::*;

#[cfg(not(windows))]
pub use platform::*;

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    // プラットフォーム関数を直接インポート
    #[cfg(windows)]
    use super::platform::*;
    #[cfg(not(windows))]
    use super::platform::*;

    #[test]
    fn test_mask_to_cores_single() {
        assert_eq!(mask_to_cores(0b0001), vec![0]);
        assert_eq!(mask_to_cores(0b1000), vec![3]);
    }

    #[test]
    fn test_mask_to_cores_multiple() {
        assert_eq!(mask_to_cores(0b1010), vec![1, 3]);
        assert_eq!(mask_to_cores(0b1111), vec![0, 1, 2, 3]);
    }

    #[test]
    fn test_mask_to_cores_empty() {
        assert_eq!(mask_to_cores(0), Vec::<usize>::new());
    }

    #[test]
    fn test_cores_to_mask_single() {
        assert_eq!(cores_to_mask(&[0]), 0b0001);
        assert_eq!(cores_to_mask(&[3]), 0b1000);
    }

    #[test]
    fn test_cores_to_mask_multiple() {
        assert_eq!(cores_to_mask(&[0, 2]), 0b0101);
        assert_eq!(cores_to_mask(&[0, 1, 2, 3]), 0b1111);
    }

    #[test]
    fn test_cores_to_mask_empty() {
        assert_eq!(cores_to_mask(&[]), 0);
    }

    #[test]
    fn test_roundtrip_mask_cores() {
        let original_cores = vec![0, 2, 4, 6];
        let mask = cores_to_mask(&original_cores);
        let result = mask_to_cores(mask);
        assert_eq!(result, original_cores);
    }

    #[test]
    fn test_high_core_index() {
        // 16コア以上のCPU対応確認
        let cores = vec![0, 8, 15];
        let mask = cores_to_mask(&cores);
        assert_eq!(mask_to_cores(mask), cores);
    }

    #[cfg(windows)]
    #[test]
    fn test_get_affinity_current_process() {
        // 現在のプロセスの PID でテスト
        let pid = std::process::id();
        let result = get_affinity(pid);
        assert!(result.is_ok(), "現在プロセスのアフィニティ取得に失敗");
        let cores = result.unwrap();
        assert!(
            !cores.is_empty(),
            "アフィニティが空（少なくとも1コアあるはず）"
        );
    }

    #[cfg(windows)]
    #[test]
    fn test_set_affinity_invalid_pid() {
        let result = set_affinity(999999, &[0]);
        assert!(result.is_err(), "存在しない PID でアフィニティ設定に成功");
    }

    #[test]
    fn test_set_affinity_empty_cores() {
        // 空のコアリストはエラー
        let result = set_affinity(1, &[]);
        assert!(result.is_err());
    }

    #[cfg(not(windows))]
    #[test]
    fn test_non_windows_stubs_return_error() {
        assert!(set_affinity(1, &[0]).is_err());
        assert!(get_affinity(1).is_err());
    }
}
