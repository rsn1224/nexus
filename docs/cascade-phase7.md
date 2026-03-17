# Phase 7: 品質仕上げ — Cascade 実装プロンプト

## 言語ルール（最優先）
コミットメッセージ、コードコメント、doc comment、エラーメッセージ、ログメッセージ、テスト名、変数名以外の自然言語テキストはすべて日本語で記述。コード中の文字列リテラル（ユーザー向けメッセージ）も日本語にすること。

---

## サブフェーズ構成

Phase 7 は以下の4サブフェーズに分割して実装する:

| Sub | 内容 | 工数目安 |
|-----|------|---------|
| 7A | 共通 UI コンポーネントテスト + data-testid 整備 | 半日 |
| 7B | Rust 品質改善（unwrap 除去・ipconfig 日本語対応・services テスト） | 1日 |
| 7C | keyring による API キー暗号化保存 | 半日 |
| 7D | E2E テスト拡充 | 半日 |

各サブフェーズを順に Cascade に投入すること。

---

# Sub-Phase 7A: 共通 UI コンポーネントテスト + data-testid 整備

## ① 前提条件
- Phase 6（6A〜6D）が完了していること
- 現在のテスト: 129 unit + 3 E2E（smoke）
- UI コンポーネント: `Button`, `Card`, `Input`, `Modal`, `StatusBadge`, `TabBar`, `Table`, `LoadingFallback`（8個）
- いずれもテストなし

## ② 対象ファイル

| ファイル | 新規/変更 | 内容 |
|---------|---------|------|
| `src/components/ui/Button.test.tsx` | 新規 | Button コンポーネントテスト |
| `src/components/ui/Card.test.tsx` | 新規 | Card コンポーネントテスト |
| `src/components/ui/Input.test.tsx` | 新規 | Input コンポーネントテスト |
| `src/components/ui/Modal.test.tsx` | 新規 | Modal コンポーネントテスト |
| `src/components/ui/StatusBadge.test.tsx` | 新規 | StatusBadge コンポーネントテスト |
| `src/components/ui/TabBar.test.tsx` | 新規 | TabBar コンポーネントテスト |
| `src/components/ui/Table.test.tsx` | 新規 | Table コンポーネントテスト |
| `src/components/ui/LoadingFallback.test.tsx` | 新規 | LoadingFallback コンポーネントテスト |
| 各 UI コンポーネント | 変更 | `data-testid` 属性を追加 |

## ③ 実装内容

### Step 1: 各 UI コンポーネントに `data-testid` を追加

E2E テスト（7D）やユニットテストから安定して要素を取得できるよう、全 UI コンポーネントのルート要素に `data-testid` を付与する。

**命名規則:** `ui-{コンポーネント名}-{目的}`

```tsx
// Button.tsx のルート要素
<button data-testid="ui-button" ...>

// Card.tsx のルート要素
<div data-testid="ui-card" ...>

// Input.tsx のルート要素
<input data-testid="ui-input" ...>

// Modal.tsx のルート要素（オーバーレイ）
<div data-testid="ui-modal-overlay" ...>
  <div data-testid="ui-modal" ...>

// StatusBadge.tsx のルート要素
<span data-testid="ui-status-badge" ...>

// TabBar.tsx のルート要素
<div data-testid="ui-tab-bar" ...>
  <button data-testid={`ui-tab-${tab}`} ...>  // 各タブにも

// Table.tsx のルート要素
<table data-testid="ui-table" ...>

// LoadingFallback.tsx のルート要素
<div data-testid="ui-loading-fallback" ...>
```

### Step 2: 各コンポーネントのテストを作成

各コンポーネントの実装を **必ず読んでから** テストを書くこと。Props のインターフェースに合わせてテストケースを設計する。

**テスト方針（全コンポーネント共通）:**
1. デフォルト props でレンダリングできること
2. 各 props バリアントの表示確認
3. イベントハンドラの動作確認（onClick, onChange 等）
4. コンテンツの表示確認

