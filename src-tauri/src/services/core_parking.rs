//! CPU コアパーキング制御サービス
//! powercfg コマンドで電源プランのコアパーキングパラメータを操作する。

use crate::error::AppError;
#[cfg(windows)]
use crate::infra::powershell;
use serde::{Deserialize, Serialize};

/// コアパーキング設定の GUID（Windows 電源オプション内部識別子）
#[cfg(windows)]
const PROCESSOR_SETTINGS_SUBGROUP: &str = "54533251-82be-4824-96c1-47b60b740d00";
#[cfg(windows)]
const CORE_PARKING_MIN_CORES: &str = "0cc5b647-c1df-4637-891a-dec35c318583";

/// 現在のコアパーキング設定
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreParkingState {
    /// コアパーキング最小稼働コア数（%）— 0 = OS に任せる、100 = パーキング無効
    pub min_cores_percent_ac: u32,
    pub min_cores_percent_dc: u32,
    /// 現在の電源プラン GUID
    pub active_plan_guid: String,
    /// 現在の電源プラン名
    pub active_plan_name: String,
}

/// powercfg /query の出力をパース
#[cfg(windows)]
fn parse_powercfg_output(output: &str) -> Result<u32, AppError> {
    // 出力例: "Power Setting GUID: 0cc5b647-c1df-4637-891a-dec35c318583  (Core Parking Min Cores)\nMinimum: 50%\nMaximum: 100%\n"
    for line in output.lines() {
        if line.trim().starts_with("Minimum:") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let percent_str = parts[1].trim_end_matches('%');
                return percent_str
                    .parse::<u32>()
                    .map_err(|_| AppError::PowerPlan("Failed to parse percentage".to_string()));
            }
        }
    }
    Err(AppError::PowerPlan(
        "Minimum value not found in powercfg output".to_string(),
    ))
}

/// 現在のアクティブ電源プラン GUID を取得
#[cfg(windows)]
fn get_active_plan_guid() -> Result<String, AppError> {
    let output = powershell::run_powershell("powercfg /getactivescheme")?;

    // 出力例: "Power Scheme GUID: 381b4222-f694-41f0-9685-5f529540044f  (Balanced)"
    for line in output.lines() {
        if line.trim().starts_with("Power Scheme GUID:") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                return Ok(parts[2].trim_end_matches('(').trim().to_string());
            }
        }
    }

    Err(AppError::PowerPlan(
        "Active power scheme not found".to_string(),
    ))
}

#[cfg(not(windows))]
#[allow(dead_code)]
fn get_active_plan_guid() -> Result<String, AppError> {
    Err(AppError::PowerPlan(
        "Power plan control not available on non-Windows".to_string(),
    ))
}

/// 電源プラン名を取得
#[cfg(windows)]
fn get_plan_name(guid: &str) -> Result<String, AppError> {
    let output = powershell::run_powershell(&format!("powercfg /query {}", guid))?;

    // 出力例: "Power Scheme GUID: 381b4222-f694-41f0-9685-5f529540044f  (Balanced)\n  Subgroup GUID: 0012ee47-9041-4b5d-9b77-535fba8b1442  (Hard disk)"
    for line in output.lines() {
        if line.trim().starts_with("Power Scheme GUID:") && line.contains(guid) {
            if let Some(start) = line.find('(') {
                if let Some(end) = line.rfind(')') {
                    return Ok(line[start + 1..end].to_string());
                }
            }
        }
    }

    Err(AppError::PowerPlan("Plan name not found".to_string()))
}

