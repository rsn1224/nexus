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

    #[error("未検出: {0}")]
    NotFound(String),

    #[error("不正な入力: {0}")]
    InvalidInput(String),

    #[error("検証エラー: {0}")]
    Validation(String),

    #[error("PowerShell実行エラー: {0}")]
    PowerShell(String),

    #[error("レジストリ操作エラー: {0}")]
    Registry(String),

    #[error("プロセス操作エラー: {0}")]
    Process(String),

    #[error("資格情報エラー: {0}")]
    Keyring(String),

    #[error("プロファイルエラー: {0}")]
    Profile(String),

    #[error("ゲーム監視エラー: {0}")]
    GameMonitor(String),

    #[error("フレームタイムエラー: {0}")]
    FrameTime(String),

    #[error("Win32 API エラー: {0}")]
    Win32(String),

    #[error("内部エラー: {0}")]
    Internal(String),
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
