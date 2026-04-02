//! TCP 最適化の設定・取得操作

use crate::error::AppError;
#[cfg(windows)]
use crate::infra::registry;
#[cfg(windows)]
use tracing::{info, warn};

use super::types::*;

#[cfg(windows)]
use super::helpers::*;

/// 現在の TCP 最適化状態を取得
#[cfg(windows)]
pub fn get_tcp_tuning_state() -> Result<TcpTuningState, AppError> {
    // Nagle/Delayed ACK - 最初の有効なインターフェースから取得
    let nagle_disabled = get_nagle_status()?;
    let delayed_ack_disabled = get_delayed_ack_status()?;

    // Network Throttling Index
    let network_throttling_index =
        registry::get_dword_value(MULTIMEDIA_KEY, "NetworkThrottlingIndex").unwrap_or(10);

    // QoS 予約帯域幅
    let qos_reserved_bandwidth_pct =
        registry::get_dword_value(QOS_KEY, "NonBestEffortLimit").unwrap_or(20);

    // TCP Auto-Tuning レベル
    let tcp_auto_tuning = get_tcp_auto_tuning_level()?;

    // ECN/RSS はデフォルト値を返す（実際の取得は複雑なため）
    let ecn_enabled = false;
    let rss_enabled = true;

    Ok(TcpTuningState {
        nagle_disabled,
        delayed_ack_disabled,
        network_throttling_index: network_throttling_index as i32,
        qos_reserved_bandwidth_pct,
        tcp_auto_tuning,
        ecn_enabled,
        rss_enabled,
    })
}

#[cfg(not(windows))]
pub fn get_tcp_tuning_state() -> Result<TcpTuningState, AppError> {
    Ok(TcpTuningState {
        nagle_disabled: false,
        delayed_ack_disabled: false,
        network_throttling_index: 10,
        qos_reserved_bandwidth_pct: 20,
        tcp_auto_tuning: TcpAutoTuningLevel::Normal,
        ecn_enabled: false,
        rss_enabled: true,
    })
}

/// Nagle アルゴリズムを無効化（全アクティブインターフェースに対して）
#[cfg(windows)]
pub fn set_nagle(disabled: bool) -> Result<(), AppError> {
    let interfaces = get_active_interfaces()?;

    for interface in &interfaces {
        let value = if disabled { 1u32 } else { 0u32 };

        registry::set_dword_value(
            &format!("{}\\{}", INTERFACES_KEY, interface),
            "TcpNoDelay",
            value,
        )?;

        if disabled {
            registry::set_dword_value(
                &format!("{}\\{}", INTERFACES_KEY, interface),
                "TcpAckFrequency",
                1,
            )?;
        }
    }

    info!("Nagle アルゴリズム設定: disabled={}", disabled);
    Ok(())
}

