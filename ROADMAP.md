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

## 依存関係と工数サマリー（Phase 0〜7）

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

**Phase 0〜7 総工数見積もり: 18〜23日**

---

## ゲーム特化強化計画（Phase 8〜10）

> 詳細仕様: `docs/specs/game-enhancement-spec.md`
> Phase 7 完了後に着手する

### Phase 8a: ゲームプロファイル基盤 — 工数: 2〜3週間

**状態:** 未着手（Phase 7 完了後）

| 実装内容 | 概要 |
|---------|------|
| ゲームプロファイル CRUD | JSON保存（`get_app_data_dir()` 使用）・一覧・編集・削除 |
| ゲーム起動検出 | WMI Win32_ProcessStartTrace（フォールバック: sysinfo ポーリング） |
| Level 1 ブースト実装 | バックグラウンドプロセス一時停止（NtSuspendProcess FFI） |
| 自動リバート | ゲーム終了時に NtResumeProcess + 電源プラン復元 |
| Tauri イベント | `nexus://game-launched`, `nexus://game-exited`, `nexus://profile-applied` |
| ProfileTab UI | BoostWing に「PROFILES」タブ追加 |

**新規依存クレート:**
- `windows-sys = "0.59"` — Win32 API FFI（WMI・NtSuspendProcess）

---

### Phase 8b: CPUアフィニティ・段階的ブースト再設計 — 工数: 2〜3週間

**状態:** 未着手（Phase 8a 完了後）

| 実装内容 | 概要 |
|---------|------|
| CPU トポロジー検出 | `GetLogicalProcessorInformationEx` で P/E-Core・CCD を自動判別 |
| CPU アフィニティ設定 | `SetProcessAffinityMask` FFI・ゲーム専有コア / バックグラウンド追い出し |
| Level 2 ブースト | 電源プラン切替 + CPU アフィニティ再配置 |
| Level 3 ブースト | 不要プロセス終了（保護リスト遵守・確認ダイアログ必須） |
| `run_boost` 修正 | `is_simulation: true` を削除し実装に置き換え |

---

### Phase 9a: フレームタイム監視 — 工数: 2〜3週間

**状態:** 未着手（Phase 8b 完了後）

| 実装内容 | 概要 |
|---------|------|
| ETW フレームタイム取得 | `Microsoft-Windows-DXGI` プロバイダー（`ferrisetw` crate 検討） |
| 統計計算 | avg FPS・1% low・0.1% low・スタッター検出 |
| リアルタイム emit | `nexus://frame-time`（1秒間隔） |
| FrameTimeGraph UI | HomeWing にリアルタイムグラフ追加 |

> **注意:** ETW の実装詳細は Phase 8b 完了後に改めて設計する（本仕様書 §9 参照）

---

### Phase 9b: タイマーリゾリューション・ネットワーク強化 — 工数: 1〜2週間

**状態:** 未着手（Phase 9a 完了後）

| 実装内容 | 概要 |
|---------|------|
| タイマーリゾリューション | `ntdll.dll` `NtSetTimerResolution` FFI（0.5ms 設定） |
| 自動リバート | ゲーム終了時にデフォルト値（15.625ms）に戻す |
| TCP Nagle 無効化 | レジストリ経由（`infra/registry.rs` 活用） |
| ジッター監視 | 既存 Ping 機能の拡張 |

---

### Phase 10: 高度な可視化・スコア再設計 — 工数: 1〜2週間

**状態:** 未着手（Phase 9b 完了後）

| 実装内容 | 概要 |
|---------|------|
| GameReadinessScore 再設計 | frame_stability(40%) + input_latency(25%) + resource_headroom(20%) + thermal_margin(15%) |
| ブースト前後比較レポート | freed_ram_mb / freed_cpu_percent / killed_processes 表示 |
| プロファイルエクスポート | JSON インポート/エクスポート（コミュニティ共有） |
| ゲームスコア履歴グラフ | セッションごとのスコア推移表示 |

---

## 依存関係図（全フェーズ）

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
                                                                                       │
                                                                                       ↓
                                                                               Phase 8a (2-3週)
                                                                                       │
                                                                                       ↓
                                                                               Phase 8b (2-3週)
                                                                                 │       │
                                                                                 ↓       ↓
                                                                           Phase 9a   Phase 9b
                                                                           (2-3週)    (1-2週)
                                                                                 │       │
                                                                                 └───┬───┘
                                                                                     ↓
                                                                               Phase 10 (1-2週)
```

**Phase 0〜7 総工数: 18〜23日**
**Phase 8〜10 総工数: 11〜16週間**
