//! フレームタイム監視コマンド（commands 層）

use crate::error::AppError;
use crate::state::SharedState;
use crate::types::game::{FrameTimeMonitorState, FrameTimeSnapshot};
use tauri::{AppHandle, Emitter, Manager, State};

/// フレームタイム監視を開始する。
/// ゲームプロセスの PID を指定して監視を開始する。
#[tauri::command]
pub async fn start_frame_time_monitor(
    app: AppHandle,
    state: State<'_, SharedState>,
    pid: u32,
    process_name: String,
) -> Result<FrameTimeMonitorState, AppError> {
    // 既存のセッションがあれば停止
    {
        let mut s = state
            .lock()
            .map_err(|e| AppError::Process(format!("State ロック失敗: {}", e)))?;
        if let Some(ref mut session) = s.frame_time_session {
            session.stop();
        }
    }

    // 新しいセッションを開始
    let session = crate::services::frame_time::FrameTimeSession::start(pid, process_name.clone())?;

    // State に保存
    {
        let mut s = state
            .lock()
            .map_err(|e| AppError::Process(format!("State ロック失敗: {}", e)))?;
        s.frame_time_session = Some(session);
    }

    // emit ループを開始（1秒間隔）
    // State<'_> は lifetime 付き参照のため async ブロックに移動できない。
    // AppHandle を clone して、ループ内で state を取得する。
    let handle_clone = app.clone();

    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;

            let snap: FrameTimeSnapshot = {
                let state = handle_clone.state::<SharedState>();
                let mut s = state.lock().unwrap();
                if let Some(ref mut session) = s.frame_time_session {
                    session.snapshot()
                } else {
                    continue;
                }
            };

            handle_clone.emit("nexus://frame-time", &snap).ok();
        }
    });

    Ok(FrameTimeMonitorState::Monitoring { pid, process_name })
}

/// フレームタイム監視を停止する。
#[tauri::command]
pub async fn stop_frame_time_monitor(
    state: State<'_, SharedState>,
) -> Result<FrameTimeMonitorState, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Process(format!("State ロック失敗: {}", e)))?;
    if let Some(ref mut session) = s.frame_time_session {
        session.stop();
    }
    s.frame_time_session = None;

    Ok(FrameTimeMonitorState::Stopped)
}

/// 現在のフレームタイム監視状態を取得する。
#[tauri::command]
pub async fn get_frame_time_status(
    state: State<'_, SharedState>,
) -> Result<FrameTimeMonitorState, AppError> {
    let s = state
        .lock()
        .map_err(|e| AppError::Process(format!("State ロック失敗: {}", e)))?;

    match &s.frame_time_session {
        Some(session) => Ok(FrameTimeMonitorState::Monitoring {
            pid: session.get_pid(),
            process_name: session.get_process_name().to_string(),
        }),
        None => Ok(FrameTimeMonitorState::Stopped),
    }
}

// ─── テスト ──────────────────────────────────────────────────────────────────
