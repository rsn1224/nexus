# Home Wing（ダッシュボード） — 仕様書

## 概要
リアルタイムのシステムステータスを表示するダッシュボード。HeroSection、ActionRow、TimelineSection の 3 セクションで構成され、`nexus://pulse` イベントを購読してリソース状況を可視化する。

## 前提条件
- バックエンドが `nexus://pulse` イベントを定期的に発行していること
- `ResourceSnapshot` 型のデータ（CPU%、MEM%、GPU%、DISK%）が取得可能であること
- フレームタイム監視対象のプロセスが OS 上で実行中であること（FrameTimeCard 使用時）

## シナリオ

### Scenario 1: パルスイベントの購読ライフサイクル
- **Given** Home Wing がマウントされていない状態
- **When** Home Wing がマウントされる
- **Then** `nexus://pulse` イベントを購読し、ResourceSnapshot を受信してリソースゲージを更新する

### Scenario 2: アンマウント時の購読解除
- **Given** Home Wing がマウント済みで pulse を購読中
- **When** Home Wing がアンマウントされる
- **Then** `nexus://pulse` イベントの購読が解除され、メモリリークが発生しない

### Scenario 3: リソースゲージの表示
- **Given** pulse イベントから ResourceSnapshot を受信
- **When** CPU=45%, MEM=62%, GPU=30%, DISK=55% のデータが届く
- **Then** 各ゲージが対応する値を表示し、DISK のみ warn 状態（≥50%）となる

### Scenario 4: GameReadinessPanel の表示
- **Given** リソース・最適化・パフォーマンスの 3 軸スコアが算出済み
- **When** 3 軸スコアがすべて高い
- **Then** ランクが「READY」と表示される

### Scenario 5: GameReadinessPanel のランク判定
- **Given** いずれかの軸スコアが低い
- **When** スコアに基づきランクが決定される
- **Then** READY / GOOD / FAIR / NOT_READY のいずれかが表示される

### Scenario 6: FrameTimeCard の監視開始
- **Given** プロセスが選択されている
- **When** フレームタイム監視を開始する
- **Then** AVG FPS、1% LOW、0.1% LOW、スタッターカウントがリアルタイム更新される

### Scenario 7: FrameTimeCard の監視停止
- **Given** フレームタイム監視が実行中
- **When** 監視を停止する
- **Then** 最後の計測結果が表示されたまま更新が止まる

### Scenario 8: BottleneckCard の自動分析
- **Given** フレームタイム監視がアクティブ
- **When** ボトルネック分析が自動実行される
- **Then** CPU / GPU / MEM / DISK のいずれかがボトルネックとして識別され、信頼度レベルが表示される

### Scenario 9: QuickActionsCard —「監視開始」
- **Given** pulse イベントが未購読
- **When**「監視開始」ボタンを押す
- **Then** `nexus://pulse` イベントの購読が開始される

### Scenario 10: QuickActionsCard —「今すぐ最適化」
- **Given** Home Wing が表示中
- **When**「今すぐ最適化」ボタンを押す
- **Then** Performance Wing へナビゲートされる

### Scenario 11: PerformanceTimelineCard のタブ切替
- **Given** PerformanceTimelineCard が表示中
- **When** LIST / DETAIL / COMPARE タブを切り替える
- **Then** 対応するセッション履歴ビューが表示される

### Scenario 12: OpsCard のプロセス情報表示
- **Given** pulse データからプロセス情報が取得可能
- **When** OpsCard がレンダリングされる
- **Then** CPU > 1% のアクティブプロセス数と、CPU 使用率上位 3 プロセスが表示される

## エッジケース
- pulse イベントが一定時間届かない場合、最終受信時刻を表示し stale 状態を示す
- ResourceSnapshot の値が null/undefined の場合、ゲージは「N/A」を表示する
- フレームタイム監視対象のプロセスが終了した場合、監視を自動停止し通知する
- ボトルネック分析でどの項目も閾値を超えない場合、「ボトルネックなし」と表示する
- CPU/MEM/GPU が同時に高負荷の場合、信頼度が最も高い項目を主ボトルネックとする

## 非機能要件
- リソースゲージの更新遅延は 1 秒以内
- 閾値: warn = 50%、danger = 80%（DISK のみ warn = 70%、danger = 90%）
- pulse イベントのリスナーはアンマウント時に確実に解除すること（メモリリーク防止）
- ゲージのアニメーションは 60fps を維持すること
