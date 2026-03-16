use crate::error::AppError;
use feed_rs::parser;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{interval, Duration};
use tracing::info;
use uuid::Uuid;

// ─── Constants ────────────────────────────────────────────────────────────────

const FEEDS_FILE: &str = "signal_feeds.json";

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignalFeed {
    pub id: String,
    pub label: String,
    pub url: String,
    pub kind: String, // "rss" | "http"
    pub interval_secs: u64,
    pub last_checked: u64,
    pub is_active: bool,
    pub last_result: Option<SignalResult>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignalResult {
    pub title: String,
    pub link: Option<String>,
    pub description: Option<String>,
    pub published: u64,
    pub guid: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct FeedConfig {
    feeds: Vec<SignalFeed>,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn load_feeds(app: &AppHandle) -> Result<Vec<SignalFeed>, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("Failed to get app data dir: {}", e)))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| AppError::Io(format!("Failed to create app data dir: {}", e)))?;

    let feeds_path = app_data_dir.join(FEEDS_FILE);
    if feeds_path.exists() {
        let content = std::fs::read_to_string(feeds_path)
            .map_err(|e| AppError::Io(format!("Failed to read feeds file: {}", e)))?;
        let config: FeedConfig = serde_json::from_str(&content)
            .map_err(|e| AppError::Io(format!("Failed to parse feeds file: {}", e)))?;
        Ok(config.feeds)
    } else {
        Ok(vec![])
    }
}

fn save_feeds(app: &AppHandle, feeds: &[SignalFeed]) -> Result<(), AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("Failed to get app data dir: {}", e)))?;

    let feeds_path = app_data_dir.join(FEEDS_FILE);
    let config = FeedConfig {
        feeds: feeds.to_vec(),
    };

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| AppError::Io(format!("Failed to serialize feeds: {}", e)))?;

    std::fs::write(feeds_path, content)
        .map_err(|e| AppError::Io(format!("Failed to write feeds file: {}", e)))?;

    Ok(())
}

async fn fetch_rss_feed(url: &str) -> Result<Vec<SignalResult>, AppError> {
    let response = reqwest::get(url)
        .await
        .map_err(|e| AppError::Io(format!("Failed to fetch RSS feed: {}", e)))?;

    let content = response
        .text()
        .await
        .map_err(|e| AppError::Io(format!("Failed to read RSS content: {}", e)))?;

    let feed = parser::parse(content.as_bytes())
        .map_err(|e| AppError::Io(format!("Failed to parse RSS feed: {}", e)))?;

    let results: Vec<SignalResult> = feed
        .entries
        .into_iter()
        .map(|entry| SignalResult {
            title: entry.title.map(|t| t.content).unwrap_or_default(),
            link: entry.links.first().map(|l| l.href.clone()),
            description: entry.content.and_then(|c| c.body),
            published: entry
                .published
                .map(|dt| dt.timestamp() as u64)
                .unwrap_or_else(now_secs),
            guid: Some(entry.id),
        })
        .collect();

    Ok(results)
}

