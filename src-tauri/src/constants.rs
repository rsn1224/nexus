// ─── Constants ───────────────────────────────────────────────────────────────

/// 保護プロセスリスト — kill / 優先度変更の対象外
/// 拡張子なしの正規化名で管理（比較時に .exe を除去して小文字化）
pub const PROTECTED_PROCESSES: &[&str] = &[
    "system", "registry", "smss", "csrss", "wininit", "winlogon", "lsass", "services", "svchost",
    "dwm", "explorer", "msmpeng", // Windows Defender
    "msseces", // Microsoft Security Essentials
    "avp",     // Kaspersky
    "nexus",   // 自アプリ
];

/// デフォルトのサスペンド候補プロセスリスト
/// ゲーム起動時に自動でサスペンドが推奨されるバックグラウンドプロセス
/// 拡張子なしの正規化名で管理（比較時に .exe を除去して小文字化）
pub const DEFAULT_SUSPEND_CANDIDATES: &[&str] = &[
    // Webブラウザ
    "chrome", "firefox", "msedge", "opera", "brave",
    // コーディング/開発ツール
    "code", "devenv", "sublime_text", "notepad++",
    // 通信ソフト
    "discord", "slack", "teams", "zoom", "skype",
    // メディアプレイヤー
    "spotify", "vlc", "wmplayer", "itunes",
    // その他
    "onedrive", "dropbox", "googledrive", "acrobat", "winword", "excel", "powerpnt",
];

/// サーマル監視の温度閾値（摂氏）
/// フロントエンドの src/lib/constants.ts と値を合わせること
pub const THERMAL_THRESHOLDS: ThermalThresholds = ThermalThresholds {
    cpu_warning_c: 75.0,   // CPU_TEMP_WARN_C
    cpu_critical_c: 90.0,  // CPU_TEMP_CRITICAL_C
    gpu_warning_c: 85.0,   // GPU_TEMP_WARN_C
    gpu_critical_c: 95.0,  // GPU_TEMP_CRITICAL_C
};

/// 温度閾値設定構造体
pub struct ThermalThresholds {
    pub cpu_warning_c: f32,
    pub cpu_critical_c: f32,
    pub gpu_warning_c: f32,
    pub gpu_critical_c: f32,
}

/// プロセス名が保護リストに含まれるか判定
/// `.exe` を除去（大文字小文字を区別せず）、小文字化してから比較
pub fn is_protected_process(name: &str) -> bool {
    let name_lower = name.to_lowercase();
    let normalized = name_lower.strip_suffix(".exe").unwrap_or(&name_lower);
    PROTECTED_PROCESSES.contains(&normalized)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_protected_with_exe() {
        assert!(is_protected_process("explorer.exe"));
        assert!(is_protected_process("svchost.exe"));
        assert!(is_protected_process("nexus.exe"));
    }

    #[test]
    fn test_is_protected_without_exe() {
        assert!(is_protected_process("System"));
        assert!(is_protected_process("csrss"));
        assert!(is_protected_process("LSASS"));
    }

    #[test]
    fn test_is_protected_case_insensitive() {
        assert!(is_protected_process("explorer.EXE"));
        assert!(is_protected_process("SVCHOST.exe"));
        assert!(is_protected_process("DWM"));
    }

    #[test]
    fn test_non_protected() {
        assert!(!is_protected_process("chrome.exe"));
        assert!(!is_protected_process("notepad.exe"));
        assert!(!is_protected_process("game.exe"));
    }
}
