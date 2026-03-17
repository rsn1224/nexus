mod commands;
mod constants;
mod emitters;
mod error;
mod infra;
mod parsers;
mod services;
mod state;

use crate::commands::{
    app_settings, boost, hardware, launcher, log, netopt, ops, pulse, storage, windows_settings,
    winopt,
};
use tracing::info;

// state.rs から re-export
pub use state::{AppState, SharedState};

// ─── Application State ────────────────────────────────────────────────────────

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
        .manage(<SharedState>::new(AppState::new()))
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
        .setup(|app| {
            let handle = app.handle().clone();

            // Pulse エミッター（リソース監視 — 2秒間隔）
            let pulse_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                emitters::pulse_emitter::start(pulse_handle).await;
            });

            // Ops エミッター（プロセス一覧 — 3秒間隔）
            let ops_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                emitters::ops_emitter::start(ops_handle).await;
            });

            // Hardware エミッター（ハードウェア情報 — 5秒間隔）
            let hw_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                emitters::hardware_emitter::start(hw_handle).await;
            });

            info!("emitters: 全エミッター起動完了（pulse=2s, ops=3s, hardware=5s）");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
