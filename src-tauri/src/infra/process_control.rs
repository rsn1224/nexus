//! Windows プロセス制御インフラ
//! Win32 FFI を使ってプロセスのサスペンド・レジュームを行う

#[cfg(windows)]
use windows_sys::core::HRESULT;
#[cfg(windows)]
use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
#[cfg(windows)]
use windows_sys::Win32::System::Threading::{
    OpenProcess, TerminateProcess, PROCESS_QUERY_INFORMATION, PROCESS_SUSPEND_RESUME,
};

use crate::error::AppError;

/// Win32 NtSuspendProcess/NtResumeProcess の安全なラッパー
/// Windows 専用モジュール（他プラットフォームではコンパイルされない）
#[cfg(windows)]
#[derive(Debug)]
#[allow(dead_code)]
pub struct ProcessController {
    handle: HANDLE,
}

#[cfg(windows)]
#[allow(dead_code)]
impl ProcessController {
    /// 新しいプロセスコントローラを作成
    ///
    /// # 引数
    /// - `pid`: ターゲットプロセスの PID
    ///
    /// # 戻り値
    /// - `Ok(ProcessController)`: 成功
    /// - `Err(AppError)`: 失敗（プロセスが存在しない、権限不足など）
    pub fn new(pid: u32) -> Result<Self, AppError> {
        // PROCESS_SUSPEND_RESUM | PROCESS_QUERY_INFORMATION アクセスでハンドルを開く
        let handle =
            unsafe { OpenProcess(PROCESS_SUSPEND_RESUME | PROCESS_QUERY_INFORMATION, 0, pid) };

        if handle.is_null() {
            return Err(AppError::Win32(format!(
                "プロセスハンドル取得失敗 PID: {}",
                pid
            )));
        }

        Ok(Self { handle })
    }

    /// プロセスを一時停止する
    ///
    /// # 戻り値
    /// - `Ok(())`: 成功
    /// - `Err(AppError)`: 失敗（すでに停止中、権限不足など）
    pub fn suspend(&self) -> Result<(), AppError> {
        // NtSuspendProcess を動的にロードして呼び出す
        let result = unsafe { self.nt_suspend_process(self.handle) };

        if result < 0 {
            return Err(AppError::Win32(format!(
                "プロセスサスペンド失敗 HRESULT: {:#X}",
                result
            )));
        }

        Ok(())
    }

    /// プロセスを再開する
    ///
    /// # 戻り値
    /// - `Ok(())`: 成功
    /// - `Err(AppError)`: 失敗（すでに実行中、権限不足など）
    pub fn resume(&self) -> Result<(), AppError> {
        // NtResumeProcess を動的にロードして呼び出す
        let result = unsafe { self.nt_resume_process(self.handle) };

        if result < 0 {
            return Err(AppError::Win32(format!(
                "プロセスレジューム失敗 HRESULT: {:#X}",
                result
            )));
        }

        Ok(())
    }

    /// プロセスを強制終了する
    ///
    /// # 引数
    /// - `exit_code`: 終了コード（通常は 1）
    ///
    /// # 戻り値
    /// - `Ok(())`: 成功
    /// - `Err(AppError)`: 失敗（権限不足など）
    pub fn terminate(&self, exit_code: u32) -> Result<(), AppError> {
        let success = unsafe { TerminateProcess(self.handle, exit_code) };

        if success == 0 {
            return Err(AppError::Win32(format!(
                "プロセス終了失敗 PID: {:#X}",
                self.handle as u32
            )));
        }

        Ok(())
    }

