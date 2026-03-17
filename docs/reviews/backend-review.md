# nexus バックエンド設計レビュー

> **レビュー日:** 2026-03-18
> **対象:** Tauri v2 + Rust (edition 2021) バックエンド全体

---

## 優先度サマリー

| 優先度 | 件数 | 内容 |
|--------|------|------|
| **P0** | 4 | 即時対応必須（バグ・セキュリティ脆弱性） |
| **P1** | 8 | 設計上の重大問題 |
| **P2** | 10 | 保守性・信頼性問題 |
| **P3** | 10 | 推奨改善 |

---

## P0: クリティカルバグ・脆弱性（即時対応）

### BE-P0-1: PowerShell インジェクション脆弱性

**問題:** 複数のコマンド（`set_dns`, `ping_host`, `analyze_disk_usage`, `restore_backup`）で `format!` マクロを使いユーザー入力を直接 PowerShell コマンド文字列に連結している。`; Remove-Item -Recurse C:\` 等の文字列が注入可能。

```rust
// 現状（危険）
let cmd = format!("Set-DnsClientServerAddress -InterfaceAlias '{}' -ServerAddresses '{}'",
    interface_name, dns_server);
```

**影響:** 任意の PowerShell コマンド実行が可能

**対応:** 入力バリデーション（正規表現による許可リスト）+ コマンド引数を個別エスケープ

### BE-P0-2: pulse.rs の Mutex 保持中 sleep

**問題:** `pulse.rs` でデータ収集ループが Mutex ロックを保持したまま 200ms スリープしている。他のスレッドからのアクセスが最大 200ms ブロックされる。

```rust
// 現状（問題）
let state = mutex.lock()?;
// ... データ収集 ...
thread::sleep(Duration::from_millis(200)); // ← ロック保持中
```

**影響:** UI の応答性低下、他の sysinfo 依存コマンドのタイムアウト

**対応:** ロック外で sleep するパターンに変更（データ取得後すぐに drop）

### BE-P0-3: get_storage_info の二重登録

**問題:** `src-tauri/src/lib.rs` の `invoke_handler` に `get_storage_info` が2回登録されている。2回目の登録が1回目を上書きするが、コードの意図が不明確で混乱を招く。

**対応:** 重複を削除

### BE-P0-4: run_boost のシミュレーション状態が不明確

**問題:** `run_boost` コマンドがプロセス優先度の実際の変更を行っているのか、シミュレーションのみなのかがコード上で明確でない。ユーザーに誤解を与える可能性がある。

**対応:** 実機能の実装かシミュレーション明示化かの設計判断と実装

---

## P1: 設計上の重大問題

### BE-P1-1: commands/ へのビジネスロジック集中（アーキテクチャ上の主問題）

**問題:** `commands/` 配下の各ファイルに Tauri コマンドハンドラとビジネスロジックが混在している。テストが困難で、ロジックの再利用ができない。コードの責務が分離されていない。

**対応:** 4層アーキテクチャへのリファクタリング:
- `commands/` → Tauri ハンドラのみ（薄いレイヤー）
- `services/` → ビジネスロジック（テスト可能）
- `infra/` → 外部接続（PowerShell, Registry, FileSystem）
- `parsers/` → データパーサー（VDF, ログ等）

### BE-P1-2: System::new_all() の複数インスタンス生成

**問題:** `pulse.rs` / `ops.rs` / `hardware.rs` が各自で `System::new_all()` を呼び出している。sysinfo の `System` オブジェクトは重く、複数インスタンスがメモリを大量消費し、データの不整合も招く。

**対応:** `PulseState` が持つ `System` インスタンスを `ops.rs` / `hardware.rs` が共有する設計

### BE-P1-3: 同期コマンドによる UI スレッドブロック

**問題:** `analyze_disk_usage` 等の重い処理が同期実行されており、Tauri コマンド実行中に UI がフリーズする。

**対応:** `async fn` への変更 + `tauri::async_runtime::spawn` を使った非同期化

### BE-P1-4: AppError の粒度が粗い

**問題:** `AppError` に `PowerShell` / `Registry` / `Process` といった操作種別のバリアントがなく、エラーの原因特定が困難。

**対応:** バリアント追加による詳細なエラー分類

### BE-P1-5: PowerShell への過度な依存

**問題:** Registry 操作を含む多くの処理が PowerShell 経由で行われており、PowerShell の起動コストとセキュリティリスクが高い。`winreg` クレートで直接実行できる操作が多数ある。

**対応:** Registry 操作を `winreg` クレートに移行

### BE-P1-6: ポーリングアーキテクチャの非効率性

**問題:** フロントエンドがポーリングで Tauri コマンドを繰り返し呼び出している。Tauri v2 のイベントシステムを使えば、Rust 側から push できるため効率的になる。

**対応:** `app.emit()` + FE 側 `listen()` パターンへの移行

### BE-P1-7: 未使用クレートによる過剰なコンパイル時間・バイナリサイズ

**問題:** `regex`, `walkdir`, `pathdiff`, `reqwest`, `sha2`, `uuid`, `feed-rs`, `totp-rs`, `log` が `Cargo.toml` に記載されているが、実際には使用されていない（または使用箇所が削除済み）。

**対応:** 各クレートの使用箇所を確認し、未使用のものを削除

### BE-P1-8: tokio features = ["full"] の過剰指定

**問題:** `tokio = { features = ["full"] }` は必要以上のサブシステムをコンパイルする。必要な機能（`rt`, `time` 等）のみを指定すべき。

**対応:** 実際に使用している tokio 機能のみに絞る

---

## P2: 保守性・信頼性問題

### BE-P2-1: WatcherState + notify クレートの未使用コード

ファイル監視機能が実装されていないが、`WatcherState` と `notify` クレートが残存している。

### BE-P2-2: error.rs の String 型エラーメッセージ

内部エラーの一部が `AppError::Internal(String)` に集約されており、プログラム的に処理できない。

### BE-P2-3: GPU 情報取得の PowerShell 依存

`Get-CimInstance Win32_VideoController` は正常動作するが、毎回 PowerShell プロセスを起動するため低頻度（hardware.rs 経由）でのみ呼び出すべき。現状の呼び出し頻度の監査が必要。

### BE-P2-4: ネットワーク設定変更のロールバック機能欠如

DNS 設定変更等の操作が失敗した際にロールバックする仕組みがない。

### BE-P2-5: 定数の分散管理

`PROTECTED_PROCESSES` は `boost.rs` にあるが、他の重要定数（ネットワーク設定、タイムアウト値等）が各ファイルに散在。`constants.rs` への集約が必要。

### BE-P2-6: ログ出力の不統一

`tracing` の使用レベルが統一されていない箇所がある。

### BE-P2-7: ipconfig パーサーの日本語ロケール非対応

日本語 Windows で `ipconfig /all` の出力が日本語になるため、パーサーが正しく動作しない可能性がある。

### BE-P2-8: CSP 設定が緩い

`tauri.conf.json` の Content Security Policy が `default-src 'self' 'unsafe-eval'` を許可しており、より厳格な設定が必要。

### BE-P2-9: capabilities/default.json の権限が広すぎる

全コマンドが一括して許可されており、最小権限の原則に違反している。コマンド別の permission 定義が必要。

### BE-P2-10: Rust edition 2021 のままで 2024 未移行

Rust edition 2024 では `use<>` 等の新機能が使える。将来の移行コストを下げるためにも早めの対応が推奨される。

---

## P3: 推奨改善

### BE-P3-1: `thiserror` v2 への移行

現在 v1 を使用。v2 で `#[derive(Error)]` の安定性と機能が向上している。

