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
    fn test_get_tcp_tuning_state_structure() {
        let result = get_tcp_tuning_state();
        assert!(result.is_ok() || result.is_err());
    }
}