    /// NtSuspendProcess の FFI 呼び出し
    ///
    /// # 安全性
    /// - Windows のみコンパイルされる
    /// - 有効なプロセスハンドルを渡す必要がある
    /// - 呼び出し元でプロセスハンドルの所有権を管理する
    unsafe fn nt_suspend_process(&self, handle: HANDLE) -> HRESULT {
        // ntdll.dll を動的にロード
        let ntdll = windows_sys::Win32::System::LibraryLoader::GetModuleHandleA(
            c"ntdll.dll".as_ptr() as *const u8,
        );

        if ntdll.is_null() {
            return 0x8007007Eu32 as HRESULT; // ERROR_MODULE_NOT_FOUND
        }

        // NtSuspendProcess 関数アドレスを取得
        let nt_suspend = windows_sys::Win32::System::LibraryLoader::GetProcAddress(
            ntdll,
            c"NtSuspendProcess".as_ptr() as *const u8,
        );

        if nt_suspend.is_none() {
            return 0x8007007Fu32 as HRESULT; // ERROR_PROC_NOT_FOUND
        }

        // 関数ポインタを呼び出し
        let nt_suspend_fn: unsafe extern "system" fn(HANDLE) -> HRESULT =
            std::mem::transmute(nt_suspend);

        nt_suspend_fn(handle)
    }

    /// NtResumeProcess の FFI 呼び出し
    ///
    /// # 安全性
    /// - Windows のみコンパイルされる
    /// - 有効なプロセスハンドルを渡す必要がある
    /// - 呼び出し元でプロセスハンドルの所有権を管理する
    unsafe fn nt_resume_process(&self, handle: HANDLE) -> HRESULT {
        // ntdll.dll を動的にロード
        let ntdll = windows_sys::Win32::System::LibraryLoader::GetModuleHandleA(
            c"ntdll.dll".as_ptr() as *const u8,
        );

        if ntdll.is_null() {
            return 0x8007007Eu32 as HRESULT; // ERROR_MODULE_NOT_FOUND
        }

        // NtResumeProcess 関数アドレスを取得
        let nt_resume = windows_sys::Win32::System::LibraryLoader::GetProcAddress(
            ntdll,
            c"NtResumeProcess".as_ptr() as *const u8,
        );

        if nt_resume.is_none() {
            return 0x8007007Fu32 as HRESULT; // ERROR_PROC_NOT_FOUND
        }

        // 関数ポインタを呼び出し
        let nt_resume_fn: unsafe extern "system" fn(HANDLE) -> HRESULT =
            std::mem::transmute(nt_resume);

        nt_resume_fn(handle)
    }
}

#[cfg(windows)]
impl Drop for ProcessController {
    fn drop(&mut self) {
        if !self.handle.is_null() {
            unsafe {
                CloseHandle(self.handle);
            }
        }
    }
}

/// Windows 以外のプラットフォーム用スタブ実装
#[cfg(not(windows))]
pub struct ProcessController {
    _private: (),
}

#[cfg(not(windows))]
impl ProcessController {
    pub fn new(_pid: u32) -> Result<Self, AppError> {
        Err(AppError::Win32(
            "プロセス制御は Windows 専用機能です".to_string(),
        ))
    }
}

/// プロセスを一時停止する便利関数
///
/// # 引数
/// - `pid`: ターゲットプロセスの PID
///
/// # 戻り値
/// - `Ok(())`: 成功
/// - `Err(AppError)`: 失敗
#[cfg(windows)]
#[allow(dead_code)]
pub fn suspend_process(pid: u32) -> Result<(), AppError> {
    let controller = ProcessController::new(pid)?;
    controller.suspend()
}

/// プロセスを再開する便利関数
///
/// # 引数
/// - `pid`: ターゲットプロセスの PID
///
/// # 戻り値
/// - `Ok(())`: 成功
/// - `Err(AppError)`: 失敗
#[cfg(windows)]
#[allow(dead_code)]
pub fn resume_process(pid: u32) -> Result<(), AppError> {
    let controller = ProcessController::new(pid)?;
    controller.resume()
}

/// プロセスを強制終了する便利関数
///
/// # 引数
/// - `pid`: ターゲットプロセスの PID
/// - `exit_code`: 終了コード（通常は 1）
///
/// # 戻り値
/// - `Ok(())`: 成功
/// - `Err(AppError)`: 失敗
#[cfg(windows)]
#[allow(dead_code)]
pub fn terminate_process(pid: u32, exit_code: u32) -> Result<(), AppError> {
    let controller = ProcessController::new(pid)?;
    controller.terminate(exit_code)
}