### BE-P3-2: services/ レイヤーの単体テスト

アーキテクチャ分離後、`services/` に対する Rust ユニットテストを充実させる。

### BE-P3-3: API キーの keyring 保存

Perplexity API キーを `keyring` クレートを使ってシステムキーチェーンに保存する。

### BE-P3-4: doc comment の整備

Public API に `///` doc comment を追加し、cargo doc でドキュメントを生成できるようにする。

### BE-P3-5: tauri-plugin-shell の導入

PowerShell 実行を `tauri-plugin-shell` 経由に統一し、実行可能コマンドをホワイトリスト管理する。

### BE-P3-6: CSV エクスポートの RFC 4180 準拠

フィールド内のカンマ・改行・クォートの適切なエスケープ処理。

### BE-P3-7: バイナリサイズの最適化

release プロファイルの `opt-level`, `lto`, `strip` 設定の最適化。

### BE-P3-8: CI/CD への cargo audit 追加

依存クレートの既知脆弱性を定期的にチェック。

### BE-P3-9: async trait の std 標準化

`async-trait` クレートへの依存を将来的に除去できるよう、コードを整理する。

### BE-P3-10: パニックの本番環境での適切なハンドリング

`unwrap()` / `expect()` の残存箇所を監査し、本番コードから除去する。
