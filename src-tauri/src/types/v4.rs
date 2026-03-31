//! v4 型定義 — フロントエンドと共有する Tauri コマンドの入出力型
use serde::{Deserialize, Serialize};

// ─── SystemStatus ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct SystemStatus {
    pub cpu_percent: f32,
    pub gpu_percent: f32,
    pub gpu_temp_c: f32,
    pub ram_used_gb: f32,
    pub ram_total_gb: f32,
    pub disk_free_gb: f32,
}

// ─── Optimization ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct OptCandidate {
    pub id: String,
    pub label: String,
    pub description: String,
    pub current_state: String,
    pub is_recommended: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ApplyResult {
    pub applied: Vec<AppliedItem>,
    pub failed: Vec<FailedItem>,
    pub session_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppliedItem {
    pub id: String,
    pub before: String,
    pub after: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedItem {
    pub id: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct RevertResult {
    pub reverted: Vec<String>,
    pub failed: Vec<FailedItem>,
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Warning,
    Danger,
}

#[derive(Debug, Clone, Serialize)]
pub struct DiagnosticAlert {
    pub severity: Severity,
    pub title: String,
    pub detail: String,
}

// ─── History ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptSession {
    pub id: String,
    pub timestamp: u64,
    pub applied: Vec<AppliedItem>,
    pub failed: Vec<FailedItem>,
}

// ─── Settings ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NexusSettings {
    pub protected_processes: Vec<String>,
    pub dns_choice: String,
    pub polling_interval_secs: u32,
}

impl Default for NexusSettings {
    fn default() -> Self {
        Self {
            protected_processes: vec![
                "explorer.exe".to_string(),
                "csrss.exe".to_string(),
                "svchost.exe".to_string(),
            ],
            dns_choice: "1.1.1.1".to_string(),
            polling_interval_secs: 5,
        }
    }
}

