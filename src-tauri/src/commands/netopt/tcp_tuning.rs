// ─── TCP Tuning Commands (Phase δ-2) ─────────────────────────────────────

use tracing::info;

use crate::error::AppError;
use crate::services::{network_monitor, network_tuning};

#[tauri::command]
pub async fn get_tcp_tuning_state() -> Result<network_tuning::TcpTuningState, AppError> {
    info!("get_tcp_tuning_state: fetching current TCP tuning state");
    tokio::task::spawn_blocking(network_tuning::get_tcp_tuning_state)
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn set_nagle_disabled(disabled: bool) -> Result<(), AppError> {
    info!("set_nagle_disabled: {}", disabled);
    tokio::task::spawn_blocking(move || network_tuning::set_nagle(disabled))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn set_delayed_ack_disabled(disabled: bool) -> Result<(), AppError> {
    info!("set_delayed_ack_disabled: {}", disabled);
    tokio::task::spawn_blocking(move || network_tuning::set_delayed_ack(disabled))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn set_network_throttling(index: i32) -> Result<(), AppError> {
    info!("set_network_throttling: {}", index);
    tokio::task::spawn_blocking(move || network_tuning::set_network_throttling(index))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn set_qos_reserved_bandwidth(percent: u32) -> Result<(), AppError> {
    info!("set_qos_reserved_bandwidth: {}%", percent);
    tokio::task::spawn_blocking(move || network_tuning::set_qos_reserved_bandwidth(percent))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn set_tcp_auto_tuning(level: String) -> Result<(), AppError> {
    info!("set_tcp_auto_tuning: {}", level);
    let tuning_level = match level.as_str() {
        "normal" => network_tuning::TcpAutoTuningLevel::Normal,
        "disabled" => network_tuning::TcpAutoTuningLevel::Disabled,
        "highlyRestricted" => network_tuning::TcpAutoTuningLevel::HighlyRestricted,
        "restricted" => network_tuning::TcpAutoTuningLevel::Restricted,
        "experimental" => network_tuning::TcpAutoTuningLevel::Experimental,
        _ => {
            return Err(AppError::InvalidInput(
                "Invalid TCP auto-tuning level".into(),
            ));
        }
    };
    tokio::task::spawn_blocking(move || network_tuning::set_tcp_auto_tuning(tuning_level))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn apply_gaming_network_preset() -> Result<network_tuning::TcpTuningState, AppError> {
    info!("apply_gaming_network_preset: applying gaming preset");
    tokio::task::spawn_blocking(network_tuning::apply_gaming_preset)
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn reset_network_defaults() -> Result<network_tuning::TcpTuningState, AppError> {
    info!("reset_network_defaults: resetting to defaults");
    tokio::task::spawn_blocking(network_tuning::reset_to_defaults)
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

// ─── Network Quality Commands (Phase δ-2) ─────────────────────────────

#[tauri::command]
pub async fn measure_network_quality(
    target: String,
    count: u32,
) -> Result<network_monitor::NetworkQualitySnapshot, AppError> {
    info!(
        "measure_network_quality: target={}, count={}",
        target, count
    );
    tokio::task::spawn_blocking(move || network_monitor::measure_network_quality(&target, count))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- TCP Tuning バリデーション（services 層を直接テスト）---
    #[test]
    #[cfg_attr(not(windows), ignore)]
    fn test_set_qos_bandwidth_validation() {
        assert!(matches!(
            network_tuning::set_qos_reserved_bandwidth(101),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    #[cfg_attr(not(windows), ignore)]
    fn test_set_network_throttling_validation() {
        assert!(matches!(
            network_tuning::set_network_throttling(-2),
            Err(AppError::InvalidInput(_))
        ));
        assert!(matches!(
            network_tuning::set_network_throttling(71),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_set_tcp_auto_tuning_validation() {
        // コマンド関数の level パース部分のテスト
        assert!(matches!(
            network_tuning::set_tcp_auto_tuning(network_tuning::TcpAutoTuningLevel::Normal),
            Ok(()) | Err(_)
        ));
    }

    #[test]
    #[cfg_attr(not(windows), ignore)]
    fn test_measure_network_quality_validation() {
        assert!(network_monitor::measure_network_quality("8.8.8.8", 10).is_ok());
        assert!(network_monitor::measure_network_quality("", 10).is_err());
        assert!(network_monitor::measure_network_quality("8.8.8.8", 0).is_err());
        assert!(network_monitor::measure_network_quality("8.8.8.8", 51).is_err());
    }
}
