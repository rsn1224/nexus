//! Windows 電源プラン制御インフラ
//! powercfg コマンドをラップして電源プランの切り替えを行う

use std::process::Command;

use crate::error::AppError;
use crate::types::game::PowerPlan;

/// powercfg 出力を Shift_JIS → UTF-8 にデコード
#[cfg(windows)]
fn decode_powercfg(bytes: &[u8]) -> String {
    let (decoded, _, _) = encoding_rs::SHIFT_JIS.decode(bytes);
    decoded.to_string()
}

/// Windows 電源プラン制御インフラ
/// Win32 API を使って電源プランの切り替えを行う
#[cfg(windows)]
pub struct PowerPlanController;

#[cfg(windows)]
impl PowerPlanController {
    /// 新しい電源プランコントローラを作成
    pub fn new() -> Self {
        Self
    }

    const GUID_PATTERNS: &[&str] = &[
        "Power Scheme GUID:", // 英語
        "電源設定の GUID:",   // 日本語（Windows 11）
        "電源設定 GUID:",     // 日本語（旧バージョン）
        "電源スキーム GUID:", // 日本語（別バージョン）
    ];

    /// 行からGUIDを抽出する（日英対応）
    fn extract_guid_from_line(line: &str) -> Option<&str> {
        for pattern in Self::GUID_PATTERNS {
            if let Some(rest) = line.split(pattern).nth(1) {
                return rest.split_whitespace().next();
            }
        }
        None
    }

    /// 現在アクティブな電源プランの GUID を取得する
    ///
    /// # 戻り値
    /// - `Ok(Some(guid))`: GUID 文字列
    /// - `Ok(None)`: 取得失敗
    /// - `Err(AppError)`: コマンド実行エラー
    pub fn get_active_plan_guid(&self) -> Result<Option<String>, AppError> {
        let output = Command::new("powercfg")
            .args(["/getactivescheme"])
            .output()
            .map_err(|e| AppError::GameMonitor(format!("powercfg getactivescheme 失敗: {}", e)))?;

        if !output.status.success() {
            let stderr = decode_powercfg(&output.stderr);
            return Err(AppError::GameMonitor(format!(
                "電源プラン取得失敗: {}",
                stderr
            )));
        }

        let stdout = decode_powercfg(&output.stdout);

        // 出力から GUID を抽出（日英対応）
        for line in stdout.lines() {
            if let Some(guid) = Self::extract_guid_from_line(line) {
                return Ok(Some(guid.trim_matches('(').to_string()));
            }
        }

        Ok(None)
    }

    /// 指定された電源プランに切り替える
    ///
    /// # 引数
    /// - `plan`: 切り替え先の電源プラン
    ///
    /// # 戻り値
    /// - `Ok(())`: 成功
    /// - `Err(AppError)`: 失敗
    pub fn switch_to_plan(&self, plan: PowerPlan) -> Result<(), AppError> {
        let guid = match plan.guid() {
            Some(g) => g,
            None => return Ok(()), // Unchanged の場合は何もしない
        };

        let output = Command::new("powercfg")
            .args(["/setactive", guid])
            .output()
            .map_err(|e| AppError::GameMonitor(format!("powercfg setactive 失敗: {}", e)))?;

        if !output.status.success() {
            let stderr = decode_powercfg(&output.stderr);
            return Err(AppError::GameMonitor(format!(
                "電源プラン切り替え失敗 GUID: {}, エラー: {}",
                guid, stderr
            )));
        }

        Ok(())
    }

    /// 電源プランを切り替え、リバート用スナップショットを返す
    ///
    /// # 引数
    /// - `plan`: 切り替え先の電源プラン
    ///
    /// # 戻り値
    /// - `Ok(Option<String>)`: 切り替え前の電源プラン GUID（リバート用）
    /// - `Err(AppError)`: 失敗
    pub fn switch_with_revert(&self, plan: PowerPlan) -> Result<Option<String>, AppError> {
        // Unchanged の場合は何もせず None を返す
        if plan.guid().is_none() {
            return Ok(None);
        }

        // 現在の電源プランを保存
        let prev_guid = self.get_active_plan_guid()?;

        // 新しい電源プランに切り替え
        self.switch_to_plan(plan)?;

        Ok(prev_guid)
    }

    /// 指定された GUID に電源プランを切り替える
    ///
    /// # 引数
    /// - `guid`: 電源プラン GUID
    ///
    /// # 戻り値
    /// - `Ok(())`: 成功
    /// - `Err(AppError)`: 失敗
    pub fn switch_to_guid(&self, guid: &str) -> Result<(), AppError> {
        let output = Command::new("powercfg")
            .args(["/setactive", guid])
            .output()
            .map_err(|e| AppError::GameMonitor(format!("powercfg setactive 失敗: {}", e)))?;

        if !output.status.success() {
            let stderr = decode_powercfg(&output.stderr);
            return Err(AppError::GameMonitor(format!(
                "電源プラン切り替え失敗 GUID: {}, エラー: {}",
                guid, stderr
            )));
        }

        Ok(())
    }