**Button.test.tsx の例:**
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('テキストが表示される', () => {
    render(<Button>テスト</Button>);
    expect(screen.getByText('テスト')).toBeInTheDocument();
  });

  it('クリックイベントが発火する', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>ボタン</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 時にクリックできない', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>ボタン</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  // variant ごとの表示テスト（実際の props を読んで記述）
});
```

**Modal.test.tsx の例:**
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

describe('Modal', () => {
  it('isOpen=true でモーダルが表示される', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="テスト">内容</Modal>);
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('内容')).toBeInTheDocument();
  });

  it('isOpen=false でモーダルが非表示', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="テスト">内容</Modal>);
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  it('閉じるボタンで onClose が呼ばれる', async () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="テスト">内容</Modal>);
    // 閉じるボタンの取得方法は実際のコンポーネントを読んで判断
    await userEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**TabBar.test.tsx の例:**
```tsx
describe('TabBar', () => {
  it('タブ一覧が表示される', () => {
    render(<TabBar tabs={['TAB1', 'TAB2']} activeTab="TAB1" onTabChange={vi.fn()} />);
    expect(screen.getByText('TAB1')).toBeInTheDocument();
    expect(screen.getByText('TAB2')).toBeInTheDocument();
  });

  it('タブクリックで onTabChange が呼ばれる', async () => {
    const onTabChange = vi.fn();
    render(<TabBar tabs={['TAB1', 'TAB2']} activeTab="TAB1" onTabChange={onTabChange} />);
    await userEvent.click(screen.getByText('TAB2'));
    expect(onTabChange).toHaveBeenCalledWith('TAB2');
  });
});
```

**Table.test.tsx の例:**
```tsx
describe('Table', () => {
  it('データ行が表示される', () => {
    // 実際の TableColumn/TableProps の型に合わせて記述
    const columns = [{ key: 'name', header: '名前' }];
    const data = [{ name: 'テスト1' }, { name: 'テスト2' }];
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('テスト1')).toBeInTheDocument();
    expect(screen.getByText('テスト2')).toBeInTheDocument();
  });

  it('空データで空状態が表示される', () => {
    render(<Table columns={[]} data={[]} />);
    // 空状態メッセージの確認（実際のコンポーネントを読んで判断）
  });
});
```

**残り（Card, Input, StatusBadge, LoadingFallback）も同様にコンポーネントの Props を読んでテストを書くこと。**

**重要:** 各テストファイルの先頭に以下をインポートする:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
```

## ④ 注意事項

- 各コンポーネントの **実際の Props インターフェース** を必ず読んでからテストを書くこと。上記例は参考であり、実際の Props と異なる可能性がある
- `userEvent` は `@testing-library/user-event` からインポート（既にプロジェクトに含まれている）
- テストファイルはコンポーネントと同じディレクトリ（`src/components/ui/`）に配置する
- `data-testid` を追加する際、既存のクラス名やスタイルを変更しないこと

## ⑤ 完了条件

- [ ] 8個の UI コンポーネント全てにテストファイルがある
- [ ] 各テストファイルに最低3つのテストケースがある
- [ ] 全 UI コンポーネントに `data-testid` 属性がある
- [ ] `npm run check` クリーン
- [ ] `npm run typecheck` クリーン
- [ ] `npm run test` 全通過（129 + 新規テスト）

## ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] console.log なし

---

# Sub-Phase 7B: Rust 品質改善

## ① 前提条件
- Sub-Phase 7A が完了していること

## ② 対象ファイル

| ファイル | 新規/変更 | 内容 |
|---------|---------|------|
| `src-tauri/src/commands/log.rs` | 変更 | プロダクションコードの `unwrap()` を除去 |
| `src-tauri/src/commands/hardware.rs` | 変更 | `System::new_all()` を SharedState 経由に変更 |
| `src-tauri/src/parsers/ipconfig.rs` | 変更 | 日本語ロケール対応 + テスト追加 |
| `src-tauri/src/parsers/vdf.rs` | 変更 | テスト追加 |
| `src-tauri/src/services/hardware.rs` | 変更 | テスト追加 |

## ③ 実装内容

### Step 1: `commands/log.rs` — プロダクションコードの `unwrap()` 除去

176行目・179行目に `Option::unwrap()` がある。`is_none()` チェックの直後で安全ではあるが、`unwrap()` はパニックの可能性があるため除去する。

