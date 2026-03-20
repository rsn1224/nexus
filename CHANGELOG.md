# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/)

## [Unreleased]

### Changed
- Stitch デザイン Phase D-1: Razer HUD カラーパレット + CSS エフェクト全面適用
- nexus-* カラーエイリアスを @theme トークンに統一（27ファイル）
- color-purple → color-amber にリネーム（実際の値に合わせて命名修正）
- --font-mono を JetBrains Mono に変更（Inter → 正しいモノスペースフォント）

### Added
- cleanup コマンドモジュール（Rust）
- TelemetryCard 再実装 + デザイントークン統一
- Stitch デザイン全 Wing 変換（core / arsenal / tactics / logs / settings）

### Fixed
- フィーチャーフラグ二重定義解消（App.tsx / GamesLibrary.tsx のローカル定義削除）
- 入力バリデーション強化（ping_host / adapter_name）
- productName を "NEXUS" に統一
- TitleBar の getCurrentWindow null ガード追加（ブラウザモード対応）

## [3.0.0] - 2026-03-19

### Changed
- types/index.ts を 18 ドメインファイルに分割（re-export のみに書き換え）
- Store ロジックを lib/ に抽出（Nav / Storage / WindowsSettings / Log / Hardware / GameProfile / NetworkTuning）
- セレクターフックを hooks/ に分離
- progressWidth ヘルパー実装 + インラインスタイル統一

### Added
- Semgrep CI 導入（TypeScript + Rust SAST）
- check-file-size.mjs strict 昇格

## [2.0.0] - 2026-03-19

### Changed
- Rust 4層アーキテクチャ確立（commands → services → infra / parsers）
- バンドル最適化（vendor-react / vendor-motion / vendor-ui チャンク分割）
- assertNever 適用
- PerformanceTimelineCard 分割

### Added
- テスト拡充（480 → 812 テスト）

## [1.0.0] - 2026-03-19

### 初回リリース

- 9 Wings（ホーム / ブースト / ランチャー / ネットワーク / ハードウェア / Windows設定 / ストレージ / ログ / 設定）
- ゲームプロファイル管理 + 自動検出
- プロセス優先度・CPU アフィニティ制御
- タイマー解像度最適化
- ネットワーク ping 計測 + TCP チューニング
- GPU/CPU モニタリング + 電力推定
- Windows OS 最適化アドバイザー
- ウォッチドッグルール
- 操作ログ + AI 分析連携
- 480 テスト（Vitest + cargo test）
- CI/CD パイプライン（GitHub Actions）
