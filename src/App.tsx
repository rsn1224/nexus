import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Shell from './components/layout/Shell';
import WingHeader from './components/layout/WingHeader';
import { ErrorBoundary, LoadingFallback } from './components/ui';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useNavStore } from './stores/useNavStore';
import type { WingId } from './types';

// ─── Lazy Wing imports ──────────────────────────────────────────────────────
const DashboardWing = lazy(() => import('./wings/DashboardWing'));
const GamingWing = lazy(() => import('./wings/GamingWing'));
const MonitorWing = lazy(() => import('./wings/MonitorWing'));
const HistoryWing = lazy(() => import('./wings/HistoryWing'));
const SettingsWing = lazy(() => import('./components/settings/SettingsWing'));

const WING_COMPONENTS: Record<WingId, React.ComponentType> = {
  dashboard: DashboardWing,
  gaming: GamingWing,
  monitor: MonitorWing,
  history: HistoryWing,
  settings: SettingsWing,
};

export default function App(): React.ReactElement {
  const [activeWing, setActiveWing] = useState<WingId>('dashboard');
  const [visitedWings, setVisitedWings] = useState<Set<WingId>>(new Set<WingId>(['dashboard']));

  useKeyboardShortcuts();

  const setNavigate = useNavStore((s) => s.setNavigate);

  const handleWingChange = useCallback((wing: WingId): void => {
    setActiveWing(wing);
    setVisitedWings((prev) => new Set([...prev, wing]));
  }, []);

  useEffect(() => {
    setNavigate(handleWingChange);
  }, [setNavigate, handleWingChange]);

  return (
    <Shell activeWing={activeWing} onWingChange={handleWingChange}>
      {(Object.keys(WING_COMPONENTS) as WingId[]).map((wingId) => {
        if (!visitedWings.has(wingId)) return null;
        const WingComponent = WING_COMPONENTS[wingId];
        return (
          <div
            key={wingId}
            className={
              wingId === activeWing ? 'flex flex-col h-full overflow-hidden wing-enter' : 'hidden'
            }
          >
            <WingHeader wingId={wingId} />
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