**現在のコード:**
```rust
if earliest_time.is_none() || utc_time < earliest_time.unwrap() {
    earliest_time = Some(utc_time);
}
if latest_time.is_none() || utc_time > latest_time.unwrap() {
    latest_time = Some(utc_time);
}
```

**修正後:**
```rust
match earliest_time {
    None => earliest_time = Some(utc_time),
    Some(t) if utc_time < t => earliest_time = Some(utc_time),
    _ => {}
}
match latest_time {
    None => latest_time = Some(utc_time),
    Some(t) if utc_time > t => latest_time = Some(utc_time),
    _ => {}
}
```

**注意:** `#[cfg(test)]` ブロック内の `unwrap()` は許容する（テストでの使用は問題ない）。

### Step 2: `commands/hardware.rs` — `System::new_all()` 除去

45行目に `let mut sys = System::new_all();` がある。これは毎回新しい `System` インスタンスを生成するため非効率。SharedState の共有インスタンスを使うべき。

**現在のコード:**
```rust
#[tauri::command]
pub fn get_hardware_info() -> Result<HardwareInfo, AppError> {
    let mut sys = System::new_all();
    sys.refresh_all();
    // ...
}
```

**修正後:**
```rust
#[tauri::command]
pub fn get_hardware_info(state: State<'_, SharedState>) -> Result<HardwareInfo, AppError> {
    let mut s = state
        .lock()
        .map_err(|e| AppError::Command(format!("Stateロックエラー: {}", e)))?;
    s.sys.refresh_all();
    // s.sys を使って情報を取得（以降の sys -> s.sys に変更）
    // ...
}
```

`lib.rs` のコマンド登録で `get_hardware_info` に `State` が渡されるようになっているか確認すること。Tauri v2 では `State` を引数に追加するだけで自動注入される。

### Step 3: `parsers/ipconfig.rs` — 日本語ロケール対応

現在は英語の `" adapter "` ラベルのみ対応。日本語 Windows では以下のラベルが使われる:
- `イーサネット アダプター` (Ethernet)
- `無線 LAN アダプター` (WiFi)
- `Wireless LAN adapter` (英語 WiFi)

また、IPv4 / MAC アドレスのラベルも日本語版がある:
- 英語: `IPv4 Address. . . . . . . . . . . :`
- 日本語: `IPv4 アドレス . . . . . . . . . . . . .:` または `IPv4 アドレス. . . . . . . . . . . :`
- 英語: `Physical Address. . . . . . . . . :`
- 日本語: `物理アドレス. . . . . . . . . . . . . :`

**修正後の `parse_ipconfig_output`:**
```rust
pub fn parse_ipconfig_output(stdout: &str) -> Vec<NetworkAdapter> {
    let mut adapters = Vec::new();
    let mut current_adapter = NetworkAdapter {
        name: String::new(),
        ip: String::new(),
        mac: String::new(),
        is_connected: false,
    };

    // アダプター名検出パターン（英語 + 日本語）
    let adapter_patterns: &[&str] = &[
        " adapter ",           // 英語: "Ethernet adapter Local Area Connection:"
        " アダプター ",         // 日本語: "イーサネット アダプター ローカル エリア接続:"
    ];

    // IPv4 アドレス検出パターン
    let ipv4_patterns: &[&str] = &[
        "IPv4 Address",        // 英語
        "IPv4 アドレス",        // 日本語
    ];

    // MAC アドレス検出パターン
    let mac_patterns: &[&str] = &[
        "Physical Address",    // 英語
        "物理アドレス",          // 日本語
    ];

    for line in stdout.lines() {
        let trimmed = line.trim();

        // アダプター名の検出
        let adapter_match = adapter_patterns
            .iter()
            .find_map(|pattern| {
                if trimmed.contains(pattern) && trimmed.ends_with(':') {
                    let name = trimmed.trim_end_matches(':');
                    let name = if let Some(pos) = name.find(pattern) {
                        name[pos + pattern.len()..].trim()
                    } else {
                        name.trim()
                    };
                    Some(name.to_string())
                } else {
                    None
                }
            });

        if let Some(name) = adapter_match {
            if !current_adapter.name.is_empty() {
                adapters.push(current_adapter.clone());
            }
            current_adapter = NetworkAdapter {
                name,
                ip: String::new(),
                mac: String::new(),
                is_connected: false,
            };
            continue;
        }

        // IPv4 アドレスの検出
        let is_ipv4 = ipv4_patterns.iter().any(|p| trimmed.contains(p));
        if is_ipv4 {
            if let Some(ip_part) = trimmed.split(':').last() {
                let ip = ip_part.trim().trim_end_matches("(Preferred)").trim_end_matches("(優先)").trim();
                if !ip.is_empty() {
                    current_adapter.ip = ip.to_string();
                    current_adapter.is_connected = true;
                }
            }
            continue;
        }

        // MAC アドレスの検出
        let is_mac = mac_patterns.iter().any(|p| trimmed.contains(p));
        if is_mac {
            // MAC アドレスは "XX-XX-XX-XX-XX-XX" 形式。コロン区切りではなくハイフン区切り
            // "Physical Address. . . . . . . . . : AA-BB-CC-DD-EE-FF"
            // split(':') の最後の要素を取得する（ラベル内にもコロンがあるため nth(1) だと失敗する可能性）
            if let Some(mac_part) = trimmed.split(':').last() {
                let mac = mac_part.trim();
                if !mac.is_empty() {
                    current_adapter.mac = mac.to_string();
                }
            }
        }
    }

    if !current_adapter.name.is_empty() {
        adapters.push(current_adapter);
    }

    adapters
        .into_iter()
        .filter(|a| a.is_connected && !a.ip.is_empty())
        .collect()
}
```

