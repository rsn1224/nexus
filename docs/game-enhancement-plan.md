# nexus ゲーム特化・軽量最適化 強化プラン

## エグゼクティブサマリー

nexus を「ゲーマーのための軽量パフォーマンスハブ」として差別化するための機能強化プランをまとめる。
現状の nexus は汎用的なシステム最適化ツールだが、ゲーム特化の機能が不足している。
本プランでは、競合分析・市場トレンド・ゲーマーコミュニティの要望を踏まえ、3つのフェーズに分けて実装可能な強化案を提案する。

---

## 1. 現状分析

### 1.1 nexus の現在の機能

| カテゴリ | 現在の機能 | 評価 |
|---------|-----------|------|
| プロセス管理 | CPU閾値超過プロセスのkill、優先度設定 | △ 基本的 |
| 電源管理 | 電源プラン切替 | △ 基本的 |
| システム監視 | CPU/RAM/Disk/Network/GPU リアルタイム監視 | ○ 良好 |
| ブースト | 閾値ベースのプロセスkill（シミュレーションモード残存） | × 要改善 |
| ネットワーク | DNS変更、ネットワーク設定適用 | △ 基本的 |
| ストレージ | temp/recycle/cache クリーンアップ、ディスク分析 | ○ 良好 |
| AI提案 | 閾値ベース（CPU>90%, RAM>75%）のルールベースアラート | × 単純すぎ |
| スコアシステム | CPU 40%/RAM 30%/Disk 20%/GPU 10% 加重スコア | △ 実ゲーム性能と乖離 |

### 1.2 決定的に欠けている機能

- **ゲームごとのプロファイル**（起動時に最適設定を自動適用）
- **CPUアフィニティ管理**（ゲームに高性能コアを専有させる）
- **フレームタイム監視**（平均FPSでなく0.1% lowsとスタッター検出）
- **タイマーリゾリューション最適化**（Windows tick rate 0.5ms化）
- **シェーダーキャッシュ管理**（初回起動スタッター対策）
- **自動起動最適化**（ゲーム検出→即座にブースト適用）

---

## 2. 競合分析

### 2.1 主要競合マッピング

| 機能 | Razer Cortex | Process Lasso | HD OPTI | nexus（現状）|
|------|-------------|---------------|---------|-------------|
| ゲームごとプロファイル | ✅ Booster Prime | ❌ | ✅ ゲーム別最適化 | ❌ |
| CPUアフィニティ | ✅ 自動設定 | ✅ 永続ルール・ProBalance | ❌ | ❌ |
| AI/ML最適化 | ✅ ML設定予測 | ❌ | ❌ | ❌（ルールベースのみ）|
| FPS予測 | ✅ 適用前FPS予測 | ❌ | ❌ | ❌ |
| ネットワーク最適化 | ❌ | ❌ | ✅ ヒットレグ改善 | △ DNS変更のみ |
| タイマーリゾリューション | ❌ | ❌ | ❌ | ❌ |
| フレームタイム監視 | △ FPSカウンター | ❌ | ❌ | ❌ |
| プロセス優先度管理 | △ 非必須停止のみ | ✅ 永続・動的ルール | △ | △ |
| 電源プラン自動切替 | ❌ | ✅ ゲーム検出時自動切替 | ❌ | △ 手動のみ |
| シェーダーキャッシュ管理 | ❌ | ❌ | ❌ | ❌ |
| 軽量性（常駐コスト） | × 重い | ○ 軽量 | △ 中程度 | ✅ Tauri（最軽量）|
| オープンソース | ❌ | ❌ | ❌ | ✅ |

### 2.2 nexus の差別化ポイント

1. **Tauri による圧倒的軽量性** — Electron系の競合（100MB+）に対し、nexus は10MB以下
2. **オープンソース** — 透明性・カスタマイズ性で競合と差別化
3. **既存のリアルタイム監視基盤** — Phase 5 で構築したイベント駆動アーキテクチャ
4. **Rust バックエンド** — 低レベルOS操作の安全性と高速性