async fn fetch_http_status(url: &str) -> Result<Vec<SignalResult>, AppError> {
    let response = reqwest::get(url)
        .await
        .map_err(|e| AppError::Io(format!("Failed to fetch HTTP URL: {}", e)))?;

    let status = response.status();
    let title = format!("HTTP {}", status.as_u16());
    let description = format!("Status: {}", status.as_str());

    Ok(vec![SignalResult {
        title,
        link: Some(url.to_string()),
        description: Some(description),
        published: now_secs(),
        guid: Some(format!("status-{}", now_secs())),
    }])
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn list_signal_feeds(app: AppHandle) -> Result<Vec<SignalFeed>, AppError> {
    info!("list_signal_feeds: loading feeds");
    let feeds = load_feeds(&app)?;
    info!(count = feeds.len(), "list_signal_feeds: done");
    Ok(feeds)
}

#[tauri::command]
pub fn add_signal_feed(
    app: AppHandle,
    label: String,
    url: String,
    kind: String,
    interval_secs: u64,
) -> Result<SignalFeed, AppError> {
    info!(label, url, kind, "add_signal_feed: adding feed");

    let mut feeds = load_feeds(&app)?;

    // 重複チェック
    if feeds.iter().any(|f| f.url == url) {
        return Err(AppError::Command(format!("Feed already exists: {}", url)));
    }

    let feed = SignalFeed {
        id: Uuid::new_v4().to_string(),
        label,
        url,
        kind,
        interval_secs,
        last_checked: 0,
        is_active: true,
        last_result: None,
    };

    feeds.push(feed.clone());
    save_feeds(&app, &feeds)?;

    info!(id = feed.id, "add_signal_feed: done");
    Ok(feed)
}

#[tauri::command]
pub fn remove_signal_feed(app: AppHandle, id: String) -> Result<(), AppError> {
    info!(id, "remove_signal_feed: removing feed");

    let mut feeds = load_feeds(&app)?;
    feeds.retain(|f| f.id != id);
    save_feeds(&app, &feeds)?;

    info!(id, "remove_signal_feed: done");
    Ok(())
}

#[tauri::command]
pub fn toggle_signal_feed(app: AppHandle, id: String) -> Result<(), AppError> {
    info!(id, "toggle_signal_feed: toggling feed");

    let mut feeds = load_feeds(&app)?;
    let is_active = {
        let feed = feeds
            .iter_mut()
            .find(|f| f.id == id)
            .ok_or_else(|| AppError::Command(format!("Feed not found: {}", id)))?;

        feed.is_active = !feed.is_active;
        feed.is_active
    };

    save_feeds(&app, &feeds)?;

    info!(id, is_active, "toggle_signal_feed: done");
    Ok(())
}

#[tauri::command]
pub async fn check_feed_now(app: AppHandle, id: String) -> Result<Vec<SignalResult>, AppError> {
    info!(id, "check_feed_now: checking feed");

    let mut feeds = load_feeds(&app)?;
    let feed = feeds
        .iter_mut()
        .find(|f| f.id == id)
        .ok_or_else(|| AppError::Command(format!("Feed not found: {}", id)))?;

    let results = if feed.kind == "rss" {
        fetch_rss_feed(&feed.url).await?
    } else {
        fetch_http_status(&feed.url).await?
    };

    feed.last_checked = now_secs();
    feed.last_result = Some(
        results
            .clone()
            .first()
            .cloned()
            .unwrap_or_else(|| SignalResult {
                title: "No results".to_string(),
                link: None,
                description: None,
                published: now_secs(),
                guid: None,
            }),
    );

    save_feeds(&app, &feeds)?;

    info!(id, count = results.len(), "check_feed_now: done");
    Ok(results)
}

// ─── Background Polling ───────────────────────────────────────────────────────

#[allow(dead_code)]
pub async fn start_background_polling(app: AppHandle) -> Result<(), AppError> {
    info!("start_background_polling: starting");

    let app_clone = app.clone();
    tokio::spawn(async move {
        let mut interval = interval(Duration::from_secs(60)); // Check every minute

        loop {
            interval.tick().await;

            if let Ok(mut feeds) = load_feeds(&app_clone) {
                let now = now_secs();
                let mut updated = false;

                for feed in feeds.iter_mut() {
                    if !feed.is_active {
                        continue;
                    }

                    if now >= feed.last_checked + feed.interval_secs {
                        info!(id = feed.id, "background polling: checking feed");

                        let results = if feed.kind == "rss" {
                            fetch_rss_feed(&feed.url).await.unwrap_or_else(|e| {
                                tracing::error!(error = %e, "Failed to check RSS feed");
                                vec![]
                            })
                        } else {
                            fetch_http_status(&feed.url).await.unwrap_or_else(|e| {
                                tracing::error!(error = %e, "Failed to check HTTP URL");
                                vec![]
                            })
                        };

                        if let Some(first_result) = results.first() {
                            feed.last_checked = now;
                            feed.last_result = Some(first_result.clone());
                            updated = true;

                            // Emit event to frontend
                            if let Err(e) = app_clone.emit("signal-updated", &first_result) {
                                tracing::error!(error = %e, "Failed to emit signal-updated event");
                            }
                        }
                    }
                }

                if updated {
                    if let Err(e) = save_feeds(&app_clone, &feeds) {
                        tracing::error!(error = %e, "Failed to save updated feeds");
                    }
                }
            }
        }
    });

    info!("start_background_polling: started");
    Ok(())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_now_secs_returns_positive() {
        let result = now_secs();
        assert!(result > 0, "now_secs should return positive timestamp");
    }

    #[test]
    fn test_signal_feed_serialization() {
        let feed = SignalFeed {
            id: "test-id".to_string(),
            label: "Test Feed".to_string(),
            url: "https://example.com/feed".to_string(),
            kind: "rss".to_string(),
            interval_secs: 300,
            last_checked: 1234567890,
            is_active: true,
            last_result: None,
        };

        let json = serde_json::to_string(&feed).expect("should serialize");
        let deserialized: SignalFeed = serde_json::from_str(&json).expect("should deserialize");

        assert_eq!(feed.id, deserialized.id);
        assert_eq!(feed.label, deserialized.label);
    }

    #[test]
    fn test_signal_result_serialization() {
        let result = SignalResult {
            title: "Test Title".to_string(),
            link: Some("https://example.com".to_string()),
            description: Some("Test Description".to_string()),
            published: 1234567890,
            guid: Some("test-guid".to_string()),
        };

        let json = serde_json::to_string(&result).expect("should serialize");
        let deserialized: SignalResult = serde_json::from_str(&json).expect("should deserialize");

        assert_eq!(result.title, deserialized.title);
        assert_eq!(result.link, deserialized.link);
    }
}