### Step 4: パーサーのユニットテスト追加

**`parsers/ipconfig.rs` に `#[cfg(test)]` ブロックを追加:**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_english_ipconfig() {
        let output = r#"
Ethernet adapter Local Area Connection:

   Connection-specific DNS Suffix  . :
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   Physical Address. . . . . . . . . : AA-BB-CC-DD-EE-FF

Wireless LAN adapter Wi-Fi:

   Media State . . . . . . . . . . . : Media disconnected
"#;
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 1);
        assert_eq!(adapters[0].name, "Local Area Connection");
        assert_eq!(adapters[0].ip, "192.168.1.100");
        assert_eq!(adapters[0].mac, "AA-BB-CC-DD-EE-FF");
        assert!(adapters[0].is_connected);
    }

    #[test]
    fn test_parse_japanese_ipconfig() {
        let output = r#"
イーサネット アダプター ローカル エリア接続:

   接続固有の DNS サフィックス . . . . .:
   IPv4 アドレス . . . . . . . . . . . .: 192.168.1.100
   サブネット マスク . . . . . . . . . .: 255.255.255.0
   デフォルト ゲートウェイ . . . . . . .: 192.168.1.1
   物理アドレス. . . . . . . . . . . . .: AA-BB-CC-DD-EE-FF

無線 LAN アダプター Wi-Fi:

   メディアの状態. . . . . . . . . . . .: メディアは接続されていません
"#;
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 1);
        assert_eq!(adapters[0].name, "ローカル エリア接続");
        assert_eq!(adapters[0].ip, "192.168.1.100");
        assert_eq!(adapters[0].mac, "AA-BB-CC-DD-EE-FF");
        assert!(adapters[0].is_connected);
    }

    #[test]
    fn test_parse_preferred_suffix() {
        let output = r#"
Ethernet adapter Ethernet:

   IPv4 Address. . . . . . . . . . . : 10.0.0.5(Preferred)
   Physical Address. . . . . . . . . : 11-22-33-44-55-66
"#;
        let adapters = parse_ipconfig_output(output);
        assert_eq!(adapters.len(), 1);
        assert_eq!(adapters[0].ip, "10.0.0.5");
    }

    #[test]
    fn test_parse_empty_output() {
        let adapters = parse_ipconfig_output("");
        assert!(adapters.is_empty());
    }

    #[test]
    fn test_disconnected_adapters_filtered() {
        let output = r#"
Ethernet adapter Ethernet:

   Media State . . . . . . . . . . . : Media disconnected
   Physical Address. . . . . . . . . : 11-22-33-44-55-66
"#;
        let adapters = parse_ipconfig_output(output);
        assert!(adapters.is_empty());
    }
}
```

**`parsers/vdf.rs` に `#[cfg(test)]` ブロックを追加:**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_vdf() {
        let content = r#"
