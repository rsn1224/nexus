//! ブーストロジック（services 層）
//! 仕様: docs/specs/game-enhancement-spec.md §6
//!
//! Phase 8a: Level 1（ソフト — バックグラウンドプロセス一時停止）
//! Phase 8b: Level 2/3（ミディアム/ハード — 電源プラン・アフィニティ・プロセス終了）

mod apply;
mod levels;
mod revert;
mod utils;

pub use apply::*;
pub use revert::revert_boost;

// ─── テスト ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use crate::constants::is_protected_process;
    use crate::types::game::BoostLevel;

    #[test]
    fn test_find_pids_returns_empty_for_nonexistent() {
        // State を直接作れないので、ロジックの単体テストは限定的
        // 統合テストは commands 層 or E2E で行う
    }

    #[test]
    fn test_boost_level_determines_action() {
        // BoostLevel の判定ロジックが正しいことを確認
        assert!(BoostLevel::None < BoostLevel::Soft);
        assert!(BoostLevel::Soft < BoostLevel::Medium);
    }

    #[test]
    fn test_protected_process_skipped() {
        assert!(is_protected_process("explorer.exe"));
        assert!(is_protected_process("svchost.exe"));
        assert!(!is_protected_process("chrome.exe"));
    }
}
