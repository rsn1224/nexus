use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tracing::info;

// ─── Constants ────────────────────────────────────────────────────────────────

const CHRONO_FILE: &str = "chrono_tasks.json";

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChronoTask {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub priority: String, // "low" | "medium" | "high"
    pub due_at: Option<u64>,
    pub created_at: u64,
    pub updated_at: u64,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn now_millis() -> Result<u64, AppError> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| AppError::Command(e.to_string()))
}

fn chrono_path(app: &AppHandle) -> Result<std::path::PathBuf, AppError> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Command(e.to_string()))?;
    Ok(app_dir.join(CHRONO_FILE))
}

fn load_tasks(app: &AppHandle) -> Result<Vec<ChronoTask>, AppError> {
    let path = chrono_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let raw = std::fs::read_to_string(&path)?;
    let tasks: Vec<ChronoTask> = serde_json::from_str(&raw)?;
    Ok(tasks)
}

fn save_tasks(app: &AppHandle, tasks: &[ChronoTask]) -> Result<(), AppError> {
    let path = chrono_path(app)?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let json = serde_json::to_string_pretty(tasks)?;
    std::fs::write(&path, json)?;
    Ok(())
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// タスク一覧を取得する。未完了タスクを先頭にソート。
#[tauri::command]
pub fn list_tasks(app: AppHandle) -> Result<Vec<ChronoTask>, AppError> {
    info!("list_tasks: loading tasks from storage");
    let mut tasks = load_tasks(&app)?;

    // done=false を先頭にソート
    tasks.sort_by(|a, b| a.done.cmp(&b.done));

    info!(count = tasks.len(), "list_tasks: done");
    Ok(tasks)
}

/// タスクを保存する。新規作成と更新を兼ねる。
#[tauri::command]
pub fn save_task(
    app: AppHandle,
    id: String,
    title: String,
    done: bool,
    priority: String,
    due_at: Option<u64>,
) -> Result<ChronoTask, AppError> {
    info!(id, title, done, priority, "save_task: saving task");

    let mut tasks = load_tasks(&app)?;
    let now = now_millis()?;

    // 既存タスクを検索
    if let Some(task) = tasks.iter_mut().find(|t| t.id == id) {
        // 更新
        task.title = title;
        task.done = done;
        task.priority = priority;
        task.due_at = due_at;
        task.updated_at = now;
    } else {
        // 新規作成
        let task = ChronoTask {
            id: id.clone(),
            title,
            done,
            priority,
            due_at,
            created_at: now,
            updated_at: now,
        };
        tasks.push(task);
    }

    save_tasks(&app, &tasks)?;

    // 保存したタスクを返す
    let saved_task = tasks
        .iter()
        .find(|t| t.id == id)
        .ok_or_else(|| AppError::Command(format!("task {} not found after save", id)))?
        .clone();
    info!(id, "save_task: done");
    Ok(saved_task)
}

/// タスクを削除する。
#[tauri::command]
pub fn delete_task(app: AppHandle, id: String) -> Result<(), AppError> {
    info!(id, "delete_task: removing task");

    let mut tasks = load_tasks(&app)?;
    tasks.retain(|task| task.id != id);

    save_tasks(&app, &tasks)?;
    info!(id, "delete_task: done");
    Ok(())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn mock_app_data_dir() -> PathBuf {
        // テスト用の一時ディレクトリパスを生成
        std::env::temp_dir().join("chrono_test")
    }

    fn cleanup_test_dir() {
        let test_dir = mock_app_data_dir();
        if test_dir.exists() {
            let _ = std::fs::remove_dir_all(&test_dir);
        }
    }

    #[test]
    fn test_save_and_load_tasks() {
        cleanup_test_dir();

        let task = ChronoTask {
            id: "test-1".to_string(),
            title: "Test Task".to_string(),
            done: false,
            priority: "high".to_string(),
            due_at: Some(1640995200000),
            created_at: 1640995200000,
            updated_at: 1640995200000,
        };

        // テスト用ディレクトリに保存
        let test_dir = mock_app_data_dir();
        std::fs::create_dir_all(&test_dir).unwrap();
        let file_path = test_dir.join("chrono_tasks.json");

        let json = serde_json::to_string(&[task.clone()]).unwrap();
        std::fs::write(&file_path, json).unwrap();

        // 読み込み
        let loaded_raw = std::fs::read_to_string(&file_path).unwrap();
        let loaded: Vec<ChronoTask> = serde_json::from_str(&loaded_raw).unwrap();

        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].id, task.id);
        assert_eq!(loaded[0].title, task.title);

        cleanup_test_dir();
    }

    #[test]
    fn test_chrono_task_serialization() {
        let task = ChronoTask {
            id: "test-1".to_string(),
            title: "Test Task".to_string(),
            done: false,
            priority: "high".to_string(),
            due_at: Some(1640995200000),
            created_at: 1640995200000,
            updated_at: 1640995200000,
        };

        // JSONシリアライズが成功することを確認
        let json = serde_json::to_string(&task).unwrap();
        assert!(json.contains("test-1"));
        assert!(json.contains("Test Task"));

        // デシリアライズが成功することを確認
        let deserialized: ChronoTask = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, task.id);
        assert_eq!(deserialized.title, task.title);
    }

    #[test]
    fn test_now_millis() {
        let timestamp = now_millis().unwrap();
        assert!(timestamp > 0);

        // 2020年以降のタイムスタンプであることを確認
        assert!(timestamp > 1577836800000); // 2020-01-01 00:00:00 UTC
    }

    #[test]
    fn test_chrono_task_creation() {
        let task = ChronoTask {
            id: "task-1".to_string(),
            title: "Test Task".to_string(),
            done: false,
            priority: "medium".to_string(),
            due_at: None,
            created_at: 1640995200000,
            updated_at: 1640995200000,
        };

        assert_eq!(task.id, "task-1");
        assert_eq!(task.title, "Test Task");
        assert!(!task.done);
        assert_eq!(task.priority, "medium");
        assert!(task.due_at.is_none());
    }

    #[test]
    fn test_chrono_task_with_due_date() {
        let task = ChronoTask {
            id: "task-2".to_string(),
            title: "Task with Due".to_string(),
            done: false,
            priority: "low".to_string(),
            due_at: Some(1641081600000), // 2022-01-02
            created_at: 1640995200000,
            updated_at: 1640995200000,
        };

        assert!(task.due_at.is_some());
        assert_eq!(task.due_at.unwrap(), 1641081600000);
    }
}
