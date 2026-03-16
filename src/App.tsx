import { useState } from 'react';
import ArchiveWing from './components/archive/ArchiveWing';
import BeaconWing from './components/beacon/BeaconWing';
import ChronoWing from './components/chrono/ChronoWing';
import Shell from './components/layout/Shell';
import LinkWing from './components/link/LinkWing';
import OpsWing from './components/ops/OpsWing';
import PulseWing from './components/pulse/PulseWing';
import ReconWing from './components/recon/ReconWing';
import SecurityWing from './components/security/SecurityWing';
import SignalWing from './components/signal/SignalWing';
import VaultWing from './components/vault/VaultWing';
import type { WingId } from './types';

const WING_COMPONENTS: Record<WingId, React.ReactNode> = {
  recon: <ReconWing />,
  pulse: <PulseWing />,
  beacon: <BeaconWing />,
  ops: <OpsWing />,
  security: <SecurityWing />,
  vault: <VaultWing />,
  archive: <ArchiveWing />,
  chrono: <ChronoWing />,
  link: <LinkWing />,
  signal: <SignalWing />,
};

export default function App(): React.ReactElement {
  const [activeWing, setActiveWing] = useState<WingId>('recon');
  // Wings are kept mounted once visited so state (e.g. Vault unlock) persists
  const [mountedWings, setMountedWings] = useState<Set<WingId>>(new Set<WingId>(['recon']));

  const handleWingChange = (wing: WingId): void => {
    setMountedWings((prev) => new Set([...prev, wing]));
    setActiveWing(wing);
  };

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
