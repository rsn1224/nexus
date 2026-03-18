# ROADMAP.md — nexus 開発ロードマップ

> **最終更新:** 2026-03-18
> **現在のフェーズ:** 全計画タスク完了 — 最適化・新機能企画フェーズへ

---

## 完了済みマイルストーン

### オーバーホールタスク（OH1〜OH8 + OH-B3）

| ID | 内容 | 状態 |
|----|------|------|
| OH1 | PowerShell フラグ修正（-NoProfile -NonInteractive -ExecutionPolicy Bypass） | ✅ 完了 |
| OH2 | GPU 型定義・取得実装（sysinfo + PowerShell Get-CimInstance） | ✅ 完了 |
| OH3 | プロセス保護リスト（PROTECTED_PROCESSES 定数 + PROT バッジ） | ✅ 完了 |
| OH4 | GPU UI + AI ルール追加（HomeWing + localAi.ts） | ✅ 完了 |
| OH5 | styles.ts 新規作成（→ Phase 2 で削除済み） | ✅ 完了 |
| OH6 | 自動ブースト設定（useLauncherStore + SettingsWing トグル） | ✅ 完了 |
| OH7 | テスト追加（localAi, stores, 81件） | ✅ 完了 |
| OH8 | エラーハンドリング統一（extractErrorMessage + ApiResult） | ✅ 完了 |
| OH-B3 | ゲームスコア実装（CPU/MEM/DISK/GPU 加重平均） | ✅ 完了 |
| OH-B5 | ウィンドウ最小幅設定（minWidth: 900） | ✅ 完了 |

### ベースライン整備タスク（T1〜T10）

T1〜T10: Shell サイドバー化・Wing 構成・Tailwind 化・テスト整備等（完了済み）

### 環境整備（OH-E）

| ID | 内容 | 状態 |
|----|------|------|
| OH-E1 | セキュリティ設定強化（settings.json denyList + pre-edit-check） | ✅ 完了 |
| OH-E2 | Tailwind CSS リファクタ（LauncherWing, PerplexityPanel） | ✅ 完了 |
| OH-E3 | E2E テスト基盤（Playwright 17 smoke tests） | ✅ 完了 |
| OH-E4 | 環境オーバーホール（rules/, agents/, skills/, CLAUDE.md slim） | ✅ 完了 |

### 将来ロードマップ（OH-B 系）— 完了

| ID | 内容 | 状態 |
|----|------|------|
| OH-B1 | BoostWing リアルタイムプロセスリスト | ✅ 完了 |
| OH-B2 | NVIDIA GPU 使用率取得（nvml-wrapper） | ✅ 完了 |
| OH-B4 | 全設定リバート + アンインストールフロー | ✅ 完了 |

**現在のテスト:** TS 317 unit + 17 E2E + Rust 142 = 476 green
**最新コミット:** `51918a2`

---

## 再構築計画（Phase 0〜7）— 完了

| フェーズ | 内容 | 状態 |
|---------|------|------|
| Phase 0 | クリティカルバグ修正（Store 型エラー・pulse.rs Mutex・二重登録） | ✅ 完了 |
| Phase 1 | セキュリティ基盤（PowerShell インジェクション対策・CSP・capabilities） | ✅ 完了 |
| Phase 2 | ドキュメント・設定整合（未使用クレート削除・styles.ts 削除） | ✅ 完了 |
| Phase 3 | フロントエンド基盤強化（Store 統合・共通コンポーネント・分割） | ✅ 完了 |
| Phase 4 | バックエンド再設計（4層アーキテクチャ・AppError 拡張・winreg） | ✅ 完了 |
| Phase 5 | Tauri v2 フル活用（ポーリング → イベント・capabilities 拡充） | ✅ 完了 |
| Phase 6 | React 19 / Zustand v5（use() + Suspense・React.lazy） | ✅ 完了 |
| Phase 7 | 品質仕上げ（テスト・E2E・Rust ユニットテスト・keyring） | ✅ 完了 |

---

## ゲーム特化強化計画（Phase 8〜10）— 完了

| フェーズ | 内容 | 状態 |
|---------|------|------|
| Phase 8a | ゲームプロファイル基盤（CRUD・WMI 起動検出・Level 1 ブースト） | ✅ 完了 |
| Phase 8b | CPU アフィニティ・段階的ブースト再設計（Level 2/3・P/E-Core 検出） | ✅ 完了 |
| Phase 9b-A | タイマーリゾリューション FFI（NtSetTimerResolution・AppState 統合） | ✅ 完了 |
| Phase 9b-B | タイマーリゾリューション UI（WinoptTab + ProfileTab） | ✅ 完了 |
| Phase 9b-C | ETW フレームタイム監視（ferrisetw・FrameTimeCard/Graph UI） | ✅ 完了 |
| Phase 10 | GameReadinessScore 再設計（3軸スコア・Canvas ゲージ・推奨リスト） | ✅ 完了 |

---

## 次フェーズ候補（未計画）

> 全計画タスクが完了。次の機能追加は新たな仕様書を作成してから着手すること。

候補アイデア:
- ネットワーク最適化強化（TCP Nagle 無効化・ジッター監視）
- ゲームスコア履歴グラフ（セッションごとのスコア推移）
- プロファイル JSON インポート/エクスポート（コミュニティ共有）
- macOS / Linux 対応（非 Windows プラットフォーム）
