# NEXUS v4.1 — Claude Code 実装指示書
## このファイルの使い方

1. このファイルを読んだ後、**作業対象ファイルの一覧を宣言**してから実装を開始すること
2. 既存ファイルを編集する場合は、変更前の該当箇所をコメントで残すこと
3. 新規ファイルを作成する場合は、このファイルの「ファイル構成」セクションを更新すること
4. タスク番号を指定された場合は、そのタスクの「要件」と「制約」のみを実装し、他タスクには触れないこと
> **対象:** `src/app/App.tsx` + `src/styles/nexus.css` の既存コードベース  
> **スタック:** React 18 / TypeScript / Tailwind CSS v4 / Zustand / Tauri (Rust) / Lucide React  
> **デザインシステム:** `nx-` プレフィックス + CSS カスタムプロパティ (`nexus.css`)

---

## プロジェクト概要

Windows 向けゲーミング PC 最適化アプリ。UI は「FF14 HUD 設計思想」に基づくサイバー×メカニカルなダークモード。  
440px 固定幅ウィジェット、各四隅に FF14 ライクな Corner Marks を配置するクロス・フォーカス設計。

---

## 現在のファイル構成

```
src/
├── app/
│   └── App.tsx          # メイン UI（コンポーネント全体）
└── styles/
    └── nexus.css        # デザイントークン・アニメーション定義
```

---

## デザイントークン（変更禁止）

```css
/* Surfaces */
--s-0: #05060b  /* 最深背景 */
--s-1: #08090f  /* App背景 */
--s-2: #0d0e17  /* カード */
--s-3: #12131e
--s-4: #191a28
--s-5: #202235
--s-6: #282b3e

/* Accent */
--c:        #22d3ee   /* クリスタルシアン（メインアクセント）*/
--c-mid:    #0891b2
--c-deep:   #0e7490
--c-bg:     rgba(34,211,238,0.07)
--c-bg2:    rgba(34,211,238,0.13)
--c-border: rgba(34,211,238,0.2)
--c-glow:   rgba(34,211,238,0.35)

--g:        #c8a84b   /* ゴールド（セクションラベル）*/
--g-bg:     rgba(200,168,75,0.1)
--g-border: rgba(200,168,75,0.28)

/* Semantic */
--success: #22c55e
--warning: #f59e0b
--danger:  #ef4444

/* Text */
--t-1: #e2e8f0  /* プライマリ */
--t-2: #94a3b8  /* セカンダリ */
--t-3: #64748b  /* ミュート */
--t-4: #3d4760  /* フェイント */

/* Fonts */
--f-mono: 'JetBrains Mono', ui-monospace, monospace
--f-jp:   'Noto Sans JP', sans-serif

/* Motion */
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
--dur-fast: 140ms
--dur-med:  240ms
--dur-slow: 380ms
```

---

## 実装ルール（必須・変更禁止）

### 1. クラス名命名規則
- **既存の `nx-` クラスは変更・削除禁止**
- 新規 UI 部品を追加する場合は必ず `nx-` プレフィックスを付与
- Tailwind ユーティリティはベースレイアウトに使用可。グロー / グラデーション / 疑似要素は `nexus.css` 側で定義

### 2. 状態管理
- KPI（CPU / GPU / TEMP / RAM）は独立した `useEffect` + `setInterval` で管理し、最適化操作系 State と**混在させない**
- `isExecuting` / `resultState` / `activePanel` は操作系 State として `App.tsx` で管理
- **数値は必ず `Math.round()` で整数化**してから描画（KPI バーの width も同様）

### 3. アニメーション
- 新規アニメーションは `nexus.css` に `@keyframes` として追加
- 既存の `pulse-ring` / `shimmer` / `boost-sheen` / `slide-in` / `fadeup` / `spin-ring` を参照・再利用すること

### 4. Tauri / Rust 連携（現在未実装）
- バックエンド呼び出しは `await invoke<T>('command_name', { ...args })` の形式
- 現状はモック値（擬似乱数）で動作。`invoke` は将来差し替え用コメントを残す

### 5. アクセシビリティ
- インタラクティブ要素には必ず `title` または `aria-label` を付与
- `role="tablist"` / `role="tab"` は既存タブに付与済み。踏襲すること

---

## 既存コンポーネント一覧

