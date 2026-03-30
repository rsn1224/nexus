//! Watchdog ルールエンジン
//! ops_emitter の出力を入力として、ルール条件に合致するプロセスにアクションを適用。
//! 3秒ごとの ops_emitter サイクルと同期して実行。

mod actions;
mod engine;
mod presets;

pub use engine::*;

#[cfg(test)]
mod tests;
