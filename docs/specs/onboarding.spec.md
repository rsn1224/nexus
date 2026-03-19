# オンボーディング — 仕様書

## 概要

初回起動時にユーザーをガイドするウィザード。4 ステップで構成される:
1. **Welcome** — アプリ紹介
2. **System Scan** — Steam 検出 / ハードウェア取得 / Windows 設定チェック
3. **Readiness Summary** — GameReadinessScore サマリー + 推奨アクション 3 件
4. **Complete** — ダッシュボードへ遷移

## 前提条件

- Tauri バックエンドが `get_hardware_info`, `scan_steam_games`, `get_app_settings`, `save_app_settings` コマンドに応答可能
- `GameReadinessScore` 計算ロジック（`lib/gameReadiness/`）が利用可能
- `localStorage` が利用可能（フラグ保存用）

## 状態管理

- `localStorage` キー: `nexus:onboarding:done` (`"true"` / 未設定)
- App.tsx で判定 → `true` でなければ `OnboardingWizard` を表示、Shell は非表示
- ウィザード完了時に `localStorage.setItem('nexus:onboarding:done', 'true')` を書き込み

## シナリオ

### Scenario 1: 初回起動でウィザード表示

- **Given** `localStorage` に `nexus:onboarding:done` が未設定
- **When** App.tsx がマウントされる
- **Then** `OnboardingWizard` が全画面で表示され、Shell（サイドバー + Wing）は非表示

### Scenario 2: 2 回目以降はスキップ

- **Given** `localStorage` に `nexus:onboarding:done` = `"true"` が設定済み
- **When** App.tsx がマウントされる
- **Then** `OnboardingWizard` は表示されず、通常の Shell がレンダリングされる

### Scenario 3: Welcome ステップ

- **Given** ウィザードが Step 1 (Welcome) を表示中
- **When** ユーザーが「始める」ボタンをクリック
- **Then** Step 2 (System Scan) に遷移する

### Scenario 4: System Scan の自動実行

- **Given** ウィザードが Step 2 (System Scan) に遷移
- **When** ステップがマウントされる
- **Then** 以下が並行実行され、各タスクの完了状態がリアルタイム表示される:
  1. `invoke('scan_steam_games')` — Steam ゲーム検出
  2. `invoke('get_hardware_info')` — ハードウェア情報取得
  3. `invoke('get_app_settings')` — 現在の設定読み込み

### Scenario 5: System Scan 完了後の遷移

- **Given** 3 タスク全てが完了（成功 or エラー）
- **When** 全タスクが終了する
- **Then** 「次へ」ボタンが有効化され、Step 3 に遷移可能になる

### Scenario 6: System Scan でエラー発生

- **Given** いずれかのタスクがエラーを返す
- **When** エラーが発生する
- **Then** 該当タスクに `⚠ エラー` を表示するが、ウィザード全体はブロックしない（他タスクは続行）

### Scenario 7: Readiness Summary ステップ

- **Given** System Scan の結果が利用可能
- **When** Step 3 (Readiness Summary) が表示される
- **Then** 以下が表示される:
  - GameReadinessScore の総合スコアとランク（ReadinessGauge コンポーネント再利用）
  - 3 軸スコア（リソース / 最適化 / FPS）
  - 上位 3 件の推奨アクション（RecommendationList コンポーネント再利用）

### Scenario 8: ウィザード完了

- **Given** Step 4 (Complete) が表示中
- **When** ユーザーが「ダッシュボードへ」ボタンをクリック
- **Then** `localStorage` に `nexus:onboarding:done` = `"true"` が保存され、ウィザードが閉じて Home Wing が表示される

### Scenario 9: ウィザードのスキップ

- **Given** ウィザードの任意のステップが表示中
- **When** ユーザーが「スキップ」リンクをクリック
- **Then** `localStorage` にフラグが保存され、即座にダッシュボードに遷移する

### Scenario 10: キーボードナビゲーション

- **Given** ウィザードが表示中
- **When** Escape キーが押される
- **Then** 何も起きない（誤操作防止。スキップは明示的クリックのみ）

## コンポーネント構造

```
src/components/onboarding/
├── OnboardingWizard.tsx      — ステップ管理（< 200 行）
├── WelcomeStep.tsx           — Step 1: ロゴ + 紹介テキスト
├── ScanStep.tsx              — Step 2: 自動スキャン + 進捗表示
├── ReadinessSummaryStep.tsx  — Step 3: スコア + 推奨アクション
└── CompleteStep.tsx          — Step 4: 完了メッセージ + CTA
```

## デザインルール

- 全画面表示（`fixed inset-0 z-50 bg-base-900`）
- 中央揃えカード（`card-glass max-w-lg`）
- ステップインジケーター: 4 つのドット（アクティブ = `bg-accent-500`、完了 = `bg-success-500`、未到達 = `bg-base-600`）
- ボタン: プライマリ（`Button variant="primary"`）
- フォント: 全て `font-mono`、見出し `text-[14px] font-bold`、本文 `text-[12px]`
- アニメーション: ステップ遷移に `wing-enter` クラスを再利用