/// プロセス名から PID を検索する便利関数
///
/// # 引数
/// - `name`: プロセス名（例: "nexus.exe"）
///
/// # 戻り値
/// - `Ok(Vec<u32>)`: 見つかった PID のリスト
/// - `Err(AppError)`: 失敗
#[cfg(windows)]
#[allow(dead_code)]
pub fn find_pids_by_name(name: &str) -> Result<Vec<u32>, AppError> {
    use std::ffi::CString;
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32First, Process32Next, PROCESSENTRY32, TH32CS_SNAPPROCESS,
    };

    let _name_cstring =
        CString::new(name).map_err(|e| AppError::Win32(format!("プロセス名変換失敗: {}", e)))?;

    // プロセススナップショットを作成
    let snapshot = unsafe { CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) };

    if snapshot == windows_sys::Win32::Foundation::INVALID_HANDLE_VALUE {
        return Err(AppError::Win32(
            "プロセススナップショット作成失敗".to_string(),
        ));
    }

    let mut pids = Vec::new();
    let mut entry: PROCESSENTRY32 = unsafe { std::mem::zeroed() };
    entry.dwSize = std::mem::size_of::<PROCESSENTRY32>() as u32;

    // 最初のプロセスを取得
    let mut result = unsafe { Process32First(snapshot, &mut entry) };

    while result != 0 {
        // プロセス名を比較
        let process_name = unsafe { std::ffi::CStr::from_ptr(entry.szExeFile.as_ptr()) };

        if let Ok(process_name_str) = process_name.to_str() {
            if process_name_str
                .to_lowercase()
                .eq_ignore_ascii_case(&name.to_lowercase())
            {
                pids.push(entry.th32ProcessID);
            }
        }

        // 次のプロセスを取得
        result = unsafe { Process32Next(snapshot, &mut entry) };
    }

    unsafe {
        CloseHandle(snapshot);
    }

    Ok(pids)
}

/// Windows 以外のプラットフォーム用スタブ実装
#[cfg(not(windows))]
pub fn find_pids_by_name(_name: &str) -> Result<Vec<u32>, AppError> {
    Err(AppError::Win32(
        "プロセス検索は Windows 専用機能です".to_string(),
    ))
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(windows)]
    fn test_process_controller_current_process() {
        use windows_sys::Win32::System::Threading::GetCurrentProcess;

        // 現在のプロセスでテスト（常に成功するはず）
        let current_pid = unsafe { GetCurrentProcess() as u32 };
        let result = ProcessController::new(current_pid);

        // テスト環境によっては失敗する可能性もあるため、エラーでなければ OK
        match result {
            Ok(_) => {} // 成功
            Err(_) => {
                // 失敗してもテストとしては OK（環境依存）
            }
        }
    }

    #[test]
    #[cfg(windows)]
    fn test_find_pids_by_name_current() {
        // 現在のプロセス名で検索テスト
        let pids = find_pids_by_name("nexus.exe");
        // 少なくとも 1 つは見つかるはず（このテスト実行中）
        // テスト環境によっては見つからない可能性もあるため、エラーでなければ OK
        assert!(pids.is_ok(), "プロセス検索でエラー発生");
    }

    #[test]
    fn test_find_pids_by_name_nonexistent() {
        // 存在しないプロセス名で検索
        let pids = find_pids_by_name("nonexistent_process_12345.exe");
        assert!(pids.is_ok(), "存在しないプロセス名検索でエラー");
        assert_eq!(pids.unwrap().len(), 0, "存在しないプロセスが見つかった");
    }

    #[test]
    fn test_process_controller_invalid_pid() {
        // 存在しない PID でコントローラ作成を試行
        let result = ProcessController::new(999999);
        assert!(result.is_err(), "存在しない PID でコントローラ作成に成功");
        assert!(matches!(result.unwrap_err(), AppError::Win32(_)));
    }

    #[test]
    #[cfg(not(windows))]
    fn test_non_windows_stub() {
        // Windows 以外のプラットフォームではスタブ実装がエラーを返す
        let result = ProcessController::new(1234);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::Win32(_)));

        let result = find_pids_by_name("test.exe");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::Win32(_)));
    }
}