---

## 3. ゲーマーのペインポイント（2026年）

調査から浮かび上がった主要な不満：

### 3.1 パフォーマンス関連
- **フレームタイムスパイク / マイクロスタッター** — 平均FPSが高くても体感がカクつく（最大の不満）
- **バックグラウンドプロセスの干渉** — Windows Update、クラウド同期、ブラウザ等がゲーム中にCPU/RAMを食う
- **初回起動時のシェーダーコンパイルスタッター** — 新しいエリアに入るたびにカクつく
- **ゲームごとの設定調整の手間** — 毎回手動で最適設定を探る必要

### 3.2 レイテンシ関連
- **入力遅延** — マウス→画面反映までの遅延（競技ゲーマーの最重要課題）
- **ネットワークレイテンシ** — サーバー接続のジッター、ヒットレグのズレ

### 3.3 利便性関連
- **ツールの乱立** — MSI Afterburner + Process Lasso + Timer Resolution + ... と多数のツールを併用
- **最適化ガイドの複雑さ** — BIOS設定、レジストリ、コマンドラインなど敷居が高い

---

## 4. 強化プラン（3フェーズ）

### フェーズ A: コアゲーミング基盤（優先度：最高）

> 目標：nexus を「ゲーム最適化ツール」として認識される最低限の機能を確立

#### A-1. ゲームプロファイルシステム

**概要**: ゲームごとに最適化設定を保存・自動適用する仕組み

```
GameProfile {
  game_id: String,          // Steam AppID or exe path
  display_name: String,
  exe_path: PathBuf,
  // プロセス設定
  cpu_affinity: Option<Vec<usize>>,     // 使用コア指定
  process_priority: Priority,            // Realtime/High/AboveNormal
  // 電源設定
  power_plan: PowerPlan,                 // 高パフォーマンス/Ultimate
  // ブースト設定
  processes_to_kill: Vec<String>,        // ゲーム起動時に停止するプロセス
  processes_to_suspend: Vec<String>,     // ゲーム起動時に一時停止するプロセス
  // タイマー設定
  timer_resolution_ms: Option<f64>,      // 0.5ms推奨
  // ネットワーク設定
  network_profile: Option<NetworkProfile>,
  // メタ
  last_played: DateTime,
  total_play_time: Duration,
}
```

**実装ポイント**:
- Steam ライブラリの自動スキャン（`libraryfolders.vdf` パース）
- `.exe` パスの手動追加にも対応
- ゲーム起動検出 → プロファイル自動適用 → 終了検出 → 自動リバート
- プロファイルのインポート/エクスポート（JSON）でコミュニティ共有可能に

**競合優位**: Razer Cortex の Booster Prime はゲーム内グラフィック設定を変更するが、nexus はOS・プロセスレベルの最適化に特化。役割が異なるので共存可能。

#### A-2. CPUアフィニティ・コアアイソレーション

**概要**: ゲームプロセスにP-Core（高性能コア）を専有させ、バックグラウンドをE-Core（省電力コア）に隔離

**根拠**: Reddit r/OptimizedGaming の報告によると、AMD 7950X3D でゲームを CCD0（8コア）に制限すると 1% low が 50%以上改善。Intel P/E-Core 環境でも、ゲームをP-Coreに固定しバックグラウンドをE-Coreに移すとスタッターが大幅減少。

```
CoreIsolation {
  // 自動検出
  cpu_topology: CpuTopology,  // P-Core/E-Core/CCD構成を自動検出
  
  // ゲーム用コアセット
  game_cores: Vec<usize>,     // ゲームに割り当てるコア
  background_cores: Vec<usize>, // バックグラウンドに追いやるコア
  
  // プロセス分類ルール
  rules: Vec<AffinityRule>,   // プロセス名/パターン → コアセット
  
  // 永続設定
  persistent: bool,           // 再起動後も維持（Process Lasso相当）
}
```

