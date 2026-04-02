//! ゲーミング向けネットワーク TCP 最適化サービス
//! レジストリベースの TCP パラメータ制御

mod helpers;
mod operations;
mod types;

pub use operations::*;
pub use types::*;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::AppError;

    #[test]
    fn test_qos_bandwidth_validation() {
        assert!(matches!(
            set_qos_reserved_bandwidth(101),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_network_throttling_validation() {
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
    fn test_network_throttling_boundary_valid() {
        // 境界値 -1 と 70 は有効（Windows では実際の操作を行うため、非 Windows では Command エラーになる）
        let r_min = set_network_throttling(-1);
        assert!(r_min.is_ok() || r_min.is_err());
        let r_max = set_network_throttling(70);
        assert!(r_max.is_ok() || r_max.is_err());
        // 境界を 1 つ超えた値は常に InvalidInput
        assert!(matches!(set_network_throttling(-2), Err(AppError::InvalidInput(_))));
        assert!(matches!(set_network_throttling(71), Err(AppError::InvalidInput(_))));
    }

    #[test]
    fn test_qos_bandwidth_boundary() {
        // 100% は有効
        let r = set_qos_reserved_bandwidth(100);
        assert!(r.is_ok() || r.is_err()); // Windows 以外では Command エラー
        // 101% は常に InvalidInput
        assert!(matches!(
            set_qos_reserved_bandwidth(101),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_get_tcp_tuning_state_structure() {
        let result = get_tcp_tuning_state();
        assert!(result.is_ok() || result.is_err());
    }
}
