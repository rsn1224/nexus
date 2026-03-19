# Navigation — 仕様書

## 概要
Wing ベースの階層ナビゲーションを管理する。Wing → Tab → Subpage Stack（最大5階層）の構造を持つ。

## 前提条件
- Zustand ストアで以下の状態を管理:
  - `activeWing: WingId`
  - `wingStates: Record<WingId, WingNavState>` — 各 Wing の `activeTab` と `subpageStack` を保持
- `SubpageEntry: { id: string, params: Record<string, unknown>, title: string }`

## シナリオ

### Scenario 1: Wing 切り替え（後方互換）
- **Given** 任意の Wing がアクティブである
- **When** `navigate(wing)` が呼ばれる
- **Then** `activeWing` が指定された Wing に切り替わる

### Scenario 2: フルナビゲーション（Wing + Tab + Subpage）
- **Given** 任意の Wing がアクティブである
- **When** `navigateTo(wingId, { tab: 'details', subpage: { id: 'item', params: {}, title: 'Item' } })` が呼ばれる
- **Then** 指定 Wing に切り替わり、タブが設定され、サブページがスタックにプッシュされる

### Scenario 3: タブ切り替え
- **Given** Wing がアクティブでサブページスタックにエントリがある
- **When** `setTab(wingId, tabId)` が呼ばれる
- **Then** アクティブタブが切り替わり、サブページスタックがクリアされる

### Scenario 4: サブページのプッシュ
- **Given** サブページスタックが4エントリ以下である
- **When** `pushSubpage(wingId, entry)` が呼ばれる
- **Then** エントリがスタックに追加される

### Scenario 5: サブページのプッシュ（上限到達）
- **Given** サブページスタックが5エントリである
- **When** `pushSubpage(wingId, entry)` が呼ばれる
- **Then** 操作は no-op となり、スタックは変化しない

### Scenario 6: サブページのポップ
- **Given** サブページスタックに1つ以上のエントリがある
- **When** `popSubpage(wingId)` が呼ばれる
- **Then** スタックの最後のエントリが削除される

### Scenario 7: サブページの全クリア
- **Given** サブページスタックにエントリがある
- **When** `clearSubpages(wingId)` が呼ばれる
- **Then** スタック全体がクリアされる

### Scenario 8: Escape キーによるサブページポップ
- **Given** モーダルが開いておらず、サブページスタックにエントリがある
- **When** Escape キーが押される
- **Then** `popSubpage` が実行され、1つ前の画面に戻る

### Scenario 9: Escape キー（モーダル優先）
- **Given** モーダルが開いている
- **When** Escape キーが押される
- **Then** モーダルが閉じられ、サブページスタックは変化しない

## パンくずリスト（Breadcrumbs）

`buildBreadcrumbs(wingId, wingState, actions)` で以下のトレイルを構築する:

```
WING_LABEL → TAB_NAME → SUBPAGE_1 → SUBPAGE_2 → ...
```

- 最後の要素はクリック不可（現在地）
- それ以前の要素はクリック可能（クリックでその階層以下のエントリをポップ）

## Wing ラベルマッピング

| WingId | ラベル |
|--------|--------|
| home | HOME |
| performance | PERFORMANCE |
| games | GAMES |
| hardware | HARDWARE |
| network | NETWORK |
| storage | STORAGE |
| settings | SETTINGS |
| log | LOG |

## エッジケース
- 存在しない `wingId` が指定された場合、操作を無視する
- サブページスタックが空の状態で `popSubpage` を呼んだ場合、no-op とする
- 同じ Wing への `navigate` は状態をリセットしない
- `navigateTo` のオプションが部分的に指定された場合、指定されたフィールドのみ適用する

## 非機能要件
- ナビゲーション遷移は16ms以内に完了すること
- パンくずリストはアクセシビリティ対応（`aria-label`, `aria-current`）とすること
- キーボードナビゲーション（Tab / Enter / Escape）をサポートすること