**実装ポイント**:
- `windows::Win32::System::Threading::SetProcessAffinityMask` で実装
- Intel P/E-Core、AMD CCD0/CCD1 の自動検出
- プリセット：「ゲーム優先（P-Core独占）」「バランス」「省電力」
- 子プロセスも追従させるオプション（Rust で PID 監視）

#### A-3. インテリジェントブーストの再設計

**概要**: 現在の「CPU閾値超過プロセスをkill」から、段階的で安全なブースト方式へ

```
BoostStrategy:
  Level 1 (ソフト):
    - 不要バックグラウンドプロセスの一時停止（suspend）
    - Windows Search Indexer 停止
    - Windows Update 延期
    - クラウド同期一時停止（OneDrive, Dropbox等）
    
  Level 2 (ミディアム):
    - 電源プランを Ultimate Performance に切替
    - Visual Effects をパフォーマンス優先に
    - CPU アフィニティをゲーム用に再配置
    - タイマーリゾリューション最適化
    
  Level 3 (ハード):
    - 指定プロセスの強制終了
    - サービスの一時停止
    - ネットワーク帯域制限（ゲーム以外）
```

**シミュレーションモードの削除**: 現在のコードに残存する `simulated` フラグを削除し、実動作のみに統一。

---

### フェーズ B: パフォーマンス可視化・分析（優先度：高）

> 目標：ゲーマーが「体感の違い」を数値で確認できる計測ツールを提供

#### B-1. フレームタイムモニタリング

**概要**: 平均FPSではなく、フレームタイム（ms）と0.1%/1% lowsを計測・可視化

**根拠**: 2026年のゲーマーコミュニティでは「平均FPSは意味がない、フレームタイムの安定性が体感を決める」が常識化。

```
FrameTimeMonitor {
  // 計測データ
  frame_times: RingBuffer<f64>,   // 直近N秒分のフレームタイム
  avg_fps: f64,
  percentile_1: f64,              // 1% low
  percentile_01: f64,             // 0.1% low
  stutter_count: u32,             // フレームタイムが平均の2倍を超えた回数
  
  // 可視化
  graph_mode: FrameTimeGraph,     // リアルタイム折れ線グラフ
  overlay_mode: bool,             // ゲーム内オーバーレイ表示
}
```

**実装方法**:
- Windows の `ETW (Event Tracing for Windows)` を使い、DirectX のフレーム提示イベントをキャプチャ
- `PresentMon` のアプローチを Rust で軽量実装
- CPU/GPU 両方のフレームタイムを分離して表示
- 「スタッターイベント」の検出とログ記録

#### B-2. パフォーマンススコアの再設計

**概要**: 現在のリソース空き状況ベースのスコアから、実ゲーム性能指標ベースへ

```
現状: GameScore = CPU空き(40%) + RAM空き(30%) + Disk空き(20%) + GPU空き(10%)
  → 問題: 実際のゲーム性能と相関しない

提案: GameReadinessScore = {
  frame_stability:  フレームタイム安定度（標準偏差の逆数）  // 40%
  input_latency:    推定入力遅延（ms）                      // 25%
  resource_headroom: CPU/RAM/VRAM 余裕度                    // 20%
  thermal_margin:   サーマルスロットリングまでの余裕         // 15%
}
```

#### B-3. ブースト前後の比較レポート

**概要**: ブースト適用前後のシステム状態を自動記録し、効果を可視化

```
BoostReport {
  before: SystemSnapshot,   // ブースト前のスナップショット
  after: SystemSnapshot,    // ブースト後のスナップショット
  delta: {
    freed_ram_mb: i64,
    freed_cpu_percent: f64,
    killed_processes: Vec<ProcessInfo>,
    suspended_processes: Vec<ProcessInfo>,
    power_plan_change: Option<(String, String)>,
  }
}
```

---

