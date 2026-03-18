use std::sync::Mutex;
use sysinfo::{Networks, ProcessesToUpdate, System};

use crate::services::hardware::GpuStaticInfo;
use crate::services::memory_cleaner::MemoryCleaner;
use crate::types::game::{CpuTopology, RevertSnapshot};

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
    /// nexus が設定したタイマーリゾリューション値（リバート用）
    pub timer_resolution_requested: Option<u32>,
    /// フレームタイム監視セッション
    pub frame_time_session: Option<crate::services::frame_time::FrameTimeSession>,
    /// CPU トポロジー情報（キャッシュ）
    pub cpu_topology: Option<CpuTopology>,
    /// GPU 静的情報（キャッシュ）
    pub gpu_static: Option<GpuStaticInfo>,
    /// メモリクリーナー
    pub memory_cleaner: MemoryCleaner,
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
            timer_resolution_requested: None,
            frame_time_session: None,
            cpu_topology: None,
            gpu_static: None,
            memory_cleaner: MemoryCleaner::new(
                crate::services::memory_cleaner::MemoryCleanerConfig::default(),
            ),
        }
    }
}

/// Tauri Managed State の型エイリアス
pub type SharedState = Mutex<AppState>;
