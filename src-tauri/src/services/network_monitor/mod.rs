//! リアルタイム Jitter / パケットロス監視

mod measurement;

pub use measurement::*;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkQualitySnapshot {
    /// ターゲットサーバー
    pub target: String,
    /// 平均レイテンシ（ms）
    pub avg_latency_ms: f64,
    /// Jitter（ms）
    pub jitter_ms: f64,
    /// パケットロス率（%）
    pub packet_loss_pct: f64,
    /// サンプル数
    pub sample_count: u32,
    pub timestamp: u64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use measurement::{parse_rtt_from_line, validate_ping_target};

    #[test]
    fn test_validate_ping_target() {
        assert!(validate_ping_target("8.8.8.8").is_ok());
        assert!(validate_ping_target("192.168.1.1").is_ok());
        assert!(validate_ping_target("google.com").is_ok());
        assert!(validate_ping_target("localhost").is_ok());

        assert!(validate_ping_target("").is_err());
        assert!(validate_ping_target("invalid target").is_err());
    }

    #[test]
    #[cfg_attr(not(windows), ignore)]
    fn test_count_validation() {
        assert!(measure_network_quality("8.8.8.8", 0).is_err());
        assert!(measure_network_quality("8.8.8.8", 51).is_err());
        assert!(measure_network_quality("8.8.8.8", 1).is_ok());
    }

    #[test]
    fn test_parse_rtt_from_line() {
        assert_eq!(
            parse_rtt_from_line("Reply from 8.8.8.8: bytes=32 time=12ms TTL=116"),
            Some(12.0)
        );
        assert_eq!(
            parse_rtt_from_line("Reply from 8.8.8.8: bytes=32 time=1ms TTL=116"),
            Some(1.0)
        );

        let result = parse_rtt_from_line("Reply from 8.8.8.8: bytes=32 time<1ms TTL=116");
        assert_eq!(
            result,
            Some(0.5),
            "time<1ms should be parsed as 0.5, got {:?}",
            result
        );

        assert_eq!(parse_rtt_from_line("Request timed out."), None);
        assert_eq!(parse_rtt_from_line("Invalid line"), None);
    }

    #[test]
    fn test_network_quality_snapshot_structure() {
        let snapshot = NetworkQualitySnapshot {
            target: "8.8.8.8".to_string(),
            avg_latency_ms: 12.5,
            jitter_ms: 2.3,
            packet_loss_pct: 0.0,
            sample_count: 10,
            timestamp: 1640995200,
        };

        assert_eq!(snapshot.target, "8.8.8.8");
        assert_eq!(snapshot.avg_latency_ms, 12.5);
        assert_eq!(snapshot.jitter_ms, 2.3);
        assert_eq!(snapshot.packet_loss_pct, 0.0);
        assert_eq!(snapshot.sample_count, 10);
        assert_eq!(snapshot.timestamp, 1640995200);
    }
}
