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
    ai, app_settings, boost, cleanup, core_parking, frame_time, hardware, health_check, memory,
    netopt, ops, pulse, session, timer,
};
#[cfg(windows)]
use crate::commands::{windows_settings, winopt};
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
        .manage(<WatchdogState>::new(std::sync::Mutex::new(
            crate::services::watchdog::WatchdogEngine::new(),
        )))
        .invoke_handler(build_invoke_handler())
        .setup(|app| {
            let handle = app.handle().clone();

            // UnifiedEmitter（pulse=2s / ops+game=3s / hardware=5s — 1秒ベースループ）
            let unified_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                emitters::unified_emitter::start(unified_handle).await;
            });
            info!("unified_emitter: 起動（base=1s, pulse=2s, ops=3s, hardware=5s）");

            // Watchdog ルール読み込み
            {
                let watchdog_state = app.state::<WatchdogState>();
                if let Ok(mut watchdog) = watchdog_state.lock() {
                    if let Ok(rules) =
                        crate::services::watchdog::WatchdogEngine::load_rules(&handle)
                    {
                        for rule in rules {
                            let _ = watchdog.add_rule(rule);
                        }
                        info!(
                            "watchdog: {} rules loaded from disk",
                            watchdog.get_rules().len()
                        );
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 共通コマンドリストを保持するマクロ。
// クロスプラットフォームのコマンドはここに追加する。
// Windows 専用コマンドは build_invoke_handler (windows) 内に直接記述する。
macro_rules! invoke_handler {
    ($($windows_only:path),* $(,)?) => {
        tauri::generate_handler![
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
            // POWER ESTIMATOR
            hardware::get_power_estimate,
            hardware::get_monthly_cost_estimate,
            hardware::set_eco_mode,
            hardware::get_eco_mode_config,
            hardware::save_eco_mode_config,
            // BOOST
            boost::run_boost,
            // OPS
            ops::list_processes,
            ops::kill_process,
            ops::set_process_priority,
            ops::get_ai_suggestions,
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
            // APP SETTINGS
            app_settings::get_app_settings,
            app_settings::save_app_settings,
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
            // CLEANUP
            cleanup::revert_all_settings,
            // MEMORY CLEANER
            memory::get_memory_cleaner_config,
            memory::update_memory_cleaner_config,
            memory::manual_memory_cleanup,
            memory::start_auto_memory_cleanup,
            memory::stop_auto_memory_cleanup,
            // ─── WINDOWS ONLY (渡された追加コマンド) ───
            $($windows_only,)*
        ]
    };
}

// Windows: 共通コマンド + Windows 専用コマンド
#[cfg(windows)]
fn build_invoke_handler() -> impl Fn(tauri::ipc::Invoke) -> bool {
    invoke_handler![
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
        // SETTINGS ADVISOR
        windows_settings::get_settings_advice,
        windows_settings::apply_recommendation,
    ]
}

// 非 Windows: 共通コマンドのみ
#[cfg(not(windows))]
fn build_invoke_handler() -> impl Fn(tauri::ipc::Invoke) -> bool {
    invoke_handler![]
}
