# Watchdog — 仕様書

## 概要
プロセスを監視し、設定可能なルールに基づいて自動的にアクション（優先度変更、アフィニティ設定、サスペンド、終了）を実行する。

## 前提条件
- Rust バックエンド側でプロセス監視・制御コマンドが実装済みであること
- UnifiedEmitter の `nexus://ops` イベントでプロセス情報が定期取得されていること

## データ型

### WatchdogRule
- `id: string`
- `name: string`
- `enabled: boolean`
- `conditions: WatchdogCondition[]`
- `action: WatchdogAction`
- `processFilter: ProcessFilter`
- `profileId: string`
- `cooldownSecs: number`
- `lastTriggeredAt: number | null`

### WatchdogCondition
- `metric: 'cpuPercent' | 'memoryMb' | 'diskReadKb' | 'diskWriteKb'`
- `operator: 'greaterThan' | 'lessThan' | 'equals'`
- `threshold: number`

### WatchdogAction
- `setPriority: { level: string }`
- `setAffinity: { cores: number[] }`
- `'suspend'`
- `'terminate'`

### ProcessFilter
- `includeNames: string[]`
- `excludeNames: string[]`

### WatchdogEvent
- `timestamp: string`
- `ruleId: string`
- `ruleName: string`
- `processName: string`
- `pid: number`
- `actionTaken: string`
- `metricValue: number`
- `threshold: number`
- `success: boolean`
- `detail: string`

## シナリオ

### Scenario 1: ルール一覧の取得
- **Given** Watchdog 画面が表示される
- **When** コンポーネントがマウントされる
- **Then** `fetchRules` が呼ばれ、ルール一覧が WatchdogRuleTable に表示される

### Scenario 2: ルールの追加
- **Given** Watchdog 画面が表示されている
- **When** ユーザーが新規ルール作成ボタンをクリックし、WatchdogRuleModal で条件とアクションを設定して保存する
- **Then** `addRule` が呼ばれ、新しいルールが一覧に追加される

### Scenario 3: ルールの有効/無効トグル
- **Given** ルール一覧にルールが存在する
- **When** ユーザーがルールのトグルスイッチを切り替える
- **Then** `updateRule` が呼ばれ、`enabled` フラグが反転する

### Scenario 4: ルールの編集
- **Given** ルール一覧にルールが存在する
- **When** ユーザーが編集ボタンをクリックし、WatchdogRuleModal で変更を保存する
- **Then** `updateRule` が呼ばれ、ルール設定が更新される

### Scenario 5: ルールの削除
- **Given** ルール一覧にルールが存在する
- **When** ユーザーが削除ボタンをクリックし、確認ダイアログで承認する
- **Then** `removeRule` が呼ばれ、ルールが一覧から削除される

### Scenario 6: ルール発火（クールダウン外）
- **Given** 有効なルールが存在し、前回の発火から `cooldownSecs` 以上経過している
- **When** 監視対象プロセスのメトリクスが条件を満たす
- **Then** ルールのアクションが実行され、WatchdogEvent がイベントログに記録される

### Scenario 7: ルール発火（クールダウン内）
- **Given** 有効なルールが存在し、前回の発火から `cooldownSecs` 未満である
- **When** 監視対象プロセスのメトリクスが条件を満たす
- **Then** アクションは実行されず、イベントも記録されない

### Scenario 8: イベントログの確認
- **Given** ルールが発火した履歴がある
- **When** ユーザーが WatchdogEventLog を表示する
- **Then** `fetchEvents` が呼ばれ、発火履歴（タイムスタンプ、ルール名、プロセス名、アクション、成否）が時系列で表示される

### Scenario 9: プリセットの読み込み
- **Given** Watchdog 画面が表示されている
- **When** ユーザーがプリセット読み込みボタンをクリックする
- **Then** `loadPresets` が呼ばれ、定義済みルールセットがインポートされる

## UI コンポーネント

### WatchdogRuleTable
- ルール一覧をテーブル形式で表示
- 各行にトグル / 編集 / 削除ボタン

### WatchdogRuleModal
- ルールの作成・編集用モーダル
- 条件（メトリクス・演算子・閾値）の複数追加
- アクション選択
- プロセスフィルタ設定
- クールダウン秒数設定

### WatchdogEventLog
- 発火イベントの監査ログ
- タイムスタンプ順で表示

## エッジケース
- `conditions` が空のルールは保存時にバリデーションエラーとする
- `processFilter` の `includeNames` と `excludeNames` の両方が空の場合、全プロセスを対象とする
- `cooldownSecs` が 0 の場合、クールダウンなし（毎回発火可能）
- `terminate` アクションは確認ダイアログを表示してからルールに設定可能とする
- ルールの条件が複数ある場合、すべての条件を AND で評価する

## 非機能要件
- ルール評価はプロセス監視の各サイクル（3秒）内で完了すること
- イベントログは最大 1000 件を保持し、古いものから削除する
- `terminate` / `suspend` アクションは権限エラー時に適切なメッセージを表示すること