### フェーズ C: 先進機能（優先度：中）

> 目標：競合との明確な差別化と、パワーユーザー向け高度機能

#### C-1. タイマーリゾリューション管理

**概要**: Windows のデフォルトタイマー解像度（15.625ms）を 0.5ms に変更し、フレームタイムの一貫性を向上

**根拠**: Timer Resolution のテストで、0.1% lows が大幅改善（Fortnite等）。ゲーム起動中のみ変更し、終了後に自動リバートすることで電力効率を維持。

```
TimerManager {
  // ゲーム起動時: NtSetTimerResolution(5000, TRUE, &current)
  // ゲーム終了時: NtSetTimerResolution(default, TRUE, &current)
  
  current_resolution_100ns: u32,
  game_resolution_100ns: u32,     // デフォルト: 5000 (0.5ms)
  auto_revert: bool,              // ゲーム終了時に自動リバート
  
  // HPET状態の表示（情報提供のみ、変更はリスクが高いため推奨しない）
  hpet_enabled: bool,
}
```

**実装ポイント**:
- `ntdll.dll` の `NtSetTimerResolution` を Rust FFI で呼び出し
- ゲームプロファイルと連動（起動時に設定、終了時にリバート）
- HPET の無効化は BIOS 依存でリスクがあるため、情報表示のみ

#### C-2. ネットワークレイテンシ最適化の強化

**概要**: 現在のDNS変更だけでなく、ゲーム向けネットワークチューニングを追加

```
NetworkOptimizer {
  // TCP最適化
  nagle_algorithm: bool,          // 無効化推奨（遅延削減）
  tcp_ack_frequency: u32,         // ACK頻度調整
  
  // QoS / 帯域制御
  game_process_priority: bool,    // ゲームプロセスのネットワーク優先
  background_throttle_kbps: Option<u32>,  // バックグラウンドの帯域制限
  
  // DNS
  dns_provider: DnsProvider,      // Cloudflare/Google/カスタム
  dns_over_https: bool,
  
  // 計測
  ping_monitor: PingMonitor,      // ゲームサーバーへの ping リアルタイム表示
  jitter_ms: f64,                 // ジッター計測
}
```

#### C-3. シェーダーキャッシュ管理

**概要**: DirectX シェーダーキャッシュの管理と最適化

**根拠**: 2026年の Windows は「Advanced Shader Delivery (ASD)」機能で初回起動スタッターを軽減するが、全ゲームが対応しているわけではない。

```
ShaderCacheManager {
  // DirectX シェーダーキャッシュの場所を監視
  cache_path: PathBuf,   // %LOCALAPPDATA%/D3DSCache
  cache_size_mb: f64,
  
  // 機能
  game_cache_sizes: HashMap<String, f64>,  // ゲームごとのキャッシュサイズ
  cleanup_stale: bool,                      // 古いキャッシュの自動削除
  pre_warm_on_install: bool,                // ゲームインストール時のプリウォーム
  
  // Windows ASD対応状況の表示
  asd_supported_games: Vec<String>,
}
```

#### C-4. サーマル認識型ブースト

**概要**: GPU/CPU温度に応じてブースト強度を自動調整（サーマルスロットリング防止）

```
ThermalAwareBoost {
  // 温度閾値
  cpu_warning_temp: f64,    // デフォルト: 85°C
  gpu_warning_temp: f64,    // デフォルト: 83°C
  throttle_temp: f64,       // デフォルト: 95°C
  
  // 動的調整
  auto_reduce_boost: bool,  // 温度上昇時にブーストを段階的に緩和
  fan_curve_hint: bool,     // FanCtrl連携のヒント表示
  
  // ラップトップ向け
  laptop_mode: bool,        // バッテリー・サーマル制約を考慮
}
```

---

## 5. 実装ロードマップ

### 前提条件
- Phase 3（FEファウンデーション）、Phase 6（React 19/Zustand v5）、Phase 7（品質仕上げ）を先に完了
- ゲーム強化は Phase 8 以降として位置づけ

