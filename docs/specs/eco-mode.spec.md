# Eco Mode — 仕様書

## 概要
FPS 制限とパワープラン切り替えによる省電力機能を提供し、消費電力と月額コストの見積もりを表示する。

## 前提条件
- Rust バックエンド側で電力推定コマンド (`fetch_power_estimate`, `fetch_cost_estimate`) が実装済みであること
- Zustand ストア（persist middleware 使用）で以下の設定を管理:
  - `enabled: boolean`
  - `targetFps: number` — 30〜144、ステップ15
  - `ecoPowerPlan: string`
  - `electricityRateYen: number`

## シナリオ

### Scenario 1: Eco Mode の設定取得
- **Given** Eco Mode 画面が表示される
- **When** コンポーネントがマウントされる
- **Then** `fetchConfig` が呼ばれ、永続化された設定がストアにロードされる

### Scenario 2: Eco Mode の有効化
- **Given** Eco Mode が無効である
- **When** ユーザーが Eco Mode トグルを ON にする
- **Then** `toggleEcoMode(true)` が実行され、FPS 制限とパワープラン切り替えが適用される

### Scenario 3: Eco Mode の無効化
- **Given** Eco Mode が有効である
- **When** ユーザーが Eco Mode トグルを OFF にする
- **Then** `toggleEcoMode(false)` が実行され、FPS 制限が解除され元のパワープランに復帰する

### Scenario 4: ターゲット FPS の変更
- **Given** Eco Mode 設定画面が表示されている
- **When** ユーザーが targetFps スライダーを 60 に設定する
- **Then** `updateConfig({ targetFps: 60 })` が実行され、設定が永続化される

### Scenario 5: 電力消費の推定表示
- **Given** Eco Mode 画面が表示されている
- **When** `fetchPowerEstimate` が完了する
- **Then** PowerConsumptionDisplay に CPU / GPU / 合計ワット数が表示される

### Scenario 6: 月額コストの見積もり
- **Given** Eco Mode 画面が表示されている
- **When** ユーザーが使用時間スライダーを 4h/day に設定する
- **Then** `fetchCostEstimate(4)` が呼ばれ、通常 vs エコの月額コストと節約額が表示される

### Scenario 7: 設定の保存
- **Given** 設定が変更されている
- **When** `saveConfig` が呼ばれる
- **Then** 設定が Zustand persist middleware 経由で永続化される

## データ型

### PowerEstimate
- `cpuPowerW: number`
- `gpuPowerW: number`
- `gpuActualPowerW: number | null`
- `totalEstimatedW: number`
- `cpuTdpW: number`
- `gpuTdpW: number`
- `timestamp: string`

### MonthlyCostEstimate
- `normalMonthlyYen: number`
- `ecoMonthlyYen: number`
- `savingsYen: number`
- `assumedHoursPerDay: number`

## UI コンポーネント

### PowerConsumptionDisplay
- 合計消費電力を表示
- 色分け: 400W 未満 → 緑、400W 以上 → オレンジ

### CostEstimationPanel
- 使用時間スライダー: 1〜8h/day
- 通常月額 vs エコ月額のコスト比較表示
- 月間節約額の表示

## エッジケース
- `gpuActualPowerW` が null の場合、TDP ベースの推定値を使用する
- `targetFps` が範囲外の値に設定された場合、最近接の有効値にクランプする（30, 45, 60, 75, 90, 105, 120, 135, 144）
- `electricityRateYen` が 0 以下の場合、コスト見積もりを非表示にする
- パワープランの切り替えに失敗した場合、エラーメッセージを表示し Eco Mode を無効に戻す

## 非機能要件
- 設定変更は Zustand persist middleware により即時永続化されること
- 電力推定値の更新頻度は 5 秒以内であること
- FPS 制限の適用はゲームパフォーマンスに悪影響を与えない方式で実装すること
