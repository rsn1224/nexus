//! TCP 最適化ヘルパー関数（Windows 専用）

#[cfg(windows)]
use crate::error::AppError;
#[cfg(windows)]
use crate::infra::registry;
#[cfg(windows)]
use std::process::Command;

#[cfg(windows)]
use super::types::*;

#[cfg(windows)]
pub(super) fn get_active_interfaces() -> Result<Vec<String>, AppError> {
    let interfaces = registry::enumerate_subkeys(INTERFACES_KEY)?;
    Ok(interfaces)
}

#[cfg(windows)]
pub(super) fn get_nagle_status() -> Result<bool, AppError> {
    let interfaces = get_active_interfaces()?;

    for interface in &interfaces {
        if let Some(value) =
            registry::get_dword_value(&format!("{}\\{}", INTERFACES_KEY, interface), "TcpNoDelay")
        {
            return Ok(value != 0);
        }
    }

    Ok(false)
}

#[cfg(windows)]
pub(super) fn get_delayed_ack_status() -> Result<bool, AppError> {
    let interfaces = get_active_interfaces()?;

    for interface in &interfaces {
        if let Some(value) = registry::get_dword_value(
            &format!("{}\\{}", INTERFACES_KEY, interface),
            "TcpDelAckTicks",
        ) {
            return Ok(value != 0);
        }
    }

    Ok(false)
}

#[cfg(windows)]
pub(super) fn get_tcp_auto_tuning_level() -> Result<TcpAutoTuningLevel, AppError> {
    let output = Command::new("netsh")
        .args(["int", "tcp", "show", "global"])
        .output()
        .map_err(|e| AppError::Command(format!("netsh command failed: {}", e)))?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    if output_str.contains("disabled") {
        Ok(TcpAutoTuningLevel::Disabled)
    } else if output_str.contains("highlyrestricted") {
        Ok(TcpAutoTuningLevel::HighlyRestricted)
    } else if output_str.contains("restricted") {
        Ok(TcpAutoTuningLevel::Restricted)
    } else if output_str.contains("experimental") {
        Ok(TcpAutoTuningLevel::Experimental)
    } else {
        Ok(TcpAutoTuningLevel::Normal)
    }
}
