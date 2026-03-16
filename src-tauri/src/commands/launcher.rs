// Launcher Wing — Steam ゲームスキャン・起動機能

use crate::error::AppError;
use std::fs;
use std::path::PathBuf;
use tracing::info;

#[derive(Debug, serde::Serialize)]
pub struct GameInfo {
    pub app_id: u32,
    pub name: String,
    pub install_path: String,
    pub size_gb: f64,
}

// ─── Steam パス検索 ───────────────────────────────────────────────────────────

fn find_steam_path() -> Option<PathBuf> {
    let candidates: Vec<PathBuf> = vec![
        PathBuf::from(r"C:\Program Files (x86)\Steam"),
        PathBuf::from(r"C:\Program Files\Steam"),
    ];

    let from_env: Vec<PathBuf> = ["ProgramFiles(x86)", "ProgramFiles"]
        .iter()
        .filter_map(|var| std::env::var(var).ok())
        .map(|p| PathBuf::from(p).join("Steam"))
        .collect();

    candidates.into_iter().chain(from_env).find(|p| p.exists())
}

// ─── VDF パーサー（簡易版） ────────────────────────────────────────────────────

/// `"key"  "value"` 形式の行を (key, value) にパース
fn parse_vdf_pair(line: &str) -> Option<(&str, &str)> {
    let line = line.trim();
    if !line.starts_with('"') {
        return None;
    }
    let rest = &line[1..];
    let key_end = rest.find('"')?;
    let key = &rest[..key_end];
    let rest = rest[key_end + 1..].trim_start();
    if !rest.starts_with('"') {
        return None;
    }
    let rest = &rest[1..];
    let val_end = rest.find('"')?;
    Some((key, &rest[..val_end]))
}

/// libraryfolders.vdf から追加ライブラリパスを収集
fn collect_library_steamapps(steam_path: &std::path::Path) -> Vec<PathBuf> {
    let mut paths = vec![steam_path.join("steamapps")];

    let vdf = steam_path.join("steamapps").join("libraryfolders.vdf");
    if let Ok(content) = fs::read_to_string(&vdf) {
        for line in content.lines() {
            if let Some((_, value)) = parse_vdf_pair(line) {
                if value.contains(":\\") || value.starts_with('/') {
                    let candidate = PathBuf::from(value).join("steamapps");
                    if candidate.exists() {
                        paths.push(candidate);
                    }
                }
            }
        }
    }

    paths
}

/// appmanifest_*.acf から (app_id, name, installdir) を抽出
fn parse_acf(content: &str) -> Option<(u32, String, String)> {
    let mut app_id: Option<u32> = None;
    let mut name: Option<String> = None;
    let mut install_dir: Option<String> = None;

    for line in content.lines() {
        if let Some((key, value)) = parse_vdf_pair(line) {
            match key {
                "appid" => app_id = value.parse().ok(),
                "name" => name = Some(value.to_string()),
                "installdir" => install_dir = Some(value.to_string()),
                _ => {}
            }
        }
    }

    Some((app_id?, name?, install_dir?))
}

// ─── Tauri コマンド ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn scan_steam_games() -> Result<Vec<GameInfo>, AppError> {
    info!("scan_steam_games: starting Steam library scan");

    let steam_path =
        find_steam_path().ok_or_else(|| AppError::Io("Steam not found".to_string()))?;

    let mut games = Vec::new();

    for steamapps in collect_library_steamapps(&steam_path) {
        let entries = match fs::read_dir(&steamapps) {
            Ok(e) => e,
            Err(_) => continue,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            let file_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default();

            if file_name.starts_with("appmanifest_") && file_name.ends_with(".acf") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Some((app_id, name, install_dir)) = parse_acf(&content) {
                        let install_path = steamapps
                            .join("common")
                            .join(&install_dir)
                            .to_string_lossy()
                            .to_string();

                        games.push(GameInfo {
                            app_id,
                            name,
                            install_path,
                            size_gb: 0.0,
                        });
                    }
                }
            }
        }
    }

    info!("scan_steam_games: found {} games", games.len());
    Ok(games)
}

#[tauri::command]
pub async fn launch_game(app_id: u32) -> Result<(), AppError> {
    info!(app_id, "launch_game: launching Steam game");

    let steam_url = format!("steam://rungameid/{}", app_id);

    std::process::Command::new("cmd")
        .args(["/c", "start", "", &steam_url])
        .spawn()
        .map_err(|e| AppError::Io(e.to_string()))?;

    info!(app_id, "launch_game: done");
    Ok(())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_vdf_pair_valid() {
        let line = r#"	"name"		"Counter-Strike 2""#;
        let result = parse_vdf_pair(line);
        assert_eq!(result, Some(("name", "Counter-Strike 2")));
    }

    #[test]
    fn test_parse_vdf_pair_invalid() {
        assert_eq!(parse_vdf_pair(""), None);
        assert_eq!(parse_vdf_pair("{"), None);
        assert_eq!(parse_vdf_pair("}"), None);
    }

    #[test]
    fn test_parse_acf() {
        let content = r#""AppState"
{
	"appid"		"570"
	"name"		"Dota 2"
	"installdir"		"dota 2 beta"
}"#;
        let result = parse_acf(content);
        assert!(result.is_some()); // OK in tests
        let (app_id, name, install_dir) = result.unwrap(); // OK in tests
        assert_eq!(app_id, 570);
        assert_eq!(name, "Dota 2");
        assert_eq!(install_dir, "dota 2 beta");
    }

    #[test]
    fn test_parse_acf_missing_fields() {
        let content = r#""AppState"
{
	"appid"		"100"
}"#;
        // name と installdir が欠如 → None が返る
        assert!(parse_acf(content).is_none());
    }
}
