//! ブーストサービスのユーティリティ関数

use crate::error::AppError;
use crate::state::SharedState;

use sysinfo::ProcessesToUpdate;
use tauri::State;

/// プロセス名から PID リストを検索する
pub(crate) fn find_pids_by_name(
    state: &State<'_, SharedState>,
    name: &str,
) -> Result<Vec<u32>, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Process(format!("Stateロックエラー: {}", e)))?;

    s.sys.refresh_processes(ProcessesToUpdate::All, true);

    let name_lower = name.to_lowercase();
    let pids: Vec<u32> = s
        .sys
        .processes()
        .values()
        .filter(|p| {
            let proc_name = p.name().to_string_lossy().to_lowercase();
            proc_name == name_lower
        })
        .map(|p| p.pid().as_u32())
        .collect();

    Ok(pids)
}
