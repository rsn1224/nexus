# Phase 6: React 19 / Zustand v5 活用 — Cascade 実装プロンプト

## 言語ルール（最優先）
コミットメッセージ、コードコメント、doc comment、エラーメッセージ、ログメッセージ、テスト名、変数名以外の自然言語テキストはすべて日本語で記述。コード中の文字列リテラル（ユーザー向けメッセージ）も日本語にすること。

---

## サブフェーズ構成

Phase 6 は以下の4サブフェーズに分割して実装する:

| Sub | 内容 | 工数目安 |
|-----|------|---------|
| 6A | Zustand useShallow 全ストア導入 | 1日 |
| 6B | React.lazy + Suspense による Wing コード分割 | 半日 |
| 6C | useEffect → イベント駆動パターン最適化 | 1日 |
| 6D | 型安全性強化 + 不要コード削除 | 半日 |

各サブフェーズを順に Cascade に投入すること。

---

# Sub-Phase 6A: Zustand useShallow 全ストア導入

## ① 前提条件
- Phase 3（A〜D）が完了していること
- Phase 5（イベント駆動化）が完了していること
- `DESIGN.md` を事前に読むこと

## ② 対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/stores/useBoostStore.ts` | useShallow セレクタ追加 |
| `src/stores/useLauncherStore.ts` | useShallow セレクタ追加 |
| `src/stores/useOpsStore.ts` | 既存グラニュラーセレクタを useShallow に統合 |
| `src/stores/usePulseStore.ts` | useShallow セレクタ追加 |
| `src/stores/useHardwareStore.ts` | 既存グラニュラーセレクタを useShallow に統合 |
| `src/stores/useLogStore.ts` | 既存セレクタを useShallow に移行 |
| `src/stores/useNavStore.ts` | 変更不要（フィールド2つのみ） |
| `src/stores/useNetoptStore.ts` | useShallow セレクタ追加 |
| `src/stores/useStorageStore.ts` | useShallow セレクタ追加 |
| `src/stores/useWindowsSettingsStore.ts` | useShallow セレクタ追加 |
| `src/stores/useWinoptStore.ts` | useShallow セレクタ追加 |
| `src/stores/useScriptStore.ts` | useShallow セレクタ追加 |
| `src/stores/useReconStore.ts` | useShallow セレクタ追加 |
| 各 Wing コンポーネント（9ファイル） | ストア呼び出しを新セレクタに置換 |

## ③ 実装内容

### パターン: useShallow セレクタの導入

**現在のアンチパターン（過剰再レンダリングの原因）:**
```typescript
// ❌ 毎回新オブジェクトが生成される → 常に再レンダリング
const { processes, isLoading, error } = useOpsStore((s) => ({
  processes: s.processes,
  isLoading: s.isLoading,
  error: s.error,
}));

// ❌ ストア全体を取得 → 無関係な変更でも再レンダリング
const { logs, isLoading } = useLogStore();
```

**修正後パターン:**
```typescript
// ✅ useShallow で浅い比較 → 値が同じなら再レンダリングしない
import { useShallow } from 'zustand/shallow';

const { processes, isLoading, error } = useOpsStore(
  useShallow((s) => ({
    processes: s.processes,
    isLoading: s.isLoading,
    error: s.error,
  }))
);
```

### 各ストアの実装指示

**useBoostStore.ts:**
```typescript
// export 追加（コンポーネント向け）
export const useBoostState = () =>
  useBoostStore(
    useShallow((s) => ({
      lastResult: s.lastResult,
      isRunning: s.isRunning,
      error: s.error,
      runBoost: s.runBoost,
    }))
  );
```

**useLauncherStore.ts:**
```typescript
export const useLauncherState = () =>
  useLauncherStore(
    useShallow((s) => ({
      games: s.games,
      isScanning: s.isScanning,
      error: s.error,
      favorites: s.favorites,
      lastPlayed: s.lastPlayed,
      sortMode: s.sortMode,
      searchQuery: s.searchQuery,
    }))
  );

export const useLauncherActions = () =>
  useLauncherStore(
    useShallow((s) => ({
      scanGames: s.scanGames,
      launchGame: s.launchGame,
      toggleAutoBoost: s.toggleAutoBoost,
      toggleFavorite: s.toggleFavorite,
      setSortMode: s.setSortMode,
      setSearchQuery: s.setSearchQuery,
    }))
  );
```

