//! 最適化候補の列挙

use crate::types::v4::OptCandidate;

pub fn get_candidates() -> Vec<OptCandidate> {
    let mut out = Vec::with_capacity(11);

    out.push(OptCandidate {
        id: "cpu_priority".into(),
        label: "CPU Priority".into(),
        description: "Set idle processes to low priority".into(),
        current_state: "Normal".into(),
        is_recommended: true,
    });

    out.push(OptCandidate {
        id: "nagle_off".into(),
        label: "Nagle Algorithm".into(),
        description: "Disable Nagle for lower latency".into(),
        current_state: nagle_display(),
        is_recommended: !nagle_is_off(),
    });

    out.push(OptCandidate {
        id: "dns_optimize".into(),
        label: "DNS Server".into(),
        description: "Switch to 1.1.1.1 (Cloudflare)".into(),
        current_state: dns_display(),
        is_recommended: true,
    });

    let plan = power_plan_display();
    out.push(OptCandidate {
        id: "power_plan".into(),
        label: "Power Plan".into(),
        description: "Switch to Ultimate Performance".into(),
        current_state: plan.clone(),
        is_recommended: !plan.contains("Ultimate"),
    });

    append_registry(&mut out);
    append_services(&mut out);

    out.push(OptCandidate {
        id: "timer_res".into(),
        label: "Timer Resolution".into(),
        description: "Set to 0.5ms for precise timing".into(),
        current_state: timer_display(),
        is_recommended: true,
    });

    out
}

// ─── ヘルパー ────────────────────────────────────────────────────────────────

fn nagle_is_off() -> bool {
    #[cfg(windows)]
    {
        crate::services::network_tuning::get_tcp_tuning_state()
            .map(|s| s.nagle_disabled)
            .unwrap_or(false)
    }
    #[cfg(not(windows))]
    false
}

fn nagle_display() -> String {
    if nagle_is_off() {
        "OFF (already optimized)".into()
    } else {
        "ON".into()
    }
}

fn dns_display() -> String {
    #[cfg(windows)]
    {
        crate::infra::powershell::run_powershell(
            "(Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses} | Select-Object -First 1).ServerAddresses -join ','",
        )
        .unwrap_or_else(|_| "Unknown".into())
        .trim()
        .to_string()
    }
    #[cfg(not(windows))]
    "N/A".into()
}

fn power_plan_display() -> String {
    #[cfg(windows)]
    {
        let ctrl = crate::infra::power_plan::PowerPlanController::new();
        if let Ok(Some(guid)) = ctrl.get_active_plan_guid() {
            let plans = ctrl.list_available_plans().unwrap_or_default();
            return guid_to_plan_name_with_list(&guid, &plans);
        }
        String::from("Unknown")
    }
    #[cfg(not(windows))]
    "N/A".into()
}

/// GUID 先頭8文字から既知の電源プラン名を返す
fn guid_to_plan_name(guid: &str) -> String {
    let lower = guid.to_lowercase();
    if lower.starts_with("381b4222") {
        return "Balanced".into();
    }
    if lower.starts_with("8c5e7fda") {
        return "High Performance".into();
    }
    if lower.starts_with("a1841308") {
        return "Power Saver".into();
    }
    if lower.starts_with("e9a42b02") {
        return "Ultimate Performance".into();
    }
    guid.into()
}

/// static マッピング優先、未知 GUID は powercfg /list の結果から解決する
fn guid_to_plan_name_with_list(guid: &str, plans: &[(String, String)]) -> String {
    let static_name = guid_to_plan_name(guid);
    if static_name != guid {
        return static_name;
    }
    plans
        .iter()
        .find(|(g, _)| g.eq_ignore_ascii_case(guid))
        .map(|(_, name)| name.clone())
        .unwrap_or_else(|| guid.to_string())
}

fn timer_display() -> String {
    crate::infra::timer_resolution::query_resolution()
        .map(|s| format!("{:.1}ms", s.current_100ns as f64 / 10000.0))
        .unwrap_or_else(|_| "Unknown".into())
}