| コンポーネント | 説明 | 主な State |
|---|---|---|
| Header | ロゴ・LIVE バッジ・電源ボタン | — |
| Tabs | 最適化 / モニター / ブースト | `activeTab` |
| KPI Row | CPU・GPU・TEMP・RAM カード | `kpi` (interval) |
| Alert Banner | Thermal Throttling 警告 | `showAlert` |
| Boost Meter | System Performance バー | `currentBoostPct` (算出値) |
| Opt List | 最適化項目チェックリスト | `items` |
| Applied Panel | 実行後の差分表示（6秒後自動消去） | `resultState` |
| CTA | EXECUTE / 前に戻る | `isExecuting`, `selectedCount` |
| Quick Actions | ゲーム・表示・保護・機能 | — |
| Footer | 設定・履歴・REVERT ALL | `activePanel` |
| Settings Panel | スライドイン設定パネル | `activePanel` |
| History Panel | スライドイン履歴パネル | `activePanel` |
| ToggleRow | 設定トグル行（内部 State） | `on` |

---

## 型定義

```typescript
type Item = {
  id: string;
  label: string;
  state: string;
  on: boolean;
  before: string;
  after: string;
};

// KPI
type KpiState = {
  cpu: number;   // 5〜95
  gpu: number;   // 2〜99
  temp: number;  // 60〜100
  ram: number;   // 20〜95
};

// Result
type ResultState = {
  success: string[];  // Item.id の集合
  failed: string[];
} | null;
```

---

## 主要ロジック

### handleExec（最適化実行）
```typescript
const handleExec = () => {
  const selected = items.filter(i => i.on);
  if (!selected.length) return;
  setIsExecuting(true);
  setTimeout(() => {
    setIsExecuting(false);
    setResultState({ success: selected.map(i => i.id), failed: [] });
    setTimeout(() => setResultState(null), 6000); // 6秒後自動クリア
  }, 1800);
};
```

### Boost 計算
```typescript
const currentBoostPct = resultState
  ? Math.min(95, 62 + selectedCount * 5)
  : 32;
```

### KPI 更新（2秒間隔）
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    setKpi(prev => ({
      cpu:  Math.max(5,  Math.min(95,  prev.cpu  + (Math.random() - 0.48) * 6)),
      gpu:  Math.max(2,  Math.min(99,  prev.gpu  + (Math.random() - 0.5)  * 4)),
      temp: Math.max(60, Math.min(100, prev.temp + (Math.random() - 0.5)  * 3)),
      ram:  Math.max(20, Math.min(95,  prev.ram  + (Math.random() - 0.5)  * 2)),
    }));
  }, 2000);
  return () => clearInterval(timer);
}, []);
```
## タスク実行推奨順

| 順序 | タスク | 理由 |
|---|---|---|
| 1st | Task 2 (Zustand 分割) | State 設計が確定してから UI を増やす |
| 2nd | Task 1 (タブビュー) | Zustand 完了後に `kpi` props 渡しが楽になる |
| 3rd | Task 3 (Quick Actions) | 既存 `nx-panel` 流用なので独立して実施可 |
| 4th | Task 4 (Tauri 連携) | バックエンド実装後に差し替え |
---

## Next Steps（実装待ちタスク）

### Task 1: タブ切り替えビュー実装
**概要:** 「モニター」「ブースト」タブのメインビューを実装する。

**要件:**
- `activeTab === 'monitor'` → `MonitorView` コンポーネントを `nx-main` 内に表示
- `activeTab === 'boost'` → `BoostView` コンポーネントを表示
- `activeTab === 'optimize'` → 既存の最適化ビューをそのまま表示

**MonitorView の内容（最低限）:**
- CPU / GPU / TEMP / RAM の時系列グラフ（直近30秒を描く線）
- プロセス一覧テーブル（PID, 名前, CPU%, MEM%）
- グラフは `recharts` または `canvas` で実装。カラーは `--c` / `--success` / `--warning` / 紫 `rgba(139,92,246,1)` を使用

**BoostView の内容（最低限）:**
- プリセット選択（ゲーミング / バランス / 省電力）→ `nx-` スタイルの選択カード
- 現在適用中プリセットのバッジ表示
- 詳細スライダー（CPU 優先度 / メモリクリア頻度）→ `nx-` スタイル

**制約:**
- KPI データは既存の `kpi` State を `props` として渡す（新規 interval を立てない）
- コンポーネントは `src/app/views/` ディレクトリに分割して配置

---

### Task 2: Zustand ストア分割
**概要:** 現在 `App.tsx` にある State を Zustand ストアに移行する。

**設計:**

```typescript
// src/stores/telemetryStore.ts
// KPI メトリクス（高頻度更新）
interface TelemetryStore {
  kpi: KpiState;
  startPolling: () => void;
  stopPolling: () => void;
}

