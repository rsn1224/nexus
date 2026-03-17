# nexus フロントエンド設計レビュー

> **レビュー日:** 2026-03-18
> **対象:** React 19 + TypeScript + Zustand v5 + Tailwind v4 フロントエンド全体

---

## 優先度サマリー

| 優先度 | 件数 | 内容 |
|--------|------|------|
| **P0** | 2 | 即時対応必須（クリティカルバグ） |
| **P1** | 7 | セキュリティ・パフォーマンス上の重大問題 |
| **P2** | 10 | 設計負債・保守性問題 |
| **P3** | 10 | 推奨改善・品質向上 |

---

## P0: クリティカルバグ（即時対応）

### FE-P0-1: useLauncherStore 型エラーで LauncherWing が機能不全

**問題:** `useLauncherStore.ts` が LauncherWing で実際に使用する state/action と乖離している。`games` / `isLoading` / `error` / `addGame` / `removeGame` / `launchGame` 等の定義が不整合または欠落しており、LauncherWing が正常にレンダリングできない。

**影響:** ゲームランチャー機能が完全に動作しない

**対応:** LauncherWing コンポーネントの使用箇所を逆算し、ストアを正しく再実装する

### FE-P0-2: useScriptStore isRunning バグ

**問題:** `useScriptStore.ts` の catch ブロックで `isLoading: false` をセットしているが、正しくは `isRunning: false` でなければならない。スクリプト実行中にエラーが発生すると `isRunning` フラグが true のまま残り、以降の実行が不可能になる。

**影響:** スクリプト実行後にエラーが発生すると実行ボタンが永続的に disabled になる

**対応:** catch ブロック内を `isRunning: false, isLoading: false` に修正

---

## P1: セキュリティ・パフォーマンス重大問題

### FE-P1-1: フロントエンド入力バリデーション欠如

**問題:** `set_dns` / `ping_host` / `analyze_disk_usage` コマンドへのユーザー入力が検証なしに Rust へ渡されている。クロスサイトスクリプティングリスクではないが、想定外の値がシステムコマンドに注入される可能性がある。

**対応:** フロントエンド側でのバリデーション実装（IP アドレス形式、ホスト名パターン、パスサニタイズ）

### FE-P1-2: DESIGN.md の Tailwind 禁止ルールが現実と乖離

**問題:** `DESIGN.md` セクション10で「Tailwind / 外部 CSS クラス禁止」と明示されているが、実際の全 Wing コンポーネントは Tailwind v4 を使用している。`src/lib/styles.ts` は未参照の dead code。設計書とコードの矛盾が Cascade の実装誤りを誘発している（過去に nexus-design.md の wrong rule により inline style で実装されたインシデント発生済み）。

**対応:** DESIGN.md を実態に合わせて書き直し。Tailwind v4 を公式スタイリング方針として明記。

### FE-P1-3: ファサードセレクタによる過剰な再レンダリング

**問題:** Zustand v5 ストアでオブジェクトセレクタを使用しているケースで、毎レンダリング新しいオブジェクト参照が生成され不要な再描画が発生している。

**対応:** `useShallow` セレクタへの移行

### FE-P1-4: useEffect 依存配列の問題

**問題:** 複数のコンポーネントで `useEffect` の依存配列が不完全または過剰で、React Strict Mode での二重実行や無限ループのリスクがある。

**対応:** 依存配列の監査と修正、React 19 の `use()` + Suspense パターンへの移行検討

### FE-P1-5: コンポーネントサイズ超過（300行制限違反）

**問題:** `HomeWing.tsx` / `LogWing.tsx` / `LauncherWing.tsx` が 300行制限を超過しており、テスト困難・保守性低下の原因になっている。

**対応:** サブコンポーネントへの分割

### FE-P1-6: useSettingsStore と useAppSettingsStore の重複

**問題:** 設定系ストアが2つに分散しており、どちらを参照すべきか明確でない。データの重複が発生している可能性がある。

**対応:** 1つのストアに統合

### FE-P1-7: 共通エラー/ローディング/空状態コンポーネントの欠如

**問題:** `ErrorBanner` / `LoadingState` / `EmptyState` が各 Wing に個別実装されており、見た目・挙動に差異がある。共通コンポーネント化が必要。

**対応:** `src/components/ui/` に共通コンポーネントを実装し、各 Wing で利用

---

## P2: 設計負債・保守性問題

### FE-P2-1: React 19 新機能未活用

`useEffect` + `isLoading` パターンが多数残存。`use()` + `<Suspense>` / `useActionState` / `useOptimistic` への移行で UX・コード品質が向上する。

### FE-P2-2: AiPanel.tsx のインラインスタイル残存

Tailwind 化が完了していない。品質チェックに「インラインスタイルなし」が含まれているが AiPanel.tsx が対象外になっている。

### FE-P2-3: React.lazy による code splitting 未実装

全 Wing が同期 import されており、初回ロード時間が不必要に長い。

### FE-P2-4: React.memo / useCallback 適用の不一致

パフォーマンス改善が一部 Wing にのみ適用されており、他の Wing には未適用。

### FE-P2-5: ポーリング間隔の一元管理欠如

各 Wing がそれぞれポーリング間隔を持っており、調整が困難。

### FE-P2-6: 型定義の重複

`src/types/index.ts` に共有型があるが、コンポーネント内でローカルに再定義されている箇所がある。

### FE-P2-7: エラーメッセージの多言語化未対応

エラーメッセージが英語・日本語混在。

### FE-P2-8: Perplexity API キーの平文保存

`usePerplexityStore` が API キーを plaintext で保存している。keyring クレートを使った暗号化保存が必要。

### FE-P2-9: CSV エクスポート RFC 4180 未準拠

カンマ・改行を含む値のクォート処理が不十分。

### FE-P2-10: テスト対象がストアのみ

コンポーネントテストが存在しない。共通 UI コンポーネント実装時にテストも追加すべき。

---

## P3: 推奨改善・品質向上

### FE-P3-1: Storybook / コンポーネントカタログ

共通コンポーネントのビジュアルリグレッション防止に有効。

### FE-P3-2: 型の strict 強化

`satisfies` 演算子の活用、const assertions の徹底。

### FE-P3-3: E2E テスト拡充

現在 3 smoke tests のみ。各 Wing の主要フローをカバー。

### FE-P3-4: アクセシビリティ改善

`aria-label` / `role` 属性の充実。キーボードナビゲーション対応。

### FE-P3-5: 国際化（i18n）基盤

現在日本語ハードコード。将来の拡張性のため i18n フレームワーク導入を検討。

### FE-P3-6: エラーバウンダリ

Wing レベルで `<ErrorBoundary>` を設置し、一部 Wing のクラッシュがアプリ全体に波及しないようにする。

### FE-P3-7: Virtual scrolling

プロセスリスト等の大量データ表示に `@tanstack/react-virtual` 導入を検討。

### FE-P3-8: パフォーマンスプロファイリング基盤

React DevTools Profiler での計測基準値の記録。

### FE-P3-9: Wing state の persistence

リロード後も最後に選択していた Wing を保持する（localStorage）。

### FE-P3-10: ダークモード以外のテーマ対応

CSS 変数によるテーマシステムが整備されているため、ライトモードの検討が可能。
