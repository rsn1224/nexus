use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tracing::info;
use uuid::Uuid;

// ─── Constants ────────────────────────────────────────────────────────────────

const ARCHIVE_FILE: &str = "archive.json";

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveNote {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub links: Vec<String>,
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

fn archive_path(app: &AppHandle) -> Result<std::path::PathBuf, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Command(e.to_string()))?;
    Ok(dir.join(ARCHIVE_FILE))
}

fn load_notes(app: &AppHandle) -> Result<Vec<ArchiveNote>, AppError> {
    let path = archive_path(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let raw = std::fs::read_to_string(&path)?;
    Ok(serde_json::from_str(&raw)?)
}

fn persist_notes(app: &AppHandle, notes: &[ArchiveNote]) -> Result<(), AppError> {
    let path = archive_path(app)?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    std::fs::write(&path, serde_json::to_string_pretty(notes)?)?;
    Ok(())
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// 保存済みノート一覧を返す（更新日時降順）。
#[tauri::command]
pub fn list_notes(app: AppHandle) -> Result<Vec<ArchiveNote>, AppError> {
    info!("list_notes: fetching archive notes");
    let mut notes = load_notes(&app)?;
    notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    info!(count = notes.len(), "list_notes: done");
    Ok(notes)
}

/// ノートを追加・上書き保存する。id が空なら新規作成。
#[tauri::command]
pub fn save_note(
    app: AppHandle,
    id: String,
    title: String,
    content: String,
    tags: Vec<String>,
    links: Vec<String>,
) -> Result<ArchiveNote, AppError> {
    info!(title = %title, "save_note: saving");
    let now = now_millis()?;
    let mut notes = load_notes(&app)?;

    if id.is_empty() {
        let note = ArchiveNote {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            tags,
            links,
            created_at: now,
            updated_at: now,
        };
        notes.push(note.clone());
        persist_notes(&app, &notes)?;
        Ok(note)
    } else {
        let pos = notes
            .iter()
            .position(|n| n.id == id)
            .ok_or_else(|| AppError::NotFound(format!("note {id}")))?;
        notes[pos].title = title;
        notes[pos].content = content;
        notes[pos].tags = tags;
        notes[pos].links = links;
        notes[pos].updated_at = now;
        let updated = notes[pos].clone();
        persist_notes(&app, &notes)?;
        Ok(updated)
    }
}

/// ノートを削除する。
#[tauri::command]
pub fn delete_note(app: AppHandle, id: String) -> Result<(), AppError> {
    info!(id = %id, "delete_note: removing");
    let mut notes = load_notes(&app)?;
    let before = notes.len();
    notes.retain(|n| n.id != id);
    if notes.len() == before {
        return Err(AppError::NotFound(format!("note {id}")));
    }
    persist_notes(&app, &notes)?;
    Ok(())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_note(id: &str, title: &str, updated_at: u64) -> ArchiveNote {
        ArchiveNote {
            id: id.to_string(),
            title: title.to_string(),
            content: String::new(),
            tags: vec![],
            links: vec![],
            created_at: 0,
            updated_at,
        }
    }

    #[test]
    fn test_notes_sort_by_updated_desc() {
        let mut notes = vec![
            make_note("a", "old", 100),
            make_note("b", "new", 300),
            make_note("c", "mid", 200),
        ];
        notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        assert_eq!(notes[0].id, "b");
        assert_eq!(notes[1].id, "c");
        assert_eq!(notes[2].id, "a");
    }

    #[test]
    fn test_archive_note_serializes_camel_case() {
        let note = make_note("test-id", "Hello", 12345);
        let json = serde_json::to_value(&note).expect("should serialize"); // OK in tests
        assert!(json.get("createdAt").is_some(), "createdAt should exist");
        assert!(json.get("updatedAt").is_some(), "updatedAt should exist");
        assert!(
            json.get("created_at").is_none(),
            "snake_case should not exist"
        );
    }
}
