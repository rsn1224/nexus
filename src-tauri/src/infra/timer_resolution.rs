//! Windows タイマーリゾリューション制御（infra 層）
//! ntdll.dll の NtSetTimerResolution / NtQueryTimerResolution を使用。
//!
//! 単位: 100 ns（5000 = 0.5 ms, 10000 = 1 ms, 156250 = 15.625 ms）
//! Windows 11 22H2 以降はプロセスローカルの制約あり。

use tracing::{info, warn};

use crate::error::AppError;
use crate::types::game::TimerResolutionState;

type NtStatus = i32;
const STATUS_SUCCESS: NtStatus = 0;

// ntdll.dll の FFI 宣言
unsafe extern "system" {
    /// タイマーリゾリューションを設定する。
    /// desired_resolution: 要求する分解能（100 ns 単位）
    /// set_resolution: 1 = 設定, 0 = リバート
    /// current_resolution: 設定後の実際の分解能（OUT パラメータ）
    fn NtSetTimerResolution(
        desired_resolution: u32,
        set_resolution: u8,
        current_resolution: *mut u32,
    ) -> NtStatus;

    /// 現在のタイマーリゾリューション情報を問い合わせる。
    /// minimum_resolution: 最小分解能（最も粗い値 = OUT）
    /// maximum_resolution: 最大分解能（最も細かい値 = OUT）
    /// current_resolution: 現在の分解能（OUT）
    fn NtQueryTimerResolution(
        minimum_resolution: *mut u32,
        maximum_resolution: *mut u32,
        current_resolution: *mut u32,
    ) -> NtStatus;
}

/// 現在のタイマーリゾリューション情報を取得する。
pub fn query_resolution() -> Result<TimerResolutionState, AppError> {
    let mut minimum = 0u32;
    let mut maximum = 0u32;
    let mut current = 0u32;

    // SAFETY: ntdll.dll の FFI 呼び出し。OUT パラメータはすべて有効なポインタ。
    let status = unsafe { NtQueryTimerResolution(&mut minimum, &mut maximum, &mut current) };

    if status != STATUS_SUCCESS {
        return Err(AppError::Process(format!(
            "NtQueryTimerResolution 失敗: NTSTATUS 0x{:08X}",
            status
        )));
    }

    info!(
        "タイマーリゾリューション取得: current={}({} ms), min={}({} ms), max={}({} ms)",
        current,
        current as f64 / 10000.0,
        minimum,
        minimum as f64 / 10000.0,
        maximum,
        maximum as f64 / 10000.0,
    );

    Ok(TimerResolutionState {
        current_100ns: current,
        nexus_requested_100ns: None, // 呼び出し元で設定する
        default_100ns: minimum,      // 最小分解能 = Windows デフォルト（最も粗い）
        minimum_100ns: maximum,      // 注意: ntdll の命名が逆。maximum = 最も細かい = 最小値
        maximum_100ns: minimum,      // minimum = 最も粗い = 最大値
    })
}

/// タイマーリゾリューションを設定する。
/// resolution_100ns: 要求する分解能（100 ns 単位、例: 5000 = 0.5 ms）
pub fn set_resolution(resolution_100ns: u32) -> Result<TimerResolutionState, AppError> {
    // バリデーション: 0 は無効
    if resolution_100ns == 0 {
        return Err(AppError::InvalidInput(
            "タイマーリゾリューションは 0 より大きい値を指定してください".to_string(),
        ));
    }

    let mut current = 0u32;

    // SAFETY: ntdll.dll の FFI 呼び出し。OUT パラメータは有効なポインタ。
    let status = unsafe { NtSetTimerResolution(resolution_100ns, 1, &mut current) };

    if status != STATUS_SUCCESS {
        return Err(AppError::Process(format!(
            "NtSetTimerResolution 失敗: NTSTATUS 0x{:08X} (要求値: {} = {} ms)",
            status,
            resolution_100ns,
            resolution_100ns as f64 / 10000.0,
        )));
    }

    info!(
        "タイマーリゾリューション設定完了: 要求={}({} ms), 実際={}({} ms)",
        resolution_100ns,
        resolution_100ns as f64 / 10000.0,
        current,
        current as f64 / 10000.0,
    );

    // 要求値と実際値が異なる場合は警告（Windows 11 22H2+ の制約）
    if current != resolution_100ns {
        warn!(
            "タイマーリゾリューション: 要求値({})と実際値({})が異なります（Windows 11 22H2+ の制約の可能性）",
            resolution_100ns, current
        );
    }

    // 最新のフル情報を取得して返す
    let mut state = query_resolution()?;
    state.nexus_requested_100ns = Some(resolution_100ns);
    Ok(state)
}

/// タイマーリゾリューションをデフォルトに戻す。
pub fn restore_resolution() -> Result<(), AppError> {
    let mut current = 0u32;

    // SAFETY: set_resolution = 0 でリバート
    let status = unsafe { NtSetTimerResolution(0, 0, &mut current) };

    if status != STATUS_SUCCESS {
        return Err(AppError::Process(format!(
            "NtSetTimerResolution リバート失敗: NTSTATUS 0x{:08X}",
            status
        )));
    }

    info!(
        "タイマーリゾリューション リバート完了: 現在={}({} ms)",
        current,
        current as f64 / 10000.0,
    );

    Ok(())
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_resolution_rejects_zero() {
        let result = set_resolution(0);
        assert!(result.is_err());
        let err_msg = result.unwrap_err().to_string();
        assert!(
            err_msg.contains("0 より大きい"),
            "エラーメッセージが不正: {}",
            err_msg
        );
    }

    // 注意: query_resolution / set_resolution / restore_resolution の実API テストは
    // Windows 環境でのみ動作する。CI では #[cfg(target_os = "windows")] で制限する。
    #[test]
    #[cfg(target_os = "windows")]
    fn test_query_resolution_succeeds() {
        let state = query_resolution().expect("クエリに失敗");
        assert!(state.current_100ns > 0, "current が 0");
        assert!(state.minimum_100ns > 0, "minimum が 0");
        assert!(state.maximum_100ns > 0, "maximum が 0");
        // 最小 ≤ 現在 ≤ 最大
        assert!(state.minimum_100ns <= state.current_100ns);
        assert!(state.current_100ns <= state.maximum_100ns);
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn test_set_and_restore_resolution() {
        // 1 ms に設定
        let state = set_resolution(10000).expect("設定に失敗");
        assert_eq!(state.nexus_requested_100ns, Some(10000));

        // リバート
        restore_resolution().expect("リバートに失敗");

        // リバート後の状態確認
        let after = query_resolution().expect("リバート後クエリに失敗");
        // デフォルトに戻っていることを確認（完全一致は保証されないが、1 ms より大きいはず）
        assert!(
            after.current_100ns >= 10000,
            "リバート後の値が想定外: {}",
            after.current_100ns
        );
    }
}
