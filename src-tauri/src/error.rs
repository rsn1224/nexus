use serde::Serialize;
use std::fmt;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    Io(String),

    Network(String),

    Serialization(String),

    Command(String),

    NotFound(String),

    InvalidInput(String),

    Validation(String),

    PowerShell(String),

    Registry(String),

    Process(String),

    Keyring(String),

    Profile(String),

    Power(String),

    PowerPlan(String),

    GameMonitor(String),

    LauncherError(String),

    FrameTime(String),

    Win32(String),

    Internal(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(msg) => write!(f, "IOエラー: {}", msg),
            Self::Network(msg) => write!(f, "ネットワークエラー: {}", msg),
            Self::Serialization(msg) => write!(f, "シリアライズエラー: {}", msg),
            Self::Command(msg) => write!(f, "コマンドエラー: {}", msg),
            Self::NotFound(msg) => write!(f, "未検出: {}", msg),
            Self::InvalidInput(msg) => write!(f, "不正な入力: {}", msg),
            Self::Validation(msg) => write!(f, "検証エラー: {}", msg),
            Self::PowerShell(msg) => write!(f, "PowerShell実行エラー: {}", msg),
            Self::Registry(msg) => write!(f, "レジストリ操作エラー: {}", msg),
            Self::Process(msg) => write!(f, "プロセス操作エラー: {}", msg),
            Self::Keyring(msg) => write!(f, "資格情報エラー: {}", msg),
            Self::Profile(msg) => write!(f, "プロファイルエラー: {}", msg),
            Self::Power(msg) => write!(f, "電源プランエラー: {}", msg),
            Self::PowerPlan(msg) => write!(f, "コアパーキングエラー: {}", msg),
            Self::GameMonitor(msg) => write!(f, "ゲーム監視エラー: {}", msg),
            Self::LauncherError(msg) => write!(f, "ランチャー設定エラー: {}", msg),
            Self::FrameTime(msg) => write!(f, "フレームタイムエラー: {}", msg),
            Self::Win32(msg) => write!(f, "Win32 API エラー: {}", msg),
            Self::Internal(msg) => write!(f, "内部エラー: {}", msg),
        }
    }
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
