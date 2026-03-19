# NEXUS UX 再構築提案 — Wing 配置・動線の見直し

> **作成:** Claude Code（2026-03-19）
> **宛先:** Computer（設計判断）
> **ステータス:** 提案（承認待ち）

---

## 現状の問題

### 1. Performance Wing が肥大（29 コンポーネント、5 タブ）

```
Performance Wing
├── プロセス最適化（ProcessTab）— プロセス一覧 + Kill + Priority + Boost
├── プロファイル（ProfileTab）— ゲームプロファイル CRUD + アフィニティ + コアパーキング
├── WATCHDOG（WatchdogTab）— 自動監視ルール
├── セッション（SessionTab）— フレームタイム履歴
└── Windows 最適化（WinoptTab）— ← Settings Wing と重複
```

**問題:** ゲームプロファイル、プロセス管理、OS 最適化が混在。ユーザーは「ゲーム設定したい」のか「プロセスを管理したい」のか目的別に辿れない。

### 2. Settings Wing が 3 タブ（10 コンポーネント）

```
Settings Wing
├── アプリ設定（GeneralTab）— API キー / 起動設定 / バージョン
├── Windows 設定（WindowsSettingsTab）— 電源プラン / ゲームモード / 視覚効果 / アドバイザー
└── Windows 最適化（WinoptTab）— ← Performance Wing と完全重複
```

**問題:** WinoptTab が Performance と Settings の両方に存在する意味がない。

### 3. EcoMode が Hardware の下部に埋没

HardwareWing はスクロールしないと EcoMode パネルが見えない。電力管理は独立した関心事。

### 4. API キーが Settings の奥

AI 分析は Home Wing のボトルネック分析で使うが、設定場所が見つけにくい。

### 5. Network Wing の 2 タブ

DNS & Ping と TCP チューニングは関連性が薄い。TCP チューニングは「最適化」の文脈。

---

## 提案: Wing 再構成

### 案 A: 目的別 5 Wing（推奨）

```
┌──────────────────────────────────────────────────┐
│ サイドバー（5 + 2 ユーティリティ）                  │
│                                                    │
│ 🏠 HOME       ダッシュボード（変更なし）            │
│ ─────────                                         │
│ ⚡ OPTIMIZE   最適化（統合）                       │
│   ├── プロセス     ProcessTab                     │
│   ├── Windows      WinoptTab + WindowsSettingsTab │
│   ├── ネットワーク  TCP + DNS 統合                 │
│   └── エコモード   EcoModePanel                   │
│                                                    │
│ 🎮 GAMES     ゲーム（統合）                       │
│   ├── ランチャー   LauncherWing                   │
│   ├── プロファイル  ProfileTab + アフィニティ      │
│   ├── セッション   SessionTab                     │
│   └── WATCHDOG     WatchdogTab                    │
│                                                    │
│ 📊 MONITOR   監視（統合）                         │
│   ├── ハードウェア  CPU/GPU/Memory/Storage        │
│   ├── ストレージ   DriveList + Cleanup            │
│   └── ログ         LogWing                        │
│ ─────────                                         │
│ ⚙️ SETTINGS  設定（スリム化）                     │
│   ├── API キー     目立つ位置に配置               │
│   ├── アプリ設定   起動/トレイ                    │
│   └── アドバイザー  推奨設定スコア                │
└──────────────────────────────────────────────────┘
```

**メリット:**
- サイドバー 8 → 5 項目（認知負荷 -38%）
- WinoptTab の重複解消
- ゲーム関連が 1 箇所に集約
- EcoMode が「最適化」カテゴリに昇格

**デメリット:**
- 大規模リファクタリング（50+ ファイルの移動）
- 既存テストの import パス修正
- HANDOFF.md / spec.md の大幅更新

---

### 案 B: 最小限の調整（低コスト）

```
現状の 8 Wing を維持しつつ、以下を修正:

1. WinoptTab を Settings Wing から削除（Performance のみに残す）
2. EcoMode を Hardware Wing 最上部に移動（スクロール不要に）
3. API キーを Settings Wing の最上部セクションに移動
4. Network Wing 内で TCP チューニングを「最適化」セクションに改名
5. ProfileTab を Games Wing に移動（Performance から分離）
```

**メリット:**
- 変更が局所的（10 ファイル以下）
- テスト影響が小さい
- 段階的に実施可能

**デメリット:**
- 根本的な構造問題は残る
- Performance Wing はまだ 4 タブ

---

### 案 C: ハイブリッド（推奨度: 中）

```
6 Wing 構成:

🏠 HOME          — 変更なし
⚡ PERFORMANCE   — プロセス + WinOpt + TCP チューニング + エコモード
🎮 GAMES         — ランチャー + プロファイル + Watchdog + セッション
📊 HARDWARE      — CPU/GPU/Memory/Storage + ログ
🌐 NETWORK       — DNS & Ping（単独、タブなし）
⚙️ SETTINGS      — API キー（上部） + アプリ設定 + アドバイザー
```

**メリット:**
- 8 → 6 Wing（適度な削減）
- ゲーム関連の集約
- WinOpt 重複解消
- Storage と Hardware の自然な統合

---

## 判断に必要な情報

| 項目 | 現在値 |
|------|--------|
| サイドバーアイコン数 | 8（+ 3 セパレータ） |
| Performance コンポーネント数 | 29（最大） |
| Settings コンポーネント数 | 10 |
| WinoptTab 重複箇所 | 2（Performance + Settings） |
| 推定リファクタリング工数 | 案 A: 大 / 案 B: 小 / 案 C: 中 |

---

## 推奨

**案 B を即時実施 → 案 C を v3.2 で計画** が現実的。

案 B の 5 項目は独立して実施可能で、各項目 30 分以内で完了。ユーザー体感の改善は大きい。

Computer の判断を待ちます。