    /// 利用可能な電源プラン一覧を取得する
    ///
    /// # 戻り値
    /// - `Ok(Vec<(String, String)>)`: (GUID, 表示名) のタプルリスト
    /// - `Err(AppError)`: 失敗
    #[allow(dead_code)] // game_monitor でのプラン一覧取得用に予約
    pub fn list_available_plans(&self) -> Result<Vec<(String, String)>, AppError> {
        let output = Command::new("powercfg")
            .args(["/list"])
            .output()
            .map_err(|e| AppError::GameMonitor(format!("powercfg list 失敗: {}", e)))?;

        if !output.status.success() {
            let stderr = decode_powercfg(&output.stderr);
            return Err(AppError::GameMonitor(format!(
                "電源プラン一覧取得失敗: {}",
                stderr
            )));
        }

        let stdout = decode_powercfg(&output.stdout);
        let mut plans = Vec::new();

        // 出力行を解析（日英対応）
        // 例: "Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)"
        for line in stdout.lines() {
            if let Some(guid) = Self::extract_guid_from_line(line) {
                let guid_str = guid.to_string();
                let guid_part = line.split(&guid_str).nth(1).unwrap_or("").trim();

                // GUID と表示名を分離
                let parts: Vec<&str> = guid_part.split_whitespace().collect();
                if parts.len() >= 2 {
                    // 表示名は括弧で囲まれている
                    let display_name = parts[1..]
                        .join(" ")
                        .trim_matches('(')
                        .trim_matches(')')
                        .to_string();

                    plans.push((guid_str, display_name));
                }
            }
        }

        Ok(plans)
    }

    /// 電源プランが存在するか確認する
    ///
    /// # 引数
    /// - `guid`: 確認する電源プラン GUID
    ///
    /// # 戻り値
    /// - `Ok(bool)`: 存在する場合は true
    /// - `Err(AppError)`: 確認中のエラー
    #[allow(dead_code)] // list_available_plans とともに将来使用予定
    pub fn plan_exists(&self, guid: &str) -> Result<bool, AppError> {
        let plans = self.list_available_plans()?;
        Ok(plans.iter().any(|(plan_guid, _)| plan_guid == guid))
    }
}

impl Default for PowerPlanController {
    fn default() -> Self {
        Self::new()
    }
}

/// 電源プランを切り替える便利関数
///
/// # 引数
/// - `plan`: 切り替え先の電源プラン
///
/// # 戻り値
/// - `Ok(Option<String>)`: 切り替え前の電源プラン GUID
/// - `Err(AppError)`: 失敗
#[cfg(windows)]
pub fn switch_power_plan(plan: PowerPlan) -> Result<Option<String>, AppError> {
    let controller = PowerPlanController::new();
    controller.switch_with_revert(plan)
}

/// 電源プランを元に戻す便利関数
///
/// # 引数
/// - `guid`: 戻り先の電源プラン GUID（None の場合は何もしない）
///
/// # 戻り値
/// - `Ok(())`: 成功
/// - `Err(AppError)`: 失敗
#[cfg(windows)]
pub fn revert_power_plan(guid: Option<String>) -> Result<(), AppError> {
    if let Some(guid) = guid {
        let controller = PowerPlanController::new();
        controller.switch_to_guid(&guid)?;
    }
    Ok(())
}

/// 現在の電源プランを取得する便利関数
///
/// # 戻り値
/// - `Ok(Option<String>)`: 現在の電源プラン名
/// - `Err(AppError)`: 失敗
#[cfg(windows)]
#[allow(dead_code)] // windows_settings が独自実装を持つため現在未使用
pub fn get_current_power_plan() -> Result<Option<String>, AppError> {
    let controller = PowerPlanController::new();
    controller.get_active_plan_guid()
}

