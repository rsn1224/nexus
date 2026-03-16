use crate::error::AppError;
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};
use tracing::info;

// Import WatcherState from lib
use crate::WatcherState;

// ─── Types ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchedPath {
    pub id: String,
    pub path: String,
    pub is_recursive: bool,
    pub created_at: u64,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchEvent {
    pub id: String,
    pub path_id: String,
    pub kind: String, // "Create", "Modify", "Remove", "Other"
    pub path: String,
    pub timestamp: u64,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BEACON_FILE: &str = "beacon_paths.json";

// ─── File I/O ─────────────────────────────────────────────────────────────────

fn get_beacon_file_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("Failed to get app data dir: {}", e)))?;

    if !app_data_dir.exists() {
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| AppError::Io(format!("Failed to create app data dir: {}", e)))?;
    }

    Ok(app_data_dir.join(BEACON_FILE))
}

fn load_watched_paths(app: &AppHandle) -> Result<Vec<WatchedPath>, AppError> {
    let file_path = get_beacon_file_path(app)?;

    if !file_path.exists() {
        return Ok(vec![]);
    }

    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| AppError::Io(format!("Failed to read beacon file: {}", e)))?;

    let paths: Vec<WatchedPath> = serde_json::from_str(&content).map_err(|e| {
        AppError::Serialization(format!("Failed to deserialize beacon paths: {}", e))
    })?;

    Ok(paths)
}

fn save_watched_paths(app: &AppHandle, paths: &[WatchedPath]) -> Result<(), AppError> {
    let file_path = get_beacon_file_path(app)?;

    let content = serde_json::to_string_pretty(paths)
        .map_err(|e| AppError::Serialization(format!("Failed to serialize beacon paths: {}", e)))?;

    std::fs::write(&file_path, content)
        .map_err(|e| AppError::Io(format!("Failed to write beacon file: {}", e)))?;

    Ok(())
}

fn load_events(app: &AppHandle) -> Result<Vec<WatchEvent>, AppError> {
    let file_path = get_beacon_file_path(app)?.with_extension("events.json");

    if !file_path.exists() {
        return Ok(vec![]);
    }

    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| AppError::Io(format!("Failed to read beacon events file: {}", e)))?;

    let events: Vec<WatchEvent> = serde_json::from_str(&content).map_err(|e| {
        AppError::Serialization(format!("Failed to deserialize beacon events: {}", e))
    })?;

    Ok(events)
}

fn save_events(app: &AppHandle, events: &[WatchEvent]) -> Result<(), AppError> {
    let file_path = get_beacon_file_path(app)?.with_extension("events.json");

    let content = serde_json::to_string_pretty(events).map_err(|e| {
        AppError::Serialization(format!("Failed to serialize beacon events: {}", e))
    })?;

    std::fs::write(&file_path, content)
        .map_err(|e| AppError::Io(format!("Failed to write beacon events file: {}", e)))?;

    Ok(())
}

// ─── Commands ───────────────────────────────────────────────────────────────

/// 監視中のパス一覧を取得する。
#[tauri::command]
pub fn list_watched_paths(app: AppHandle) -> Result<Vec<WatchedPath>, AppError> {
    info!("list_watched_paths: loading paths");
    let paths = load_watched_paths(&app)?;
    Ok(paths)
}

/// 新しいパスの監視を開始する。
#[tauri::command]
pub fn start_watching(
    app: AppHandle,
    watcher_state: State<WatcherState>,
    path: String,
    is_recursive: bool,
) -> Result<WatchedPath, AppError> {
    info!(
        path,
        recursive = is_recursive,
        "start_watching: adding path"
    );

    let path_buf = Path::new(&path)
        .canonicalize()
        .map_err(|e| AppError::Io(format!("Invalid path {}: {}", path, e)))?;

    if !path_buf.exists() {
        return Err(AppError::Command(format!("Path does not exist: {}", path)));
    }

    let mut paths = load_watched_paths(&app)?;

    // 重複チェック
    if paths.iter().any(|p| p.path == path_buf.to_string_lossy()) {
        return Err(AppError::Command(format!(
            "Path already being watched: {}",
            path
        )));
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::Command(format!("Time error: {}", e)))?
        .as_secs();

    let watched_path = WatchedPath {
        id: uuid::Uuid::new_v4().to_string(),
        path: path_buf.to_string_lossy().to_string(),
        is_recursive,
        created_at: now,
        is_active: true,
    };

    // Setup notify watcher
    let app_clone = app.clone();
    let path_id = watched_path.id.clone();
    let path_buf_clone = path_buf.to_owned();

    let (tx, rx) = std::sync::mpsc::channel::<notify::Result<notify::Event>>();
    let mut watcher = RecommendedWatcher::new(tx, notify::Config::default())
        .map_err(|e| AppError::Command(format!("Failed to create watcher: {}", e)))?;

    let mode = if is_recursive {
        RecursiveMode::Recursive
    } else {
        RecursiveMode::NonRecursive
    };

    watcher
        .watch(&path_buf_clone, mode)
        .map_err(|e| AppError::Command(format!("Failed to watch path: {}", e)))?;

    // Store watcher in state for cleanup
    {
        let mut watchers = watcher_state.watchers.lock().map_err(|e| {
            tracing::error!("Failed to lock watchers: {:?}", e);
            AppError::Command(format!("Failed to lock watchers: {}", e))
        })?;
        watchers.insert(watched_path.id.clone(), watcher);
    }

    // Spawn thread to handle file system events
    std::thread::spawn(move || {
        for event in rx.into_iter().flatten() {
            let kind_str = match event.kind {
                EventKind::Create(_) => "Create",
                EventKind::Modify(_) => "Modify",
                EventKind::Remove(_) => "Remove",
                _ => "Other",
            };

            for path in event.paths {
                let watch_event = WatchEvent {
                    id: uuid::Uuid::new_v4().to_string(),
                    path_id: path_id.clone(),
                    kind: kind_str.to_string(),
                    path: path.to_string_lossy().to_string(),
                    timestamp: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs(),
                };

                if let Err(e) = app_clone.emit("file-system-event", &watch_event) {
                    tracing::error!("Failed to emit file system event: {}", e);
                }
            }
        }
    });

    paths.push(watched_path.clone());
    save_watched_paths(&app, &paths)?;

    info!(id = watched_path.id, "start_watching: done");
    Ok(watched_path)
}

