// edition 2024 では collapsible_if が既存の可読性パターンに対しても警告するため許可
#![allow(
    clippy::collapsible_if,
    clippy::collapsible_match,
    clippy::collapsible_else_if
)]
mod commands;
mod constants;
mod emitters;
mod error;
mod infra;
mod parsers;
mod services;
mod state;
mod types;

use crate::commands::{
    ai, app_settings, boost, cleanup, core_parking, frame_time, hardware, health_check, launcher,
    launcher_settings, log, memory, netopt, ops, profile, pulse, script, session, storage, timer,
    windows_settings, winopt, watchdog,
};
use tracing::info;

// Manager トレイトをインポート
use tauri::Manager;

// state.rs から re-export
pub use state::{AppState, SharedState, WatchdogState};

// types::game から再エクスポート
pub use types::game::*;

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
        .manage(<WatchdogState>::new(std::sync::Mutex::new(crate::services::watchdog::WatchdogEngine::new())))
        .invoke_handler(tauri::generate_handler![
            // AI
            ai::get_optimization_suggestions,
            ai::test_api_key,
            ai::analyze_bottleneck_ai,
            // HEALTH CHECK
            health_check::run_health_check,
            // PULSE
            pulse::get_resource_snapshot,
            // HARDWARE
            hardware::get_hardware_info,
            // BOOST
            boost::run_boost,
            // LAUNCHER
            launcher::scan_steam_games,
            launcher::launch_game,
            // LAUNCHER SETTINGS
            launcher_settings::get_launcher_settings_cmd,
            launcher_settings::save_launcher_settings_cmd,
            launcher_settings::migrate_launcher_settings,
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
            // TCP TUNING
            netopt::get_tcp_tuning_state,
            netopt::set_nagle_disabled,
            netopt::set_delayed_ack_disabled,
            netopt::set_network_throttling,
            netopt::set_qos_reserved_bandwidth,
            netopt::set_tcp_auto_tuning,
            netopt::apply_gaming_network_preset,
            netopt::reset_network_defaults,
            netopt::measure_network_quality,
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
            // GAME PROFILES
            profile::list_game_profiles,
            profile::get_game_profile,
            profile::save_game_profile,
            profile::delete_game_profile,
            profile::apply_game_profile,
            profile::revert_game_profile,
            profile::start_game_monitor,
            profile::stop_game_monitor,
            profile::get_cpu_topology,
            profile::set_process_affinity,
            profile::get_process_affinity,
            profile::get_current_power_plan,
            profile::get_suspend_candidates,
            profile::export_game_profile,
            profile::import_game_profile,
            // CORE PARKING
            core_parking::get_core_parking_state,
            core_parking::set_core_parking,
            // TIMER RESOLUTION
            timer::get_timer_resolution,
            timer::set_timer_resolution,
            timer::restore_timer_resolution,
            // FRAME TIME
            frame_time::start_frame_time_monitor,
            frame_time::stop_frame_time_monitor,
            frame_time::get_frame_time_status,
            // SESSION
            session::list_sessions,
            session::get_session,
            session::delete_session,
            session::compare_sessions,
            session::update_session_note,
            // WATCHDOG
            watchdog::get_watchdog_rules,
            watchdog::add_watchdog_rule,
            watchdog::update_watchdog_rule,
            watchdog::remove_watchdog_rule,
            watchdog::get_watchdog_events,
            watchdog::get_watchdog_presets,
            // CLEANUP
            cleanup::revert_all_settings,
            cleanup::cleanup_app_data,
            // MEMORY CLEANER
            memory::get_memory_cleaner_config,
            memory::update_memory_cleaner_config,
            memory::manual_memory_cleanup,
            memory::start_auto_memory_cleanup,
            memory::stop_auto_memory_cleanup,
            // SCRIPT
            script::list_scripts,
            script::add_script,
            script::delete_script,
            script::execute_script,
            script::list_execution_logs,
            script::clear_execution_logs,
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

            // ゲーム起動監視（sysinfo ポーリング — 3秒間隔）
            {
                let game_handle = handle.clone();
                // game_monitor_active を true に設定
                let state = handle.state::<SharedState>();
                if let Ok(mut s) = state.lock() {
                    s.game_monitor_active = true;
                }
                tauri::async_runtime::spawn(async move {
                    crate::services::game_monitor::start_polling(game_handle).await;
                });
                info!("game_monitor: ゲーム監視開始（sysinfo polling=3s）");
            }

            // Watchdog ルール読み込み
            {
                let watchdog_state = app.state::<WatchdogState>();
                if let Ok(mut watchdog) = watchdog_state.lock() {
                    if let Ok(rules) = crate::services::watchdog::WatchdogEngine::load_rules(&handle) {
                        for rule in rules {
                            let _ = watchdog.add_rule(rule);
                        }
                        info!("watchdog: {} rules loaded from disk", watchdog.get_rules().len());
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
