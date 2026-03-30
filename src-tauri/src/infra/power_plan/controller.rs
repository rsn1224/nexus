//! Windows 電源プラン制御インフラ
//! powercfg コマンドをラップして電源プランの切り替えを行う

use std::process::Command;

use crate::error::AppError;
use crate::types::game::PowerPlan;

/// powercfg 出力を Shift_JIS → UTF-8 にデコード
#[cfg(windows)]
pub(super) fn decode_powercfg(bytes: &[u8]) -> String {
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

    pub(super) const GUID_PATTERNS: &[&str] = &[
        "Power Scheme GUID:", // 英語
        "電源設定の GUID:",   // 日本語（Windows 11）
        "電源設定 GUID:",     // 日本語（旧バージョン）
        "電源スキーム GUID:", // 日本語（別バージョン）
    ];

    /// 行からGUIDを抽出する（日英対応）
    pub(super) fn extract_guid_from_line(line: &str) -> Option<&str> {
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

        for line in stdout.lines() {
            if let Some(guid) = Self::extract_guid_from_line(line) {
                let guid_str = guid.to_string();
                let guid_part = line.split(&guid_str).nth(1).unwrap_or("").trim();

                let parts: Vec<&str> = guid_part.split_whitespace().collect();
                if parts.len() >= 2 {
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
