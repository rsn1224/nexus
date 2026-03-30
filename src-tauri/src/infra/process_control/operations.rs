//! プロセス制御の便利関数

#[cfg(windows)]
use windows_sys::Win32::Foundation::CloseHandle;
#[cfg(windows)]
use windows_sys::Win32::System::Threading::{
    ABOVE_NORMAL_PRIORITY_CLASS, BELOW_NORMAL_PRIORITY_CLASS, HIGH_PRIORITY_CLASS,
    IDLE_PRIORITY_CLASS, NORMAL_PRIORITY_CLASS, OpenProcess, PROCESS_SET_INFORMATION,
    REALTIME_PRIORITY_CLASS, SetPriorityClass,
};

use crate::error::AppError;

use super::controller::ProcessController;

/// プロセスの優先度を Win32 API で設定する。
#[cfg(windows)]
#[allow(dead_code)]
pub fn set_process_priority_class(
    pid: u32,
    priority: crate::types::game::ProcessPriority,
) -> Result<(), AppError> {
    let priority_class = match priority {
        crate::types::game::ProcessPriority::Normal => NORMAL_PRIORITY_CLASS,
        crate::types::game::ProcessPriority::High => HIGH_PRIORITY_CLASS,
        crate::types::game::ProcessPriority::Realtime => REALTIME_PRIORITY_CLASS,
        crate::types::game::ProcessPriority::AboveNormal => ABOVE_NORMAL_PRIORITY_CLASS,
        crate::types::game::ProcessPriority::BelowNormal => BELOW_NORMAL_PRIORITY_CLASS,
        crate::types::game::ProcessPriority::Idle => IDLE_PRIORITY_CLASS,
    };

    unsafe {
        let handle = OpenProcess(PROCESS_SET_INFORMATION, 0, pid);
        if handle.is_null() {
            return Err(AppError::Win32(format!("OpenProcess 失敗: PID {}", pid)));
        }

        let result = SetPriorityClass(handle, priority_class);
        CloseHandle(handle);

        if result == 0 {
            return Err(AppError::Win32(format!(
                "SetPriorityClass 失敗: PID {}, priority={:?}",
                pid, priority
            )));
        }
    }

    tracing::info!(
        "プロセス優先度設定完了: PID={}, priority={:?}",
        pid,
        priority
    );
    Ok(())
}

/// 非 Windows プラットフォーム用スタブ
#[cfg(not(windows))]
pub fn set_process_priority_class(
    _pid: u32,
    _priority: crate::types::game::ProcessPriority,
) -> Result<(), AppError> {
    Err(AppError::Win32(
        "プロセス優先度設定は Windows のみサポートされています".to_string(),
    ))
}

/// プロセスを一時停止する便利関数
#[cfg(windows)]
#[allow(dead_code)]
pub fn suspend_process(pid: u32) -> Result<(), AppError> {
    let controller = ProcessController::new(pid)?;
    controller.suspend()
}

#[cfg(not(windows))]
#[allow(dead_code)]
pub fn suspend_process(_pid: u32) -> Result<(), AppError> {
    Err(AppError::Win32("Windows 専用機能です".to_string()))
}

/// プロセスを再開する便利関数
#[cfg(windows)]
#[allow(dead_code)]
pub fn resume_process(pid: u32) -> Result<(), AppError> {
    let controller = ProcessController::new(pid)?;
    controller.resume()
}

#[cfg(not(windows))]
#[allow(dead_code)]
pub fn resume_process(_pid: u32) -> Result<(), AppError> {
    Err(AppError::Win32("Windows 専用機能です".to_string()))
}

/// プロセスを強制終了する便利関数
#[cfg(windows)]
#[allow(dead_code)]
pub fn terminate_process(pid: u32, exit_code: u32) -> Result<(), AppError> {
    let controller = ProcessController::new(pid)?;
    controller.terminate(exit_code)
}

#[cfg(not(windows))]
#[allow(dead_code)]
pub fn terminate_process(_pid: u32, _exit_code: u32) -> Result<(), AppError> {
    Err(AppError::Win32("Windows 専用機能です".to_string()))
}

/// プロセス名から PID を検索する便利関数
#[cfg(windows)]
#[allow(dead_code)]
pub fn find_pids_by_name(name: &str) -> Result<Vec<u32>, AppError> {
    use std::ffi::CString;
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, PROCESSENTRY32, Process32First, Process32Next, TH32CS_SNAPPROCESS,
    };

    let _name_cstring =
        CString::new(name).map_err(|e| AppError::Win32(format!("プロセス名変換失敗: {}", e)))?;

    let snapshot = unsafe { CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) };

    if snapshot == windows_sys::Win32::Foundation::INVALID_HANDLE_VALUE {
        return Err(AppError::Win32(
            "プロセススナップショット作成失敗".to_string(),
        ));
    }

    let mut pids = Vec::new();
    let mut entry: PROCESSENTRY32 = unsafe { std::mem::zeroed() };
    entry.dwSize = std::mem::size_of::<PROCESSENTRY32>() as u32;

    let mut result = unsafe { Process32First(snapshot, &mut entry) };

    while result != 0 {
        let process_name = unsafe { std::ffi::CStr::from_ptr(entry.szExeFile.as_ptr()) };

        if let Ok(process_name_str) = process_name.to_str() {
            if process_name_str
                .to_lowercase()
                .eq_ignore_ascii_case(&name.to_lowercase())
            {
                pids.push(entry.th32ProcessID);
            }
        }

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
    Ok(vec![])
}
