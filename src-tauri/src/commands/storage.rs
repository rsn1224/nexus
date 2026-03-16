// Storage Wing — ドライブ情報取得機能

use crate::error::AppError;
use serde::{Deserialize, Serialize};
use sysinfo::Disks;
use tracing::info;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveInfo {
    pub name: String,
    pub total_gb: f64,
    pub free_gb: f64,
    pub used_percent: f64,
}

#[tauri::command]
pub fn get_storage_info() -> Result<Vec<DriveInfo>, AppError> {
    info!("get_storage_info: collecting drive information");

    let disks = Disks::new_with_refreshed_list();
    let mut drives = Vec::new();

    for disk in &disks {
        let total_space = disk.total_space();
        let available_space = disk.available_space();
        
        if total_space == 0 {
            continue;
        }

        let total_gb = total_space as f64 / (1024.0 * 1024.0 * 1024.0);
        let free_gb = available_space as f64 / (1024.0 * 1024.0 * 1024.0);
        let used_gb = total_gb - free_gb;
        let used_percent = (used_gb / total_gb) * 100.0;

        let mount_point = disk.mount_point()
            .to_string_lossy()
            .to_string();

        // ドライブ名をフォーマット（C: のように）
        let name = if mount_point.len() == 1 {
            format!("{}:", mount_point)
        } else {
            mount_point
        };

        drives.push(DriveInfo {
            name,
            total_gb,
            free_gb,
            used_percent,
        });
    }

    // ドライブ名でソート
    drives.sort_by(|a, b| a.name.cmp(&b.name));

    info!(
        drives_count = drives.len(),
        "get_storage_info: completed"
    );

    Ok(drives)
}
