import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Shell from './components/layout/Shell';
import { ErrorBoundary, LoadingFallback } from './components/ui';
import { useNavStore } from './stores/useNavStore';
import type { WingId } from './types';

// ─── Lazy Wing imports ──────────────────────────────────────────────────────
const HomeWing = lazy(() => import('./components/home/HomeWing'));
const PerformanceWing = lazy(() => import('./components/performance/BoostWing'));
const GamesWing = lazy(() => import('./components/games/LauncherWing'));
const SettingsWing = lazy(() => import('./components/settings/SettingsWing'));
const HardwareWing = lazy(() => import('./components/hardware/HardwareWing'));
const LogWing = lazy(() => import('./components/log/LogWing'));
const NetworkWing = lazy(() => import('./components/network/NetoptWing'));
const StorageWing = lazy(() => import('./components/storage/StorageWing'));

const WING_COMPONENTS: Record<WingId, React.ComponentType> = {
  home: HomeWing,
  performance: PerformanceWing,
  games: GamesWing,
  settings: SettingsWing,
  hardware: HardwareWing,
  log: LogWing,
  network: NetworkWing,
  storage: StorageWing,
};

export default function App(): React.ReactElement {
  const [activeWing, setActiveWing] = useState<WingId>('home');

  const setNavigate = useNavStore((s) => s.setNavigate);

  const handleWingChange = useCallback((wing: WingId): void => {
    setActiveWing(wing);
  }, []);

  useEffect(() => {
    setNavigate(handleWingChange);
  }, [setNavigate, handleWingChange]);

  return (
    <Shell activeWing={activeWing} onWingChange={handleWingChange}>
      {(Object.keys(WING_COMPONENTS) as WingId[]).map((wingId) => {
        const WingComponent = WING_COMPONENTS[wingId];
        return (
          <div
            key={wingId}
            className={wingId === activeWing ? 'flex flex-col h-full overflow-hidden' : 'hidden'}
          >
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <WingComponent />
              </Suspense>
            </ErrorBoundary>
          </div>
        );
      })}
    </Shell>
  );
}
