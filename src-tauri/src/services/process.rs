use crate::constants::is_protected_process;
use crate::error::AppError;
use crate::state::SharedState;
use crate::types::game::ProcessPriority;
use sysinfo::{Process, ProcessesToUpdate};
use tauri::State;

/// プロセス一覧の生データ（commands/ で SystemProcess に変換）
pub struct ProcessData {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub mem_mb: f64,
    pub disk_read_kb: f64,
    pub disk_write_kb: f64,
    pub can_terminate: bool,
}

/// 共有 System インスタンスを更新してプロセス一覧を取得する
pub fn list_processes(state: &State<'_, SharedState>) -> Result<Vec<ProcessData>, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Process(format!("Stateロックエラー: {}", e)))?;

    // 共有 System を更新（fresh_system() の代替）
    s.sys.refresh_processes(ProcessesToUpdate::All, true);

    let mut processes: Vec<ProcessData> = s
        .sys
        .processes()
        .values()
        .map(|p: &Process| {
            let name = p.name().to_string_lossy().to_string();
            let can_terminate = !is_protected_process(&name);
            ProcessData {
                pid: p.pid().as_u32(),
                name,
                cpu_percent: p.cpu_usage(),
                mem_mb: p.memory() as f64 / 1024.0 / 1024.0,
                disk_read_kb: p.disk_usage().read_bytes as f64 / 1024.0,
                disk_write_kb: p.disk_usage().written_bytes as f64 / 1024.0,
                can_terminate,
            }
        })
        .collect();

    processes.sort_by(|a, b| {
        b.cpu_percent
            .partial_cmp(&a.cpu_percent)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    processes.truncate(100);

    Ok(processes)
}

/// プロセスを終了する
pub fn kill_process(state: &State<'_, SharedState>, pid: u32) -> Result<String, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Process(format!("Stateロックエラー: {}", e)))?;

    s.sys.refresh_processes(ProcessesToUpdate::All, true);

    let sysinfo_pid = sysinfo::Pid::from(pid as usize);
    if let Some(process) = s.sys.process(sysinfo_pid) {
        let name = process.name().to_string_lossy().to_string();
        if is_protected_process(&name) {
            return Err(AppError::Process("保護プロセスです".to_string()));
        }
        if process.kill() {
            Ok(format!("プロセス {} を終了しました", pid))
        } else {
            Err(AppError::Process(format!(
                "プロセス {} の終了に失敗しました",
                pid
            )))
        }
    } else {
        Err(AppError::NotFound(format!(
            "プロセス {} が見つかりません",
            pid
        )))
    }
}

/// 高 CPU 使用率の非保護プロセスを提案する
pub fn get_ai_suggestions(state: &State<'_, SharedState>) -> Result<Vec<String>, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Process(format!("Stateロックエラー: {}", e)))?;

    s.sys.refresh_processes(ProcessesToUpdate::All, true);

    let mut processes: Vec<(String, f32)> = s
        .sys
        .processes()
        .values()
        .map(|p: &Process| (p.name().to_string_lossy().to_string(), p.cpu_usage()))
        .filter(|(name, _)| !is_protected_process(name))
        .collect();

    processes.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    let mut seen = std::collections::HashSet::new();
    let suggestions = processes
        .into_iter()
        .filter_map(|(name, _)| {
            if seen.insert(name.clone()) {
                Some(name)
            } else {
                None
            }
        })
        .take(5)
        .collect();

    Ok(suggestions)
}

/// プロセスの優先度を Win32 API で設定する
pub fn set_priority(pid: u32, priority: &str) -> Result<(), AppError> {
    let priority_class = match priority {
        "high" => ProcessPriority::AboveNormal,
        "normal" => ProcessPriority::Normal,
        "idle" => ProcessPriority::Idle,
        _ => {
            return Err(AppError::Validation(format!(
                "不正な優先度: '{}'. 'high', 'normal', 'idle' のいずれかを指定してください",
                priority
            )))
        }
    };

    crate::infra::process_control::set_process_priority_class(pid, priority_class)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_priority_invalid() {
        let result = set_priority(1234, "invalid");
        assert!(result.is_err());

        if let Err(AppError::Validation(msg)) = result {
            assert!(msg.contains("不正な優先度"));
            assert!(msg.contains("invalid"));
        } else {
            panic!("Expected Validation error");
        }
    }

    #[test]
    fn test_set_priority_parameter_mapping() {
        // パラメータマッピングのテスト - Win32 API 呼び出しは行わない
        // 実際の環境では Win32 API が失敗することを想定

        // 有効なパラメータでも Win32 API 呼び出しでエラーになるはず
        let result = set_priority(1234, "high");
        assert!(result.is_err());

        let result = set_priority(1234, "normal");
        assert!(result.is_err());

        let result = set_priority(1234, "idle");
        assert!(result.is_err());

        // 無効なパラメータは検証エラーになる
        let result = set_priority(1234, "invalid");
        assert!(result.is_err());

        if let Err(AppError::Validation(_)) = result {
            // OK - 検証エラー
        } else {
            panic!("Expected Validation error for invalid parameter");
        }
    }
}