**useOpsStore.ts:**
既存のグラニュラーセレクタ（`useProcesses`, `useProcessSuggestions` 等）は互換性のため残す。
ただし、コンポーネント側で複数のグラニュラーセレクタを個別に呼んでいる箇所は、useShallow 統合セレクタに置き換える。

```typescript
// 新規追加（既存のグラニュラーセレクタは削除しない）
export const useOpsState = () =>
  useOpsStore(
    useShallow((s) => ({
      processes: s.processes,
      suggestions: s.suggestions,
      isLoading: s.isLoading,
      isSuggestionsLoading: s.isSuggestionsLoading,
      error: s.error,
      lastUpdated: s.lastUpdated,
      isListening: s.isListening,
    }))
  );

export const useOpsActions = () =>
  useOpsStore(
    useShallow((s) => ({
      subscribe: s.subscribe,
      unsubscribe: s.unsubscribe,
      fetchSuggestions: s.fetchSuggestions,
      killProcess: s.killProcess,
      setProcessPriority: s.setProcessPriority,
      clearError: s.clearError,
    }))
  );
```

**usePulseStore.ts:**
```typescript
export const usePulseState = () =>
  usePulseStore(
    useShallow((s) => ({
      snapshots: s.snapshots,
      isListening: s.isListening,
      error: s.error,
    }))
  );

export const usePulseActions = () =>
  usePulseStore(
    useShallow((s) => ({
      subscribe: s.subscribe,
      unsubscribe: s.unsubscribe,
      clearSnapshots: s.clearSnapshots,
    }))
  );
```

**useHardwareStore.ts:**
既存のグラニュラーセレクタ（`useHardwareInfo`, `useCpuInfo` 等）と `useHardwareData` カスタムフックは残す。
`useHardwareData` 内部のストア呼び出しに useShallow を適用する:

```typescript
// useHardwareData の修正
export const useHardwareData = () => {
  const { info, isListening, error, subscribe } = useHardwareStore(
    useShallow((s) => ({
      info: s.info,
      isListening: s.isListening,
      error: s.error,
      subscribe: s.subscribe,
    }))
  );
  // ... 以降の計算ロジックは変更なし
};
```

**useLogStore.ts:**
既存の `useLogState` と `useLogActions` を useShallow でラップする:

```typescript
export const useLogState = () =>
  useLogStore(
    useShallow((s) => ({
      logs: s.logs,
      analysis: s.analysis,
      isLoading: s.isLoading,
      error: s.error,
      selectedLevel: s.selectedLevel,
      selectedSource: s.selectedSource,
      searchQuery: s.searchQuery,
    }))
  );

export const useLogActions = () =>
  useLogStore(
    useShallow((s) => ({
      getSystemLogs: s.getSystemLogs,
      getApplicationLogs: s.getApplicationLogs,
      analyzeLogs: s.analyzeLogs,
      exportLogs: s.exportLogs,
      setSelectedLevel: s.setSelectedLevel,
      setSelectedSource: s.setSelectedSource,
      setSearchQuery: s.setSearchQuery,
      clearLogs: s.clearLogs,
      clearError: s.clearError,
    }))
  );
```

**useNetoptStore.ts, useStorageStore.ts, useWindowsSettingsStore.ts, useWinoptStore.ts, useScriptStore.ts, useReconStore.ts:**
同じパターンで useShallow セレクタを追加する。
実際のファイルを読んで state / actions を分離すること。

### コンポーネント側の修正

各 Wing コンポーネントで、ストアの直接呼び出しを新しいセレクタに置き換える。

例: `HomeWing.tsx` の修正
```typescript
// 修正前
const subscribeOps = useOpsStore((s) => s.subscribe);
const subscribePulse = usePulseStore((s) => s.subscribe);
const processes = useOpsStore((s) => s.processes);

// 修正後
const { subscribe: subscribeOps, ...opsRest } = useOpsActions();
const { processes } = useOpsState();
const { subscribe: subscribePulse } = usePulseActions();
```

全 Wing コンポーネント（9ファイル）を確認し、同様に修正すること。
ただし、単一プロパティのみ取得している箇所（例: `useOpsStore((s) => s.processes)`）はそのままでよい（すでに最適）。

## ④ 注意事項

