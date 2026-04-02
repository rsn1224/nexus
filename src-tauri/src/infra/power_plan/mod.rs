//! Windows 電源プラン制御インフラ
//! powercfg コマンドをラップして電源プランの切り替えを行う

mod controller;
mod helpers;

pub use controller::PowerPlanController;
pub use helpers::*;

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::game::PowerPlan;

    #[test]
    fn test_power_plan_controller_default() {
        let _unused_controller = PowerPlanController {};
    }

    #[test]
    fn test_power_plan_controller_new() {
        let _unused_controller = PowerPlanController::new();
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

        match result {
            Ok(Some(guid)) => {
                assert!(guid.len() == 36, "GUID の長さが不正: {}", guid);
                assert!(guid.contains('-'), "GUID にハイフンが含まれない: {}", guid);
            }
            Ok(None) => {}
            Err(_) => {}
        }
    }

    #[test]
    fn test_list_available_plans() {
        let controller = PowerPlanController::new();
        let result = controller.list_available_plans();

        if let Ok(plans) = result {
            if !plans.is_empty() {
                for (guid, name) in &plans {
                    assert!(!guid.is_empty(), "GUID が空");
                    assert!(!name.is_empty(), "表示名が空");
                    assert!(guid.len() == 36, "GUID の長さが不正: {}", guid);
                }
            }
        }
    }

    #[test]
    fn test_plan_exists() {
        let controller = PowerPlanController::new();
        let plans_result = controller.list_available_plans();

        if let Ok(plans) = plans_result {
            if !plans.is_empty() {
                let (guid, _) = &plans[0];
                let exists = controller.plan_exists(guid);
                assert!(exists.is_ok(), "プラン存在確認でエラー");

                if let Ok(exists_bool) = exists {
                    if !exists_bool {
                        println!("Warning: Expected plan to exist but it doesn't");
                    }
                }

                let fake_guid = "12345678-1234-1234-1234-123456789abc";
                let exists = controller.plan_exists(fake_guid);
                assert!(exists.is_ok(), "プラン存在確認でエラー");
                assert!(!exists.unwrap(), "存在しないはずのプランが存在する");
            } else {
                println!("No power plans available for testing");
            }
        }
    }

    #[test]
    fn test_switch_power_plan_unchanged() {
        let result = switch_power_plan(PowerPlan::Unchanged);
        assert!(result.is_ok(), "Unchanged 切り替えでエラー");
        assert_eq!(result.unwrap(), None, "Unchanged 前の GUID は None");
    }

    #[test]
    fn test_revert_power_plan_none() {
        let result = revert_power_plan(None);
        assert!(result.is_ok(), "None リバートでエラー");
    }

    #[test]
    fn test_get_current_power_plan() {
        let result = get_current_power_plan();

        match result {
            Ok(Some(guid)) => {
                assert!(!guid.is_empty(), "現在の電源プラン GUID が空");
            }
            Ok(None) => {}
            Err(_) => {}
        }
    }

    #[test]
    fn test_power_plan_guid_constants() {
        assert!(PowerPlan::HighPerformance.guid().is_some());
        assert!(PowerPlan::UltimatePerformance.guid().is_some());
        assert!(PowerPlan::Balanced.guid().is_some());
        assert!(PowerPlan::Unchanged.guid().is_none());

        let high_perf_guid = PowerPlan::HighPerformance.guid().unwrap();
        assert_eq!(high_perf_guid, "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c");
    }
}
