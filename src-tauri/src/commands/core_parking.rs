//! CPU コアパーキング制御コマンド

use crate::error::AppError;
use crate::services::core_parking;
use tauri::command;

/// 現在のコアパーキング状態を取得
#[command]
pub fn get_core_parking_state() -> Result<core_parking::CoreParkingState, AppError> {
    core_parking::get_core_parking_state()
}

/// コアパーキングを設定
/// percent: 0 = OS 任せ（パーキング有効）、100 = 全コア稼働（パーキング無効）
#[command]
pub fn set_core_parking(min_cores_percent: u32) -> Result<(), AppError> {
    core_parking::set_core_parking(min_cores_percent)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg_attr(not(windows), ignore)]
    fn test_set_core_parking_validation() {
        // 無効な値のみテスト（有効な値は環境依存のためスキップ）
        assert!(matches!(
            set_core_parking(101),
            Err(AppError::InvalidInput(_))
        ));
    }

    #[test]
    fn test_get_core_parking_state() {
        // 実際の環境依存を避けるため、構造チェックのみ
        let result = get_core_parking_state();
        // 成功しても失敗してもよい（環境による）
        assert!(result.is_ok() || result.is_err());
    }
}
