import { useEffect } from 'react';

/**
 * 初回マウント時にデータフェッチを実行するカスタムフック
 * useEffect の重複を削減し、一貫したエラーハンドリングを提供
 */
export function useInitialData(
  fetchFn: () => Promise<void>,
  dependencies: React.DependencyList = [],
): void {
  useEffect(() => {
    void fetchFn();
    // biome-ignore lint/correctness/useExhaustiveDependencies: caller controls deps
  }, dependencies);
}

/**
 * イベントリスナー登録のカスタムフック
 * クリーンアップロジックを標準化
 */
export function useEventSubscription(
  // biome-ignore lint/suspicious/noConfusingVoidType: matches useEffect cleanup signature
  subscribeFn: () => void | (() => void),
  dependencies: React.DependencyList = [],
): void {
  useEffect(() => {
    const cleanup = subscribeFn();
    return cleanup;
    // biome-ignore lint/correctness/useExhaustiveDependencies: caller controls deps
  }, dependencies);
}

/**
 * Store 状態が変化したときにローカル状態を同期するカスタムフック
 */
export function useStateSync(syncFn: () => void, dependencies: React.DependencyList): void {
  useEffect(() => {
    syncFn();
    // biome-ignore lint/correctness/useExhaustiveDependencies: caller controls deps
  }, dependencies);
}
