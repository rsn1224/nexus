pub mod cpu_affinity;
pub mod etw;
pub mod gpu;
pub mod netsh;
pub mod perplexity_client;
pub mod ping;
pub mod process_control;

#[cfg(windows)]
pub mod power_plan;
#[cfg(windows)]
pub mod powershell;
#[cfg(windows)]
pub mod registry;
#[cfg(windows)]
pub mod timer_resolution;
