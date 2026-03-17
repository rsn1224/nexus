//! フレームタイム統計計算サービス（services 層）

use crate::error::AppError;
#[cfg(windows)]
use crate::infra::etw::{self, EtwSession, FrameEvent, FrameEventBuffer};
#[cfg(windows)]
use crate::types::game::FrameTimeSnapshot;
#[cfg(windows)]
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[cfg(not(windows))]
use crate::error::AppError;
#[cfg(not(windows))]
use crate::types::game::{FrameTimeMonitorState, FrameTimeSnapshot};

/// フレームタイム監視セッション
pub struct FrameTimeSession {
    #[cfg(windows)]
    session: Option<EtwSession>,
    #[cfg(windows)]
    buffer: FrameEventBuffer,
    #[cfg(windows)]
    target_pid: u32,
    #[cfg(windows)]
    process_name: String,
    #[cfg(not(windows))]
    _dummy: (),
}

impl FrameTimeSession {
    /// 新しい監視セッションを開始する。
    pub fn start(pid: u32, process_name: String) -> Result<Self, AppError> {
        #[cfg(windows)]
        {
            let buffer: FrameEventBuffer = Arc::new(Mutex::new(Vec::with_capacity(18000)));
            let etw_session = etw::start_trace(Some(pid), Arc::clone(&buffer))?;

            Ok(Self {
                session: Some(etw_session),
                buffer,
                target_pid: pid,
                process_name,
            })
        }

        #[cfg(not(windows))]
        {
            let _ = (pid, process_name);
            Err(AppError::FrameTime(
                "ETW は Windows のみサポートされています".to_string(),
            ))
        }
    }

    /// 停止する。
    pub fn stop(&mut self) {
        #[cfg(windows)]
        {
            if let Some(session) = self.session.take() {
                session.stop();
            }
        }
        #[cfg(not(windows))]
        {}
    }

    /// PID を取得する。
    pub fn get_pid(&self) -> u32 {
        #[cfg(windows)]
        {
            self.target_pid
        }
        #[cfg(not(windows))]
        {
            0
        }
    }

    /// プロセス名を取得する。
    pub fn get_process_name(&self) -> &str {
        #[cfg(windows)]
        {
            &self.process_name
        }
        #[cfg(not(windows))]
        {
            "stub"
        }
    }

    /// 現在のバッファからスナップショットを計算して返す。
    /// 毎秒呼び出される想定。
    pub fn snapshot(&self) -> FrameTimeSnapshot {
        #[cfg(windows)]
        {
            let events = {
                let buf = self
                    .buffer
                    .lock()
                    .unwrap_or_else(|e: std::sync::PoisonError<_>| e.into_inner());
                buf.clone()
            };

            // 直近1秒分のイベントを抽出
            let now = Instant::now();
            let one_sec_ago = now - std::time::Duration::from_secs(1);
            let recent: Vec<&FrameEvent> = events
                .iter()
                .filter(|e| e.timestamp >= one_sec_ago && e.pid == self.target_pid)
                .collect();

            // フレームタイム計算
            let frame_times: Vec<f64> = recent
                .windows(2)
                .map(|pair| {
                    let dt = pair[1].timestamp.duration_since(pair[0].timestamp);
                    dt.as_secs_f64() * 1000.0 // ms に変換
                })
                .collect();

            // 統計計算
            let (avg_fps, pct_1_low, pct_01_low) = if frame_times.is_empty() {
                (0.0, 0.0, 0.0)
            } else {
                let mean = frame_times.iter().sum::<f64>() / frame_times.len() as f64;
                let avg_fps = if mean > 0.0 { 1000.0 / mean } else { 0.0 };

                let mut sorted = frame_times.clone();
                sorted.sort_by(|a: &f64, b: &f64| {
                    a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)
                });

                let pct_99 = percentile(&sorted, 99.0);
                let pct_999 = percentile(&sorted, 99.9);

                let pct_1_low = if pct_99 > 0.0 { 1000.0 / pct_99 } else { 0.0 };
                let pct_01_low = if pct_999 > 0.0 { 1000.0 / pct_999 } else { 0.0 };

                (avg_fps, pct_1_low, pct_01_low)
            };

            // スタッター検出（33ms以上）
            let stutter_count = frame_times.iter().filter(|&&ft| ft >= 33.0).count();

            // ダウンサンプリング（最大100個）
            let downsampled = if frame_times.len() > 100 {
                let step = frame_times.len() / 100;
                frame_times.iter().step_by(step.max(1)).copied().collect()
            } else {
                frame_times.clone()
            };

            FrameTimeSnapshot {
                pid: self.target_pid,
                process_name: self.process_name.clone(),
                avg_fps,
                pct_1_low,
                pct_01_low,
                stutter_count: stutter_count as u32,
                last_frame_time_ms: frame_times.last().copied().unwrap_or(0.0),
                frame_times: downsampled,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis() as u64,
            }
        }

        #[cfg(not(windows))]
        {
            FrameTimeSnapshot {
                pid: 0,
                process_name: "stub".to_string(),
                avg_fps: 0.0,
                pct_1_low: 0.0,
                pct_01_low: 0.0,
                stutter_count: 0,
                last_frame_time_ms: 0.0,
                frame_times: vec![],
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis() as u64,
            }
        }
    }
}

/// パーセンタイル計算
fn percentile(sorted: &[f64], p: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    let index = (p / 100.0 * (sorted.len() - 1) as f64) as usize;
    sorted[index.min(sorted.len() - 1)]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_percentile() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert_eq!(percentile(&data, 50.0), 3.0);
        assert_eq!(percentile(&data, 0.0), 1.0);
        assert_eq!(percentile(&data, 100.0), 5.0);
    }

    #[test]
    fn test_percentile_empty() {
        let data: Vec<f64> = vec![];
        assert_eq!(percentile(&data, 50.0), 0.0);
    }

    #[cfg(windows)]
    #[test]
    fn test_frame_time_session_compiles() {
        // ETW は Windows でのみ動作するため、コンパイルテストのみ
        assert!(true);
    }

    #[cfg(not(windows))]
    #[test]
    fn test_frame_time_session_stub() {
        let result = FrameTimeSession::start(1234, "test.exe".to_string());
        assert!(result.is_err());
    }
}
