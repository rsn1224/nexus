#![allow(dead_code)]

//! Valve VDF (KeyValues) 形式のパーサー
//! Steam の libraryfolders.vdf 等のファイルを解析する
use std::collections::HashMap;

/// VDF テキストを key-value マップに変換する
pub fn parse_vdf(content: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix('"') {
            if let Some(key_end) = rest.find('"') {
                let key = &rest[..key_end];
                let after_key = &rest[key_end + 1..];
                let value_trimmed = after_key.trim();
                if let Some(value_rest) = value_trimmed.strip_prefix('"') {
                    if let Some(val_end) = value_rest.find('"') {
                        let value = &value_rest[..val_end];
                        map.insert(key.to_string(), value.to_string());
                    }
                }
            }
        }
    }

    map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_key_value_pairs() {
        let content = r#"
"libraryfolders"
{
    "0"
    {
        "path"      "C:\\\\Program Files (x86)\\\\Steam"
        "label"     ""
    }
}
"#;
        let map = parse_vdf(content);
        assert_eq!(
            map.get("path"),
            Some(&"C:\\\\\\\\Program Files (x86)\\\\\\\\Steam".to_string())
        );
        assert_eq!(map.get("label"), Some(&String::new()));
    }

    #[test]
    fn test_parse_app_ids() {
        let content = r#"
"apps"
{
    "228980"    "0"
    "730"       "16591804"
}
"#;
        let map = parse_vdf(content);
        assert_eq!(map.get("228980"), Some(&"0".to_string()));
        assert_eq!(map.get("730"), Some(&"16591804".to_string()));
    }

    #[test]
    fn test_parse_empty() {
        let map = parse_vdf("");
        assert!(map.is_empty());
    }

    #[test]
    fn test_section_headers_ignored() {
        let content = r#"
"section"
{
}
"#;
        let map = parse_vdf(content);
        // セクション名のみ（値なし）はマップに入らない
        assert!(!map.contains_key("section"));
    }
}
