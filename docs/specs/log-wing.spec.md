# Log Wing — 仕様書

## 概要
システムログおよびアプリケーションログを表示し、レベル・ソース・テキストによるフィルタリングと分析機能を提供する。

## 前提条件
- Rust バックエンド側でシステムログ取得コマンド (`get_system_logs`, `get_application_logs`, `analyze_logs`, `export_logs`) が実装済みであること
- Zustand ストアで以下の状態を管理:
  - `logs: LogEntry[]`
  - `analysis: LogAnalysis | null`
  - `selectedLevel: 'All' | 'Error' | 'Warn' | 'Info' | 'Debug'`
  - `selectedSource: string`
  - `searchQuery: string`

## シナリオ

### Scenario 1: システムログの取得
- **Given** Log Wing が表示されている
- **When** ユーザーがリフレッシュボタンをクリックする
- **Then** `getSystemLogs(level?, limit?=1000)` が呼ばれ、ログ一覧が更新される

### Scenario 2: レベルによるフィルタリング
- **Given** ログが読み込まれている
- **When** ユーザーがレベルドロップダウンで「エラー」を選択する
- **Then** `setSelectedLevel('Error')` が実行され、Error レベルのログのみが表示される

### Scenario 3: ソースによるフィルタリング
- **Given** ログが読み込まれている
- **When** ユーザーがソースドロップダウンから特定のソースを選択する
- **Then** `setSelectedSource` が実行され、該当ソースのログのみが表示される

### Scenario 4: テキスト検索
- **Given** ログが読み込まれている
- **When** ユーザーが検索入力欄にテキストを入力する
- **Then** `setSearchQuery` が実行され、message / source / timestamp にマッチするログのみが表示される

### Scenario 5: アプリケーションログの取得
- **Given** Log Wing が表示されている
- **When** ユーザーがアプリ名入力欄にアプリ名を入力し、Fetch ボタンをクリックする
- **Then** `getApplicationLogs(appName, limit?)` が呼ばれ、該当アプリのログが表示される

### Scenario 6: ログ分析
- **Given** ログが読み込まれている
- **When** ユーザーが Analyze ボタンをクリックする
- **Then** `analyzeLogs()` が呼ばれ、LogAnalysisPanel に分析結果が表示される

### Scenario 7: ログのエクスポート
- **Given** ログが読み込まれている
- **When** ユーザーがエクスポート形式（JSON / CSV）を選択し、Export ボタンをクリックする
- **Then** `exportLogs(format)` が呼ばれ、成功時にファイルパスが表示される

### Scenario 8: ログのクリア
- **Given** ログが読み込まれている
- **When** ユーザーが Clear ボタンをクリックする
- **Then** `clearLogs` が実行され、ログ一覧と分析結果がリセットされる

## UI コンポーネント

### LogFilters
- レベルドロップダウン: 全レベル / エラー / 警告 / 情報 / デバッグ
- ソースドロップダウン: ログソースから動的に生成
- 検索入力: message / source / timestamp に対するテキストフィルタ

### LogStats
- 全件数とフィルタ後の件数を表示
- レベル別内訳: Error=赤, Warn=オレンジ, Info=青, Debug=グレー

### LogActions
- リフレッシュ / クリア / 分析ボタン
- アプリログ入力欄 + Fetch ボタン
- エクスポート形式ドロップダウン（JSON / CSV）+ Export ボタン
- エクスポート成功時にファイルパスを表示

### LogEntries
- 縦方向リスト
- 各エントリ: 色付きドット、タイムスタンプ、ソース、レベルバッジ、メッセージ（100文字で切り詰め）

### LogAnalysisPanel
- 4セルグリッド: total / error / warn / info カウント
- 時間範囲
- 頻度順トップソース一覧

## エッジケース
- ログが0件の場合、空状態メッセージを表示する
- アプリ名が空の状態で Fetch を押した場合、バリデーションエラーを表示する
- `limit` が未指定の場合、デフォルト 1000 件を使用する
- エクスポート先のディスク容量不足時、エラーメッセージを表示する
- 検索クエリが正規表現として不正な場合、プレーンテキスト検索にフォールバックする

## 非機能要件
- 1000件のログ表示でスクロールが60FPSを維持すること（仮想スクロール推奨）
- エクスポート処理中はローディング表示を行うこと
- フィルタリングはクライアントサイドで即時反映すること