"libraryfolders"
{
    "0"
    {
        "path"      "C:\\Program Files (x86)\\Steam"
        "apps"
        {
            "228980"    "0"
            "730"       "0"
        }
    }
}
"#;
        let map = parse_vdf(content);
        assert_eq!(map.get("path"), Some(&"C:\\Program Files (x86)\\Steam".to_string()));
        assert_eq!(map.get("228980"), Some(&"0".to_string()));
    }

    #[test]
    fn test_parse_empty() {
        let map = parse_vdf("");
        assert!(map.is_empty());
    }

    #[test]
    fn test_parse_no_values() {
        let content = r#"
"section"
{
}
"#;
        let map = parse_vdf(content);
        assert!(map.is_empty());
    }
}
```

## ④ 注意事項

- `#[cfg(test)]` 内の `unwrap()` は許容する（テストコードではパニックが適切な失敗手段）
- `System::new_all()` の変更は `get_hardware_info` の引数シグネチャが変わるため、`lib.rs` のコマンド登録を確認すること（Tauri v2 は自動注入なので登録自体は変更不要だが、呼び出し側の型が一致しているか確認）
- ipconfig パーサーの日本語テストデータは、実際の `ipconfig /all` 出力を再現している。ラベルの後のドット数やスペース数は Windows バージョンによって微妙に異なる場合がある。`contains()` でマッチングしているので大丈夫だが、テストデータは代表的なパターンに限定すること
- `parsers/ipconfig.rs` の先頭にある `#![allow(dead_code)]` は、テスト追加後に不要であれば削除してよい

## ⑤ 完了条件

- [ ] `commands/log.rs` のプロダクションコードに `unwrap()` が残っていない
- [ ] `commands/hardware.rs` に `System::new_all()` が残っていない（SharedState 経由に変更）
- [ ] `parsers/ipconfig.rs` が日本語 `ipconfig /all` 出力をパースできる
- [ ] `parsers/ipconfig.rs` に5件以上のテストがある
- [ ] `parsers/vdf.rs` に3件以上のテストがある
- [ ] `cargo test` 全通過
- [ ] `cargo clippy -- -D warnings` エラー 0

## ⑥ 品質チェック

```bash
cd src-tauri && cargo test && cargo clippy -- -D warnings && cargo fmt --check
npm run typecheck && npm run check && npm run test
```

- [ ] lint エラー 0（Rust + TS 両方）
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] プロダクションコードに `unwrap()` なし
- [ ] `System::new_all()` 直接呼び出しなし

---

# Sub-Phase 7C: keyring による API キー暗号化保存

## ① 前提条件
- Sub-Phase 7B が完了していること
- 現状: Perplexity API キーは `localStorage` に平文保存（`useAppSettingsStore.ts` の `SETTINGS_KEY = 'nexus:settings'`）
- バックエンドにも `commands/app_settings.rs` で JSON ファイル保存がある

## ② 対象ファイル

| ファイル | 新規/変更 | 内容 |
|---------|---------|------|
| `src-tauri/Cargo.toml` | 変更 | `keyring` クレート追加 |
| `src-tauri/src/services/credentials.rs` | 新規 | keyring ラッパー |
| `src-tauri/src/services/mod.rs` | 変更 | `pub mod credentials;` 追加 |
| `src-tauri/src/commands/app_settings.rs` | 変更 | API キー保存/読込を keyring 経由に変更 |
| `src-tauri/src/error.rs` | 変更 | `Keyring(String)` バリアント追加 |
| `src/stores/useAppSettingsStore.ts` | 変更 | localStorage の API キー保存を削除（BE 経由に統一） |

## ③ 実装内容

### Step 1: Cargo.toml に keyring 追加

```toml
[dependencies]
# 既存の依存に追加
keyring = { version = "3", features = ["windows-native"] }
```

**注意:** keyring v3 では `features = ["windows-native"]` で Windows 資格情報マネージャーを使用する。v2 と API が異なるため、v3 のドキュメントを参照すること。

### Step 2: `services/credentials.rs` 新規作成

