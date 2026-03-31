# NEXUS v4 — Design Specification

## 1. コンセプト

**ゲーム前の30秒ルーティン。** 開く → 状態確認 → 最適化 → 閉じる。常駐しない。

### 設計原則

1. **30秒ルール** — 起動から最適化完了まで30秒以内
2. **1画面完結** — Wing/タブ遷移なし
3. **数字が主役** — Grafana 的な情報密度、装飾ゼロ
4. **壊さない** — 全操作リバート可能

---

## 2. 画面構成

Main 1画面（スクロール不要）+ スライドパネル 2枚（Settings, History）。

```
┌──────────────────────────────────────────────┐
│ TITLEBAR ────────────────────── [─][□][×]     │
├──────────────────────────────────────────────┤
│ SYSTEM STATUS                                │
│  CPU 42%  GPU 61%  RAM 14/32GB               │
│  TEMP 68°C  DISK 234GB FREE                  │
├──────────────────────────────────────────────┤
│ DIAGNOSTICS（異常時のみ表示）                   │
│  ⚠ GPU thermal throttling: 94°C > 90°C      │
├──────────────────────────────────────────────┤
│ OPTIMIZATIONS                                │
│  ☑ CPU Priority → 3 idle candidates          │
│  ☑ Network Nagle OFF                         │
│  ☑ DNS → 1.1.1.1                            │
│  ☑ Power Plan → Ultimate Performance         │
│  ☑ Registry Tweaks (4 items)                 │
│  ☑ Stop Services (Search, SysMain)           │
│  ☑ Timer Resolution 0.5ms                    │
│                                              │
│  [──────── OPTIMIZE ────────]                │
│  Applied: CPU 12→3 idle | Nagle ON→OFF       │
├──────────────────────────────────────────────┤
│ QUICK INFO                                   │
│  GAMES 42  UPDATES 1 avail  LAST OPT 2h ago │
├──────────────────────────────────────────────┤
│ [SETTINGS]  [HISTORY]  [REVERT ALL]          │
└──────────────────────────────────────────────┘
```

---

## 3. デザイントークン

> SSOT: `src/design-tokens.ts` — CSS 実体: `src/index.css` @theme

### カラー

| トークン | 値 | 用途 |
|---------|-----|------|
| `base-950` | `#08080d` | 最深背景 |
| `base-900` | `#0a0a0f` | メイン背景 |
| `base-800` | `#12121a` | カード背景 |
| `base-700` | `#1e293b` | ボーダー subtle |
| `base-600` | `#334155` | ボーダー active |
| `base-500` | `#475569` | テキスト muted |
| `accent-600` | `#0891b2` | アクセント dark |
| `accent-500` | `#06b6d4` | アクセント（唯一のアクセント色） |
| `accent-400` | `#22d3ee` | アクセント light |
| `success-500` | `#22c55e` | 成功 |
| `warning-500` | `#f59e0b` | 警告 |
| `danger-500` | `#ef4444` | 危険 |
| `text-primary` | `#e2e8f0` | メインテキスト |
| `text-secondary` | `#94a3b8` | 補助テキスト |
| `text-muted` | `#475569` | ラベル・非活性 |

### フォント

| トークン | 値 |
|---------|-----|
| `font-sans` | `"Inter", "system-ui", sans-serif` |
| `font-mono` | `"JetBrains Mono", ui-monospace, monospace` |

**ベースフォント:** JetBrains Mono 12px（全体）。見出し・ラベルに Inter を使用。

### タイポグラフィ

| 用途 | サイズ | ウェイト | トラッキング |
|------|--------|---------|-------------|
| KPI 数字 | `text-[24px]` | `font-bold` | — |
| セクション見出し | `text-[11px]` | `font-bold` | `tracking-[0.15em]` uppercase |
| 本文 | `text-[12px]` | `font-normal` | — |
| ラベル | `text-[10px]` | `font-semibold` | `tracking-[0.12em]` |
| ボタン | `text-[11px]` | `font-semibold` | `tracking-[0.1em]` uppercase |

### レイアウト

| 項目 | 値 |
|------|-----|
| `border-radius` | `4px` 統一 |
| カード背景 | `bg-base-800` + `border border-border-subtle` |
| カード hover | `border-border-active` |
| 装飾 | **なし**（グロー・グラデーション・シャドウ・アニメーション禁止） |
| 唯一の例外 | OPTIMIZE ボタン hover 時の微小 `box-shadow` |

---

## 4. 禁止パターン

```
text-black / text-white      → text-text-primary / text-text-secondary
bg-black / bg-white          → bg-base-900 / bg-base-800
shadow-lg / shadow-xl        → 禁止（shadow-sm のみ許可）
bg-gradient-to-*             → 禁止
glow-* / bloom-*             → 禁止
animate-* / transition-*     → 禁止（OPTIMIZE ボタン hover の box-shadow 除く）
text-[Npx] 任意値            → 上記タイポグラフィ表の値のみ許可
font-[N] 任意値              → font-normal/medium/semibold/bold のみ
rounded (裸)                 → rounded（4px）統一
style={{...}} inline         → Tailwind className で対応
console.log                  → log.info / log.warn / log.error
any 型                       → 適切な型を定義
#xxxxxx ハードコード          → デザイントークン CSS 変数を使用
```

