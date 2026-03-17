use std::sync::Mutex;
use sysinfo::{Networks, ProcessesToUpdate, System};

use crate::types::game::RevertSnapshot;

/// アプリケーション全体で共有するシステム情報ステート
pub struct AppState {
    pub sys: System,
    pub last_disk_read: u64,
    pub last_disk_write: u64,
    pub networks: Networks,
    /// ゲームプロファイル適用時のリバート用スナップショット
    pub revert_snapshot: Option<RevertSnapshot>,
    /// ゲーム監視がアクティブかどうか
    pub game_monitor_active: bool,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

impl AppState {
    pub fn new() -> Self {
        let mut sys = System::new();
        sys.refresh_memory();
        sys.refresh_cpu_all();
        sys.refresh_processes(ProcessesToUpdate::All, true);

        let initial_read: u64 = sys
            .processes()
            .values()
            .map(|p| p.disk_usage().read_bytes)
            .sum();
        let initial_write: u64 = sys
            .processes()
            .values()
            .map(|p| p.disk_usage().written_bytes)
            .sum();

        let networks = Networks::new_with_refreshed_list();

        Self {
            sys,
            last_disk_read: initial_read,
            last_disk_write: initial_write,
            networks,
            revert_snapshot: None,
            game_monitor_active: false,
        }
    }
}

/// Tauri Managed State の型エイリアス
pub type SharedState = Mutex<AppState>;
