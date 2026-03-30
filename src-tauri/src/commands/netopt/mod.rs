mod adapter_dns;
mod tcp_tuning;
mod types;

pub use adapter_dns::*;
pub use tcp_tuning::*;
pub use types::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ping_result_serialization() {
        let result = PingResult {
            target: "8.8.8.8".to_string(),
            latency_ms: Some(12),
            success: true,
        };

        let serialized = serde_json::to_string(&result).unwrap();
        let deserialized: PingResult = serde_json::from_str(&serialized).unwrap();

        assert_eq!(result.target, deserialized.target);
        assert_eq!(result.latency_ms, deserialized.latency_ms);
        assert_eq!(result.success, deserialized.success);
    }

    // --- set_dns バリデーション ---
    #[test]
    fn test_validate_ipv4_valid() {
        assert!(validate_ipv4("8.8.8.8").is_ok());
        assert!(validate_ipv4("192.168.1.1").is_ok());
        assert!(validate_ipv4("0.0.0.0").is_ok());
        assert!(validate_ipv4("255.255.255.255").is_ok());
    }

    #[test]
    fn test_validate_ipv4_invalid() {
        assert!(validate_ipv4("").is_err());
        assert!(validate_ipv4("not-an-ip").is_err());
        assert!(validate_ipv4("256.1.1.1").is_err());
        assert!(validate_ipv4("1.2.3").is_err());
        assert!(validate_ipv4("; rm -rf /").is_err());
        assert!(validate_ipv4("8.8.8.8; whoami").is_err());
    }

    #[test]
    fn test_validate_adapter_name_valid() {
        assert!(validate_adapter_name("Ethernet").is_ok());
        assert!(validate_adapter_name("Wi-Fi").is_ok());
        assert!(validate_adapter_name("イーサネット").is_ok());
        assert!(validate_adapter_name("Local Area Connection 2").is_ok());
    }

    #[test]
    fn test_validate_adapter_name_injection() {
        assert!(validate_adapter_name("eth0; whoami").is_err());
        assert!(validate_adapter_name("eth0 | cat /etc/passwd").is_err());
        assert!(validate_adapter_name("eth0 & dir").is_err());
        assert!(validate_adapter_name("").is_err());
    }

    // --- ping_host バリデーション ---
    #[test]
    fn test_validate_ping_target_valid() {
        assert!(validate_ping_target("8.8.8.8").is_ok());
        assert!(validate_ping_target("google.com").is_ok());
        assert!(validate_ping_target("sub.domain.example.com").is_ok());
    }

    #[test]
    fn test_validate_ping_target_invalid() {
        assert!(validate_ping_target("").is_err());
        assert!(validate_ping_target("; whoami").is_err());
        assert!(validate_ping_target("google.com; ls").is_err());
        assert!(validate_ping_target("test space.com").is_err());
    }
}
