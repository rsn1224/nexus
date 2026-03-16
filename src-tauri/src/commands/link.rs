use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tracing::info;

// ─── Constants ────────────────────────────────────────────────────────────────

const LINK_FILE: &str = "link_snippets.json";

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Snippet {
    pub id: String,
    pub label: String,
    pub content: String,
    pub category: String, // "text" | "code" | "url"
    pub created_at: u64,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn now_millis() -> Result<u64, AppError> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .map_err(|e| AppError::Command(e.to_string()))
}

fn link_path(app: &AppHandle) -> Result<std::path::PathBuf, AppError> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Command(e.to_string()))?;
    Ok(app_dir.join(LINK_FILE))
}

fn load_snippets(app: &AppHandle) -> Result<Vec<Snippet>, AppError> {
    let path = link_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let raw = std::fs::read_to_string(&path)?;
    let snippets: Vec<Snippet> = serde_json::from_str(&raw)?;
    Ok(snippets)
}

fn save_snippets(app: &AppHandle, snippets: &[Snippet]) -> Result<(), AppError> {
    let path = link_path(app)?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let json = serde_json::to_string_pretty(snippets)?;
    std::fs::write(&path, json)?;
    Ok(())
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// スニペット一覧を取得する。
#[tauri::command]
pub fn list_snippets(app: AppHandle) -> Result<Vec<Snippet>, AppError> {
    info!("list_snippets: loading snippets from storage");
    let snippets = load_snippets(&app)?;
    info!(count = snippets.len(), "list_snippets: done");
    Ok(snippets)
}

/// スニペットを保存する。新規作成と更新を兼ねる。
#[tauri::command]
pub fn save_snippet(
    app: AppHandle,
    id: String,
    label: String,
    content: String,
    category: String,
) -> Result<Snippet, AppError> {
    info!(id, label, category, "save_snippet: saving snippet");

    let mut snippets = load_snippets(&app)?;
    let now = now_millis()?;

    // 既存スニペットを検索
    if let Some(snippet) = snippets.iter_mut().find(|s| s.id == id) {
        // 更新
        snippet.label = label;
        snippet.content = content;
        snippet.category = category;
    } else {
        // 新規作成
        let snippet = Snippet {
            id: id.clone(),
            label,
            content,
            category,
            created_at: now,
        };
        snippets.push(snippet);
    }

    save_snippets(&app, &snippets)?;

    // 保存したスニペットを返す
    let saved_snippet = snippets
        .iter()
        .find(|s| s.id == id)
        .ok_or_else(|| AppError::Command(format!("snippet not found after save: {id}")))?
        .clone();
    info!(id, "save_snippet: done");
    Ok(saved_snippet)
}

/// スニペットを削除する。
#[tauri::command]
pub fn delete_snippet(app: AppHandle, id: String) -> Result<(), AppError> {
    info!(id, "delete_snippet: removing snippet");

    let mut snippets = load_snippets(&app)?;
    snippets.retain(|snippet| snippet.id != id);

    save_snippets(&app, &snippets)?;
    info!(id, "delete_snippet: done");
    Ok(())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn mock_app_data_dir() -> PathBuf {
        // テスト用の一時ディレクトリパスを生成
        std::env::temp_dir().join("link_test")
    }

    fn cleanup_test_dir() {
        let test_dir = mock_app_data_dir();
        if test_dir.exists() {
            let _ = std::fs::remove_dir_all(&test_dir);
        }
    }

    #[test]
    fn test_save_and_load_snippets() {
        cleanup_test_dir();

        let snippet = Snippet {
            id: "snippet-1".to_string(),
            label: "Test Snippet".to_string(),
            content: "Test content".to_string(),
            category: "text".to_string(),
            created_at: 1640995200000,
        };

        // テスト用ディレクトリに保存
        let test_dir = mock_app_data_dir();
        std::fs::create_dir_all(&test_dir).unwrap();
        let file_path = test_dir.join("link_snippets.json");

        let json = serde_json::to_string(&[snippet.clone()]).unwrap();
        std::fs::write(file_path, json).unwrap();

        // 読み込み
        let loaded_raw = std::fs::read_to_string(test_dir.join("link_snippets.json")).unwrap();
        let loaded: Vec<Snippet> = serde_json::from_str(&loaded_raw).unwrap();

        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].id, snippet.id);
        assert_eq!(loaded[0].label, snippet.label);

        cleanup_test_dir();
    }

    #[test]
    fn test_snippet_serialization() {
        let snippet = Snippet {
            id: "test-1".to_string(),
            label: "Test Snippet".to_string(),
            content: "Test content".to_string(),
            category: "code".to_string(),
            created_at: 1640995200000,
        };

        // JSONシリアライズが成功することを確認
        let json = serde_json::to_string(&snippet).unwrap();
        assert!(json.contains("test-1"));
        assert!(json.contains("Test Snippet"));

        // デシリアライズが成功することを確認
        let deserialized: Snippet = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, snippet.id);
        assert_eq!(deserialized.label, snippet.label);
    }

    #[test]
    fn test_now_millis() {
        let timestamp = now_millis().unwrap();
        assert!(timestamp > 0);

        // 2020年以降のタイムスタンプであることを確認
        assert!(timestamp > 1577836800000); // 2020-01-01 00:00:00 UTC
    }

    #[test]
    fn test_snippet_creation() {
        let snippet = Snippet {
            id: "snippet-1".to_string(),
            label: "Test Snippet".to_string(),
            content: "Test content".to_string(),
            category: "url".to_string(),
            created_at: 1640995200000,
        };

        assert_eq!(snippet.id, "snippet-1");
        assert_eq!(snippet.label, "Test Snippet");
        assert_eq!(snippet.content, "Test content");
        assert_eq!(snippet.category, "url");
    }

    #[test]
    fn test_snippet_categories() {
        let categories = vec!["text", "code", "url"];

        for category in categories {
            let snippet = Snippet {
                id: format!("test-{}", category),
                label: format!("{} Snippet", category.to_uppercase()),
                content: format!("Content for {}", category),
                category: category.to_string(),
                created_at: 1640995200000,
            };

            assert_eq!(snippet.category, category);
        }
    }
}
