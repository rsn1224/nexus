//! ETW フレームタイム監視（infra 層）
//! PresentMon と同様のアプローチで DXGI/D3D9 Present イベントを受信する。
//!
//! ETW プロバイダー:
//!   - Microsoft-Windows-DXGI:  {CA11C036-0102-4A2D-A6AD-F03CFED5D3C9}
//!   - Microsoft-Windows-D3D9:  {783ACA0A-790E-4D7F-8451-AA850511C6B9}
//!
//! 監視対象イベント:
//!   - DXGI Present::Start (Event ID 0x2a = 42)
//!   - D3D9 Present::Start (Event ID 0x01 = 1)
//!
//! 参考: https://github.com/GameTechDev/PresentMon

#[cfg(windows)]
use crate::error::AppError;
#[cfg(windows)]
use ferrisetw::{provider::Provider, schema_locator::SchemaLocator, trace::UserTrace};
#[cfg(windows)]
use std::sync::{Arc, Mutex};
#[cfg(windows)]
use std::time::Instant;
#[cfg(windows)]
use tracing::info;

#[cfg(not(windows))]
use crate::error::AppError;

/// DXGI プロバイダー GUID
#[cfg(windows)]
const DXGI_GUID: &str = "CA11C036-0102-4A2D-A6AD-F03CFED5D3C9";
/// D3D9 プロバイダー GUID
#[cfg(windows)]
const D3D9_GUID: &str = "783ACA0A-790E-4D7F-8451-AA850511C6B9";

/// DXGI Present::Start イベント ID
#[cfg(windows)]
const DXGI_PRESENT_START: u16 = 42; // 0x2a
/// D3D9 Present::Start イベント ID
#[cfg(windows)]
const D3D9_PRESENT_START: u16 = 1; // 0x01

/// フレームイベント — Present::Start のタイムスタンプを記録
#[derive(Debug, Clone)]
pub struct FrameEvent {
    pub pid: u32,
    pub timestamp: Instant,
}

/// ETW トレースセッションのハンドル
#[cfg(windows)]
pub struct EtwSession {
    _trace: UserTrace,
}

/// フレームイベントの受信バッファ（スレッド間共有）
#[cfg(windows)]
pub type FrameEventBuffer = Arc<Mutex<Vec<FrameEvent>>>;

/// ETW トレースセッションを開始し、Present::Start イベントを受信する。
///
/// # 引数
/// - `target_pid`: 監視対象のプロセスID（None の場合は全プロセス）
/// - `buffer`: フレームイベントの蓄積先バッファ
///
/// # 戻り値
/// - `EtwSession`: セッションハンドル（drop で自動停止）
///
/// # エラー
/// - 管理者権限がない場合
/// - ETW セッションの開始に失敗した場合
#[cfg(windows)]
pub fn start_trace(
    target_pid: Option<u32>,
    buffer: FrameEventBuffer,
) -> Result<EtwSession, AppError> {
    let buffer_dxgi = Arc::clone(&buffer);
    let buffer_d3d9 = Arc::clone(&buffer);

    // DXGI プロバイダー設定
    let dxgi_provider = Provider::by_guid(DXGI_GUID);
    let d3d9_provider = Provider::by_guid(D3D9_GUID);

    // DXGI プロバイダー設定
    let dxgi_provider = dxgi_provider
        .add_callback(move |record, schema_locator| {
            handle_present_event(
                record,
                schema_locator,
                DXGI_PRESENT_START,
                target_pid,
                &buffer_dxgi,
            );
        })
        .build();

    // D3D9 プロバイダー設定
    let d3d9_provider = d3d9_provider
        .add_callback(move |record, schema_locator| {
            handle_present_event(
                record,
                schema_locator,
                D3D9_PRESENT_START,
                target_pid,
                &buffer_d3d9,
            );
        })
        .build();

    // ETW リアルタイムトレースセッション開始
    let trace = UserTrace::new()
        .named("nexus-frame-time".to_string())
        .enable(dxgi_provider)
        .enable(d3d9_provider)
        .start_and_process()
        .map_err(|e| {
            AppError::FrameTime(format!(
                "ETW セッション開始失敗: {:?}。管理者権限で実行してください。",
                e
            ))
        })?;

    info!("ETW フレームタイム監視を開始 (PID: {:?})", target_pid);
    Ok(EtwSession { _trace: trace })
}

/// ETW セッションを停止する。
#[cfg(windows)]
impl EtwSession {
    pub fn stop(self) {
        // UserTrace は drop 時に自動停止するが、明示的に呼ぶこともできる
        info!("ETW フレームタイム監視を停止");
    }
}

/// Present::Start イベントを処理するコールバック
#[cfg(windows)]
fn handle_present_event(
    record: &ferrisetw::EventRecord,
    _schema_locator: &SchemaLocator,
    expected_event_id: u16,
    target_pid: Option<u32>,
    buffer: &FrameEventBuffer,
) {
    let event_id = record.event_id();
    if event_id != expected_event_id {
        return;
    }

    let pid = record.process_id();

    // PID フィルタリング
    if let Some(target) = target_pid {
        if pid != target {
            return;
        }
    }

    // フレームイベントをバッファに追加
    if let Ok(mut buf) = buffer.lock() {
        buf.push(FrameEvent {
            pid,
            timestamp: Instant::now(),
        });
        // バッファサイズを制限（直最近18000イベントを保持）
        if buf.len() > 18000 {
            let drain_count = buf.len() - 18000;
            buf.drain(0..drain_count);
        }
    }
}

/// 非 Windows プラットフォーム用のスタブ実装
#[cfg(not(windows))]
pub fn start_trace(
    _target_pid: Option<u32>,
    _buffer: Arc<Mutex<Vec<FrameEvent>>>,
) -> Result<(), AppError> {
    Err(AppError::Process(
        "ETW フレームタイム監視は Windows のみサポートされています".to_string(),
    ))
}

#[cfg(not(windows))]
pub struct EtwSession;

#[cfg(not(windows))]
impl EtwSession {
    pub fn stop(self) {
        // No-op on non-Windows
    }
}

#[cfg(not(windows))]
pub type FrameEventBuffer = Arc<Mutex<Vec<FrameEvent>>>;

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_guid_parsing() {
        // GUID が正しくパースできることを確認
        assert!(DXGI_GUID.parse::<uuid::Uuid>().is_ok());
        assert!(D3D9_GUID.parse::<uuid::Uuid>().is_ok());
    }
}