- `useShallow` は `zustand/shallow` からインポートする（`zustand` ではない）
- アクション関数のみのセレクタは useShallow 不要（関数参照は安定しているため）。ただし state + action の混合セレクタには useShallow が必要
- `useNavStore` はフィールドが2つだけなので useShallow 不要
- 既存のグラニュラーセレクタ（`useProcesses` 等）は互換性のため削除しない。新しい統合セレクタを追加する形で対応
- テストファイルがある場合（`useBoostStore.test.ts` 等）、テスト内でもセレクタの呼び出し方が変わらないか確認

## ⑤ 完了条件

- [ ] 13ストア全てに useShallow セレクタが追加されている（useNavStore は除外）
- [ ] 9 Wing コンポーネント全てがストア全体取得 `useXxxStore()` を使っていない
- [ ] `npm run check` クリーン
- [ ] `npm run typecheck` クリーン
- [ ] `npm run test` 全通過
- [ ] 既存のグラニュラーセレクタが削除されていない（互換性維持）

## ⑥ 品質チェック

```bash
npm run check
npm run typecheck
npm run test
```

---

# Sub-Phase 6B: React.lazy + Suspense による Wing コード分割

## ① 前提条件
- Sub-Phase 6A が完了していること

## ② 対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/App.tsx` | 静的 import → React.lazy + Suspense |
| `src/components/ui/LoadingFallback.tsx` | 新規作成（Suspense fallback） |
| `src/components/ui/index.ts` | LoadingFallback を export に追加 |

## ③ 実装内容

### App.tsx の変更

```typescript
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import Shell from './components/layout/Shell';
import { useNavStore } from './stores/useNavStore';
import type { WingId } from './types';
import { LoadingFallback } from './components/ui';

// ─── Lazy Wing imports ──────────────────────────────────────────────────────
const HomeWing = lazy(() => import('./components/home/HomeWing'));
const BoostWing = lazy(() => import('./components/boost/BoostWing'));
const LauncherWing = lazy(() => import('./components/launcher/LauncherWing'));
const SettingsWing = lazy(() => import('./components/settings/SettingsWing'));
const WindowsWing = lazy(() => import('./components/windows/WindowsWing'));
const HardwareWing = lazy(() => import('./components/hardware/HardwareWing'));
const LogWing = lazy(() => import('./components/log/LogWing'));
const NetoptWing = lazy(() => import('./components/netopt/NetoptWing'));
const StorageWing = lazy(() => import('./components/storage/StorageWing'));

const WING_COMPONENTS: Record<WingId, React.ReactNode> = {
  home: <HomeWing />,
  boost: <BoostWing />,
  launcher: <LauncherWing />,
  settings: <SettingsWing />,
  windows: <WindowsWing />,
  hardware: <HardwareWing />,
  log: <LogWing />,
  netopt: <NetoptWing />,
  storage: <StorageWing />,
};

export default function App(): React.ReactElement {
  const [activeWing, setActiveWing] = useState<WingId>('home');
  const [mountedWings, setMountedWings] = useState<Set<WingId>>(new Set<WingId>(['home']));

  const setNavigate = useNavStore((s) => s.setNavigate);

  const handleWingChange = useCallback((wing: WingId): void => {
    setMountedWings((prev) => new Set([...prev, wing]));
    setActiveWing(wing);
  }, []);

  useEffect(() => {
    setNavigate(handleWingChange);
  }, [setNavigate, handleWingChange]);

  return (
    <Shell activeWing={activeWing} onWingChange={handleWingChange}>
      <Suspense fallback={<LoadingFallback />}>
        {(Object.keys(WING_COMPONENTS) as WingId[]).map((wingId) =>
          mountedWings.has(wingId) ? (
            <div
              key={wingId}
              className={`flex flex-col h-full overflow-hidden ${
                wingId === activeWing ? '' : 'hidden'
              }`}
            >
              {WING_COMPONENTS[wingId]}
            </div>
          ) : null,
        )}
      </Suspense>
    </Shell>
  );
}
```

### 重要: App.tsx のインラインスタイル除去

現在の App.tsx には以下のインラインスタイルが残っている:
```typescript
style={{
  display: wingId === activeWing ? 'flex' : 'none',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}}
```

これを Tailwind クラスに置き換えること（DESIGN.md インラインスタイル禁止）:
```typescript
className={`flex flex-col h-full overflow-hidden ${
  wingId === activeWing ? '' : 'hidden'
}`}
```

