import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Shell from './components/layout/Shell';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import { ErrorBoundary, LoadingFallback } from './components/ui';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useNavStore } from './stores/useNavStore';
import type { WingId } from './types';

const ONBOARDING_KEY = 'nexus:onboarding:done';

// ─── Lazy Wing imports ──────────────────────────────────────────────────────
const DashboardWing = lazy(() => import('./wings/DashboardWing'));
const GamingWing = lazy(() => import('./wings/GamingWing'));
const MonitorWing = lazy(() => import('./wings/MonitorWing'));
const HistoryWing = lazy(() => import('./wings/HistoryWing'));
const SettingsWing = lazy(() => import('./components/settings/SettingsWing'));

const WING_COMPONENTS: Record<WingId, React.ComponentType> = {
  core: DashboardWing,
  arsenal: GamingWing,
  tactics: MonitorWing,
  logs: HistoryWing,
  settings: SettingsWing,
};

export default function App(): React.ReactElement {
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === 'true',
  );
  const [activeWing, setActiveWing] = useState<WingId>('core');

  useKeyboardShortcuts();

  const setNavigate = useNavStore((s) => s.setNavigate);

  const handleWingChange = useCallback((wing: WingId): void => {
    setActiveWing(wing);
  }, []);

  const handleOnboardingComplete = useCallback((): void => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
  }, []);

  useEffect(() => {
    setNavigate(handleWingChange);
  }, [setNavigate, handleWingChange]);

  if (!onboardingDone) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  const WingComponent = WING_COMPONENTS[activeWing];

  return (
    <Shell activeWing={activeWing} onWingChange={handleWingChange}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <div data-testid={`wing-${activeWing}`}>
            <WingComponent />
          </div>
        </Suspense>
      </ErrorBoundary>
    </Shell>
  );
}