```rust
//! Windows 資格情報マネージャーを使った機密情報の安全な保存
use crate::error::AppError;

const SERVICE_NAME: &str = "nexus-app";

/// API キーを Windows 資格情報マネージャーに保存する
pub fn save_api_key(key_name: &str, value: &str) -> Result<(), AppError> {
    let entry = keyring::Entry::new(SERVICE_NAME, key_name)
        .map_err(|e| AppError::Keyring(format!("Entry作成エラー: {}", e)))?;

    if value.is_empty() {
        // 空文字列の場合は既存のエントリを削除
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()), // 元から無い場合は成功扱い
            Err(e) => Err(AppError::Keyring(format!("削除エラー: {}", e))),
        }
    } else {
        entry
            .set_password(value)
            .map_err(|e| AppError::Keyring(format!("保存エラー: {}", e)))
    }
}

/// API キーを Windows 資格情報マネージャーから読み込む
pub fn load_api_key(key_name: &str) -> Result<Option<String>, AppError> {
    let entry = keyring::Entry::new(SERVICE_NAME, key_name)
        .map_err(|e| AppError::Keyring(format!("Entry作成エラー: {}", e)))?;

    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::Keyring(format!("読込エラー: {}", e))),
    }
}

#[cfg(test)]
mod tests {
    // keyring のテストは Windows 資格情報マネージャーへの実アクセスが必要
    // CI 環境では実行できないため、統合テストとして手動実行する
    // ここでは API の呼び出しパターンのみ確認

    #[test]
    fn test_service_name_is_constant() {
        assert_eq!(super::SERVICE_NAME, "nexus-app");
    }
}
```

### Step 3: `error.rs` にバリアント追加

```rust
#[error("資格情報エラー: {0}")]
Keyring(String),
```

### Step 4: `commands/app_settings.rs` の変更

`get_app_settings` で API キーを keyring から読み込み、`save_app_settings` で keyring に保存するよう変更:

```rust
use crate::services::credentials;

#[tauri::command]
pub fn get_app_settings(app: AppHandle) -> Result<AppSettings, AppError> {
    info!("get_app_settings: loading app settings");

    let settings_path = get_settings_path(&app)?;

    let mut settings = if settings_path.exists() {
        let content = fs::read_to_string(&settings_path).map_err(|e| {
            warn!("設定ファイル読み込みエラー: {}", e);
            AppError::Io(format!("設定ファイル読み込みエラー: {}", e))
        })?;
        serde_json::from_str::<AppSettings>(&content).map_err(|e| {
            warn!("設定ファイル解析エラー: {}", e);
            AppError::Serialization(format!("設定ファイル解析エラー: {}", e))
        })?
    } else {
        info!("設定ファイルなし。デフォルト設定を返します");
        AppSettings::default()
    };

    // API キーは keyring から読み込む（JSON ファイルには保存しない）
    match credentials::load_api_key("perplexity-api-key") {
        Ok(Some(key)) => settings.perplexity_api_key = key,
        Ok(None) => {} // keyring にエントリなし — デフォルト空文字列のまま
        Err(e) => {
            warn!("keyring からの API キー読み込みに失敗: {}", e);
            // エラーでも設定自体は返す（API キーだけ空）
        }
    }

    info!("get_app_settings: 設定読み込み完了");
    Ok(settings)
}

#[tauri::command]
pub fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), AppError> {
    info!("save_app_settings: saving app settings");

    // API キーは keyring に保存
    credentials::save_api_key("perplexity-api-key", &settings.perplexity_api_key)?;

    // JSON ファイルには API キー以外を保存
    let mut file_settings = settings.clone();
    file_settings.perplexity_api_key = String::new(); // JSON には書かない

    let settings_path = get_settings_path(&app)?;
    let content = serde_json::to_string_pretty(&file_settings).map_err(|e| {
        warn!("設定シリアライズエラー: {}", e);
        AppError::Serialization(format!("設定シリアライズエラー: {}", e))
    })?;

    fs::write(&settings_path, content).map_err(|e| {
        warn!("設定ファイル書き込みエラー: {}", e);
        AppError::Io(format!("設定ファイル書き込みエラー: {}", e))
    })?;

    info!("save_app_settings: 設定保存完了");
    Ok(())
}
```

### Step 5: `useAppSettingsStore.ts` の変更

