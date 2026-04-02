use super::*;

#[test]
fn test_extract_plan_display_name_active_with_asterisk() {
    // アクティブなプランの行末には " *" が付く
    // (Ultimate Performance)  * → "Ultimate Performance" を返すべき
    let display = PowerPlanController::extract_plan_display_name("(Ultimate Performance)  *");
    assert_eq!(display, Some("Ultimate Performance".to_string()));
}

#[test]
fn test_extract_plan_display_name_inactive() {
    let display = PowerPlanController::extract_plan_display_name("(Balanced)");
    assert_eq!(display, Some("Balanced".to_string()));
}

#[test]
fn test_extract_plan_display_name_japanese() {
    let display = PowerPlanController::extract_plan_display_name("(バランス) *");
    assert_eq!(display, Some("バランス".to_string()));
}

#[test]
fn test_decode_powercfg_utf8() {
    // Windows 11 の powercfg は UTF-8 で出力する
    let input = "電源設定の GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (バランス)"
        .as_bytes()
        .to_vec();
    let result = decode_powercfg(&input);
    assert!(
        result.contains("381b4222"),
        "UTF-8 入力が正しくデコードされていない: {:?}",
        result
    );
    assert!(
        result.contains("バランス"),
        "日本語が正しくデコードされていない: {:?}",
        result
    );
}

#[test]
fn test_decode_powercfg_ascii() {
    // 英語環境の出力
    let input = b"Power Scheme GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  (High Performance)";
    let result = decode_powercfg(input);
    assert!(
        result.contains("8c5e7fda"),
        "ASCII 入力が壊れた: {:?}",
        result
    );
}

#[test]
fn test_extract_guid_from_line_japanese() {
    let line = "電源設定の GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (バランス)";
    let guid = PowerPlanController::extract_guid_from_line(line);
    assert_eq!(guid, Some("381b4222-f694-41f0-9685-ff5bb260df2e"));
}

#[test]
fn test_find_ultimate_in_list_output() {
    // powercfg /list の出力から Ultimate Performance GUID を見つける
    let list_output = concat!(
        "電源設定の GUID: e9a42b02-d5df-448d-aa00-03f14749eb61  (Ultimate Performance)\n",
        "電源設定の GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (バランス)\n",
        "電源設定の GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  (高パフォーマンス)\n",
    );
    let found = list_output.lines().find_map(|line| {
        PowerPlanController::extract_guid_from_line(line)
            .filter(|g| g.to_lowercase().starts_with("e9a42b02"))
            .map(str::to_string)
    });
    assert_eq!(
        found.as_deref(),
        Some("e9a42b02-d5df-448d-aa00-03f14749eb61")
    );
}

#[test]
fn test_find_ultimate_not_present() {
    // Ultimate Performance が存在しない場合は None
    let list_output = concat!(
        "電源設定の GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (バランス)\n",
        "電源設定の GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  (高パフォーマンス)\n",
    );
    let found = list_output.lines().find_map(|line| {
        PowerPlanController::extract_guid_from_line(line)
            .filter(|g| g.to_lowercase().starts_with("e9a42b02"))
            .map(str::to_string)
    });
    assert!(found.is_none());
}

#[test]
fn test_duplicatescheme_output_guid_extraction() {
    // powercfg -duplicatescheme の出力から新 GUID を抽出
    // 出力形式: "電源設定の GUID: <新GUID>  (Ultimate Performance)"
    let dup_output =
        "電源設定の GUID: abcd1234-5678-9abc-def0-123456789abc  (Ultimate Performance)";
    let guid = PowerPlanController::extract_guid_from_line(dup_output);
    assert_eq!(
        guid,
        Some("abcd1234-5678-9abc-def0-123456789abc"),
        "duplicatescheme 出力の GUID 抽出が失敗"
    );
}
