import type React from 'react';
import { useState } from 'react';
import { useInitialData, useStateSync } from '../../hooks/useInitialData';
import { useWindowsSettings } from '../../stores/useWindowsSettingsStore';
import { PowerPlan, VisualEffects } from '../../types';
import { Button, ErrorBanner, LoadingState } from '../ui';
import GamingSection from './GamingSection';
import PowerPlanSection from './PowerPlanSection';
import SettingsAdvisorPanel from './SettingsAdvisorPanel';
import VisualEffectsSection from './VisualEffectsSection';

export default function WindowsSettingsTab(): React.ReactElement {
  const {
    settings,
    isLoading,
    error,
    fetchSettings,
    setPowerPlan,
    toggleGameMode,
    toggleFullscreenOptimization,
    toggleHardwareGpuScheduling,
    setVisualEffects,
  } = useWindowsSettings();

  const [pendingPowerPlan, setPendingPowerPlan] = useState<PowerPlan>(PowerPlan.Balanced);
  const [pendingVisualEffects, setPendingVisualEffects] = useState<VisualEffects>(
    VisualEffects.Balanced,
  );

  useStateSync(() => {
    if (settings) {
      setPendingPowerPlan(settings.powerPlan);
      setPendingVisualEffects(settings.visualEffects);
    }
  }, [settings]);

  useInitialData(() => fetchSettings(), [fetchSettings]);

  if (isLoading && !settings) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <div className="font-mono text-xs font-bold text-accent-500 tracking-[0.15em] shrink-0 pb-2 border-b border-border-subtle">
            ▶ WINDOWS / SETTINGS
          </div>
          <Button variant="ghost" size="sm" disabled loading>
            ↻ REFRESH
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="LOADING..." />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      {error && <ErrorBanner message={error} />}

      <div className="mb-4 flex justify-between items-center">
        <div className="font-mono text-xs font-bold text-accent-500 tracking-[0.15em] shrink-0 pb-2 border-b border-border-subtle">
          ▶ WINDOWS / SETTINGS
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void fetchSettings()}
          disabled={isLoading}
          loading={isLoading}
        >
          ↻ REFRESH
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <PowerPlanSection
          pendingPowerPlan={pendingPowerPlan}
          isLoading={isLoading}
          onPendingChange={setPendingPowerPlan}
          onApply={() => void setPowerPlan(pendingPowerPlan)}
        />
        <GamingSection
          settings={settings}
          isLoading={isLoading}
          onToggleGameMode={() => void toggleGameMode()}
          onToggleFullscreenOptimization={() => void toggleFullscreenOptimization()}
          onToggleHardwareGpuScheduling={() => void toggleHardwareGpuScheduling()}
        />
        <VisualEffectsSection
          pendingVisualEffects={pendingVisualEffects}
          isLoading={isLoading}
          onPendingChange={setPendingVisualEffects}
          onApply={() => void setVisualEffects(pendingVisualEffects)}
        />
        <SettingsAdvisorPanel />
      </div>
    </div>
  );
}
