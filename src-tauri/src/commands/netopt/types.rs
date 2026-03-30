use encoding_rs::SHIFT_JIS;
use serde::{Deserialize, Serialize};
use std::net::Ipv4Addr;

use crate::error::AppError;

/// Windows コマンド出力を Shift_JIS → UTF-8 に変換（フォールバック: lossy UTF-8）
pub fn decode_output(bytes: &[u8]) -> String {
    let (decoded, _, had_errors) = SHIFT_JIS.decode(bytes);
    if had_errors {
        String::from_utf8_lossy(bytes).to_string()
    } else {
        decoded.to_string()
    }
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NetworkAdapter {
    pub name: String,
    pub ip: String,
    pub mac: String,
    pub is_connected: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PingResult {
    pub target: String,
    pub latency_ms: Option<u64>,
    pub success: bool,
}

// ─── Validation Functions (Phase 1) ─────────────────────────────────────

/// IPv4アドレスのバリデーション
pub fn validate_ipv4(ip: &str) -> Result<(), AppError> {
    ip.parse::<Ipv4Addr>()
        .map_err(|_| AppError::InvalidInput(format!("Invalid IPv4 address: {}", ip)))?;
    Ok(())
}

/// ネットワークアダプタ名のバリデーション（危険文字の排除）
pub fn validate_adapter_name(name: &str) -> Result<(), AppError> {
    if name.is_empty() || name.len() > 256 {
        return Err(AppError::InvalidInput(
            "Adapter name must be 1-256 characters".into(),
        ));
    }
    // シェルメタ文字を拒否
    if name.chars().any(|c| {
        matches!(
            c,
            ';' | '|' | '&' | '`' | '$' | '<' | '>' | '"' | '\'' | '\\'
        )
    }) {
        return Err(AppError::InvalidInput(format!(
            "Adapter name contains forbidden characters: {}",
            name
        )));
    }
    Ok(())
}

/// ping対象のバリデーション（IP or ホスト名）
pub fn validate_ping_target(target: &str) -> Result<(), AppError> {
    if target.is_empty() || target.len() > 253 {
        return Err(AppError::InvalidInput(
            "Target must be 1-253 characters".into(),
        ));
    }
    // IPアドレスとして有効 OR ホスト名として有効
    if target.parse::<Ipv4Addr>().is_ok() {
        return Ok(());
    }
    // ホスト名: 英数字, ハイフン, ドットのみ
    if target
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '.')
    {
        return Ok(());
    }
    Err(AppError::InvalidInput(format!(
        "Invalid ping target: {}. Only IP addresses or hostnames (alphanumeric, '-', '.') are allowed",
        target
    )))
}
