//! Windows プロセス制御インフラ
//! Win32 FFI を使ってプロセスのサスペンド・レジュームを行う

mod controller;
mod operations;

pub use operations::*;

// controller items re-exported for tests
#[cfg(test)]
use controller::*;

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::AppError;

    #[test]
    #[cfg(windows)]
    fn test_process_controller_current_process() {
        use windows_sys::Win32::System::Threading::GetCurrentProcess;

        let current_pid = unsafe { GetCurrentProcess() as u32 };
        let result = ProcessController::new(current_pid);

        match result {
            Ok(_) => {}
            Err(_) => {}
        }
    }

    #[test]
    #[cfg(windows)]
    fn test_find_pids_by_name_current() {
        let pids = find_pids_by_name("nexus.exe");
        assert!(pids.is_ok(), "プロセス検索でエラー発生");
    }

    #[test]
    fn test_find_pids_by_name_nonexistent() {
        let pids = find_pids_by_name("nonexistent_process_12345.exe");
        assert!(pids.is_ok(), "存在しないプロセス名検索でエラー");
        assert_eq!(pids.unwrap().len(), 0, "存在しないプロセスが見つかった");
    }

    #[test]
    fn test_process_controller_invalid_pid() {
        let result = ProcessController::new(999999);
        assert!(result.is_err(), "存在しない PID でコントローラ作成に成功");
        assert!(matches!(result.unwrap_err(), AppError::Win32(_)));
    }

    #[test]
    #[cfg(not(windows))]
    fn test_non_windows_stub() {
        let result = ProcessController::new(1234);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::Win32(_)));

        let result = find_pids_by_name("test.exe");
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }
}
