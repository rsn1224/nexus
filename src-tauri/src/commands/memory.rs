//! メモリクリーナー系コマンドハンドラー

use tauri::{AppHandle, Emitter, State};
use tracing::info;

use crate::error::AppError;
use crate::services::memory_cleaner::{MemoryCleaner, MemoryCleanerConfig, MemoryCleanupResult};
use crate::state::SharedState;

/// メモリクリーナー設定を取得
#[tauri::command]
pub fn get_memory_cleaner_config(state: State<SharedState>) -> Result<MemoryCleanerConfig, AppError> {
    let app_state = state.lock()
        .map_err(|e| AppError::Internal(format!("メモリクリーナーロックエラー: {}", e)))?;
    Ok(app_state.memory_cleaner.get_config().clone())
}

/// メモリクリーナー設定を更新
#[tauri::command]
pub fn update_memory_cleaner_config(
    config: MemoryCleanerConfig,
    state: State<SharedState>
) -> Result<(), AppError> {
    let mut app_state = state.lock()
        .map_err(|e| AppError::Internal(format!("メモリクリーナーロックエラー: {}", e)))?;
    app_state.memory_cleaner.update_config(config);
    info!("メモリクリーナー設定を更新");
    Ok(())
}

/// 手動メモリクリーニングを実行
#[tauri::command]
pub async fn manual_memory_cleanup(app: AppHandle) -> Result<MemoryCleanupResult, AppError> {
    let result = MemoryCleaner::manual_cleanup().await?;
    
    // フロントエンドに結果を通知
    if let Err(e) = app.emit("nexus://memory-cleanup-result", &result) {
        tracing::error!("メモリクリーニング結果の送信に失敗: {}", e);
    }
    
    Ok(result)
}

/// 自動メモリクリーニングを開始
#[tauri::command]
pub async fn start_auto_memory_cleanup(app: AppHandle, state: State<'_, SharedState>) -> Result<(), AppError> {
    let mut cleaner = {
        let app_state = state.lock()
            .map_err(|e| AppError::Internal(format!("メモリクリーナーロックエラー: {}", e)))?;
        app_state.memory_cleaner.clone()
    };
    
    cleaner.start_auto_cleanup(app).await?;
    info!("自動メモリクリーニングを開始");
    Ok(())
}

/// 自動メモリクリーニングを停止
#[tauri::command]
pub fn stop_auto_memory_cleanup(state: State<SharedState>) -> Result<(), AppError> {
    let mut app_state = state.lock()
        .map_err(|e| AppError::Internal(format!("メモリクリーナーロックエラー: {}", e)))?;
    
    app_state.memory_cleaner.stop_auto_cleanup();
    info!("自動メモリクリーニングを停止");
    Ok(())
}
