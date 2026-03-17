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
