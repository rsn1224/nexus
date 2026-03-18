# NEXUS — Personal Base of Operations

Windows ゲーマー向けのシステム最適化デスクトップアプリ。  
Tauri v2 + React 19 + TypeScript + Rust で構築。

## 機能

- **ホーム** — システム状態・ゲーム準備状況・ボトルネック分析
- **ブースト** — プロセス優先度・CPU アフィニティ・タイマー解像度・ウォッチドッグ
- **ランチャー** — ゲームプロファイル管理・自動検出・起動
- **ネットワーク** — ping 計測・ネットワーク最適化・TCP チューニング
- **ハードウェア** — GPU/CPU モニタリング・電力推定・エコモード
- **Windows 設定** — OS 最適化アドバイザー・Game DVR・電源プラン
- **ストレージ** — ドライブ分析・クリーンアップ
- **ログ** — 操作ログ・AI 分析

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Tauri v2 |
| フロントエンド | React 19 + TypeScript + Tailwind CSS v4 |
| 状態管理 | Zustand v5 |
| バックエンド | Rust (edition 2024) |
| テスト | Vitest + Playwright + cargo test |
| CI/CD | GitHub Actions |

## ビルド

### 前提条件

- Node.js 20+
- Rust (stable)
- Windows 10/11（実行環境）

### 開発

```bash
npm install
npm run tauri dev
```

### 本番ビルド

```bash
npm run tauri build
```

## テスト

```bash
# フロントエンド
npm run test

# Rust
cd src-tauri && cargo test

# E2E
npm run test:e2e
```

## ライセンス

プライベートソフトウェア。無断複製・配布を禁じます。