// src/stores/optimizationStore.ts
// 最適化操作系 State
interface OptimizationStore {
  items: Item[];
  isExecuting: boolean;
  resultState: ResultState;
  activePanel: string | null;
  showAlert: boolean;
  toggleItem: (id: string) => void;
  execute: () => void;
  revert: () => void;
  setActivePanel: (panel: string | null) => void;
  dismissAlert: () => void;
}
```

**制約:**
- 2ストアは**絶対に混在させない**（telemetry と optimization を分離する目的は再レンダリングの最小化）
- `App.tsx` のコンポーネント構造・クラス名・表示ロジックは変更しない
- 移行後、既存の表示・アニメーションが正常に動作することを確認

---

### Task 3: Quick Actions ダイアログ実装
**概要:** 「ゲーム」「表示」「保護」「機能」ボタンのクリック時に詳細パネルを表示する。

**要件:**
- 既存の `nx-panel` / `nx-overlay` の仕組みを**再利用**する（新規モーダル機構は作らない）
- `activePanel` の値に `'game'` / `'display'` / `'security'` / `'modules'` を追加

**各パネルの内容（最低限）:**

| パネル | 内容 |
|---|---|
| `game` | ゲームプロファイル選択（FPS / RPG / RTS）、フォアグラウンド優先度トグル |
| `display` | リフレッシュレート表示、G-Sync / FreeSync トグル、HDR トグル |
| `security` | ファイアウォール状態、Windows Defender 状態のバッジ表示 |
| `modules` | インストール済み最適化モジュール一覧（有効 / 無効トグル） |

**制約:**
- パネルのヘッダーは既存の `nx-panel-hd` / `nx-panel-ttl` / `nx-panel-x` クラスを使用
- コンテンツは既存の `nx-s-row` / `nx-tog` スタイルを流用して統一感を保つ

---

### Task 4: Tauri バックエンド連携（将来実装）
**概要:** Rust 側 `invoke` 経由でリアルシステム情報を取得する。

**Rust コマンド（予定）:**
```rust
#[tauri::command]
async fn get_system_metrics() -> Result<KpiState, String> { ... }

#[tauri::command]
async fn execute_optimization(item_ids: Vec<String>) -> Result<OptimizationResult, String> { ... }

#[tauri::command]
async fn revert_optimization() -> Result<(), String> { ... }
```

**フロントエンド対応:**
- `telemetryStore.ts` の `startPolling` 内で `await invoke<KpiState>('get_system_metrics')` に差し替え
- `optimizationStore.ts` の `execute` で `await invoke<OptimizationResult>('execute_optimization', { itemIds: ... })` に差し替え
- **現時点では擬似乱数ロジックの直前に `// TODO: replace with invoke` コメントを追加するだけでよい**

---

## 実装時の注意事項

1. **既存の CSS クラスは一切削除・変更しない**。追加のみ許可。
2. `nexus.css` のカラー変数は変更禁止。新しいバリアントが必要な場合は `--c-*` / `--g-*` の命名規則に従って追加。
3. アニメーションは `prefers-reduced-motion` を考慮すること：
   ```css
   @media (prefers-reduced-motion: reduce) {
     .nx-pulse-dot { animation: none; }
     /* 等 */
   }
   ```
4. 日本語テキストは `font-family: var(--f-jp)` を適用すること（`nx-opt-label`、`nx-s-lbl` 等の既存パターンに倣う）。
5. 数値表示（KPI、ブースト等）は `font-feature-settings: "tnum"` で等幅数字を維持すること。

---

## 作業開始前チェックリスト

- [ ] `src/app/App.tsx` の現在の State 構造を把握する
- [ ] `src/styles/nexus.css` のトークン・クラス名を確認する
- [ ] 対象タスクの「制約」セクションを読む 
- [ ] 既存コンポーネントへの副作用がないことを確認する
