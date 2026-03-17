import { useCallback, useEffect, useState } from 'react';
import BoostWing from './components/boost/BoostWing';
import HardwareWing from './components/hardware/HardwareWing';
import HomeWing from './components/home/HomeWing';
import LauncherWing from './components/launcher/LauncherWing';
import Shell from './components/layout/Shell';
import LogWing from './components/log/LogWing';
import NetoptWing from './components/netopt/NetoptWing';
import SettingsWing from './components/settings/SettingsWing';
import StorageWing from './components/storage/StorageWing';
import WindowsWing from './components/windows/WindowsWing';
import { useNavStore } from './stores/useNavStore';
import type { WingId } from './types';

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
  // Wings are kept mounted once visited so state (e.g. Vault unlock) persists
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
      {(Object.keys(WING_COMPONENTS) as WingId[]).map((wingId) =>
        mountedWings.has(wingId) ? (
          <div
            key={wingId}
            style={{
              display: wingId === activeWing ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {WING_COMPONENTS[wingId]}
          </div>
        ) : null,
      )}
    </Shell>
  );
}
