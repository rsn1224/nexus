# Games Wing（ゲームランチャー） — 仕様書

## 概要
インストール済み Steam ゲームをグリッド表示し、ワンクリックで起動・最適化を行うランチャー画面。お気に入り管理、Auto Boost、ソート・検索機能を備える。

## 前提条件
- Steam がインストールされており、ゲームライブラリのパスが取得可能であること
- バックエンドが Steam ゲーム一覧をスキャンできること
- `run_boost` コマンドが利用可能であること（Auto Boost 使用時）
- `useLauncherStore` がバックエンド経由で設定を永続化できること

## シナリオ

### Scenario 1: ゲームグリッドの表示
- **Given** Steam ゲームのスキャンが完了している
- **When** Games Wing を開く
- **Then** インストール済みゲームがレスポンシブグリッド（2〜5 列）で表示される

### Scenario 2: GameCard の情報表示
- **Given** ゲームグリッドが表示中
- **When** 各 GameCard を確認する
- **Then** Steam ヘッダー画像、ゲーム名、お気に入り星アイコン、サイズ（GB）、最終プレイ日時、ProfileBadge（● アクティブ / ○ 非アクティブ）、LAUNCH ボタンが表示される

### Scenario 3: 最終プレイ日時の表示フォーマット
- **Given** ゲームに最終プレイ情報がある
- **When** GameCard がレンダリングされる
- **Then** 今日 → 「今日」、昨日 → 「昨日」、それ以降 → 「Xヶ月前」、未プレイ → 「未プレイ」と表示される

### Scenario 4: ゲーム検索
- **Given** LauncherControls の検索入力が表示中
- **When** ゲーム名を入力する
- **Then** 部分一致するゲームのみグリッドに表示される

### Scenario 5: ソート切替
- **Given** LauncherControls のソートドロップダウンが表示中
- **When** ソート基準（名前 / サイズ / 最終プレイ）を選択する
- **Then** グリッドが選択基準で並び替えられる

### Scenario 6: ゲームスキャン
- **Given** LauncherControls のスキャンボタンが表示中
- **When** スキャンボタンを押す
- **Then** Steam ライブラリが再スキャンされ、グリッドが更新される

### Scenario 7: Auto Boost 有効でゲーム起動
- **Given** AUTO BOOST トグルが ON
- **When** GameCard の LAUNCH ボタンを押す
- **Then** `run_boost` が実行された後にゲームが起動され、lastPlayed タイムスタンプが記録される

### Scenario 8: Auto Boost 失敗時のフォールバック
- **Given** AUTO BOOST が ON で `run_boost` が失敗
- **When** ゲーム起動処理が継続される
- **Then** ブースト失敗を通知しつつ、ゲームは正常に起動される

### Scenario 9: Auto Boost 無効でゲーム起動
- **Given** AUTO BOOST トグルが OFF
- **When** GameCard の LAUNCH ボタンを押す
- **Then** ブーストなしでゲームが直接起動され、lastPlayed タイムスタンプが記録される

### Scenario 10: お気に入りのトグル
- **Given** GameCard が表示中
- **When** 星アイコンをクリックする
- **Then** お気に入り状態がトグルされ、永続化される

### Scenario 11: 設定の永続化
- **Given** autoBoostEnabled、favorites、lastPlayed、sortMode が変更された
- **When** 値が更新される
- **Then** `useLauncherStore` 経由でバックエンドに永続化される

## エッジケース
- Steam がインストールされていない場合、エラーメッセージとインストールガイドを表示する
- スキャン結果が 0 件の場合、「ゲームが見つかりません」と空状態を表示する
- Steam ヘッダー画像の取得に失敗した場合、プレースホルダー画像を表示する
- ゲーム名が長い場合、テキストを省略表示（ellipsis）する
- お気に入りとソートの組み合わせ: お気に入りは常に上部に表示した上でソートを適用する
- 同時に複数のゲームを起動しようとした場合の挙動を制御する

## 非機能要件
- グリッドはレスポンシブ: 画面幅に応じて 2〜5 列に自動調整
- Steam ヘッダー画像はキャッシュして再利用する
- スキャン処理中はローディングインジケーターを表示する
- `run_boost` のタイムアウトは 10 秒以内
- お気に入り・設定の永続化は即時（UI 操作をブロックしない）