`localStorage` への API キー保存を削除し、バックエンド経由に統一する:

- `loadPersistedSettings()` から `perplexityApiKey` の読み込みを削除
- `savePersistedSettings()` から `perplexityApiKey` の保存を削除
- `setPerplexityApiKey` アクションで `invoke('save_app_settings', ...)` を呼ぶように変更
- 既存の localStorage に残っている API キーがあれば、初回起動時に keyring に移行して localStorage から削除する（マイグレーション）

## ④ 注意事項

- `keyring` v3 と v2 は API が異なる。`features = ["windows-native"]` を忘れないこと
- keyring アクセスはエラーになる可能性がある（権限不足等）。エラー時はログを出力して処理を続行すること（API キーが空の状態で動作する）
- JSON ファイルには API キーを **書かない**（keyring のみに保存）
- フロントエンドの localStorage にも API キーを **保存しない**（バックエンド invoke 経由のみ）
- マイグレーション: 既存ユーザーが localStorage に API キーを持っている場合、初回 `fetchSettings` 時に keyring に移行してから localStorage の該当キーを削除する

## ⑤ 完了条件

- [ ] `keyring` クレートが Cargo.toml に追加されている
- [ ] `services/credentials.rs` が作成されている
- [ ] `get_app_settings` が keyring から API キーを読み込む
- [ ] `save_app_settings` が keyring に API キーを保存する
- [ ] JSON 設定ファイルに API キーが平文で保存されない
- [ ] localStorage に API キーが保存されない
- [ ] `cargo build` が成功する
- [ ] 既存テストが全通過する

## ⑥ 品質チェック

```bash
cd src-tauri && cargo build && cargo test && cargo clippy -- -D warnings
npm run typecheck && npm run check && npm run test
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] 全テスト green
- [ ] `unwrap()` なし（プロダクションコード）

---

# Sub-Phase 7D: E2E テスト拡充

## ① 前提条件
- Sub-Phase 7C が完了していること
- 現在の E2E: `e2e/smoke.test.ts` に3件のテスト
- Playwright 設定: `baseURL: 'http://localhost:1420'`
- 既存の `data-testid`: `sidebar`, `nav-{wingId}`, `wing-{activeWing}`（Shell.tsx）+ 7A で追加した UI コンポーネント分

## ② 対象ファイル

| ファイル | 新規/変更 | 内容 |
|---------|---------|------|
| `e2e/navigation.test.ts` | 新規 | Wing 切替テスト |
| `e2e/boost.test.ts` | 新規 | BoostWing テスト |
| `e2e/settings.test.ts` | 新規 | SettingsWing テスト |
| `e2e/hardware.test.ts` | 新規 | HardwareWing テスト |

## ③ 実装内容

### テスト方針

E2E テストは Tauri の開発サーバー（`localhost:1420`）に接続して動作確認する。以下のカテゴリでテストを追加:

1. **ナビゲーション**: 全 Wing への切替が正常に動作すること
2. **Wing 表示**: 各 Wing が正しくレンダリングされること
3. **基本操作**: 主要な操作フローが動作すること

### `e2e/navigation.test.ts`

```typescript
import { expect, test } from '@playwright/test';

test.describe('Wing ナビゲーション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const wings = [
    { id: 'home', header: 'HOME' },
    { id: 'boost', header: 'BOOST' },
    { id: 'launcher', header: 'LAUNCHER' },
    { id: 'hardware', header: 'HARDWARE' },
    { id: 'netopt', header: 'NETWORK' },
    { id: 'storage', header: 'STORAGE' },
    { id: 'log', header: 'LOG' },
    { id: 'windows', header: 'WINDOWS' },
    { id: 'settings', header: 'SETTINGS' },
  ];

  for (const wing of wings) {
    test(`${wing.id} Wing に切替できる`, async ({ page }) => {
      await page.click(`[data-testid="nav-${wing.id}"]`);
      // Wing がアクティブになることを確認
      const wingContainer = page.locator(`[data-testid="wing-${wing.id}"]`);
      await expect(wingContainer).toBeVisible();
    });
  }

  test('Wing 切替後に前の Wing の状態が保持される', async ({ page }) => {
    // Home → Boost → Home と戻って表示が崩れないことを確認
    await page.click('[data-testid="nav-boost"]');
    await expect(page.locator('[data-testid="wing-boost"]')).toBeVisible();

    await page.click('[data-testid="nav-home"]');
    await expect(page.locator('[data-testid="wing-home"]')).toBeVisible();
  });
});
```

### `e2e/boost.test.ts`

```typescript
import { expect, test } from '@playwright/test';

