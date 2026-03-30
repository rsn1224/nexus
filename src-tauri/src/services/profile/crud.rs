//! ゲームプロファイルの CRUD 操作

use std::path::{Path, PathBuf};

use tracing::{info, warn};
use uuid::Uuid;

use crate::error::AppError;
use crate::types::game::GameProfile;

/// profiles.json のファイル名
const PROFILES_FILE: &str = "profiles.json";

/// プロファイル保存パスを取得
fn profiles_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(PROFILES_FILE)
}

/// 全プロファイルを読み込む
pub fn load_profiles(app_data_dir: &Path) -> Result<Vec<GameProfile>, AppError> {
    let path = profiles_path(app_data_dir);
    if !path.exists() {
        info!("プロファイルファイルなし。空リストを返します: {:?}", path);
        return Ok(vec![]);
    }

    let json = std::fs::read_to_string(&path)
        .map_err(|e| AppError::Profile(format!("プロファイル読み込みエラー: {}", e)))?;

    let profiles: Vec<GameProfile> = serde_json::from_str(&json).map_err(|e| {
        warn!("プロファイル JSON 解析エラー: {}", e);
        AppError::Profile(format!("プロファイル解析エラー: {}", e))
    })?;

    info!("プロファイル {} 件読み込み完了", profiles.len());
    Ok(profiles)
}

/// 指定 ID のプロファイルを取得する
#[allow(dead_code)]
pub fn get_profile(app_data_dir: &Path, id: &str) -> Result<Option<GameProfile>, AppError> {
    let profiles = load_profiles(app_data_dir)?;
    Ok(profiles.into_iter().find(|p| p.id == id))
}

/// プロファイルを保存（新規作成 or 更新）
/// - `id` が空の場合は UUID v4 を自動生成
/// - `created_at` が 0 の場合は現在時刻を設定
/// - `updated_at` は常に現在時刻で上書き
#[allow(dead_code)]
pub fn save_profile(
    app_data_dir: &Path,
    mut profile: GameProfile,
) -> Result<GameProfile, AppError> {
    let mut profiles = load_profiles(app_data_dir)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // ID 自動生成
    if profile.id.is_empty() {
        profile.id = Uuid::new_v4().to_string();
        profile.created_at = now;
        info!(
            "新規プロファイル作成: id={}, name={}",
            profile.id, profile.display_name
        );
    } else {
        info!(
            "プロファイル更新: id={}, name={}",
            profile.id, profile.display_name
        );
    }
    profile.updated_at = now;

    // 既存プロファイルの置換 or 追加
    if let Some(pos) = profiles.iter().position(|p| p.id == profile.id) {
        profiles[pos] = profile.clone();
    } else {
        profiles.push(profile.clone());
    }

    write_profiles(app_data_dir, &profiles)?;
    Ok(profile)
}

/// プロファイルを削除
#[allow(dead_code)]
pub fn delete_profile(app_data_dir: &Path, id: &str) -> Result<(), AppError> {
    let mut profiles = load_profiles(app_data_dir)?;
    let before_len = profiles.len();
    profiles.retain(|p| p.id != id);

    if profiles.len() == before_len {
        warn!("削除対象プロファイルが見つかりません: id={}", id);
        return Err(AppError::Profile(format!(
            "プロファイルが見つかりません: {}",
            id
        )));
    }

    write_profiles(app_data_dir, &profiles)?;
    info!("プロファイル削除完了: id={}", id);
    Ok(())
}

/// プロファイルリストを JSON ファイルに書き込む
pub(super) fn write_profiles(
    app_data_dir: &Path,
    profiles: &[GameProfile],
) -> Result<(), AppError> {
    // ディレクトリが存在しない場合は作成
    if !app_data_dir.exists() {
        std::fs::create_dir_all(app_data_dir)
            .map_err(|e| AppError::Profile(format!("データディレクトリ作成エラー: {}", e)))?;
    }

    let json = serde_json::to_string_pretty(profiles)
        .map_err(|e| AppError::Profile(format!("プロファイルシリアライズエラー: {}", e)))?;

    std::fs::write(profiles_path(app_data_dir), json)
        .map_err(|e| AppError::Profile(format!("プロファイル書き込みエラー: {}", e)))?;

    Ok(())
}
