# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/)

## [4.0.0] - 2026-03-31

### Changed
- **コンセプト刷新**: 5 Wing 多画面 → Main 1画面「ゲーム前の30秒ルーティン」
- Wing 概念廃止: `BottomTabBar` / `Sidebar` / 全 Wing コンポーネント削除
- デザインシステム刷新: Stitch/Razer Green → Cyan (`#06b6d4`) 単色アクセント・装飾なし
- Rust バックエンド再編: 旧コマンド群 → 7コマンド体系（status / optimize / diagnose / history / settings）
- `tauri.conf.json`: productName → "NEXUS v4", minWidth → 800px
- TypeScript 型定義: v2 型ファイル全削除 → system.ts / optimize.ts に統合

### Added
- `src/components/Main.tsx` — 全セクション統合（スクロール不要）
- `src/components/SystemStatus.tsx` — CPU/GPU/RAM/Temp KPI グリッド
- `src/components/Diagnostics.tsx` — 異常時のみ表示アラートリスト
- `src/components/Optimizations.tsx` — チェックリスト + OPTIMIZE + before/after diff + REVERT ALL 2段確認
- `src/components/QuickInfo.tsx` — 最終最適化日時・Settings/History ボタン
- `src/components/SettingsPanel.tsx` — NexusSettings フォーム（DNS / 保護プロセス / ポーリング間隔）
- `src/components/HistoryPanel.tsx` — 最適化セッション履歴（新しい順・アコーディオン）
- `src/components/ui/SlidePanel.tsx` — Esc / バックドロップで閉じる右スライドパネル
- `src/stores/useSystemStore.ts` — 5秒ポーリング + SystemStatus + DiagnosticAlert
- `src/stores/useOptimizeStore.ts` — 候補選択 / 適用 / リバート / 履歴
- `src/stores/useSettingsStore.ts` — NexusSettings CRUD
- `src/lib/tauri-commands.ts` — 全 invoke ラッパー集約
- `src/lib/formatters.ts` — v4 専用フォーマッター（temp / gb / percent / timestamp）
- E2E smoke tests: v4 UI 向け書き直し（settings/history パネル開閉確認）

### Removed
- Stitch UI 全残骸（glass-panel / bloom-border / stitch-* / #44D62C）
- v2 型定義ファイル（v2.ts / v2ai.ts / v2health.ts 等 7ファイル）
- 旧ストア（useNavStore / useEcoModeStore / useModalStore / usePulseStore 等）
- 旧 lib（ai/ / buildHealthInput / healthScore / gameReadiness / suggestionEngine 等）
- 旧 E2E テスト（wings.test.ts / navigation.test.ts / game-profile.test.ts）

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
