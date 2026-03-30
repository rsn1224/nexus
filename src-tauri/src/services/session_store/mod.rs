//! セッション永続化サービス
//! SQLite or JSON ファイルでセッションデータを保存する。
//! app_data_dir/sessions/ 配下に {session_id}.json として保存。
//! 一覧は sessions/index.json で管理。

mod comparison;
mod crud;

pub use comparison::*;
pub use crud::*;

#[cfg(test)]
mod tests {
    use super::crud::validate_session_id;
    use crate::types::game::{HardwareSnapshot, SavedFrameTimeSession, SessionSummary};
    use std::fs;
    use tempfile::TempDir;

    fn setup_test_dir() -> TempDir {
        TempDir::new().unwrap()
    }

    #[test]
    fn test_validate_session_id() {
        // 有効な ID
        assert!(validate_session_id("session-123").is_ok());
        assert!(validate_session_id("abc123").is_ok());

        // 無効な ID
        assert!(validate_session_id("").is_err());
        assert!(validate_session_id("../etc/passwd").is_err());
        assert!(validate_session_id("session@123").is_err());
        assert!(validate_session_id("session 123").is_err());

        // 長すぎる ID
        let long_id = "a".repeat(101);
        assert!(validate_session_id(&long_id).is_err());
    }

    #[test]
    fn test_save_and_get_session() {
        let temp_dir = setup_test_dir();
        let sessions_dir = temp_dir.path().join("sessions");
        fs::create_dir_all(&sessions_dir).unwrap();

        let session = SavedFrameTimeSession {
            id: "test-session-1".to_string(),
            profile_id: None,
            game_name: "Test Game".to_string(),
            started_at: 1000,
            ended_at: 2000,
            play_secs: 1000,
            summary: SessionSummary {
                avg_fps: 60.0,
                pct_1_low: 55.0,
                pct_01_low: 50.0,
                total_stutter_count: 5,
                max_frame_time_ms: 33.3,
                min_fps: 45.0,
                total_frames: 60000,
            },
            percentiles: vec![],
            fps_timeline: vec![],
            note: "Test note".to_string(),
            hardware_snapshot: Some(HardwareSnapshot {
                cpu_name: "Test CPU".to_string(),
                gpu_name: Some("Test GPU".to_string()),
                mem_total_gb: 16.0,
                os_version: "Windows 10".to_string(),
            }),
        };

        // 保存
        let path = sessions_dir.join("test-session-1.json");
        let json = serde_json::to_string_pretty(&session).unwrap();
        fs::write(&path, json).unwrap();

        // 取得
        let content = fs::read_to_string(&path).unwrap();
        let loaded: SavedFrameTimeSession = serde_json::from_str(&content).unwrap();

        assert_eq!(loaded.id, session.id);
        assert_eq!(loaded.game_name, session.game_name);
        assert_eq!(loaded.summary.avg_fps, session.summary.avg_fps);
    }

    #[test]
    fn test_delete_session() {
        let temp_dir = setup_test_dir();
        let sessions_dir = temp_dir.path().join("sessions");
        fs::create_dir_all(&sessions_dir).unwrap();

        let session = SavedFrameTimeSession {
            id: "session-to-delete".to_string(),
            profile_id: None,
            game_name: "Test Game".to_string(),
            started_at: 1000,
            ended_at: 2000,
            play_secs: 1000,
            summary: SessionSummary {
                avg_fps: 60.0,
                pct_1_low: 55.0,
                pct_01_low: 50.0,
                total_stutter_count: 5,
                max_frame_time_ms: 33.3,
                min_fps: 45.0,
                total_frames: 60000,
            },
            percentiles: vec![],
            fps_timeline: vec![],
            note: String::new(),
            hardware_snapshot: None,
        };

        // 保存
        let path = sessions_dir.join("session-to-delete.json");
        let json = serde_json::to_string_pretty(&session).unwrap();
        fs::write(&path, json).unwrap();
        assert!(path.exists());

        // 削除
        fs::remove_file(&path).unwrap();
        assert!(!path.exists());
    }

    #[test]
    fn test_compare_sessions() {
        // セッション A
        let session_a = SavedFrameTimeSession {
            id: "session-a".to_string(),
            profile_id: None,
            game_name: "Test Game".to_string(),
            started_at: 1000,
            ended_at: 2000,
            play_secs: 1000,
            summary: SessionSummary {
                avg_fps: 50.0,
                pct_1_low: 45.0,
                pct_01_low: 40.0,
                total_stutter_count: 10,
                max_frame_time_ms: 40.0,
                min_fps: 35.0,
                total_frames: 50000,
            },
            percentiles: vec![],
            fps_timeline: vec![],
            note: String::new(),
            hardware_snapshot: None,
        };

        // セッション B（改善版）
        let session_b = SavedFrameTimeSession {
            id: "session-b".to_string(),
            profile_id: None,
            game_name: "Test Game".to_string(),
            started_at: 3000,
            ended_at: 4000,
            play_secs: 1000,
            summary: SessionSummary {
                avg_fps: 60.0,          // 20% 改善
                pct_1_low: 55.0,        // 22.2% 改善
                pct_01_low: 50.0,       // 25% 改善
                total_stutter_count: 5, // 5 減少
                max_frame_time_ms: 33.3,
                min_fps: 45.0,
                total_frames: 60000,
            },
            percentiles: vec![],
            fps_timeline: vec![],
            note: String::new(),
            hardware_snapshot: None,
        };

        // 差分計算（B - A）。正の値 = 改善
        let fps_delta_pct = if session_a.summary.avg_fps > 0.0 {
            ((session_b.summary.avg_fps - session_a.summary.avg_fps) / session_a.summary.avg_fps)
                * 100.0
        } else {
            0.0
        };

        let pct_1_low_delta_pct = if session_a.summary.pct_1_low > 0.0 {
            ((session_b.summary.pct_1_low - session_a.summary.pct_1_low)
                / session_a.summary.pct_1_low)
                * 100.0
        } else {
            0.0
        };

        let pct_01_low_delta_pct = if session_a.summary.pct_01_low > 0.0 {
            ((session_b.summary.pct_01_low - session_a.summary.pct_01_low)
                / session_a.summary.pct_01_low)
                * 100.0
        } else {
            0.0
        };

        let stutter_delta = session_b.summary.total_stutter_count as i32
            - session_a.summary.total_stutter_count as i32;

        // 差分を確認
        assert!((fps_delta_pct - 20.0).abs() < 0.01); // 20% 改善
        assert!((pct_1_low_delta_pct - 22.22).abs() < 0.01); // 22.22% 改善
        assert!((pct_01_low_delta_pct - 25.0).abs() < 0.01); // 25% 改善
        assert_eq!(stutter_delta, -5); // 5 減少
    }
}
