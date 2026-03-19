# Game Readiness Score — 仕様書

## 概要
CPU・メモリ・GPU・最適化設定・フレームタイムの3軸からゲーム準備度を 0〜100 のスコアとして算出し、改善推奨を提示する。

## 前提条件
- UnifiedEmitter の `nexus://pulse` および `nexus://hardware` イベントからリソース情報が取得できること
- Performance Wing のプロファイル・ブースト・タイマー・アフィニティ設定の状態が参照できること
- Game Monitor からフレームタイムデータが取得可能であること（オプション）

## 入力パラメータ
- `cpuPercent: number`
- `memUsedMb: number`
- `memTotalMb: number`
- `gpuUsagePercent: number`
- `gpuTempC: number`
- `diskUsagePercent: number`
- `isProfileApplied: boolean`
- `boostLevel: 'hard' | 'medium' | 'soft' | 'none'`
- `timerState: { currentResolutionMs: number }`
- `affinityConfigured: boolean`
- `frameTime: FrameTimeData | null` — オプション

## シナリオ

### Scenario 1: フレームタイムなしでのスコア算出
- **Given** リソースデータと最適化設定が取得されている
- **When** `frameTime` が null である
- **Then** `Resource Score * 0.5 + Optimization Score * 0.5` で合計スコアが算出される

### Scenario 2: フレームタイムありでのスコア算出
- **Given** リソースデータ、最適化設定、フレームタイムが取得されている
- **When** `frameTime` が存在する
- **Then** `Resource Score * 0.3 + Optimization Score * 0.3 + Performance Score * 0.4` で合計スコアが算出される

### Scenario 3: READY ランク
- **Given** 全軸のスコアが高い
- **When** 合計スコアが 80 以上である
- **Then** ランクは `READY` と表示される

### Scenario 4: NOT_READY ランク
- **Given** リソース使用率が高く最適化が未設定である
- **When** 合計スコアが 40 未満である
- **Then** ランクは `NOT_READY` と表示され、改善推奨が表示される

### Scenario 5: 推奨事項の生成
- **Given** スコアが算出されている
- **When** 改善可能な項目がある
- **Then** 優先度順（high → medium → low）で最大5件の推奨事項が表示される

## スコア算出ロジック

### Resource Score（リソース余裕度）
利用可能な各因子の平均:
- CPU: `100 - cpuPercent`
- Memory: `100 - (memUsedMb / memTotalMb * 100)`
- GPU: `100 - gpuUsagePercent`
- GPU Temp: `< 70°C → 100` / `70-80°C → 80` / `80-90°C → 50` / `≥ 90°C → 20`
- Disk: `100 - diskUsagePercent`

### Optimization Score（最適化度）
各項目の加算（最大 100）:
- プロファイル適用済み: +30
- ブーストレベル: hard → +30 / medium → +25 / soft → +15 / none → +0
- タイマー解像度: ≤ 0.5ms → +20 / ≤ 1.0ms → +15 / ≤ 2.0ms → +10 / > 2.0ms → +5
- アフィニティ設定済み: +20

### Performance Score（パフォーマンス、frameTime 存在時のみ）
各項目の加算（最大 100）:
- FPS ティア: ≥ 144 → 40 / ≥ 120 → 35 / ≥ 60 → 30 / ≥ 30 → 15 / < 30 → 5
- 安定性（1% Low / Avg 比率）: ≥ 0.8 → 30 / ≥ 0.6 → 20 / ≥ 0.4 → 10 / < 0.4 → 5
- スタッター数: 0 → 30 / 1-2 → 20 / 3-5 → 10 / > 5 → 0

### 合計スコア
- `frameTime` あり: `resource * 0.3 + optimization * 0.3 + performance * 0.4`
- `frameTime` なし: `resource * 0.5 + optimization * 0.5`
- 結果は `[0, 100]` にクランプ

## ランク判定

| スコア範囲 | ランク |
|-----------|--------|
| 80〜100 | READY |
| 60〜79 | GOOD |
| 40〜59 | FAIR |
| 0〜39 | NOT_READY |

## 推奨事項（Recommendations）
最大5件、優先度順にソート:

### High（高優先度）
- CPU 使用率 ≥ 80%
- メモリ使用率 ≥ 85%
- スタッター数 > 3

### Medium（中優先度）
- プロファイル未適用
- FPS が不安定（1% Low / Avg 比率が低い）
- GPU 温度 ≥ 85°C

### Low（低優先度）
- ブースト未設定（none）
- タイマー解像度未最適化

## エッジケース
- GPU データが取得できない場合、GPU 関連因子を除外して平均を算出する
- `memTotalMb` が 0 の場合、メモリスコアを 0 とする
- 全入力が最適値の場合、スコアは 100 にならない可能性がある（各因子の平均による）
- `frameTime` のデータポイントが不足している場合、Performance Score を算出しない

## 非機能要件
- スコア算出は 10ms 以内に完了すること（純粋な計算のため）
- スコアの更新頻度は `nexus://pulse` イベントに連動（2秒間隔）
- ランクの色分け: READY=緑, GOOD=青, FAIR=オレンジ, NOT_READY=赤
