mod commands;
mod error;

use crate::commands::{
    app_settings, boost, hardware, launcher, log, netopt, ops, pulse, storage, windows_settings,
    winopt,
};
use std::collections::HashMap;
use std::sync::Mutex;
use sysinfo::{Networks, System};
use tracing::info;

// ─── Application State ────────────────────────────────────────────────────────

pub struct WatcherState {
    pub watchers: Mutex<HashMap<String, notify::RecommendedWatcher>>,
}

pub struct PulseState {
    pub sys: System,
    pub last_disk_read: u64,
    pub last_disk_write: u64,
    pub networks: Networks,
}

impl Default for PulseState {
    fn default() -> Self {
        Self::new()
    }
}

impl PulseState {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_memory();
        sys.refresh_cpu_all();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

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
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    info!("NEXUS starting up");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .manage(WatcherState {
            watchers: Mutex::new(HashMap::new()),
        })
        .manage(Mutex::new(PulseState::new()))
        .invoke_handler(tauri::generate_handler![
            // PULSE
            pulse::get_resource_snapshot,
            // HARDWARE
            hardware::get_hardware_info,
            // BOOST
            boost::run_boost,
            // LAUNCHER
            launcher::scan_steam_games,
            launcher::launch_game,
            // OPS
            ops::list_processes,
            ops::kill_process,
            ops::set_process_priority,
            ops::get_ai_suggestions,
            // WINOPT
            winopt::get_win_settings,
            winopt::apply_win_setting,
            winopt::revert_win_setting,
            winopt::get_net_settings,
            winopt::flush_dns_cache,
            winopt::apply_net_setting,
            winopt::revert_net_setting,
            // WINDOWS SETTINGS
            windows_settings::get_windows_settings,
            windows_settings::set_power_plan,
            windows_settings::toggle_game_mode,
            windows_settings::toggle_fullscreen_optimization,
            windows_settings::toggle_hardware_gpu_scheduling,
            windows_settings::set_visual_effects,
            // NETOPT
            netopt::get_network_adapters,
            netopt::get_current_dns,
            netopt::set_dns,
            netopt::ping_host,
            // STORAGE
            storage::get_storage_info,
            storage::cleanup_temp_files,
            storage::cleanup_recycle_bin,
            storage::cleanup_system_cache,
            storage::run_full_cleanup,
            storage::analyze_disk_usage,
            // LOG
            log::get_system_logs,
            log::get_application_logs,
            log::analyze_logs,
            log::export_logs,
            // APP SETTINGS
            app_settings::get_app_settings,
            app_settings::save_app_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
