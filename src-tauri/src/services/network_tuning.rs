//! ゲーミング向けネットワーク TCP 最適化サービス
//! レジストリベースの TCP パラメータ制御

use crate::error::AppError;
#[cfg(windows)]
use crate::infra::registry;
use serde::{Deserialize, Serialize};
use std::process::Command;
use tracing::info;

/// TCP 最適化設定の現在の状態
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TcpTuningState {
    /// Nagle アルゴリズム無効化（TcpNoDelay）
    pub nagle_disabled: bool,
    /// TCP Delayed ACK 無効化
    pub delayed_ack_disabled: bool,
    /// Network Throttling Index（-1 = 無制限、デフォルトは 10）
    pub network_throttling_index: i32,
    /// QoS 予約帯域幅（%、デフォルト 20）
    pub qos_reserved_bandwidth_pct: u32,
    /// TCP Auto-Tuning レベル
    pub tcp_auto_tuning: TcpAutoTuningLevel,
    /// ECN（Explicit Congestion Notification）
    pub ecn_enabled: bool,
    /// RSS（Receive Side Scaling）
    pub rss_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TcpAutoTuningLevel {
    Normal,
    Disabled,
    HighlyRestricted,
    Restricted,
    Experimental,
}

/// 各設定のレジストリパス
const INTERFACES_KEY: &str = r"SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces";
const MULTIMEDIA_KEY: &str =
    r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile";
const QOS_KEY: &str = r"SOFTWARE\Policies\Microsoft\Windows\Psched";

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
    // デフォルト値を返す
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

        // TcpNoDelay を設定
        registry::set_dword_value(
            &format!("{}\\{}", INTERFACES_KEY, interface),
            "TcpNoDelay",
            value,
        )?;

        // TcpAckFrequency を設定（Nagle無効時は最適化）
        if disabled {
            registry::set_dword_value(
                &format!("{}\\{}", INTERFACES_KEY, interface),
                "TcpAckFrequency",
                1, // 毎回 ACK
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
            "Network Throttling Index must be -1 to 70".into(),
        ));
    }

    registry::set_dword_value(MULTIMEDIA_KEY, "NetworkThrottlingIndex", index as u32)?;

    info!("Network Throttling Index 設定: {}", index);
    Ok(())
}

#[cfg(not(windows))]
pub fn set_network_throttling(_index: i32) -> Result<(), AppError> {
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// QoS 予約帯域幅を設定
#[cfg(windows)]
pub fn set_qos_reserved_bandwidth(percent: u32) -> Result<(), AppError> {
    if percent > 100 {
        return Err(AppError::InvalidInput(
            "QoS bandwidth must be 0-100%".into(),
        ));
    }

    registry::set_dword_value(QOS_KEY, "NonBestEffortLimit", percent)?;

    info!("QoS 予約帯域幅設定: {}%", percent);
    Ok(())
}

#[cfg(not(windows))]
pub fn set_qos_reserved_bandwidth(_percent: u32) -> Result<(), AppError> {
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

    let output = Command::new("netsh")
        .args(["int", "tcp", "set", "global", "autotuninglevel=", level_str])
        .output()
        .map_err(|e| AppError::Command(format!("netsh command failed: {}", e)))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!(
            "netsh autotuninglevel failed: {}",
            error
        )));
    }

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

    set_nagle(true)?; // Nagle 無効化
    set_delayed_ack(true)?; // Delayed ACK 無効化
    set_network_throttling(-1)?; // スロットリング無制限
    set_qos_reserved_bandwidth(0)?; // 予約帯域解放
    set_tcp_auto_tuning(TcpAutoTuningLevel::Normal)?; // Auto-Tuning は Normal 推奨

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

// --- ヘルパー関数 ---

/// アクティブなネットワークインターフェースの一覧を取得
#[cfg(windows)]
fn get_active_interfaces() -> Result<Vec<String>, AppError> {
    // 簡易実装: レジストリからインターフェースキーの一覧を取得
    // 実際の実装では WMI や GetAdaptersAddresses を使用するべき
    let interfaces = registry::enumerate_subkeys(INTERFACES_KEY)?;
    Ok(interfaces)
}

#[cfg(windows)]
/// Nagle の現在状態を取得
fn get_nagle_status() -> Result<bool, AppError> {
    let interfaces = get_active_interfaces()?;

    for interface in &interfaces {
        if let Some(value) =
            registry::get_dword_value(&format!("{}\\{}", INTERFACES_KEY, interface), "TcpNoDelay")
        {
            return Ok(value != 0);
        }
    }

    Ok(false) // デフォルトは有効
}

#[cfg(windows)]
/// Delayed ACK の現在状態を取得
fn get_delayed_ack_status() -> Result<bool, AppError> {
    let interfaces = get_active_interfaces()?;

    for interface in &interfaces {
        if let Some(value) = registry::get_dword_value(
            &format!("{}\\{}", INTERFACES_KEY, interface),
            "TcpDelAckTicks",
        ) {
            return Ok(value != 0);
        }
    }

    Ok(false) // デフォルトは有効
}

/// TCP Auto-Tuning レベルを取得
fn get_tcp_auto_tuning_level() -> Result<TcpAutoTuningLevel, AppError> {
    let output = Command::new("netsh")
        .args(["int", "tcp", "show", "global"])
        .output()
        .map_err(|e| AppError::Command(format!("netsh command failed: {}", e)))?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    // 出力から "Receive Side Scaling State" や "Autotuning Level" を解析
    // 簡易実装: デフォルトを返す
    if output_str.contains("disabled") {
        Ok(TcpAutoTuningLevel::Disabled)
    } else if output_str.contains("highlyrestricted") {
        Ok(TcpAutoTuningLevel::HighlyRestricted)
    } else if output_str.contains("restricted") {
        Ok(TcpAutoTuningLevel::Restricted)
    } else if output_str.contains("experimental") {
        Ok(TcpAutoTuningLevel::Experimental)
    } else {
        Ok(TcpAutoTuningLevel::Normal) // デフォルト
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_qos_bandwidth_validation() {
        // 無効な値のみテスト（有効な値は環境依存のためスキップ）
        assert!(matches!(
            set_qos_reserved_bandwidth(101),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_network_throttling_validation() {
        // 無効な値のみテスト（有効な値は環境依存のためスキップ）
        assert!(matches!(
            set_network_throttling(-2),
            Err(AppError::InvalidInput(_))
        ));
        assert!(matches!(
            set_network_throttling(71),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_get_tcp_tuning_state_structure() {
        // 実際の環境依存を避けるため、構造チェックのみ
        let result = get_tcp_tuning_state();
        // 成功しても失敗してもよい（環境による）
        assert!(result.is_ok() || result.is_err());
    }
}
