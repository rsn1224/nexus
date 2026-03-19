# ROADMAP.md — nexus 開発ロードマップ

> **最終更新:** 2026-03-19
> **現在のフェーズ:** v3.0 Phase 4（リリース準備）

---

## v3.0 実績サマリー

### Phase 1: ワークフロー基盤構築（`212b958`）

- `docs/TESTING.md` — テストピラミッド、エージェント分離ルール、ミューテーション運用
- `docs/BACKEND.md` — Rust 4 層アーキテクチャ、UnifiedEmitter 仕様
- 3 lint スクリプト: `check-file-size.mjs`, `check-architecture.mjs`, `check-inline-styles.mjs`
- CI 更新: frontend ジョブに 3 スクリプト追加

### Phase 2: Spec 策定 + ミューテーションテスト + types 分割

- `docs/specs/` に 13 spec.md（Given/When/Then 形式）
- Stryker 導入: ベースライン 31.64%（274 killed / 592 survived / 866 mutants）
- `types/index.ts` 分割: 739 行 → 20 行（18 ドメイン別ファイル + re-export）
- `assertNever` → `lib/assert.ts` に移動

### Phase 3: Store ロジック抽出 + セキュリティ強化

- 7 ストア全て 200 行以下に削減（合計 1,748 → 1,106 行）
- 新規 lib/: navigation, storageCommands, windowsSettingsCommands, logFilter, hardwareFormatters, networkTuning + gameProfile 追記
- 新規 hooks/: 5 セレクターフックファイル
- Semgrep SAST 導入（p/typescript + p/rust）
- `check-file-size.mjs` エラーモードに昇格

### Phase 4: ドキュメント + 品質仕上げ + リリース（進行中）

- DESIGN.md v3 更新
- BACKEND.md 最終版更新
- ROADMAP.md 更新（本ファイル）
- HANDOFF.md 全面更新
- ミューテーションスコア閾値引き上げ

---

## 完了済みマイルストーン

### オーバーホールタスク（OH1〜OH8 + OH-B3）

| ID | 内容 | 状態 |
|----|------|------|
| OH1 | PowerShell フラグ修正 | ✅ 完了 |
| OH2 | GPU 型定義・取得実装 | ✅ 完了 |
| OH3 | プロセス保護リスト | ✅ 完了 |
| OH4 | GPU UI + AI ルール追加 | ✅ 完了 |
| OH5 | styles.ts 新規作成（→ Phase 2 で削除済み） | ✅ 完了 |
| OH6 | 自動ブースト設定 | ✅ 完了 |
| OH7 | テスト追加（81 件） | ✅ 完了 |
| OH8 | エラーハンドリング統一 | ✅ 完了 |
| OH-B1 | リアルタイムプロセスリスト | ✅ 完了 |
| OH-B2 | NVIDIA GPU 使用率（nvml-wrapper） | ✅ 完了 |
| OH-B3 | ゲームスコア実装 | ✅ 完了 |
| OH-B4 | 全設定リバート + アンインストールフロー | ✅ 完了 |
| OH-B5 | ウィンドウ最小幅設定 | ✅ 完了 |
| OH-B6 | テストカバレッジ拡張 | ✅ 完了 |

### 再構築計画（Phase 0〜7）

| フェーズ | 内容 | 状態 |
|---------|------|------|
| Phase 0 | クリティカルバグ修正 | ✅ 完了 |
| Phase 1 | セキュリティ基盤 | ✅ 完了 |
| Phase 2 | ドキュメント・設定整合 | ✅ 完了 |
| Phase 3 | フロントエンド基盤強化 | ✅ 完了 |
| Phase 4 | バックエンド再設計（4 層アーキテクチャ） | ✅ 完了 |
| Phase 5 | Tauri v2 フル活用 | ✅ 完了 |
| Phase 6 | React 19 / Zustand v5 | ✅ 完了 |
| Phase 7 | 品質仕上げ | ✅ 完了 |

### ゲーム特化強化計画（Phase 8〜10）

| フェーズ | 内容 | 状態 |
|---------|------|------|
| Phase 8a | ゲームプロファイル基盤 | ✅ 完了 |
| Phase 8b | CPU アフィニティ・段階的ブースト | ✅ 完了 |
| Phase 9b | タイマーリゾリューション + ETW フレームタイム | ✅ 完了 |
| Phase 10 | GameReadinessScore 再設計 | ✅ 完了 |

### デザインリフレッシュ + v2.1 + v2.2

| フェーズ | 内容 | 状態 |
|---------|------|------|
| R1-R5 | デザインリフレッシュ | ✅ 完了 |
| v2.1 | ナビゲーション基盤 | ✅ 完了 |
| v2.2 | コンポーネント分割 + UnifiedEmitter | ✅ 完了 |

---

## 品質指標（v3.0 時点）

| 指標 | 値 |
|------|-----|
| TS テスト | 542 |
| Rust テスト | 230+ |
| E2E テスト | 存在（continue-on-error） |
| any 型 | 0 |
| console.log | 0 |
| 200 行超 TS/TSX | 0（エラーモード強制） |
| ミューテーションスコア | 31.64%（ベースライン） |
| バンドルサイズ | 232kB（v2.2 時点） |
| アーキテクチャ違反 | 1（Modal → useModalStore、既知） |

---

## v3.1 進行中

### オンボーディングフロー（Phase 1）

- **仕様書:** `docs/specs/onboarding.spec.md`
- **HANDOFF:** Cascade 向け実装指示追記済み（Phase 1-A〜1-D）
- **ステータス:** `pending`（Cascade 実装待ち）
- 4 ステップウィザード: Welcome → System Scan → Readiness Summary → Complete
- `localStorage` フラグ方式、App.tsx で判定

## v3.1 残り候補

| 候補 | 優先度 | 依存 |
|------|--------|------|
| Rust 300 行超ファイルの段階的分割（25 ファイル） | 高 | v3.0 完了 |
| i18n 基盤（日本語/英語） | 高 | v3.0 完了 |
| E2E テスト正式化（continue-on-error 撤去） | 高 | spec.md 完備後 |
| テーマカスタマイズ（accent color） | 中 | v3.0 完了 |
| アクセシビリティ監査 + 改善 | 中 | v3.0 完了 |
| ダッシュボードカスタマイズ | 低 | オンボーディング後 |
| macOS / Linux 対応 | 低 | 長期 |
