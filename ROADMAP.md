# NEXUS — Roadmap

## v4.0: 30秒ルーティン（現行）

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 0 | クリーンアップ — 旧 Wing/Stitch/v2 型を全削除 | ✅ 完了 |
| Phase 1 | 設計ドキュメント — DESIGN.md v4 + ROADMAP + CLAUDE.md 更新 | ✅ 完了 |
| Phase 2 | Rust バックエンド整理 — 7コマンド体系に再編 | ✅ 完了 |
| Phase 3 | フロントエンド実装 — 1画面 UI 新規作成 | ✅ 完了 |
| Phase 4 | 統合 + リリース — E2E テスト + 品質ゲート | ✅ 完了 |

### 実装済み機能（v4.0）

- CPU Boost + ハードウェア監視 + ネットワーク最適化（既存 Rust ロジック再利用）
- 電源プラン切替 + レジストリチューン + サービス一時停止（新規）
- パフォーマンスモニター表示（before/after 差分）
- L1 ルールベース診断

---

## v4.1: AI 診断（🔵 pending）

- **L2 Ollama 診断** — Qwen 3.5-4B ローカル LLM でシステム状態を分析
- **L3 Perplexity Sonar 診断** — Web 検索連携で最新ドライバ情報を含む診断
- **NVIDIA GPU 設定自動適用** — nvml-wrapper 経由で GPU クロック・ファン制御

---

## v4.2: 拡張機能（計画）

- メモリクリーンアップ — WorkingSet トリミング + ページファイル最適化
- ストレージ S.M.A.R.T. — ディスク健全性モニタリング
- ベンチマークモード — 最適化前後の定量比較

---

## アーカイブ

| バージョン | ドキュメント |
|-----------|------------|
| v1 | `docs/archive/DESIGN_v1.md` |
| v3 | `docs/archive/DESIGN_v3.md`, `docs/archive/ROADMAP_v3.md` |
