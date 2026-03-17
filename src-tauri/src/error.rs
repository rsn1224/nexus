use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    #[error("IOエラー: {0}")]
    Io(String),

    #[error("シリアライズエラー: {0}")]
    Serialization(String),

    #[error("コマンドエラー: {0}")]
    Command(String),

    #[allow(dead_code)]
    #[error("未検出: {0}")]
    NotFound(String),

    #[error("不正な入力: {0}")]
    InvalidInput(String),

    #[allow(dead_code)]
    #[error("権限不足: {0}")]
    Unauthorized(String),

    #[allow(dead_code)]
    #[error("PowerShell実行エラー: {0}")]
    PowerShell(String),

    #[allow(dead_code)]
    #[error("レジストリ操作エラー: {0}")]
    Registry(String),

    #[allow(dead_code)]
    #[error("プロセス操作エラー: {0}")]
    Process(String),

    #[allow(dead_code)]
    #[error("資格情報エラー: {0}")]
    Keyring(String),

    #[allow(dead_code)]
    #[error("プロファイルエラー: {0}")]
    Profile(String),

    #[allow(dead_code)]
    #[error("ゲーム監視エラー: {0}")]
    GameMonitor(String),

    #[allow(dead_code)]
    #[error("Win32 API エラー: {0}")]
    Win32(String),
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        Self::Io(e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        Self::Serialization(e.to_string())
    }
}