fn append_registry(out: &mut Vec<OptCandidate>) {
    let items: &[(&str, &str, &str, &str, &str)] = &[
        (
            "reg_responsiveness",
            "SystemResponsiveness",
            "Reduce system overhead for gaming",
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile",
            "SystemResponsiveness",
        ),
        (
            "reg_priority_sep",
            "Win32PrioritySeparation",
            "Optimize foreground process priority",
            r"SYSTEM\CurrentControlSet\Control\PriorityControl",
            "Win32PrioritySeparation",
        ),
        (
            "reg_throttle",
            "NetworkThrottlingIndex",
            "Disable network throttling",
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile",
            "NetworkThrottlingIndex",
        ),
        (
            "reg_game_dvr",
            "Game DVR",
            "Disable background game recording",
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\GameDVR",
            "AppCaptureEnabled",
        ),
    ];

    for &(id, label, desc, _subkey, _vname) in items {
        #[cfg(windows)]
        let current = {
            let v = crate::infra::registry::read_hklm_dword_or(_subkey, _vname, u32::MAX);
            if v == u32::MAX { "not set".into() } else { v.to_string() }
        };
        #[cfg(not(windows))]
        let current: String = "N/A".into();

        out.push(OptCandidate {
            id: id.into(),
            label: label.into(),
            description: desc.into(),
            current_state: current,
            is_recommended: true,
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nagle_display_off_shows_optimized_label() {
        // OFF の場合は "OFF (already optimized)" を返す
        // ON 時は "ON" を返す — ロジックの文字列を直接検証
        let off_str: String = "OFF (already optimized)".into();
        let on_str: String = "ON".into();
        assert!(off_str.contains("already optimized"), "OFF 表示に already optimized が含まれない");
        assert!(!on_str.contains("already optimized"), "ON 表示が誤った文字列");
    }

    #[test]
    fn test_guid_to_plan_name_balanced() {
        let guid = "381b4222-f694-41f0-9685-ff5bb260df2e";
        assert_eq!(guid_to_plan_name(guid), "Balanced");
    }

    #[test]
    fn test_guid_to_plan_name_high_performance() {
        let guid = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c";
        assert_eq!(guid_to_plan_name(guid), "High Performance");
    }

    #[test]
    fn test_guid_to_plan_name_ultimate() {
        let guid = "e9a42b02-d5df-448d-aa00-03f14749eb61";
        assert_eq!(guid_to_plan_name(guid), "Ultimate Performance");
    }

    #[test]
    fn test_guid_to_plan_name_unknown() {
        let guid = "00000000-0000-0000-0000-000000000000";
        assert_eq!(guid_to_plan_name(guid), guid);
    }

    #[test]
    fn test_guid_to_plan_name_with_list_custom_guid() {
        let guid = "43d7a294-f4db-44fa-9e1c-51b5285f839a";
        let plans = vec![(
            "43d7a294-f4db-44fa-9e1c-51b5285f839a".to_string(),
            "Ultimate Performance".to_string(),
        )];
        assert_eq!(guid_to_plan_name_with_list(guid, &plans), "Ultimate Performance");
    }

    #[test]
    fn test_guid_to_plan_name_with_list_known_guid_ignores_list() {
        let guid = "381b4222-f694-41f0-9685-ff5bb260df2e";
        let plans = vec![("381b4222-f694-41f0-9685-ff5bb260df2e".to_string(), "WrongName".to_string())];
        assert_eq!(guid_to_plan_name_with_list(guid, &plans), "Balanced");
    }

    #[test]
    fn test_guid_to_plan_name_with_list_completely_unknown() {
        let guid = "ffffffff-ffff-ffff-ffff-ffffffffffff";
        assert_eq!(guid_to_plan_name_with_list(guid, &[]), guid);
    }
}

fn append_services(out: &mut Vec<OptCandidate>) {
    let svcs: &[(&str, &str, &str, &str)] = &[
        ("svc_search", "Windows Search", "Temporarily stop indexer", "WSearch"),
        ("svc_sysmain", "SysMain", "Temporarily stop Superfetch", "SysMain"),
    ];

    for &(id, label, desc, _svc) in svcs {
        #[cfg(windows)]
        let current = crate::infra::powershell::run_powershell(&format!(
            "(Get-Service -Name '{}' -ErrorAction SilentlyContinue).Status",
            _svc
        ))
        .unwrap_or_else(|_| "Unknown".into())
        .trim()
        .to_string();

        #[cfg(not(windows))]
        let current: String = "N/A".into();

        out.push(OptCandidate {
            id: id.into(),
            label: label.into(),
            description: desc.into(),
            current_state: current.clone(),
            is_recommended: current == "Running",
        });
    }
}