test.describe('BoostWing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="nav-boost"]');
  });

  test('BoostWing が表示される', async ({ page }) => {
    const wing = page.locator('[data-testid="wing-boost"]');
    await expect(wing).toBeVisible();
  });

  test('タブバーが表示される', async ({ page }) => {
    // TabBar の存在を確認（実際のタブ名はコンポーネントを読んで記述）
    const tabBar = page.locator('[data-testid="ui-tab-bar"]');
    await expect(tabBar).toBeVisible();
  });
});
```

### `e2e/settings.test.ts`

```typescript
import { expect, test } from '@playwright/test';

test.describe('SettingsWing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="nav-settings"]');
  });

  test('SettingsWing が表示される', async ({ page }) => {
    const wing = page.locator('[data-testid="wing-settings"]');
    await expect(wing).toBeVisible();
  });

  test('API キー入力フィールドが存在する', async ({ page }) => {
    // SettingsWing 内に API キー入力欄があることを確認
    // 実際のフィールドのセレクタはコンポーネントを読んで判断
    const apiKeySection = page.locator('text=API');
    await expect(apiKeySection).toBeVisible();
  });
});
```

### `e2e/hardware.test.ts`

```typescript
import { expect, test } from '@playwright/test';

test.describe('HardwareWing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="nav-hardware"]');
  });

  test('HardwareWing が表示される', async ({ page }) => {
    const wing = page.locator('[data-testid="wing-hardware"]');
    await expect(wing).toBeVisible();
  });

  test('CPU 情報セクションが表示される', async ({ page }) => {
    // HardwareWing 内に CPU セクションがあることを確認
    const cpuSection = page.locator('text=CPU');
    await expect(cpuSection).toBeVisible();
  });
});
```

**重要:** 上記テストはスケルトンである。各テストファイルを作成する際に、対応する Wing コンポーネントの実際の DOM 構造を確認し、より具体的なセレクタやアサーションに置き換えること。

## ④ 注意事項

- E2E テストは `npm run tauri dev` が起動している状態で実行する。CI 環境での自動起動はこの Phase では対象外
- `page.goto('/')` は `http://localhost:1420` にアクセスする（playwright.config.ts の baseURL）
- テストの安定性のため `await expect(...).toBeVisible()` で要素の表示完了を待つ
- Tauri のバックエンドコマンドは実際に実行されるため、テストデータの汚染に注意。設定変更テストなどは注意して設計する
- 目標: 既存3件 + 新規7件以上 = 合計10件以上

## ⑤ 完了条件

- [ ] `e2e/navigation.test.ts` が作成されている
- [ ] `e2e/boost.test.ts` が作成されている
- [ ] `e2e/settings.test.ts` が作成されている
- [ ] `e2e/hardware.test.ts` が作成されている
- [ ] E2E テスト合計10件以上
- [ ] 全 Wing への切替テストがある
- [ ] `npx playwright test` が全通過する（開発サーバー起動状態で）

## ⑥ 品質チェック

```bash
npm run typecheck && npm run check && npm run test
npx playwright test
```

- [ ] lint エラー 0
- [ ] 型エラー 0
- [ ] unit テスト全 green（180+件目標）
- [ ] E2E テスト全 green（10+件目標）
- [ ] console.log なし
- [ ] any 型なし
- [ ] インラインスタイルなし

---

## Phase 7 完了後の作業

全サブフェーズ完了後、以下を実行すること:

1. `HANDOFF.md` の Phase 7 ステータスを `✅ 完了` に更新
2. `HANDOFF.md` の Phase 6 ステータスも `✅ 完了` に更新
3. 最新のテスト件数をメモ（unit + E2E）
4. コミットメッセージ: `Phase 7 完了: 品質仕上げ（UIテスト・Rust品質改善・keyring・E2E）`
