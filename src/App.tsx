import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Shell from './components/layout/Shell';
import { LoadingFallback } from './components/ui';
import { useNavStore } from './stores/useNavStore';
import type { WingId } from './types';

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

const WING_COMPONENTS: Record<WingId, React.ComponentType> = {
  home: HomeWing,
  boost: BoostWing,
  launcher: LauncherWing,
  settings: SettingsWing,
  windows: WindowsWing,
  hardware: HardwareWing,
  log: LogWing,
  netopt: NetoptWing,
  storage: StorageWing,
};

export default function App(): React.ReactElement {
  const [activeWing, setActiveWing] = useState<WingId>('home');
  // Wings are kept mounted once visited so state persists
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
      {(Object.keys(WING_COMPONENTS) as WingId[]).map((wingId) => {
        if (!mountedWings.has(wingId)) return null;
        const WingComponent = WING_COMPONENTS[wingId];
        return (
          <div
            key={wingId}
            className={wingId === activeWing ? 'flex flex-col h-full overflow-hidden' : 'hidden'}
          >
            <Suspense fallback={<LoadingFallback />}>
              <WingComponent />
            </Suspense>
          </div>
        );
      })}
    </Shell>
  );
}
