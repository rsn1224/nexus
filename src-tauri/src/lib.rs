mod commands;
mod error;

use crate::commands::{archive, beacon, chrono, launcher, link, ops, pulse, recon, security, signal, vault};
use std::collections::HashMap;
use std::sync::Mutex;
use tracing::info;

// ─── Application State ────────────────────────────────────────────────────────

pub struct WatcherState {
    pub watchers: Mutex<HashMap<String, notify::RecommendedWatcher>>,
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
        .invoke_handler(tauri::generate_handler![
            // RECON
            recon::scan_network,
            recon::get_traffic_snapshot,
            recon::ping_device,
            recon::resolve_hostname,
            // OPS
            ops::list_processes,
            ops::get_ai_suggestions,
            ops::kill_process,
            ops::set_process_priority,
            // VAULT
            vault::list_vault_entries,
            vault::unlock_vault,
            vault::save_vault_entry,
            vault::delete_vault_entry,
            vault::change_master_password,
            vault::generate_totp,
            // ARCHIVE
            archive::list_notes,
            archive::save_note,
            archive::delete_note,
            // PULSE
            pulse::get_resource_snapshot,
            // CHRONO
            chrono::list_tasks,
            chrono::save_task,
            chrono::delete_task,
            // LINK
            link::list_snippets,
            link::save_snippet,
            link::delete_snippet,
            // BEACON
            beacon::list_watched_paths,
            beacon::start_watching,
            beacon::stop_watching,
            beacon::remove_watched_path,
            beacon::get_events,
            beacon::clear_events,
            beacon::validate_path,
            // LAUNCHER
            launcher::scan_steam_games,
            launcher::launch_game,
            // SECURITY
            security::run_vulnerability_scan,
            security::run_secret_scan,
            // SIGNAL
            signal::list_signal_feeds,
            signal::add_signal_feed,
            signal::remove_signal_feed,
            signal::toggle_signal_feed,
            signal::check_feed_now,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
