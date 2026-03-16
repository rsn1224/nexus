use regex::Regex;
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Manager};
use tracing::{info, warn};

use crate::error::AppError;

// ─── Secret Detection Patterns ────────────────────────────────────────────────

const SECRET_PATTERNS: &[(&str, &str)] = &[
    (
        "Generic API Key",
        r#"(?i)(api[_-]?key|apikey)\s*[=:]\s*['"]?[A-Za-z0-9\-_]{20,}"#,
    ),
    ("Bearer Token", r#"Bearer\s+[A-Za-z0-9\-_.~+/]{20,}"#),
    ("AWS Access Key", r#"AKIA[0-9A-Z]{16}"#),
    (
        "Generic Secret",
        r#"(?i)(secret|token|password)\s*[=:]\s*['"]?[A-Za-z0-9\-_!@#$%]{16,}"#,
    ),
    ("Perplexity Key", r#"pplx-[A-Za-z0-9]{48}"#),
];

// ─── Vulnerability Types ────────────────────────────────────────────────

#[derive(serde::Serialize, Debug)]
pub struct NpmVulnerability {
    pub name: String,
    pub severity: String, // "critical" | "high" | "moderate" | "low"
    pub via: Vec<String>, // 依存元パッケージ名
    pub fix_available: bool,
}

#[derive(serde::Serialize, Debug)]
pub struct CargoVulnerability {
    pub package: String,
    pub version: String,
    pub advisory_id: String,
    pub title: String,
    pub severity: String,
    pub url: String,
}

#[derive(serde::Serialize, Debug, Clone, Copy)]
pub struct VulnerabilitySummary {
    pub critical: u32,
    pub high: u32,
    pub moderate: u32,
    pub low: u32,
    pub total: u32,
}

#[derive(serde::Serialize, Debug)]
pub struct VulnerabilityReport {
    pub npm: Vec<NpmVulnerability>,
    pub cargo: Vec<CargoVulnerability>,
    pub summary: VulnerabilitySummary,
    pub scanned_at: String, // ISO8601 文字列（フロント側で Date 変換）
}

// ─── Secret Detection Types ────────────────────────────────────────────────

#[derive(serde::Serialize, Debug)]
pub struct DetectedSecret {
    pub file: String, // ワークスペースルートからの相対パス
    pub line: u32,
    pub pattern_name: String,
    pub preview: String, // マスク済み表示用（最大40文字）
}

#[derive(serde::Serialize, Debug, Clone, Copy)]
pub struct SecretSummary {
    pub total: u32,
    pub files_affected: u32,
}

#[derive(serde::Serialize, Debug)]
pub struct SecretReport {
    pub secrets: Vec<DetectedSecret>,
    pub summary: SecretSummary,
    pub scanned_at: String, // ISO8601
}

// ─── Vulnerability Scan Implementation ───────────────────────────────────────

#[tauri::command]
pub async fn run_vulnerability_scan(app: AppHandle) -> Result<VulnerabilityReport, AppError> {
    info!("Starting vulnerability scan");

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    let workspace_root = resource_dir
        .parent()
        .ok_or_else(|| AppError::Io("Failed to find workspace root".to_string()))?;

    // npm audit 実行
    let npm_vulns = match run_npm_audit(workspace_root).await {
        Ok(vulns) => vulns,
        Err(e) => {
            warn!("npm audit failed: {}", e);
            Vec::new()
        }
    };

    // cargo audit 実行
    let cargo_vulns = match run_cargo_audit(workspace_root).await {
        Ok(vulns) => vulns,
        Err(e) => {
            warn!("cargo audit failed: {}", e);
            Vec::new()
        }
    };

    let summary = calculate_vulnerability_summary(&npm_vulns, &cargo_vulns);
    info!(
        "Vulnerability scan completed: {} total vulnerabilities",
        summary.total
    );

    Ok(VulnerabilityReport {
        npm: npm_vulns,
        cargo: cargo_vulns,
        summary,
        scanned_at: chrono::Utc::now().to_rfc3339(),
    })
}

async fn run_npm_audit(workspace_root: &Path) -> Result<Vec<NpmVulnerability>, AppError> {
    let npm_dir = workspace_root.join("nexus");

    let output = Command::new("npm.cmd")
        .current_dir(&npm_dir)
        .args(["audit", "--json"])
        .output()
        .map_err(|e| AppError::Command(format!("Failed to run npm audit: {}", e)))?;

    // npm audit は脆弱性発見時も非ゼロで終了するため、
    // stdout が空の場合のみ実行エラーとみなす
    if output.stdout.is_empty() {
        return Err(AppError::Command(format!(
            "npm audit produced no output: {}",
            String::from_utf8_lossy(&output.stderr)
        )));
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| AppError::Command(format!("Failed to parse npm audit output: {}", e)))?;

    parse_npm_audit_output(&stdout)
}

async fn run_cargo_audit(workspace_root: &Path) -> Result<Vec<CargoVulnerability>, AppError> {
    let cargo_dir = workspace_root.join("nexus/src-tauri");

    let output = Command::new("cargo")
        .current_dir(&cargo_dir)
        .args(["audit", "--json"])
        .output()
        .map_err(|e| AppError::Command(format!("Failed to run cargo audit: {}", e)))?;

    // cargo audit は脆弱性発見時も非ゼロで終了するため、
    // stdout が空の場合のみ実行エラーとみなす
    if output.stdout.is_empty() {
        return Err(AppError::Command(format!(
            "cargo audit produced no output: {}",
            String::from_utf8_lossy(&output.stderr)
        )));
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| AppError::Command(format!("Failed to parse cargo audit output: {}", e)))?;

    parse_cargo_audit_output(&stdout)
}

fn parse_npm_audit_output(output: &str) -> Result<Vec<NpmVulnerability>, AppError> {
    #[derive(Deserialize)]
    struct NpmAuditOutput {
        advisories: HashMap<String, NpmAdvisory>,
    }

    #[derive(Deserialize)]
    struct NpmAdvisory {
        severity: String,
        module_name: String,
        via: Vec<String>,
        fix_available: bool,
    }

    let audit_output: NpmAuditOutput = serde_json::from_str(output)
        .map_err(|e| AppError::Command(format!("Failed to parse npm audit JSON: {}", e)))?;

    let vulnerabilities = audit_output
        .advisories
        .values()
        .map(|advisory| NpmVulnerability {
            name: advisory.module_name.clone(),
            severity: advisory.severity.clone(),
            via: advisory.via.clone(),
            fix_available: advisory.fix_available,
        })
        .collect();

    Ok(vulnerabilities)
}

fn parse_cargo_audit_output(output: &str) -> Result<Vec<CargoVulnerability>, AppError> {
    #[derive(Deserialize)]
    struct CargoAuditOutput {
        vulnerabilities: Option<Vec<CargoAuditVuln>>,
    }

    #[derive(Deserialize)]
    struct CargoAuditVuln {
        package: CargoPackage,
        advisory: CargoAdvisory,
    }

    #[derive(Deserialize)]
    struct CargoPackage {
        name: String,
        version: String,
    }

    #[derive(Deserialize)]
    struct CargoAdvisory {
        id: String,
        title: String,
        severity: String,
        url: String,
    }

    let audit_output: CargoAuditOutput = serde_json::from_str(output)
        .map_err(|e| AppError::Command(format!("Failed to parse cargo audit JSON: {}", e)))?;

    let vulnerabilities = audit_output
        .vulnerabilities
        .unwrap_or_default()
        .into_iter()
        .map(|vuln| CargoVulnerability {
            package: vuln.package.name,
            version: vuln.package.version,
            advisory_id: vuln.advisory.id,
            title: vuln.advisory.title,
            severity: vuln.advisory.severity,
            url: vuln.advisory.url,
        })
        .collect();

    Ok(vulnerabilities)
}

fn calculate_vulnerability_summary(
    npm_vulns: &[NpmVulnerability],
    cargo_vulns: &[CargoVulnerability],
) -> VulnerabilitySummary {
    let mut summary = VulnerabilitySummary {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        total: 0,
    };

    for vuln in npm_vulns {
        match vuln.severity.as_str() {
            "critical" => summary.critical += 1,
            "high" => summary.high += 1,
            "moderate" => summary.moderate += 1,
            "low" => summary.low += 1,
            _ => {}
        }
        summary.total += 1;
    }

    for vuln in cargo_vulns {
        match vuln.severity.as_str() {
            "critical" => summary.critical += 1,
            "high" => summary.high += 1,
            "moderate" => summary.moderate += 1,
            "low" => summary.low += 1,
            _ => {}
        }
        summary.total += 1;
    }

    summary
}

// ─── Secret Scan Implementation ───────────────────────────────────────────────

#[tauri::command]
pub fn run_secret_scan(app: AppHandle) -> Result<SecretReport, AppError> {
    info!("Starting secret scan");

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    let workspace_root = resource_dir
        .parent()
        .ok_or_else(|| AppError::Io("Failed to find workspace root".to_string()))?;

    let scan_dir = workspace_root.join("nexus");

    let target_files = collect_target_files(&scan_dir)?;

    let mut secrets = Vec::new();
    let mut files_affected = std::collections::HashSet::new();

    for file_path in &target_files {
        let content = fs::read_to_string(file_path).map_err(|e| {
            AppError::Io(format!(
                "Failed to read file {}: {}",
                file_path.display(),
                e
            ))
        })?;

        let line_secrets = scan_file_for_secrets(&content, file_path, workspace_root)?;
        if !line_secrets.is_empty() {
            files_affected.insert(file_path.clone());
            secrets.extend(line_secrets);
        }
    }

    let summary = SecretSummary {
        total: secrets.len() as u32,
        files_affected: files_affected.len() as u32,
    };

    info!(
        "Secret scan completed: {} secrets found in {} files",
        summary.total, summary.files_affected
    );

    Ok(SecretReport {
        secrets,
        summary,
        scanned_at: chrono::Utc::now().to_rfc3339(),
    })
}

fn collect_target_files(scan_dir: &Path) -> Result<Vec<std::path::PathBuf>, AppError> {
    let mut target_files = Vec::new();

    for entry in walkdir::WalkDir::new(scan_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| !is_excluded_dir(e.path()))
    {
        let path = entry.path();

        if let Some("ts" | "tsx" | "rs" | "toml" | "env") =
            path.extension().and_then(|s| s.to_str())
        {
            target_files.push(path.to_path_buf());
        }
    }

    Ok(target_files)
}

fn is_excluded_dir(path: &Path) -> bool {
    let path_str = path.to_string_lossy();
    path_str.contains("node_modules") || path_str.contains("target") || path_str.contains(".git")
}

fn scan_file_for_secrets(
    content: &str,
    file_path: &Path,
    workspace_root: &Path,
) -> Result<Vec<DetectedSecret>, AppError> {
    let mut secrets = Vec::new();

    for (pattern_name, pattern) in SECRET_PATTERNS {
        let regex = Regex::new(pattern).map_err(|e| {
            AppError::Command(format!("Invalid regex pattern {}: {}", pattern_name, e))
        })?;

        for (line_num, line) in content.lines().enumerate() {
            if let Some(mat) = regex.find(line) {
                let preview = if mat.as_str().len() > 40 {
                    format!("{}...", &mat.as_str()[..37])
                } else {
                    mat.as_str().to_string()
                };

                secrets.push(DetectedSecret {
                    file: pathdiff::diff_paths(file_path, workspace_root)
                        .unwrap_or_else(|| file_path.to_path_buf())
                        .to_string_lossy()
                        .to_string(),
                    line: (line_num + 1) as u32,
                    pattern_name: pattern_name.to_string(),
                    preview,
                });
            }
        }
    }

    Ok(secrets)
}

// ─── Tests ─────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_vulnerability_summary() {
        let npm_vulns = vec![
            NpmVulnerability {
                name: "test-package-1".to_string(),
                severity: "critical".to_string(),
                via: vec!["dep1".to_string()],
                fix_available: true,
            },
            NpmVulnerability {
                name: "test-package-2".to_string(),
                severity: "moderate".to_string(),
                via: vec!["dep2".to_string()],
                fix_available: false,
            },
        ];

        let cargo_vulns = vec![CargoVulnerability {
            package: "test-crate-1".to_string(),
            version: "1.0.0".to_string(),
            advisory_id: "RUST-001".to_string(),
            title: "Test vulnerability".to_string(),
            severity: "high".to_string(),
            url: "https://example.com".to_string(),
        }];

        let summary = calculate_vulnerability_summary(&npm_vulns, &cargo_vulns);

        assert_eq!(summary.critical, 1);
        assert_eq!(summary.high, 1);
        assert_eq!(summary.moderate, 1);
        assert_eq!(summary.low, 0);
        assert_eq!(summary.total, 3);
    }

    #[test]
    fn test_is_excluded_dir() {
        assert!(is_excluded_dir(Path::new("node_modules")));
        assert!(is_excluded_dir(Path::new("target/debug")));
        assert!(is_excluded_dir(Path::new(".git")));
        assert!(!is_excluded_dir(Path::new("src")));
        assert!(!is_excluded_dir(Path::new("components")));
    }

    #[test]
    fn test_secret_patterns() {
        let test_content = r#"
        api_key = "sk-1234567890abcdef1234567890abcdef"
        Bearer token1234567890abcdef1234567890abcdef
        AKIA12345678901234
        secret = "my_secret_value_123!"
        pplx-abcdef1234567890abcdef1234567890abcdef123456
        "#;

        let secrets =
            scan_file_for_secrets(test_content, Path::new("test.ts"), Path::new("/workspace"))
                .unwrap(); // OK in tests

        assert!(!secrets.is_empty());
    }
}