#[cfg(not(windows))]
pub fn set_nagle(_disabled: bool) -> Result<(), AppError> {
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// TCP Delayed ACK を無効化
#[cfg(windows)]
pub fn set_delayed_ack(disabled: bool) -> Result<(), AppError> {
    let interfaces = get_active_interfaces()?;

    for interface in &interfaces {
        let value = if disabled { 1u32 } else { 0u32 };

        registry::set_dword_value(
            &format!("{}\\{}", INTERFACES_KEY, interface),
            "TcpDelAckTicks",
            value,
        )?;
    }

    info!("TCP Delayed ACK 設定: disabled={}", disabled);
    Ok(())
}

#[cfg(not(windows))]
pub fn set_delayed_ack(_disabled: bool) -> Result<(), AppError> {
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// Network Throttling Index を設定
#[cfg(windows)]
pub fn set_network_throttling(index: i32) -> Result<(), AppError> {
    if !(-1..=70).contains(&index) {
        return Err(AppError::InvalidInput(
            "Network Throttling Index は -1〜70 の範囲で指定してください".into(),
        ));
    }

    registry::set_dword_value(MULTIMEDIA_KEY, "NetworkThrottlingIndex", index as u32)?;

    info!("Network Throttling Index 設定: {}", index);
    Ok(())
}

#[cfg(not(windows))]
pub fn set_network_throttling(index: i32) -> Result<(), AppError> {
    if !(-1..=70).contains(&index) {
        return Err(AppError::InvalidInput(
            "Network Throttling Index は -1〜70 の範囲で指定してください".into(),
        ));
    }
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// QoS 予約帯域幅を設定
#[cfg(windows)]
pub fn set_qos_reserved_bandwidth(percent: u32) -> Result<(), AppError> {
    if percent > 100 {
        return Err(AppError::InvalidInput(
            "QoS 帯域幅は 0〜100% の範囲で指定してください".into(),
        ));
    }

    if let Err(e) = registry::set_dword_value(QOS_KEY, "NonBestEffortLimit", percent) {
        warn!(
            "QoS レジストリ書き込み失敗（管理者権限が必要な場合があります）: {}",
            e
        );
        return Err(AppError::Command(
            "QoS 設定の変更には管理者権限が必要です。アプリを管理者として実行してください。".into(),
        ));
    }

    info!("QoS 予約帯域幅設定: {}%", percent);
    Ok(())
}

#[cfg(not(windows))]
pub fn set_qos_reserved_bandwidth(percent: u32) -> Result<(), AppError> {
    if percent > 100 {
        return Err(AppError::InvalidInput(
            "QoS 帯域幅は 0〜100% の範囲で指定してください".into(),
        ));
    }
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// TCP Auto-Tuning レベルを設定
#[cfg(windows)]
pub fn set_tcp_auto_tuning(level: TcpAutoTuningLevel) -> Result<(), AppError> {
    let level_str = match level {
        TcpAutoTuningLevel::Normal => "normal",
        TcpAutoTuningLevel::Disabled => "disabled",
        TcpAutoTuningLevel::HighlyRestricted => "highlyrestricted",
        TcpAutoTuningLevel::Restricted => "restricted",
        TcpAutoTuningLevel::Experimental => "experimental",
    };

    crate::infra::netsh::run_netsh(&[
        "int",
        "tcp",
        "set",
        "global",
        "autotuninglevel=",
        level_str,
    ])?;

    info!("TCP Auto-Tuning 設定: {:?}", level);
    Ok(())
}

#[cfg(not(windows))]
pub fn set_tcp_auto_tuning(_level: TcpAutoTuningLevel) -> Result<(), AppError> {
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// ゲーミング最適化プリセットを一括適用
#[cfg(windows)]
pub fn apply_gaming_preset() -> Result<TcpTuningState, AppError> {
    info!("ゲーミングネットワーク最適化プリセット適用開始");

    set_nagle(true)?;
    set_delayed_ack(true)?;
    set_network_throttling(-1)?;
    set_qos_reserved_bandwidth(0)?;
    set_tcp_auto_tuning(TcpAutoTuningLevel::Normal)?;

    let state = get_tcp_tuning_state()?;
    info!("ゲーミングプリセット適用完了");
    Ok(state)
}

#[cfg(not(windows))]
pub fn apply_gaming_preset() -> Result<TcpTuningState, AppError> {
    get_tcp_tuning_state()
}

/// デフォルト設定にリセット
#[cfg(windows)]
pub fn reset_to_defaults() -> Result<TcpTuningState, AppError> {
    info!("ネットワーク設定をデフォルトにリセット");

    set_nagle(false)?;
    set_delayed_ack(false)?;
    set_network_throttling(10)?;
    set_qos_reserved_bandwidth(20)?;
    set_tcp_auto_tuning(TcpAutoTuningLevel::Normal)?;

    let state = get_tcp_tuning_state()?;
    info!("デフォルト設定へのリセット完了");
    Ok(state)
}

#[cfg(not(windows))]
pub fn reset_to_defaults() -> Result<TcpTuningState, AppError> {
    get_tcp_tuning_state()
}
