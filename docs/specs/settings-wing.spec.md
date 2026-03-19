# Settings Wing（設定） — 仕様書

## 概要
アプリ設定、Windows 設定、Windows 最適化の 3 タブで構成される設定画面。API キー管理、起動設定、Windows ゲーミング最適化、全設定のリバートとデータ削除を提供する。

## 前提条件
- アプリ設定（`app_settings.json`）が読み書き可能であること
- Windows レジストリ / 電源プラン / 視覚効果の読み書き権限があること
- Perplexity API キーのテストエンドポイントが利用可能であること
- バックアップデータ（`winopt_backup.json`）が管理されていること

## シナリオ

### アプリ設定タブ — GeneralTab

#### Scenario 1: Perplexity API キーの入力
- **Given** アプリ設定タブの API セクションが表示中
- **When** API キーを入力する
- **Then** 入力値がマスク表示される

#### Scenario 2: API キーのテスト — 成功
- **Given** API キーが入力済み
- **When** テストボタンを押し、API が正常応答を返す
- **Then** 緑色のバリデーション表示（成功）になる

#### Scenario 3: API キーのテスト — 失敗
- **Given** 無効な API キーが入力済み
- **When** テストボタンを押し、API がエラーを返す
- **Then** 赤色のバリデーション表示（失敗）になる

#### Scenario 4: Windows 起動時に自動起動
- **Given** APPLICATION セクションが表示中
- **When** 「Windows 起動時に起動」トグルを ON にする
- **Then** Windows のスタートアップにアプリが登録される

#### Scenario 5: トレイに最小化
- **Given** APPLICATION セクションが表示中
- **When** 「トレイに最小化」トグルを ON にする
- **Then** ウィンドウ閉じ時にシステムトレイに格納される

#### Scenario 6: バージョン情報の表示
- **Given** ABOUT セクションが表示中
- **When** セクションがレンダリングされる
- **Then** アプリバージョンとビルド日付が表示される

### アプリ設定タブ — MaintenanceTab

#### Scenario 7: 全設定リバート
- **Given** MaintenanceTab が表示中
- **When** 「全設定リバート」ボタンを押す
- **Then** すべての設定がデフォルト値に戻される

#### Scenario 8: アプリデータ削除
- **Given** MaintenanceTab が表示中
- **When** 「アプリデータ削除」ボタンを押す
- **Then** 確認モーダルが表示され、削除対象ファイル一覧（profiles.json、app_settings.json、winopt_backup.json、API キー）が列挙される

#### Scenario 9: アプリデータ削除の確認
- **Given** 削除確認モーダルが表示中
- **When** 確認ボタンを押す
- **Then** 対象ファイルがすべて削除され、アプリが初期状態に戻る

#### Scenario 10: アプリデータ削除のキャンセル
- **Given** 削除確認モーダルが表示中
- **When** キャンセルボタンを押す
- **Then** モーダルが閉じ、データは削除されない

### Windows 設定タブ

#### Scenario 11: 電源プランの変更
- **Given** PowerPlanSection が表示中
- **When** ドロップダウンから「High Performance」を選択して適用する
- **Then** Windows の電源プランが High Performance に切り替わる

#### Scenario 12: 電源プランの選択肢
- **Given** PowerPlanSection のドロップダウンを開く
- **When** 選択肢を確認する
- **Then** Balanced、High Performance、Power Saver が選択可能

#### Scenario 13: Game Mode のトグル
- **Given** GamingSection が表示中
- **When** Game Mode トグルを ON にする
- **Then** Windows Game Mode が有効化される

#### Scenario 14: フルスクリーン最適化のトグル
- **Given** GamingSection が表示中
- **When** Fullscreen Optimization トグルを変更する
- **Then** フルスクリーン最適化の有効/無効が切り替わる

#### Scenario 15: ハードウェア GPU スケジューリングのトグル
- **Given** GamingSection が表示中
- **When** Hardware GPU Scheduling トグルを変更する
- **Then** GPU スケジューリングの有効/無効が切り替わる

#### Scenario 16: 視覚効果の変更
- **Given** VisualEffectsSection が表示中
- **When** ドロップダウンから「Best Performance」を選択して適用する
- **Then** Windows の視覚効果が最高パフォーマンス設定に変更される

#### Scenario 17: 視覚効果の選択肢
- **Given** VisualEffectsSection のドロップダウンを開く
- **When** 選択肢を確認する
- **Then** Best Performance、Balanced、Best Appearance が選択可能

### Windows 最適化タブ

#### Scenario 18: 最適化スコアの表示
- **Given** SettingsAdvisorPanel が表示中
- **When** 最適化スコアが算出される
- **Then** 0〜100% のスコアが色分けで表示される（緑 ≥ 80、オレンジ ≥ 60、赤 < 60）

#### Scenario 19: 推奨事項の表示
- **Given** SettingsAdvisorPanel が表示中
- **When** 推奨事項がレンダリングされる
- **Then** 各推奨に安全レベル（safe / moderate / advanced）が表示される

#### Scenario 20: 安全な推奨の一括適用
- **Given** 推奨事項が表示中
- **When** 「APPLY ALL SAFE」ボタンを押す
- **Then** 安全レベルが「safe」の推奨のみがすべて適用される

## エッジケース
- API キーが空でテストボタンを押した場合、バリデーションエラーを表示する
- スタートアップ登録に失敗した場合（権限不足等）、エラーメッセージを表示する
- アプリデータ削除後にアプリが正常に再初期化されることを保証する
- 電源プラン変更に管理者権限が必要な場合、昇格を要求する
- GPU スケジューリングが OS バージョンで非サポートの場合、トグルを無効化しツールチップで理由を表示する
- 最適化スコアが算出不能な場合、「N/A」を表示する
- 「APPLY ALL SAFE」で一部の項目が失敗した場合、成功/失敗の結果を個別に報告する
- `winopt_backup.json` が破損している場合、リバート不可の旨を表示する

## 非機能要件
- API キーはメモリ上でマスク、ストレージでは暗号化して保存する
- Windows 設定変更前に `winopt_backup.json` へバックアップを必ず取得する
- 最適化スコアの色閾値: 緑 ≥ 80%、オレンジ ≥ 60%、赤 < 60%
- 安全レベルの定義: safe（リスクなし）、moderate（再起動推奨）、advanced（上級者向け・副作用の可能性）
- 設定変更は即時反映し、UI のブロックを最小限にする
- 確認モーダルは誤操作防止のため、削除対象を明示的にリスト表示する
