# ROADMAP.md — nexus 開発ロードマップ

> **最終更新:** 2026-03-18
> **現在のフェーズ:** オーバーホール完了 → 再構築計画 Phase 0 開始

---

## 完了済みマイルストーン

### オーバーホールタスク（OH1〜OH8 + OH-B3）

| ID | 内容 | 状態 |
|----|------|------|
| OH1 | PowerShell フラグ修正（-NoProfile -NonInteractive -ExecutionPolicy Bypass） | ✅ 完了 |
| OH2 | GPU 型定義・取得実装（sysinfo + PowerShell Get-CimInstance） | ✅ 完了 |
| OH3 | プロセス保護リスト（PROTECTED_PROCESSES 定数 + PROT バッジ） | ✅ 完了 |
| OH4 | GPU UI + AI ルール追加（HomeWing + localAi.ts） | ✅ 完了 |
| OH5 | styles.ts 新規作成（S.xxx 共通定数） | ✅ 完了（→ Phase 2 で削除予定） |
| OH6 | 自動ブースト設定（useLauncherStore + SettingsWing トグル） | ✅ 完了 |
| OH7 | テスト追加（localAi, stores, 81件） | ✅ 完了 |
| OH8 | エラーハンドリング統一（extractErrorMessage + ApiResult） | ✅ 完了 |
| OH-B3 | ゲームスコア実装（CPU/MEM/DISK/GPU 加重平均） | ✅ 完了 |
| OH-B5 | ウィンドウ最小幅設定（minWidth: 900） | ✅ 完了 |

### ベースライン整備タスク（T1〜T10）

T1〜T10: Shell サイドバー化・Wing 構成・Tailwind 化・テスト整備等（完了済み）

### 環境整備（OH）

| ID | 内容 | 状態 |
|----|------|------|
| OH-E1 | セキュリティ設定強化（settings.json denyList + pre-edit-check） | ✅ 完了 |
| OH-E2 | Tailwind CSS リファクタ（LauncherWing, PerplexityPanel） | ✅ 完了 |
| OH-E3 | E2E テスト基盤（Playwright 3 smoke tests） | ✅ 完了 |
| OH-E4 | 環境オーバーホール（rules/, agents/, skills/, CLAUDE.md slim） | ✅ 完了 |

**現在のテスト:** 149 unit + 3 E2E green
**最新コミット:** `922041c`

---

## 将来ロードマップ（OH-B 系）

| ID | 内容 | 前提 | 状態 |
|----|------|------|------|
| OH-B1 | BoostWing リアルタイムプロセスリスト | Phase 4 完了後 | 未着手 |
| OH-B2 | NVIDIA GPU 使用率取得（nvml-wrapper） | OH2 完了後 | 未着手 |
| OH-B4 | 全設定リバート + アンインストールフロー | Phase 3 完了後 | 未着手 |

---

## 再構築計画（Phase 0〜7）

> 詳細な実装指示は `HANDOFF.md` を参照
> レビュー根拠は `docs/reviews/` を参照

**推奨実行順序（パターンB: BE先行）:**
```
Phase 0 → 1 → 2 → 4 → 5 → 3 → 6 → 7
```

### Phase 0: クリティカルバグ修正 — 工数: 1〜2日

**状態:** 未着手

| バグ | 対象ファイル |
|------|-------------|
| useLauncherStore 型エラー（FE-P0-1） | `src/stores/useLauncherStore.ts` |
| useScriptStore isRunning バグ（FE-P0-2） | `src/stores/useScriptStore.ts` |
| pulse.rs Mutex 保持中 sleep（BE-P0-2） | `src-tauri/src/commands/pulse.rs` |
| get_storage_info 二重登録（BE-P0-3） | `src-tauri/src/lib.rs` |
| run_boost 動作不明確（BE-P0-4） | `src-tauri/src/commands/boost.rs` |

---

### Phase 1: セキュリティ基盤 — 工数: 2〜3日

**状態:** 未着手

- PowerShell インジェクション対策（BE-P0-1）
- CSP ポリシー厳格化
- capabilities/default.json コマンド別 permission
- 入力バリデーション（set_dns / ping_host / analyze_disk_usage）
- 保護プロセスリスト統合（constants.rs）

---

### Phase 2: ドキュメント・設定整合 — 工数: 1日

**状態:** 未着手

- 未使用クレート削除（regex, walkdir, pathdiff, reqwest, sha2, uuid, feed-rs, totp-rs, log）
- WatcherState + notify クレート削除
- tokio features 最小化
- styles.ts 削除（dead code）

---

### Phase 3: フロントエンド基盤強化 — 工数: 4〜5日

**状態:** 未着手（Phase 4-5 完了後に着手推奨）

- useSettingsStore + useAppSettingsStore 統合
- useShallow セレクタ導入
- 共通コンポーネント実装（ErrorBanner, LoadingState, EmptyState, SectionHeader, KeyValueRow, Toggle, ProgressBar）
- コンポーネント分割（HomeWing, LogWing, LauncherWing）
- パフォーマンス改善（useEffect 依存配列修正、React.memo / useCallback）

---

### Phase 4: バックエンド再設計 — 工数: 4〜5日

**状態:** 未着手

- 4層アーキテクチャ（commands/services/infra/parsers）
- System インスタンス共有（PulseState 経由）
- 重い同期コマンドの async 化
- AppError 拡張（PowerShell / Registry / Process バリアント）
- winreg クレート導入（Registry 操作の PowerShell 依存削減）

---

### Phase 5: Tauri v2 フル活用 — 工数: 2〜3日

**状態:** 未着手

- ポーリング → Tauri イベントシステム移行
  - `pulse:snapshot`（2秒）/ `ops:processes`（3秒）/ `hw:info`（5秒）
- tauri-plugin-shell 導入
- capabilities 拡充

---

### Phase 6: React 19 / Zustand v5 活用 — 工数: 3〜4日

**状態:** 未着手（Phase 3 完了後に着手）

- use() + Suspense パターン導入
- useActionState 導入
- useOptimistic 導入
- React.lazy + code splitting
- Rust edition 2024 移行（任意）
- thiserror v2 移行（任意）

---

### Phase 7: 品質仕上げ — 工数: 2〜3日

**状態:** 未着手

- 共通 UI コンポーネントテスト
- E2E テスト拡充
- services/ レイヤー Rust ユニットテスト
- doc comment 整備
- ipconfig パーサー日本語ロケール対応
- API キー暗号化保存（keyring クレート）
- CSV エクスポート RFC 4180 準拠

---

## 依存関係と工数サマリー

```
Phase 0 (1-2日) ──→ Phase 1 (2-3日) ──→ Phase 2 (1日)
                                              │
                                              ↓
                                        Phase 4 (4-5日) ──→ Phase 5 (2-3日)
                                                                   │
                                                                   ↓
                                                            Phase 3 (4-5日)
                                                                   │
                                                                   ↓
                                                            Phase 6 (3-4日) ──→ Phase 7 (2-3日)
```

**総工数見積もり: 18〜23日**
