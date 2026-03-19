# Unified Emitter — 仕様書

## 概要
4つの独立したエミッターを統合した単一の非同期 Rust タスクで、1秒ベースループにより定期的にシステム情報を収集・配信する。

## 前提条件
- Tauri v2 の `AppHandle` によるイベント発信が可能であること
- `sysinfo`, GPU 情報取得、ゲーム検出の各モジュールが実装済みであること
- `Mutex<AppState>` でアプリケーション状態が共有されていること

## アーキテクチャ

### ベースループ
- 周期: 1秒（`BASE_MS`）
- `tick` は各サイクルで `wrapping_add(1)` によりインクリメント
- 残り時間: `BASE_MS - elapsed` で1秒サイクルを維持

### CPU リフレッシュパターン
1. 1回目のリフレッシュ（ロック取得→解放）
2. 200ms スリープ（ロック解放中）
3. 2回目のリフレッシュ（デルタ計算用）

### スケジューリング

| 条件 | イベント | 間隔 |
|------|---------|------|
| `tick % 2 == 0` | pulse | 2秒 |
| `tick % 3 == 0` | ops + game_monitor | 3秒 |
| `tick % 5 == 0` | hardware + thermal | 5秒 |

## シナリオ

### Scenario 1: Pulse イベントの配信
- **Given** UnifiedEmitter が稼働している
- **When** `tick % 2 == 0` となる
- **Then** `nexus://pulse` イベントが `ResourceSnapshot` ペイロードで発信される

### Scenario 2: Ops イベントの配信
- **Given** UnifiedEmitter が稼働している
- **When** `tick % 3 == 0` となる
- **Then** `nexus://ops` イベントが CPU 使用率降順トップ100プロセスの `Vec<SystemProcess>` で発信される

### Scenario 3: Hardware イベントの配信
- **Given** UnifiedEmitter が稼働している
- **When** `tick % 5 == 0` となる
- **Then** `nexus://hardware` イベントが `HardwareInfo` ペイロードで発信される

### Scenario 4: Thermal Alert の発信（状態変化時）
- **Given** `tick % 5 == 0` でサーマルチェックが実行される
- **When** コンポーネントの温度が閾値を超える（または安全範囲に復帰する）
- **Then** `nexus://thermal-alert` イベントが `ThermalAlert` ペイロードで発信される

### Scenario 5: Thermal Alert の定期発信
- **Given** コンポーネントの温度が閾値を超えた状態が継続している
- **When** 前回のアラートから30秒が経過する
- **Then** `nexus://thermal-alert` イベントが再度発信される

### Scenario 6: 温度正常復帰の通知
- **Given** コンポーネントが以前に thermal alert を発した
- **When** 温度が安全範囲に復帰する
- **Then** `level: 'normal'` の `ThermalAlert` が発信される

### Scenario 7: ゲーム検出
- **Given** `tick % 3 == 0` で `check_once` が呼ばれる
- **When** 新しいゲームプロセスが検出される
- **Then** `nexus://game-launched` イベントが発信され、`active_games` HashMap に追加される

### Scenario 8: ゲーム終了検出
- **Given** `active_games` にゲームが登録されている
- **When** 該当プロセスが検出されなくなる
- **Then** `nexus://game-exited` イベントが発信され、`active_games` から削除される

## イベントペイロード

### `nexus://pulse` — ResourceSnapshot
- `timestamp: string`
- `cpuPercent: number`
- `cpuTempC: number | null`
- `memUsedMb: number`
- `memTotalMb: number`
- `diskReadKb: number`
- `diskWriteKb: number`
- `netRecvKb: number`
- `netSentKb: number`

注: Disk I/O デルタは pulse tick でのみ計算される。

### `nexus://ops` — Vec\<SystemProcess\>
CPU 使用率降順でソートされたトップ100プロセス:
- `pid: number`
- `name: string`
- `cpuPercent: number`
- `memMb: number`
- `diskReadKb: number`
- `diskWriteKb: number`
- `canTerminate: boolean`

### `nexus://hardware` — HardwareInfo
- CPU: name, cores, threads, freq, temp
- Memory: total, used
- Disks: name, size, available, type
- GPU: name, vram, temp, usage
- OS: name, version, arch
- Uptime: seconds

### `nexus://thermal-alert` — ThermalAlert
- `component: string`
- `level: 'normal' | 'warning' | 'critical'`
- `currentTempC: number`
- `thresholdC: number`
- `message: string`
- `timestamp: string`

## ロック規律（Lock Discipline）
- `Mutex<AppState>` は短時間のみ保持し、200ms スリープ前に必ず解放する
- スリープ中は他のコマンドがロックを取得可能
- デッドロック防止のため、ロック保持中に他のロックを取得しない

## ThermalState
- `LazyLock<Mutex<ThermalState>>` static として定義
- `last_alerts: HashMap<String, ThermalLevel>` — コンポーネントごとの最終アラートレベル
- `last_alert_time: HashMap<String, Instant>` — コンポーネントごとの最終アラート時刻
- クールダウン: 30秒（同一状態での再通知間隔）

## エッジケース
- GPU が搭載されていないシステムでは GPU 関連フィールドを null / 0 で配信する
- `sysinfo` のリフレッシュが 200ms 以上かかった場合、サイクルの残りスリープを 0ms にクランプする
- プロセスが100件未満の場合、存在するプロセスのみを返す
- `tick` のオーバーフローは `wrapping_add` により自然にラップアラウンドする
- Thermal チェックでセンサーが利用不可の場合、該当コンポーネントをスキップする

## 非機能要件
- 1秒サイクルの精度は ±50ms 以内であること
- CPU リフレッシュの2段階パターンにより正確なデルタ計算を保証すること
- ロック保持時間は 10ms 以内を目標とすること
- メモリリーク防止: `active_games` の終了検出漏れを防ぐため、定期的なクリーンアップを実施すること
