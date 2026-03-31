//! v4 最適化サービス
//! 全 11 項目の候補取得・適用・リバートを管理する

mod apply;
mod candidates;
pub(crate) mod registry;
mod revert_store;
mod session;

pub use apply::apply_optimizations;
pub use candidates::get_candidates;
pub use revert_store::revert_all;
