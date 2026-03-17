// Storage Wing — ドライブ情報取得機能

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use sysinfo::Disks;
use tracing::{info, warn};

// ─── Validation Functions (Phase 1) ─────────────────────────────────────

/// Windows ドライブレター形式のバリデーション
fn validate_drive_name(name: &str) -> Result<(), AppError> {
    // "C:", "C:\", "D:", "D:\" のいずれか
    let trimmed = name.trim_end_matches('\\');
    if trimmed.len() == 2
        && trimmed
            .chars()
            .next()
            .is_some_and(|c| c.is_ascii_alphabetic())
        && trimmed.chars().nth(1) == Some(':')
    {
        return Ok(());
    }
    Err(AppError::InvalidInput(format!(
        "Invalid drive name: '{}'. Expected format: 'C:' or 'C:\\'",
        name
    )))
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DiskDrive {
    pub name: String,
    pub model: String,
    pub size_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub file_system: String,
    pub mount_point: String,
    pub is_removable: bool,
    pub health_status: String, // "Good", "Warning", "Critical"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StorageInfo {
    pub drives: Vec<DiskDrive>,
    pub total_size_bytes: u64,
    pub total_used_bytes: u64,
    pub total_available_bytes: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CleanupResult {
    pub temp_files_cleaned: u64,
    pub recycle_bin_cleaned: u64,
    pub system_cache_cleaned: u64,
    pub total_freed_bytes: u64,
}

#[tauri::command]
pub fn get_storage_info() -> Result<StorageInfo, AppError> {
    info!("get_storage_info: fetching storage information");

    let mut drives = Vec::new();
    let mut total_size = 0u64;
    let mut total_used = 0u64;
    let mut total_available = 0u64;

    let disks = Disks::new_with_refreshed_list();

    for disk in &disks {
        let name = disk.name().to_string_lossy().to_string();
        let mount_point = disk.mount_point().to_string_lossy().to_string();
        let file_system = disk.file_system().to_string_lossy().to_string();

        let total_space = disk.total_space();
        let available_space = disk.available_space();
        let used_space = total_space - available_space;

        // ディスクの種類を判定
        let is_removable = mount_point.to_lowercase().contains("usb")
            || name.to_lowercase().contains("usb")
            || file_system.to_lowercase().contains("fat");

        // 簡易的なヘルスステータス判定
        let health_status = if available_space < total_space / 20 {
            "Critical".to_string()
        } else if available_space < total_space / 10 {
            "Warning".to_string()
        } else {
            "Good".to_string()
        };

        let drive = DiskDrive {
            name: name.clone(),
            model: name, // sysinfoでは詳細なモデル情報が取得できないためnameを使用
            size_bytes: total_space,
            used_bytes: used_space,
            available_bytes: available_space,
            file_system,
            mount_point,
            is_removable,
            health_status,
        };

        drives.push(drive);
        total_size += total_space;
        total_used += used_space;
        total_available += available_space;
    }

    let storage_info = StorageInfo {
        drives,
        total_size_bytes: total_size,
        total_used_bytes: total_used,
        total_available_bytes: total_available,
    };

    info!(
        "get_storage_info: found {} drives, total size: {} GB",
        storage_info.drives.len(),
        storage_info.total_size_bytes / (1024 * 1024 * 1024)
    );

    Ok(storage_info)
}

#[tauri::command]
pub fn cleanup_temp_files() -> Result<u64, AppError> {
    info!("cleanup_temp_files: scanning reclaimable temporary files");

    let mut total_freed = 0u64;

    // Windowsの一時フォルダの削除可能サイズを計算
    let username = std::env::var("USERNAME").unwrap_or_else(|_| "Default".to_string());
    let temp_user_dir = format!(r"C:\Users\{}\AppData\Local\Temp", username);
    let temp_dirs = vec![
        r"C:\Windows\Temp",
        r"C:\Users\Default\AppData\Local\Temp",
        temp_user_dir.as_str(),
    ];

    for temp_dir in temp_dirs {
        if let Ok(metadata) = std::fs::metadata(temp_dir) {
            if metadata.is_dir() {
                // 簡易的なクリーンアップ（実際の実装ではより安全な方法が必要）
                match std::fs::read_dir(temp_dir) {
                    Ok(entries) => {
                        for entry in entries.flatten() {
                            let path = entry.path();
                            if path.is_file() {
                                if let Ok(metadata) = std::fs::metadata(&path) {
                                    total_freed += metadata.len();
                                    // 削除可能サイズを計算（実際の削除は安全のためコメントアウト）
                                    // let _ = std::fs::remove_file(&path);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Failed to read temp directory {}: {}", temp_dir, e);
                    }
                }
            }
        }
    }

    info!("cleanup_temp_files: reclaimable {} bytes", total_freed);
    Ok(total_freed)
}

#[tauri::command]
pub fn cleanup_recycle_bin() -> Result<u64, AppError> {
    info!("cleanup_recycle_bin: scanning reclaimable recycle bin");

    // Windowsのゴミ箱をクリーンアップ
    let output = Command::new("powershell")
        .args([
            "-Command",
            "Clear-RecycleBin -Force -ErrorAction SilentlyContinue; Get-ChildItem -Path 'C:\\$Recycle.Bin' -Recurse -Force | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum"
        ])
        .output()
        .map_err(|e| {
            warn!("Failed to execute recycle bin cleanup: {}", e);
            AppError::Command(format!("Failed to execute recycle bin cleanup: {}", e))
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let total_freed = stdout.trim().parse::<u64>().unwrap_or(0);

    info!("cleanup_recycle_bin: reclaimable {} bytes", total_freed);
    Ok(total_freed)
}

#[tauri::command]
pub fn cleanup_system_cache() -> Result<u64, AppError> {
    info!("cleanup_system_cache: scanning reclaimable system cache");

    let mut total_freed = 0u64;

    // Windowsシステムキャッシュの削除可能サイズを計算
    let cache_dirs = vec![
        r"C:\Windows\SoftwareDistribution\Download",
        r"C:\Windows\Prefetch",
        r"C:\Windows\Temp",
    ];

    for cache_dir in cache_dirs {
        if let Ok(metadata) = std::fs::metadata(cache_dir) {
            if metadata.is_dir() {
                match std::fs::read_dir(cache_dir) {
                    Ok(entries) => {
                        for entry in entries.flatten() {
                            let path = entry.path();
                            if path.is_file() {
                                if let Ok(metadata) = std::fs::metadata(&path) {
                                    total_freed += metadata.len();
                                    // 削除可能サイズを計算（実際の削除は安全のためコメントアウト）
                                    // let _ = std::fs::remove_file(&path);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Failed to read cache directory {}: {}", cache_dir, e);
                    }
                }
            }
        }
    }

    info!("cleanup_system_cache: reclaimable {} bytes", total_freed);
    Ok(total_freed)
}

#[tauri::command]
pub fn run_full_cleanup() -> Result<CleanupResult, AppError> {
    info!("run_full_cleanup: scanning total reclaimable space");

    let temp_freed = cleanup_temp_files().unwrap_or(0);
    let recycle_freed = cleanup_recycle_bin().unwrap_or(0);
    let cache_freed = cleanup_system_cache().unwrap_or(0);

    let result = CleanupResult {
        temp_files_cleaned: temp_freed,
        recycle_bin_cleaned: recycle_freed,
        system_cache_cleaned: cache_freed,
        total_freed_bytes: temp_freed + recycle_freed + cache_freed,
    };

    info!(
        "run_full_cleanup: total reclaimable {} bytes",
        result.total_freed_bytes
    );
    Ok(result)
}

#[tauri::command]
pub fn analyze_disk_usage(drive_name: String) -> Result<Vec<String>, AppError> {
    validate_drive_name(&drive_name)?; // ← 追加
    info!(
        "analyze_disk_usage: analyzing usage for drive {}",
        drive_name
    );

    let root = Path::new(&drive_name);
    let mut large_files = Vec::new();

    if let Ok(entries) = std::fs::read_dir(root) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Ok(metadata) = std::fs::metadata(&path) {
                // 100MB 以上のファイルをリストアップ
                if metadata.is_file() && metadata.len() > 100 * 1024 * 1024 {
                    large_files.push(format!(
                        "{} ({:.1} GB)",
                        path.display(),
                        metadata.len() as f64 / (1024.0_f64.powi(3))
                    ));
                }
            }
        }
    }
    large_files.sort();
    Ok(large_files)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_storage_info_serialization() {
        let storage_info = StorageInfo {
            drives: vec![DiskDrive {
                name: "C:".to_string(),
                model: "SSD".to_string(),
                size_bytes: 500000000000,
                used_bytes: 250000000000,
                available_bytes: 250000000000,
                file_system: "NTFS".to_string(),
                mount_point: "C:\\".to_string(),
                is_removable: false,
                health_status: "Good".to_string(),
            }],
            total_size_bytes: 500000000000,
            total_used_bytes: 250000000000,
            total_available_bytes: 250000000000,
        };

        let serialized = serde_json::to_string(&storage_info).unwrap();
        let deserialized: StorageInfo = serde_json::from_str(&serialized).unwrap();

        assert_eq!(storage_info.drives.len(), deserialized.drives.len());
        assert_eq!(storage_info.total_size_bytes, deserialized.total_size_bytes);
    }

    #[test]
    fn test_cleanup_result_serialization() {
        let result = CleanupResult {
            temp_files_cleaned: 1024,
            recycle_bin_cleaned: 2048,
            system_cache_cleaned: 4096,
            total_freed_bytes: 7168,
        };

        let serialized = serde_json::to_string(&result).unwrap();
        let deserialized: CleanupResult = serde_json::from_str(&serialized).unwrap();

        assert_eq!(result.total_freed_bytes, deserialized.total_freed_bytes);
    }

    // --- analyze_disk_usage バリデーション ---
    #[test]
    fn test_validate_drive_name_valid() {
        assert!(validate_drive_name("C:").is_ok());
        assert!(validate_drive_name("C:\\").is_ok());
        assert!(validate_drive_name("D:").is_ok());
        assert!(validate_drive_name("D:\\").is_ok());
    }

    #[test]
    fn test_validate_drive_name_invalid() {
        assert!(validate_drive_name("").is_err());
        assert!(validate_drive_name("../").is_err());
        assert!(validate_drive_name("C:\\Users\\..\\..").is_err());
        assert!(validate_drive_name("/etc/passwd").is_err());
        assert!(validate_drive_name("CC:").is_err());
        assert!(validate_drive_name("1:").is_err());
    }
}