---

## 5. Rust コマンド設計

| コマンド | 返り値型 | 責務 |
|---------|---------|------|
| `get_system_status` | `SystemStatus` | CPU/GPU/RAM/Temp/Disk 統合取得 |
| `get_optimization_candidates` | `Vec<OptCandidate>` | 適用可能な最適化 + 現在状態 |
| `apply_optimizations` | `ApplyResult` | 選択項目を一括適用 + before/after 差分 |
| `revert_all` | `RevertResult` | 全設定リバート |
| `get_history` | `Vec<Session>` | 過去の最適化セッション |
| `get_settings` / `update_settings` | `Settings` | 設定 CRUD |
| `diagnose` | `Vec<DiagnosticAlert>` | L1 ルールベース診断 |

### 型定義

```rust
struct SystemStatus {
    cpu_percent: f32,
    gpu_percent: f32,
    gpu_temp_c: f32,
    ram_used_gb: f32,
    ram_total_gb: f32,
    disk_free_gb: f32,
}

struct OptCandidate {
    id: String,           // "cpu_priority", "nagle_off", etc.
    label: String,
    description: String,
    current_state: String, // "Nagle: ON", "Power Plan: Balanced"
    is_recommended: bool,
}

struct ApplyResult {
    applied: Vec<AppliedItem>,
    failed: Vec<FailedItem>,
}
struct AppliedItem { id: String, before: String, after: String }
struct FailedItem { id: String, reason: String }

struct DiagnosticAlert {
    severity: Severity,   // Warning | Danger
    title: String,
    detail: String,
}
```

---

## 6. 最適化項目一覧

| ID | 項目 | 実装 | リバート方法 |
|----|------|------|-------------|
| `cpu_priority` | CPU 優先度を IDLE に | SetPriorityClass | 元の優先度を保存→復元 |
| `nagle_off` | Nagle アルゴリズム無効化 | Registry TcpNoDelay=1 | TcpNoDelay=0 |
| `dns_optimize` | DNS を 1.1.1.1 に | netsh | 元の DNS を保存→復元 |
| `power_plan` | Ultimate Performance 切替 | powercfg | 元のプランGUID を保存→復元 |
| `reg_responsiveness` | SystemResponsiveness=0 | Registry | 元の値を保存→復元 |
| `reg_priority_sep` | Win32PrioritySeparation 調整 | Registry | 元の値を保存→復元 |
| `reg_throttle` | NetworkThrottlingIndex 無効化 | Registry | 元の値を保存→復元 |
| `reg_game_dvr` | Game DVR 無効化 | Registry | 元の値を保存→復元 |
| `svc_search` | Windows Search 一時停止 | sc stop/start | sc start |
| `svc_sysmain` | SysMain 一時停止 | sc stop/start | sc start |
| `timer_res` | タイマーリゾリューション 0.5ms | NtSetTimerResolution | デフォルトに復元 |

---

## 7. L1 診断ルール

| 条件 | アラート | 重要度 |
|------|---------|--------|
| GPU temp > 90°C | サーマルスロットリング | `danger` |
| GPU temp > 80°C | 高温警告 | `warning` |
| RAM usage > 90% | メモリ不足 | `warning` |
| CPU usage > 95%（30秒継続） | CPU ボトルネック | `warning` |
| Disk free < 10% | ストレージ不足 | `warning` |
| Disk free < 5% | ストレージ危険 | `danger` |

---

## 8. フロントエンド構成

```
src/
├── components/
│   ├── Main.tsx              — 全セクション統合（1画面）
│   ├── SystemStatus.tsx      — CPU/GPU/RAM/Temp/Disk KPI
│   ├── Diagnostics.tsx       — 異常時のみ表示
│   ├── Optimizations.tsx     — チェックリスト + OPTIMIZE + before/after
│   ├── QuickInfo.tsx         — ゲーム数・更新・最終最適化
│   ├── SettingsPanel.tsx     — 右スライドパネル
│   ├── HistoryPanel.tsx      — 右スライドパネル
│   ├── layout/TitleBar.tsx   — タイトルバー + ウィンドウコントロール
│   └── ui/                   — Button, Card, Toggle, StatusBadge, ErrorBanner,
│                               LoadingState, SlidePanel, etc.
├── stores/
│   ├── useSystemStore.ts     — get_system_status + diagnose（5秒ポーリング）
│   ├── useOptimizeStore.ts   — candidates / apply / revert
│   └── useSettingsStore.ts   — get_settings / update_settings
├── lib/
│   ├── tauri-commands.ts     — invoke ラッパー全集約
│   ├── formatters.ts         — 温度・容量・パーセンテージ
│   └── logger.ts             — log.info / log.warn / log.error
└── types/
    ├── system.ts             — SystemStatus, DiagnosticAlert
    ├── optimize.ts           — OptCandidate, ApplyResult, Session
    ├── settings.ts           — Settings
    └── index.ts              — re-export のみ
```

---

## 9. 品質基準

- TS/TSX **200行制限** / `any` 禁止 / `console.log` 禁止 / インラインスタイル禁止
- Rust `unwrap()` 禁止 / clippy 警告 0 / **300行制限**
- コミット前: `npm run check && typecheck && test && cargo check && clippy && cargo test`
- デザイントークン外のハードコード色禁止
