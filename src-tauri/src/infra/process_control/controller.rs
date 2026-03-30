//! Windows プロセス制御インフラ
//! Win32 FFI を使ってプロセスのサスペンド・レジュームを行う

#[cfg(windows)]
use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
#[cfg(windows)]
use windows_sys::Win32::System::Threading::{
    OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_SUSPEND_RESUME, TerminateProcess,
};
#[cfg(windows)]
use windows_sys::core::HRESULT;

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
    pub fn new(pid: u32) -> Result<Self, AppError> {
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
    pub fn suspend(&self) -> Result<(), AppError> {
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
    pub fn resume(&self) -> Result<(), AppError> {
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
    /// # Safety
    /// - Windows のみコンパイルされる
    /// - 有効なプロセスハンドルを渡す必要がある
    unsafe fn nt_suspend_process(&self, handle: HANDLE) -> HRESULT {
        let ntdll = unsafe {
            windows_sys::Win32::System::LibraryLoader::GetModuleHandleA(
                c"ntdll.dll".as_ptr() as *const u8
            )
        };

        if ntdll.is_null() {
            return 0x8007007Eu32 as HRESULT;
        }

        let nt_suspend = unsafe {
            windows_sys::Win32::System::LibraryLoader::GetProcAddress(
                ntdll,
                c"NtSuspendProcess".as_ptr() as *const u8,
            )
        };

        if nt_suspend.is_none() {
            return 0x8007007Fu32 as HRESULT;
        }

        let nt_suspend_fn: unsafe extern "system" fn(HANDLE) -> HRESULT =
            unsafe { std::mem::transmute(nt_suspend) };

        unsafe { nt_suspend_fn(handle) }
    }

    /// NtResumeProcess の FFI 呼び出し
    ///
    /// # Safety
    /// - Windows のみコンパイルされる
    /// - 有効なプロセスハンドルを渡す必要がある
    unsafe fn nt_resume_process(&self, handle: HANDLE) -> HRESULT {
        let ntdll = unsafe {
            windows_sys::Win32::System::LibraryLoader::GetModuleHandleA(
                c"ntdll.dll".as_ptr() as *const u8
            )
        };

        if ntdll.is_null() {
            return 0x8007007Eu32 as HRESULT;
        }

        let nt_resume = unsafe {
            windows_sys::Win32::System::LibraryLoader::GetProcAddress(
                ntdll,
                c"NtResumeProcess".as_ptr() as *const u8,
            )
        };

        if nt_resume.is_none() {
            return 0x8007007Fu32 as HRESULT;
        }

        let nt_resume_fn: unsafe extern "system" fn(HANDLE) -> HRESULT =
            unsafe { std::mem::transmute(nt_resume) };

        unsafe { nt_resume_fn(handle) }
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
#[allow(dead_code)]
#[derive(Debug)]
pub struct ProcessController {
    _private: (),
}

#[cfg(not(windows))]
#[allow(dead_code)]
impl ProcessController {
    pub fn new(_pid: u32) -> Result<Self, AppError> {
        Err(AppError::Win32(
            "プロセス制御は Windows 専用機能です".to_string(),
        ))
    }
}