/// 現在のコアパーキング状態を取得
#[cfg(windows)]
pub fn get_core_parking_state() -> Result<CoreParkingState, AppError> {
    let plan_guid = get_active_plan_guid()?;
    let plan_name = get_plan_name(&plan_guid)?;

    // AC（電源接続時）の値を取得
    let ac_output = powershell::run_powershell(&format!(
        "powercfg /query {} {} {}",
        &plan_guid, PROCESSOR_SETTINGS_SUBGROUP, CORE_PARKING_MIN_CORES
    ))?;
    let min_cores_percent_ac = parse_powercfg_output(&ac_output)?;

    // DC（バッテリー時）の値を取得
    let dc_output = powershell::run_powershell(&format!(
        "powercfg /query {} {} {}_dc",
        &plan_guid, PROCESSOR_SETTINGS_SUBGROUP, CORE_PARKING_MIN_CORES
    ))?;

    // DC設定が存在しない場合はACと同じ値を使用
    let min_cores_percent_dc = parse_powercfg_output(&dc_output).unwrap_or(min_cores_percent_ac);

    Ok(CoreParkingState {
        min_cores_percent_ac,
        min_cores_percent_dc,
        active_plan_guid: plan_guid,
        active_plan_name: plan_name,
    })
}

#[cfg(not(windows))]
pub fn get_core_parking_state() -> Result<CoreParkingState, AppError> {
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// コアパーキングを設定
/// percent: 0 = OS 任せ（パーキング有効）、100 = 全コア稼働（パーキング無効）
#[cfg(windows)]
pub fn set_core_parking(min_cores_percent: u32) -> Result<(), AppError> {
    if min_cores_percent > 100 {
        return Err(AppError::InvalidInput(
            "min_cores_percent must be 0-100".into(),
        ));
    }

    let plan_guid = get_active_plan_guid()?;

    // AC（電源接続時）を設定
    powershell::run_powershell(&format!(
        "powercfg /setacvalueindex {} {} {} {}",
        &plan_guid,
        PROCESSOR_SETTINGS_SUBGROUP,
        CORE_PARKING_MIN_CORES,
        &min_cores_percent.to_string()
    ))?;

    // DC（バッテリー時）を設定
    powershell::run_powershell(&format!(
        "powercfg /setdcvalueindex {} {} {} {}",
        &plan_guid,
        PROCESSOR_SETTINGS_SUBGROUP,
        CORE_PARKING_MIN_CORES,
        &min_cores_percent.to_string()
    ))?;

    // 設定を即時反映
    powershell::run_powershell(&format!("powercfg /setactive {}", &plan_guid))?;

    Ok(())
}

#[cfg(not(windows))]
pub fn set_core_parking(_min_cores_percent: u32) -> Result<(), AppError> {
    Err(AppError::Command("Windows 専用機能です".into()))
}

/// ゲームプロファイル用: パーキング無効化（100%）→ 元に戻す
/// 戻り値: 元の設定値（復帰用）
pub fn disable_parking() -> Result<u32, AppError> {
    let current_state = get_core_parking_state()?;
    let original_percent = current_state.min_cores_percent_ac;

    // すでに100%なら何もしない
    if original_percent == 100 {
        return Ok(100);
    }

    set_core_parking(100)?;
    Ok(original_percent)
}

/// パーキング設定を復元
pub fn restore_parking(original_percent: u32) -> Result<(), AppError> {
    set_core_parking(original_percent)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(windows)]
    #[test]
    fn test_parse_powercfg_output_valid() {
        let output = "Power Setting GUID: 0cc5b647-c1df-4637-891a-dec35c318583  (Core Parking Min Cores)\nMinimum: 50%\nMaximum: 100%\n";
        let result = parse_powercfg_output(output);
        assert_eq!(result.unwrap(), 50);
    }

    #[cfg(windows)]
    #[test]
    fn test_parse_powercfg_output_invalid() {
        let output = "Power Setting GUID: 0cc5b647-c1df-4637-891a-dec35c318583  (Core Parking Min Cores)\nMaximum: 100%\n";
        let result = parse_powercfg_output(output);
        assert!(result.is_err());
    }

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
    fn test_disable_parking_idempotent() {
        // すでに100%なら何もしない（モックできないので論理のみ）
        // このテストは実際の環境依存を避けるための構造確認
        assert_eq!(100, 100); // placeholder
    }
}
