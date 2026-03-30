//! コア ping 測定ロジック

use crate::error::AppError;
use std::process::Command;
use tracing::info;

use super::NetworkQualitySnapshot;

/// 指定ターゲットに対して連続 ping を実行し、Jitter とパケットロスを測定
pub fn measure_network_quality(
    target: &str,
    count: u32,
) -> Result<NetworkQualitySnapshot, AppError> {
    if !(1..=50).contains(&count) {
        return Err(AppError::InvalidInput(
            "Ping count must be between 1 and 50".into(),
        ));
    }

    validate_ping_target(target)?;

    info!(
        "ネットワーク品質測定開始: target={}, count={}",
        target, count
    );

    let output = Command::new("ping")
        .args(["-n", &count.to_string(), target])
        .output()
        .map_err(|e| AppError::Command(format!("ping command failed: {}", e)))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Command(format!("ping failed: {}", error)));
    }

    let output_str = String::from_utf8_lossy(&output.stdout);

    let mut rtt_values = Vec::new();
    let mut received_count = 0u32;

    for line in output_str.lines() {
        if line.contains("time=") || line.contains("time<") {
            if let Some(rtt) = parse_rtt_from_line(line) {
                rtt_values.push(rtt);
                received_count += 1;
            }
        } else if line.contains("Reply from") {
            received_count += 1;
        }
    }

    let packet_loss_pct = if count > 0 {
        ((count - received_count) as f64 / count as f64) * 100.0
    } else {
        0.0
    };

    let (avg_latency_ms, jitter_ms) = if rtt_values.is_empty() {
        (0.0, 0.0)
    } else {
        let avg = rtt_values.iter().sum::<f64>() / rtt_values.len() as f64;
        let variance =
            rtt_values.iter().map(|x| (x - avg).powi(2)).sum::<f64>() / rtt_values.len() as f64;
        let jitter = variance.sqrt();
        (avg, jitter)
    };

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let snapshot = NetworkQualitySnapshot {
        target: target.to_string(),
        avg_latency_ms,
        jitter_ms,
        packet_loss_pct,
        sample_count: count,
        timestamp,
    };

    info!(
        "ネットワーク品質測定完了: avg={:.1}ms, jitter={:.1}ms, loss={:.1}%",
        avg_latency_ms, jitter_ms, packet_loss_pct
    );

    Ok(snapshot)
}

/// ping ターゲットのバリデーション
pub(super) fn validate_ping_target(target: &str) -> Result<(), AppError> {
    if target.is_empty() {
        return Err(AppError::InvalidInput("Target cannot be empty".into()));
    }

    if target.parse::<std::net::Ipv4Addr>().is_ok() {
        return Ok(());
    }

    if target.contains('.') && !target.chars().any(|c| c.is_whitespace()) {
        return Ok(());
    }

    if target.eq_ignore_ascii_case("localhost") {
        return Ok(());
    }

    Err(AppError::InvalidInput(
        "Invalid ping target. Use IPv4 address or domain name.".into(),
    ))
}

/// ping 出力行から RTT 値を抽出
pub(super) fn parse_rtt_from_line(line: &str) -> Option<f64> {
    if let Some(time_start) = line.find("time") {
        let time_part = &line[time_start..];

        if let Some(lt_pos) = time_part.find('<') {
            let value_part = &time_part[lt_pos + 1..];
            if value_part.contains("ms") {
                return Some(0.5);
            }
        } else if let Some(eq_pos) = time_part.find('=') {
            let value_part = &time_part[eq_pos + 1..];

            if let Some(ms_pos) = value_part.find("ms") {
                let value_str = &value_part[..ms_pos];

                if value_str.starts_with('<') {
                    return Some(0.5);
                }

                return value_str.parse::<f64>().ok();
            }
        }
    }

    None
}

/// PowerShell 版の ping 測定（より詳細な統計用）
#[cfg(windows)]
#[allow(dead_code)]
pub fn measure_network_quality_powershell(
    target: &str,
    count: u32,
) -> Result<NetworkQualitySnapshot, AppError> {
    validate_ping_target(target)?;

    if !(1..=50).contains(&count) {
        return Err(AppError::InvalidInput(
            "Ping count must be between 1 and 50".into(),
        ));
    }

    let script = format!(
        "Test-Connection -ComputerName {} -Count {} | Select-Object -ExpandProperty ResponseTime",
        target, count
    );

    let output = crate::infra::powershell::run_powershell(&script)?;

    let mut rtt_values = Vec::new();
    for line in output.lines() {
        if let Ok(value) = line.trim().parse::<f64>() {
            rtt_values.push(value);
        }
    }

    let _sample_count = rtt_values.len() as u32;
    let (avg_latency_ms, jitter_ms) = if rtt_values.is_empty() {
        (0.0, 0.0)
    } else {
        let avg = rtt_values.iter().sum::<f64>() / rtt_values.len() as f64;
        let variance =
            rtt_values.iter().map(|x| (x - avg).powi(2)).sum::<f64>() / rtt_values.len() as f64;
        let jitter = variance.sqrt();
        (avg, jitter)
    };

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    Ok(NetworkQualitySnapshot {
        target: target.to_string(),
        avg_latency_ms,
        jitter_ms,
        packet_loss_pct: 0.0,
        sample_count: count,
        timestamp,
    })
}

#[cfg(not(windows))]
#[allow(dead_code)]
pub fn measure_network_quality_powershell(
    _target: &str,
    _count: u32,
) -> Result<NetworkQualitySnapshot, AppError> {
    Err(AppError::Command("Windows 専用機能です".into()))
}