/// パスの監視を停止する。
#[tauri::command]
pub fn stop_watching(
    app: AppHandle,
    watcher_state: State<WatcherState>,
    id: String,
) -> Result<(), AppError> {
    info!(id, "stop_watching: removing path");

    let mut paths = load_watched_paths(&app)?;

    let index = paths
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| AppError::Command(format!("Watched path not found: {}", id)))?;

    paths[index].is_active = false;
    save_watched_paths(&app, &paths)?;

    // Remove watcher from state to stop file system events
    {
        let mut watchers = watcher_state.watchers.lock().map_err(|e| {
            tracing::error!("Failed to lock watchers: {:?}", e);
            AppError::Command(format!("Failed to lock watchers: {}", e))
        })?;
        watchers.remove(&id);
    }

    info!(id, "stop_watching: done");
    Ok(())
}

/// 監視パスを完全に削除する。
#[tauri::command]
pub fn remove_watched_path(
    app: AppHandle,
    watcher_state: State<WatcherState>,
    id: String,
) -> Result<(), AppError> {
    info!(id, "remove_watched_path: removing path");

    let mut paths = load_watched_paths(&app)?;

    let index = paths
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| AppError::Command(format!("Watched path not found: {}", id)))?;

    paths.remove(index);
    save_watched_paths(&app, &paths)?;

    // Remove watcher from state to stop file system events
    {
        let mut watchers = watcher_state.watchers.lock().map_err(|e| {
            tracing::error!("Failed to lock watchers: {:?}", e);
            AppError::Command(format!("Failed to lock watchers: {}", e))
        })?;
        watchers.remove(&id);
    }

    info!(id, "remove_watched_path: done");
    Ok(())
}

/// イベント履歴を取得する。
#[tauri::command]
pub fn get_events(app: AppHandle, limit: Option<usize>) -> Result<Vec<WatchEvent>, AppError> {
    info!("get_events: loading events");
    let mut events = load_events(&app)?;

    // 新しい順にソート
    events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    if let Some(limit) = limit {
        events.truncate(limit);
    }

    Ok(events)
}

/// イベント履歴をクリアする。
#[tauri::command]
pub fn clear_events(app: AppHandle) -> Result<(), AppError> {
    info!("clear_events: clearing events");
    save_events(&app, &[])?;
    Ok(())
}

/// パスが存在し、監視可能かチェックする。
#[tauri::command]
pub fn validate_path(path: String) -> Result<bool, AppError> {
    let path_buf = Path::new(&path);

    if !path_buf.exists() {
        return Ok(false);
    }

    let canonical = path_buf
        .canonicalize()
        .map_err(|_| AppError::Command("Invalid path".to_string()))?;

    Ok(canonical.exists())
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::SystemTime;
    use uuid::Uuid;

    fn now_millis() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    #[test]
    fn test_watched_path_creation() {
        let path = WatchedPath {
            id: Uuid::new_v4().to_string(),
            path: "/test/path".to_string(),
            is_recursive: true,
            created_at: now_millis(),
            is_active: true,
        };

        assert!(path.is_recursive);
        assert!(path.is_active);
        assert!(path.created_at > 0);
    }

    #[test]
    fn test_watch_event_creation() {
        let event = WatchEvent {
            id: Uuid::new_v4().to_string(),
            path_id: Uuid::new_v4().to_string(),
            kind: "Create".to_string(),
            path: "/test/path/file.txt".to_string(),
            timestamp: now_millis(),
        };

        assert_eq!(event.kind, "Create");
        assert!(event.timestamp > 0);
    }

    #[test]
    fn test_watched_path_serialization() {
        let path = WatchedPath {
            id: "test-id".to_string(),
            path: "/test/path".to_string(),
            is_recursive: false,
            created_at: 1234567890,
            is_active: true,
        };

        let json = serde_json::to_string(&path).unwrap();
        let deserialized: WatchedPath = serde_json::from_str(&json).unwrap();

        assert_eq!(path.id, deserialized.id);
        assert_eq!(path.path, deserialized.path);
        assert_eq!(path.is_recursive, deserialized.is_recursive);
    }

    #[test]
    fn test_watch_event_serialization() {
        let event = WatchEvent {
            id: "event-id".to_string(),
            path_id: "path-id".to_string(),
            kind: "Modify".to_string(),
            path: "/test/file.txt".to_string(),
            timestamp: 1234567890,
        };

        let json = serde_json::to_string(&event).unwrap();
        let deserialized: WatchEvent = serde_json::from_str(&json).unwrap();

        assert_eq!(event.id, deserialized.id);
        assert_eq!(event.kind, deserialized.kind);
        assert_eq!(event.path, deserialized.path);
    }
}
