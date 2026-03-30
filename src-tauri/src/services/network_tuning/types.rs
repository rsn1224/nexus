//! ネットワーク TCP 最適化型定義

use serde::{Deserialize, Serialize};

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
#[cfg(windows)]
pub(super) const INTERFACES_KEY: &str =
    r"SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces";
#[cfg(windows)]
pub(super) const MULTIMEDIA_KEY: &str =
    r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile";
#[cfg(windows)]
pub(super) const QOS_KEY: &str = r"SOFTWARE\Policies\Microsoft\Windows\Psched";