### LoadingFallback.tsx（新規作成）

```typescript
import type React from 'react';

export default function LoadingFallback(): React.ReactElement {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--color-text-muted)]">
          読み込み中...
        </span>
      </div>
    </div>
  );
}
```

### 各 Wing の default export 確認

React.lazy は `default export` を要求する。各 Wing が `export default` になっていることを確認する。
現在の実装を読んで、`export default function XxxWing` または `export default XxxWing` の形式になっていなければ修正すること。

## ④ 注意事項

- `Shell` と `useNavStore` は lazy 化しない（初期レンダリングに必須）
- `HomeWing` は初回表示なので lazy 化の恩恵は小さいが、統一性のため含める
- `hidden` クラスは `display: none` と同等。Tailwind v4 で利用可能
- Suspense の fallback は Wing 切替時のみ表示される（数十ms程度）

## ⑤ 完了条件

- [ ] 9 Wing 全てが `React.lazy` で遅延ロードされている
- [ ] `Suspense` が `Shell` の子として配置されている
- [ ] `LoadingFallback` コンポーネントが作成されている
- [ ] App.tsx のインラインスタイルが Tailwind クラスに置換されている
- [ ] `npm run check` クリーン
- [ ] `npm run typecheck` クリーン
- [ ] `npm run test` 全通過

## ⑥ 品質チェック

```bash
npm run check
npm run typecheck
npm run test
```

---

# Sub-Phase 6C: useEffect 最適化

## ① 前提条件
- Sub-Phase 6B が完了していること

## ② 対象ファイル

| ファイル | 現在の useEffect 数 | 最適化内容 |
|---------|-------------------|-----------|
| `src/components/home/HomeWing.tsx` | 3 | subscribe 統合、localStorage 初期化を state 初期値に |
| `src/components/settings/SettingsWing.tsx` | 3 | fetchSettings を useEffect 外に |
| `src/components/windows/WindowsWing.tsx` | 3 | fetch 統合 |
| `src/components/boost/BoostWing.tsx` | 2 | 確認のみ（subscribe 用は必要） |
| `src/components/launcher/LauncherWing.tsx` | 2 | 確認のみ |
| `src/components/hardware/HardwareWing.tsx` | 2 | 確認のみ |
| `src/components/log/LogWing.tsx` | 2 | 確認のみ |
| `src/components/netopt/NetoptWing.tsx` | 2 | 確認のみ |
| `src/components/storage/StorageWing.tsx` | 2 | 確認のみ |

## ③ 実装内容

### 最適化方針

**変更するもの:**
1. 複数の `useEffect(() => { subscribe(); }, [])` を1つに統合
2. `localStorage` からの初期値読み込みは `useState(() => ...)` の初期化関数に移動
3. 依存配列が不正確な useEffect を修正

**変更しないもの:**
- イベントリスナーの subscribe/unsubscribe パターンは useEffect が正しい用途
- Tauri イベントの listen は非同期なので useEffect が必要
- データフェッチの useEffect は React 19 の `use()` に移行可能だが、Tauri invoke は Promise ベースでキャッシュ不要のため useEffect のままでよい

### HomeWing.tsx の最適化例

```typescript
// 修正前: 3つの useEffect
useEffect(() => {
  subscribePulse();
  subscribeOps();
  const saved = localStorage.getItem('nexus:home:history');
  if (saved) {
    try { setOptimizationHistory(JSON.parse(saved)); } catch {}
  }
}, [subscribePulse, subscribeOps]);

useEffect(() => { /* logs からの履歴更新 */ }, [logs]);

useEffect(() => {
  localStorage.setItem('nexus:home:history', JSON.stringify(optimizationHistory));
}, [optimizationHistory]);

// 修正後: localStorage 初期化を state 初期値に移動
const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistory[]>(() => {
  try {
    const saved = localStorage.getItem('nexus:home:history');
    return saved ? (JSON.parse(saved) as OptimizationHistory[]) : [];
  } catch {
    return [];
  }
});

useEffect(() => {
  subscribePulse();
  subscribeOps();
}, [subscribePulse, subscribeOps]);

// logs → history 更新と localStorage 永続化は1つに統合可能か検討
```

### 実装指示

各 Wing の useEffect を読んで、以下の判断基準で最適化すること:

