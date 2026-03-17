# nexus 再構築ロードマップ

> **策定日:** 2026-03-18
> **根拠:** frontend-review.md (P0x2/P1x7) + backend-review.md (P0x4/P1x8) のレビュー結果
> **総工数見積もり:** 18〜23日

---

## 推奨実行順序（パターンB: BE先行）

```
Phase 0 → Phase 1 → Phase 2 → Phase 4 → Phase 5 → Phase 3 → Phase 6 → Phase 7
```

**パターンB を推奨する理由:**
1. Phase 0 でクリティカルバグを修正（即時価値）
2. Phase 1 でセキュリティ基盤を確立（後の実装に影響する基礎）
3. Phase 2 でコードベースのノイズを除去（後続フェーズが作業しやすくなる）
4. Phase 4-5 でバックエンドを再設計（ポーリング廃止でフロントの再設計が変わる）
5. Phase 3 でフロントエンドを強化（BE の新 API 設計を前提に実装できる）
6. Phase 6-7 で最新技術活用・品質仕上げ

---

## フェーズ概要

### Phase 0: クリティカルバグ修正
**工数:** 1〜2日
**対象 P0 問題:** FE-P0-1, FE-P0-2, BE-P0-2, BE-P0-3, BE-P0-4

- `useLauncherStore.ts` の復旧（LauncherWing との整合）
- `useScriptStore.ts` の `isRunning` バグ修正
- `pulse.rs` の Mutex 保持中 sleep 解消
- `get_storage_info` 二重登録修正
- `run_boost` の設計判断と実装方針確定

**なぜ最初か:** P0 バグが未修正のままだとランチャー・スクリプト機能が使えない。

---

### Phase 1: セキュリティ基盤
**工数:** 2〜3日
**対象 P0 問題:** BE-P0-1
**対象 P1 問題:** FE-P1-1, BE-P1-9（CSP）, BE-P1-8（capabilities）

- PowerShell インジェクション対策（入力バリデーション + サニタイズ）
- CSP ポリシーの厳格化（`tauri.conf.json`）
- `capabilities/default.json` のコマンド別 permission 定義
- `set_dns` / `ping_host` / `analyze_disk_usage` の入力バリデーション実装
- `constants.rs` への保護プロセスリスト統合

**なぜ早期か:** セキュリティは後から追加するとリグレッションリスクが高い。

---

### Phase 2: ドキュメント・設定整合
**工数:** 1日
**対象:** BE-P1-7, BE-P1-8, BE-P2-1, BE-P0-3

- 未使用クレート削除（`regex`, `walkdir`, `pathdiff`, `reqwest`, `sha2`, `uuid`, `feed-rs`, `totp-rs`, `log`）
- `WatcherState` + `notify` クレート削除
- `tokio features = ["full"]` → 必要最小限に変更
- `styles.ts` の削除（dead code）
- ROADMAP.md の OH-B3 完了反映

**なぜここか:** クレート削除はコンパイルを確認しながら行う必要があるが、後続フェーズのリファクタと干渉しないため早めに実施。

---

### Phase 3: フロントエンド基盤強化
**工数:** 4〜5日
**対象 P1 問題:** FE-P1-2, FE-P1-3, FE-P1-4, FE-P1-5, FE-P1-6, FE-P1-7

- `useSettingsStore` + `useAppSettingsStore` 統合
- ファサードセレクタ廃止 → `useShallow` 導入
- 共通コンポーネント実装（ErrorBanner, LoadingState, EmptyState, SectionHeader, KeyValueRow, Toggle, ProgressBar）
- コンポーネント分割（HomeWing, LogWing, LauncherWing）
- パフォーマンス改善（useEffect 依存配列修正、React.memo / useCallback）

**なぜ Phase 4-5 後か:** Phase 5 でイベント駆動に変更すると、ポーリングコードの大部分が不要になる。先に FE を強化してしまうと二度手間になる。

---

### Phase 4: バックエンド再設計
**工数:** 4〜5日
**対象 P1 問題:** BE-P1-1, BE-P1-2, BE-P1-3, BE-P1-4, BE-P1-5

- 4層アーキテクチャへのリファクタリング（commands → services/infra/parsers 分離）
- `System` インスタンス共有（`PulseState` 経由）
- 重い同期コマンドの async 化
- `AppError` 拡張（`PowerShell`, `Registry`, `Process` バリアント）
- `winreg` クレート導入による Registry 操作の PowerShell 依存削減

---

### Phase 5: Tauri v2 フル活用
**工数:** 2〜3日
**対象 P1 問題:** BE-P1-6

- ポーリング → Tauri イベントシステムへの移行
  - `pulse:snapshot`（2秒間隔）
  - `ops:processes`（3秒間隔）
  - `hw:info`（5秒間隔）
- `tauri-plugin-shell` 導入
- capabilities 拡充

---

### Phase 6: React 19 / Zustand v5 活用
**工数:** 3〜4日
**対象 P2 問題:** FE-P2-1, FE-P2-3

- `use()` + `<Suspense>` パターン導入（`useEffect` + `isLoading` の置換）
- `useActionState` 導入（フォーム送信管理）
- `useOptimistic` 導入（楽観的更新）
- `React.lazy` + code splitting 実装
- Rust edition 2024 移行（余裕があれば）
- `thiserror` v2 移行（余裕があれば）

---

### Phase 7: 品質仕上げ
**工数:** 2〜3日

- 共通 UI コンポーネントのテスト実装
- E2E テスト拡充（各 Wing の主要フロー）
- `services/` レイヤーの Rust ユニットテスト
- doc comment 整備
- ipconfig パーサーの日本語ロケール対応
- API キー暗号化保存（keyring クレート）
- CSV エクスポート RFC 4180 準拠

---

## 依存関係グラフ

```
Phase 0 ──→ Phase 1 ──→ Phase 2
                              │
                              ↓
                         Phase 4 ──→ Phase 5
                                          │
                                          ↓
                                     Phase 3 ──→ Phase 6 ──→ Phase 7
```

**キーポイント:**
- Phase 4 完了 → BE 4層分離により services/ に対するテストが書ける
- Phase 5 完了 → FE 側のポーリングコードが大量に不要になる → Phase 3 の作業量が減る
- Phase 3 + 5 完了 → React 19 / Zustand v5 への移行（Phase 6）が効率的に行える

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| Phase 4 のリファクタで既存テストが壊れる | フェーズ前にテストカバレッジを記録し、Phase 4 完了条件に全テスト green を含める |
| Phase 5 のイベント移行で UI が不安定になる | Wing ごとに段階移行。1つ安定してから次の Wing に適用 |
| Phase 6 の React 19 移行で TypeScript 型エラー | React 19 型定義の更新確認を事前に行う |
| 工数の超過 | P0/P1 対応（Phase 0〜2）を最優先。P3 問題（Phase 7）は後回し可 |

---

## 完了基準（全フェーズ共通）

- lint エラー 0（Biome + clippy）
- 型エラー 0（tsc --noEmit）
- 全テスト green（149+ unit, 3+ E2E）
- console.log なし
- any 型なし
- インラインスタイルなし
- unwrap() なし（本番コード）