### 推奨実装順序

```
Phase 8a: ゲームプロファイル基盤（2-3週間）
  ├── ゲームスキャン・検出（Steam連携）
  ├── プロファイルCRUD（UI + Rust backend）
  ├── ゲーム起動/終了検出 → 自動適用/リバート
  └── テスト: 3つ以上のゲームでE2E確認

Phase 8b: CPUアフィニティ・ブースト再設計（2-3週間）
  ├── CPU トポロジー自動検出（Intel P/E, AMD CCD）
  ├── アフィニティ設定API（Rust）
  ├── 段階的ブースト（Level 1-3）
  ├── ブースト前後のスナップショット比較
  └── テスト: Intel/AMD 両環境で確認

Phase 9a: フレームタイム監視（2-3週間）
  ├── ETWベースのフレームタイム取得（Rust）
  ├── リアルタイムグラフUI（React）
  ├── 0.1%/1% low 計算・表示
  ├── スタッター検出アラート
  └── テスト: DX11/DX12/Vulkan タイトルで検証

Phase 9b: タイマーリゾリューション・ネットワーク強化（1-2週間）
  ├── NtSetTimerResolution FFI
  ├── Nagle無効化・TCP最適化
  ├── Ping/ジッターモニター
  └── ゲームプロファイルとの連動

Phase 10: 高度な可視化・スコア再設計（1-2週間）
  ├── GameReadinessScore の実装
  ├── ブースト効果レポートUI
  ├── シェーダーキャッシュ管理
  └── サーマル認識型ブースト
```

---

## 6. 技術的考慮事項

### 6.1 軽量性の維持（最重要）

nexus の最大の強みは Tauri による軽量性。機能追加で膨らまないよう注意が必要：

| 項目 | 目標 |
|------|------|
| 常駐メモリ | < 30MB（現状約15MB、追加後も30MB以下） |
| CPU使用率（アイドル時） | < 0.5% |
| バイナリサイズ | < 15MB |
| ゲーム中のFPS影響 | 0 FPS（計測ツールのオーバーヘッドは除く） |

**方針**:
- フレームタイム監視は「オプトイン」で必要時のみ有効化
- ETW は既に OS 側の仕組みなので追加オーバーヘッドは最小
- バックグラウンド監視の頻度はユーザーが調整可能

### 6.2 安全性

- CPU アフィニティ変更はゲーム終了時に必ずリバート
- タイマーリゾリューション変更もゲーム終了時に自動リバート
- 「元に戻せない変更」は一切行わない
- レジストリ変更はすべてバックアップ・リバート可能
- ブーストのLevel 3（プロセスkill）は明示的な同意後のみ

### 6.3 既存ツールとの共存

ユーザーの常駐アプリ（NVIDIA App, FanCtrl, Steam, Xbox, G HUB）との共存を保証：

| アプリ | nexus との関係 |
|--------|--------------|
| NVIDIA App | 補完関係。nexus はOS側、NVIDIA App はGPU側を最適化 |
| FanCtrl | 干渉なし。nexus のサーマル認識がFanCtrlの動作を参考にできる |
| Steam | 依存関係。Steam ライブラリからゲーム一覧をスキャン |
| Xbox App / Game Bar | 補完関係。Game Mode はWindows側、nexus はプロセス側 |
| G HUB | 干渉なし。マウス/キーボード設定は別レイヤー |

### 6.4 Windows 2026 新機能との連携

- **Auto Super Resolution (Auto SR)**: NPUベースのAIアップスケーラー。nexus は「有効/無効」の状態表示と切替UIを提供
- **Advanced Shader Delivery (ASD)**: シェーダープリロード機能。nexus は対応ゲームの表示と非対応ゲームへのワークアラウンドを提供
- **Hardware GPU Scheduling**: 有効化状態の確認と推奨設定の提示
- **Windowed Game Optimizations**: 有効化状態の確認と推奨設定の提示

