# Hardware Wing（ハードウェアモニター） — 仕様書

## 概要
CPU・GPU・メモリ・ストレージのリアルタイム監視と、エコモードによる電力最適化・コスト試算を提供するハードウェア情報画面。`nexus://hardware` イベントを購読して情報を更新する。

## 前提条件
- バックエンドが `nexus://hardware` イベントを発行していること
- ハードウェア情報（CPU、GPU、メモリ、ストレージ）が取得可能であること
- 電力消費データ（CPU/GPU ワット数）が計測可能であること
- エコモード設定がバックエンドで制御可能であること

## シナリオ

### CpuSection

#### Scenario 1: CPU 情報の表示
- **Given** `nexus://hardware` イベントからCPUデータを受信
- **When** CpuSection がレンダリングされる
- **Then** モデル名、コア数/スレッド数、ベース周波数が表示される

#### Scenario 2: CPU 温度の色分け表示
- **Given** CPU 温度データを受信
- **When** 温度が 65°C の場合
- **Then** 緑色で表示される（< 70°C）

#### Scenario 3: CPU 温度の警告表示
- **Given** CPU 温度データを受信
- **When** 温度が 75°C の場合
- **Then** 黄色で表示される（70〜80°C）

#### Scenario 4: CPU 温度の危険表示
- **Given** CPU 温度データを受信
- **When** 温度が 85°C の場合
- **Then** 赤色で表示される（≥ 80°C）

### GpuSection

#### Scenario 5: GPU 情報の表示
- **Given** GPU が検出されている
- **When** GpuSection がレンダリングされる
- **Then** モデル名、VRAM 合計、温度（色分け）、使用率 % が表示される

#### Scenario 6: GPU 未検出時の表示
- **Given** GPU が検出されない
- **When** GpuSection がレンダリングされる
- **Then** モデル名に「N/A」が表示される

### MemorySection

#### Scenario 7: メモリ情報の表示
- **Given** メモリデータを受信
- **When** MemorySection がレンダリングされる
- **Then** 合計 GB、使用中 GB、使用率 %、空き GB、テキストプログレスバーが表示される

### EcoModePanel

#### Scenario 8: エコモードの有効化
- **Given** エコモードが OFF
- **When** エコモードトグルを ON にする
- **Then** エコモードが有効化され、ターゲット FPS と電源プランの設定が適用される

#### Scenario 9: ターゲット FPS スライダーの操作
- **Given** エコモードが ON
- **When** ターゲット FPS スライダーを 60 に設定する
- **Then** FPS 制限が 60 に設定される（範囲: 30〜144、ステップ: 15）

#### Scenario 10: 電源プランの選択
- **Given** EcoModePanel が表示中
- **When** 電源プランを「Power Saver」に変更する
- **Then** Windows の電源プランが Power Saver に切り替わる

#### Scenario 11: 電気料金の設定
- **Given** EcoModePanel が表示中
- **When** 電気料金（¥/kWh）を入力する
- **Then** コスト試算に反映される

### PowerConsumptionDisplay

#### Scenario 12: 消費電力の表示
- **Given** 電力データが取得可能
- **When** PowerConsumptionDisplay がレンダリングされる
- **Then** CPU ワット数、GPU ワット数、合計ワット数が表示される

#### Scenario 13: 消費電力の色分け
- **Given** 合計消費電力を表示中
- **When** 合計が 350W の場合
- **Then** 緑色で表示される（< 400W）

#### Scenario 14: 高消費電力の警告色
- **Given** 合計消費電力を表示中
- **When** 合計が 450W の場合
- **Then** オレンジ色で表示される（> 400W）

### CostEstimationPanel

#### Scenario 15: 月額コスト試算
- **Given** 電気料金と消費電力が設定済み
- **When** 時間スライダー（1〜8h）を調整する
- **Then** 通常モードとエコモードの月額コスト、および節約額が表示される

### Thermal Alerts

#### Scenario 16: サーマルアラートの発行
- **Given** 温度監視が稼働中
- **When** CPU/GPU 温度が Warning/Critical レベルに達する
- **Then** アラートが自動発行される（状態変化時、または 30 秒間隔）

### Storage Overview

#### Scenario 17: ストレージ一覧の表示
- **Given** ストレージデータが取得可能
- **When** ストレージ概要がレンダリングされる
- **Then** ドライブリストが SSD/HDD 種別とヘルスステータス（Critical / Warning / Good）付きで表示される

## エッジケース
- `nexus://hardware` イベントが途絶えた場合、最終更新時刻を表示し stale 状態を示す
- GPU が複数搭載されている場合、プライマリ GPU の情報を表示する
- メモリ使用率が 95% 以上の場合、危険アラートを表示する
- エコモードのターゲット FPS がゲームの上限 FPS を超える場合、実質無制限として扱う
- 電気料金が 0 または未設定の場合、コスト試算セクションを非表示にする
- ストレージのヘルス情報が取得できないドライブは「不明」と表示する

## 非機能要件
- ハードウェアデータの更新頻度は 1〜2 秒間隔
- 温度閾値: Warning（CPU/GPU 70°C）、Critical（CPU/GPU 80°C）
- サーマルアラートは状態変化時に即座に、定常時は 30 秒間隔で発行
- 消費電力の色閾値: 緑 < 400W、オレンジ ≥ 400W
- ストレージヘルス閾値: Critical（使用率 > 90%）、Warning（> 80%）、Good（≤ 80%）
- エコモード設定の変更は即時反映（UI ブロックなし）
