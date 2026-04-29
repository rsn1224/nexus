# nexus アーキテクチャ

## フロントエンド

```text
src/
├── App.tsx / App.css            # ルートコンポーネント
├── main.tsx                     # Vite エントリーポイント
├── index.css                    # デザイントークン CSS（@theme）
├── design-tokens.ts             # トークン定義 SSOT（TypeScript）
├── components/
│   ├── Main.tsx                 # 全セクション統合（1画面）
│   ├── Diagnostics.tsx          # 異常時のみ表示
│   ├── actions/
│   │   └── ActionStrip.tsx      # アクション行
│   ├── diagnostic/
│   │   └── DiagnosticBanner.tsx # 診断バナー
│   ├── layout/
│   │   ├── AppShell.tsx         # アプリシェル
│   │   ├── TopBar.tsx           # トップバー
│   │   ├── Sidebar.tsx          # サイドバー
│   │   └── FooterBar.tsx        # フッターバー
│   ├── optimize/
│   │   └── OptimizeSection.tsx  # 最適化セクション
│   ├── panels/
│   │   ├── SettingsPanel.tsx    # 設定スライドパネル
│   │   ├── HistoryPanel.tsx     # 履歴スライドパネル
│   │   └── QuickPanels.tsx      # クイックパネル
│   ├── system/
│   │   └── KpiGrid.tsx          # KPI グリッド
│   ├── ui/                      # Button, Card, Toggle, StatusBadge, ErrorBanner,
│   │                            #   LoadingState, SlidePanel, OptimizationRow 等
│   └── views/                   # DashboardView, BoostView, HardwareView, MemoryView,
│                                #   MonitorView, NetworkView, OptimizeView, SettingsView,
│                                #   TimerView, WindowsView
├── stores/
│   ├── useSystemStore.ts        # SystemStatus + Diagnostics（5秒ポーリング）
│   │                            # Tauri: invoke('get_system_status') / invoke('diagnose')
│   ├── useOptimizeStore.ts      # candidates / apply / revert
│   │                            # Tauri: invoke('get_optimization_candidates') / invoke('apply_optimizations') / invoke('revert_all')
│   ├── useSettingsStore.ts      # settings CRUD
│   │                            # Tauri: invoke('get_settings') / invoke('update_settings')
│   ├── useAppSettingsStore.ts   # アプリ設定
│   ├── useHardwareStore.ts      # ハードウェア情報
│   ├── useMemoryStore.ts        # メモリ情報
│   ├── useNavStore.ts           # ナビゲーション状態
│   ├── useNetworkStore.ts       # ネットワーク情報
│   ├── useTimerStore.ts         # タイマー
│   └── useWindowsStore.ts       # Windows 設定
├── lib/
│   ├── tauri-commands.ts        # invoke ラッパー全集約
│   ├── formatters.ts            # 温度・容量・パーセンテージ
│   ├── logger.ts                # console.log 禁止、これを使う
│   ├── cn.ts                    # classname マージユーティリティ
│   └── constants.ts             # 定数定義
├── hooks/
│   └── useFocusTrap.ts          # フォーカストラップ
├── types/
│   ├── system.ts                # SystemStatus, DiagnosticAlert
│   ├── optimize.ts              # OptCandidate, ApplyResult, Session
│   ├── settings.ts              # Settings
│   └── index.ts                 # re-export のみ
├── i18n/
│   └── locales/ en/ ja/         # 国際化リソース
└── services/
    ├── notificationService.ts
    └── perplexityService.ts
```

## バックエンド（Rust 4層アーキテクチャ）

```text
src-tauri/src/
├── commands/    # Tauri コマンドハンドラーのみ（薄いレイヤー）
├── services/    # ビジネスロジック（テスト可能な純粋ロジック）
├── infra/       # 外部システム接続（PowerShell, Registry, FileSystem）
└── parsers/     # VDF, ログ等のパーサー
```

**依存方向（逆方向禁止）:** `commands → services → infra/parsers`