| パターン | 対応 |
|---------|------|
| `useEffect(() => subscribe(), [])` | そのまま維持（正しい用途） |
| 複数の subscribe を別々の useEffect で呼んでいる | 1つに統合 |
| localStorage 読み込み | `useState(() => ...)` の初期化関数に移動 |
| 依存配列が空だが関数を呼んでいる | 依存配列に関数を追加 |
| setInterval / setTimeout | そのまま維持（クリーンアップが必要） |

**重要:** 各 Wing ファイルの現在の実装を必ず読んでから最適化すること。ここに書いていない Wing にも最適化の余地がある場合は対応すること。

## ④ 注意事項

- React 19 の `use()` は Promise を直接受け取れるが、Tauri invoke のレスポンスはキャッシュ不要なユースケースが多いため、無理に `use()` に移行しない
- `useActionState` / `useOptimistic` は現時点で適用箇所がないため導入しない（将来のフォーム画面で検討）
- useEffect の数を減らすこと自体が目的ではない。不要な再実行を防ぐことが目的

## ⑤ 完了条件

- [ ] 各 Wing の useEffect が最適化されている
- [ ] localStorage 初期値読み込みが useState 初期化関数に移動している
- [ ] 複数の subscribe が1つの useEffect に統合されている
- [ ] `npm run check` クリーン
- [ ] `npm run typecheck` クリーン
- [ ] `npm run test` 全通過

## ⑥ 品質チェック

```bash
npm run check
npm run typecheck
npm run test
```

---

# Sub-Phase 6D: 型安全性強化 + 不要コード削除

## ① 前提条件
- Sub-Phase 6C が完了していること

## ② 対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/types/index.ts` | 未使用の型定義を削除 |
| 各ストアファイル | 型の厳密化 |
| `src/components/ui/index.ts` | 全共有コンポーネントが export されているか確認 |

## ③ 実装内容

### 未使用型の確認と削除

`src/types/index.ts` を読み、以下の型が実際にインポートされている箇所があるか確認する。
インポート箇所がない型は削除する:

確認対象（明らかに旧 Wing 用で使われていない可能性がある型）:
- `DockerContainer` — WindowsWing で Docker 管理が実装されているか確認
- `VaultEntry` — Vault Wing は存在しない
- `ArchiveNote` — Archive Wing は存在しない
- `ChronoTask` — Chrono Wing は存在しない
- `Snippet` — Link Wing は存在しない
- `WatchedPath` / `WatchEvent` — Beacon Wing は存在しない
- `TotpResult` — TOTP 機能が存在するか確認
- `NpmVulnerability` / `CargoVulnerability` / `VulnerabilityReport` — Security Wing は存在しない
- `DetectedSecret` / `SecretReport` — Security Wing は存在しない
- `SignalFeed` / `SignalResult` — Signal Wing は存在しない
- `NetworkDevice` / `TrafficSnapshot` — Recon Wing の現在のコードで使われているか確認

**重要:** 削除前に `grep` や検索で全ソースコードを確認し、実際にインポートされていないことを検証すること。テストファイルでの使用も確認すること。

### 型の厳密化

各ストアで `error: string | null` の初期化パターンが統一されているか確認:
```typescript
// ✅ 統一パターン
set({ error: extractErrorMessage(err) })

// ❌ 不統一（直接 Error.message を使っている）
set({ error: err instanceof Error ? err.message : 'Failed to ...' })
```

`extractErrorMessage` を使っていない箇所があれば統一する。

### 不要な re-export の確認

`src/stores/useReconStore.ts` が存在するが、対応する Wing が `src/components/` に存在するか確認する。
存在しない Wing のストアは削除候補とする（ただし削除は確認後）。

## ④ 注意事項

- 型を削除する前に必ず全ファイルで import 検索を行うこと
- `useReconStore.ts` は対応 Wing が無くても他のストアから参照されている可能性がある
- Rust 側の変更は不要（このサブフェーズはフロントエンドのみ）

## ⑤ 完了条件

- [ ] 未使用の型定義が削除されている
- [ ] エラーハンドリングが `extractErrorMessage` に統一されている
- [ ] 未使用のストアが特定・報告されている
- [ ] `npm run check` クリーン
- [ ] `npm run typecheck` クリーン
- [ ] `npm run test` 全通過

## ⑥ 品質チェック

```bash
npm run check
npm run typecheck
npm run test
```

完了後、HANDOFF.md の Phase 6 セクションを更新し、ステータスを `review` にすること。