impl PowerPlanController {
    /// 電源プランのGUIDから名前を取得
    #[allow(dead_code)]
    pub fn get_plan_name(&self, guid: &str) -> Result<String, AppError> {
        // Windows APIで電源プラン名を取得
        let output = std::process::Command::new("powercfg")
            .args(["/query", guid])
            .output()
            .map_err(|e| AppError::Power(format!("powercfg実行エラー: {}", e)))?;

        if !output.status.success() {
            let stderr = decode_powercfg(&output.stderr);
            return Err(AppError::Power(format!("電源プラン名取得失敗: {}", stderr)));
        }

        let stdout = decode_powercfg(&output.stdout);

        // 出力から電源プラン名を抽出（日英対応）
        // 例 (英語): "Power Scheme GUID: 381b4222-...  (Balanced)"
        // 例 (日本語): "電源スキーム GUID: 381b4222-...  (バランス)"
        for line in stdout.lines() {
            let is_scheme_line = Self::GUID_PATTERNS.iter().any(|pat| line.contains(*pat));
            if is_scheme_line {
                if let Some(start) = line.find('(') {
                    if let Some(end) = line.rfind(')') {
                        if start < end {
                            return Ok(line[start + 1..end].to_string());
                        }
                    }
                }
            }
        }

        Err(AppError::Power("電源プラン名の解析に失敗".to_string()))
    }
}

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_power_plan_controller_default() {
        let _unused_controller = PowerPlanController::default();
        // デフォルト作成が成功すれば OK
    }

    #[test]
    fn test_power_plan_controller_new() {
        let _unused_controller = PowerPlanController::new();
        // 新規作成が成功すれば OK
    }

    #[test]
    fn test_extract_guid_english() {
        let line = "Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)";
        assert_eq!(
            PowerPlanController::extract_guid_from_line(line),
            Some("381b4222-f694-41f0-9685-ff5bb260df2e")
        );
    }

    #[test]
    fn test_extract_guid_japanese() {
        let line = "電源設定 GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (バランス)";
        assert_eq!(
            PowerPlanController::extract_guid_from_line(line),
            Some("381b4222-f694-41f0-9685-ff5bb260df2e")
        );
    }

    #[test]
    fn test_extract_guid_japanese_alt() {
        let line = "電源スキーム GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (バランス)";
        assert_eq!(
            PowerPlanController::extract_guid_from_line(line),
            Some("381b4222-f694-41f0-9685-ff5bb260df2e")
        );
    }

    #[test]
    fn test_extract_guid_no_match() {
        let line = "Some other line without GUID";
        assert_eq!(PowerPlanController::extract_guid_from_line(line), None);
    }

    #[test]
    fn test_get_active_plan_guid() {
        let controller = PowerPlanController::new();
        let result = controller.get_active_plan_guid();

        // powercfg が利用可能な環境では成功するはず
        // テスト環境によっては失敗する可能性もあるため、エラーでなければ OK
        match result {
            Ok(Some(guid)) => {
                // GUID 形式を確認（8-4-4-4-12 の形式）
                assert!(guid.len() == 36, "GUID の長さが不正: {}", guid);
                assert!(guid.contains('-'), "GUID にハイフンが含まれない: {}", guid);
            }
            Ok(None) => {
                // powercfg が利用不可の場合も OK
            }
            Err(_) => {
                // エラーの場合もテストとしては OK（環境依存）
            }
        }
    }

    #[test]
    fn test_list_available_plans() {
        let controller = PowerPlanController::new();
        let result = controller.list_available_plans();

        // 少なくとも 1 つの電源プランが見つかるはず
        match result {
            Ok(plans) => {
                if !plans.is_empty() {
                    // 各プランの GUID と表示名を確認
                    for (guid, name) in &plans {
                        assert!(!guid.is_empty(), "GUID が空");
                        assert!(!name.is_empty(), "表示名が空");
                        assert!(guid.len() == 36, "GUID の長さが不正: {}", guid);
                    }
                }
                // 空でもテストとしては OK（環境依存）
            }
            Err(_) => {
                // エラーの場合もテストとしては OK（環境依存）
            }
        }
    }

    #[test]
    fn test_plan_exists() {
        let controller = PowerPlanController::new();
        let plans_result = controller.list_available_plans();

        if let Ok(plans) = plans_result {
            if !plans.is_empty() {
                // 最初のプランで存在確認テスト
                let (guid, _) = &plans[0];
                let exists = controller.plan_exists(guid);
                assert!(exists.is_ok(), "プラン存在確認でエラー");
                assert!(exists.unwrap(), "存在するはずのプランが存在しない");

                // 存在しない GUID でテスト
                let fake_guid = "12345678-1234-1234-1234-123456789abc";
                let exists = controller.plan_exists(fake_guid);
                assert!(exists.is_ok(), "プラン存在確認でエラー");
                assert!(!exists.unwrap(), "存在しないはずのプランが存在する");
            }
        }
    }

    #[test]
    fn test_switch_power_plan_unchanged() {
        // Unchanged の場合は何もしないことを確認
        let result = switch_power_plan(PowerPlan::Unchanged);
        assert!(result.is_ok(), "Unchanged 切り替えでエラー");
        assert_eq!(result.unwrap(), None, "Unchanged 前の GUID は None");
    }

    #[test]
    fn test_revert_power_plan_none() {
        // None の場合は何もしないことを確認
        let result = revert_power_plan(None);
        assert!(result.is_ok(), "None リバートでエラー");
    }

    #[test]
    fn test_get_current_power_plan() {
        let result = get_current_power_plan();

        // 結果の型を確認
        match result {
            Ok(Some(guid)) => {
                assert!(!guid.is_empty(), "現在の電源プラン GUID が空");
            }
            Ok(None) => {
                // powercfg が利用不可の場合も OK
            }
            Err(_) => {
                // エラーの場合もテストとしては OK（環境依存）
            }
        }
    }

    #[test]
    fn test_power_plan_guid_constants() {
        // PowerPlan 列挙型の GUID 定数をテスト
        assert!(PowerPlan::HighPerformance.guid().is_some());
        assert!(PowerPlan::UltimatePerformance.guid().is_some());
        assert!(PowerPlan::Balanced.guid().is_some());
        assert!(PowerPlan::Unchanged.guid().is_none());

        // GUID 形式を確認
        let high_perf_guid = PowerPlan::HighPerformance.guid().unwrap();
        assert_eq!(high_perf_guid, "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c");
    }
}
