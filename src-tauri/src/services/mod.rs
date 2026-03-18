pub mod boost;
pub mod cleanup;
pub mod core_parking;
pub mod cpu_topology;
pub mod credentials;
pub mod frame_time;
pub mod game_monitor;
pub mod hardware;
pub mod health_check;
pub mod memory_cleaner;
pub mod network_monitor;
#[cfg(windows)]
pub mod network_tuning;
pub mod power_estimator;
pub mod process;
pub mod profile;
pub mod session_store;
pub mod settings_advisor;
pub mod system_monitor;
pub mod thermal_monitor;
#[cfg(windows)]
pub mod timer;
pub mod watchdog;