---

## 7. 差別化メッセージ

### 競合との位置づけ

```
Razer Cortex    = ゲーム内グラフィック設定の AI 最適化（重い、クローズド）
Process Lasso   = 汎用プロセス管理（ゲーム特化ではない）
HD OPTI         = ゲーム特化だがネットワーク中心（有料化予定）
Timer Resolution = 単機能ツール（UIなし）

nexus = ゲーマーのための軽量統合ハブ
  - OS レベルの最適化をワンクリックで
  - Tauri で最軽量（ゲーム中 0 FPS 影響）
  - オープンソースで透明性担保
  - 既存ツール（NVIDIA App, Steam等）と補完関係
```

### ターゲットユーザー

1. **競技ゲーマー**: フレームタイム安定性・入力遅延削減が最重要
2. **カジュアルゲーマー**: 「ワンクリックブースト」で難しい設定不要
3. **パワーユーザー**: 細かいプロファイル設定・CPU アフィニティ管理
4. **ラップトップゲーマー**: サーマル制約下での最適化

---

## 8. まとめ — 優先実装 TOP 5

| 順位 | 機能 | 理由 | 工数目安 |
|------|------|------|---------|
| 1 | ゲームプロファイルシステム | 全ての強化機能の基盤となる | 2-3週間 |
| 2 | CPUアフィニティ・コアアイソレーション | 最も体感効果が大きい（1% low 50%+改善の報告あり） | 2-3週間 |
| 3 | 段階的ブースト再設計 | 現在のkillベースから安全な段階式へ | 1-2週間 |
| 4 | フレームタイム監視 | 「効果の見える化」でユーザー満足度向上 | 2-3週間 |
| 5 | タイマーリゾリューション管理 | 実装が軽量で効果が高い | 3-5日 |

---

## 出典

- [Razer Cortex: Booster Prime](https://www.razer.com/cortex/booster-prime) — AI/ML ベースのゲーム設定最適化
- [Razer Cortex: Game Booster](https://www.razer.com/cortex/booster) — プロセス管理・FPSカウンター
- [Process Lasso CPU Affinity Guide (Bitsum)](https://bitsum.com/cpu-affinities/) — 永続的CPUアフィニティ管理
- [r/OptimizedGaming: Process Lasso](https://www.reddit.com/r/OptimizedGaming/comments/1c7lw6x/process_lasso_myth_or_fact/) — 7950X3D で1% low 50%+改善の報告
- [HD OPTI](https://hdopti.com) — ゲーム特化の自動最適化・ネットワーク最適化
- [Timer Resolution](https://timerresolution.com) — Windows タイマー解像度変更ツール
- [2026 Timer Resolution Guide (YouTube)](https://www.youtube.com/watch?v=0Nx8E979ryg) — HPET無効化・タイマーリゾリューションのベンチマーク
- [2026 Windows PC Optimization Guide (YouTube)](https://www.youtube.com/watch?v=D5VZXq9DMX8) — 2026年版Windows最適化ガイド
- [How to Auto-Optimize Games on Windows 11 2026 (YouTube)](https://www.youtube.com/watch?v=m19SmcD4Qug) — Auto SR・ASD・Identity Check等の2026新機能
- [Fix Frame-Time Spikes & Stutter in Games (YouTube)](https://www.youtube.com/watch?v=dFSg7HBeycM) — RAM関連スタッター対策
- [Top 10 Free Gaming Tools 2026 (Tech Times)](https://www.techtimes.com/articles/313727/20260103/top-10-free-gaming-tools-must-have-software-every-pc-gamer-needs-2026.htm) — 2026年の推奨ゲーミングツール一覧
- [Microsoft: Optimize Your Gaming PC](https://www.microsoft.com/en-us/windows/learning-center/optimize-your-gaming-pc-setup) — Game Mode・DirectStorage公式ガイド
