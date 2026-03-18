import type React from 'react';
import { useState } from 'react';
import { useInitialData, useStateSync } from '../../hooks/useInitialData';
import { useWindowsSettings } from '../../stores/useWindowsSettingsStore';
import { PowerPlan, VisualEffects } from '../../types';
import { Button, ErrorBanner, LoadingState } from '../ui';
import SettingsAdvisorPanel from './SettingsAdvisorPanel';

export default function WindowsWing(): React.ReactElement {
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

  // Pending states for select elements
  const [pendingPowerPlan, setPendingPowerPlan] = useState<PowerPlan>(PowerPlan.Balanced);
  const [pendingVisualEffects, setPendingVisualEffects] = useState<VisualEffects>(
    VisualEffects.Balanced,
  );

  // 設定変更時にローカル状態を同期
  useStateSync(() => {
    if (settings) {
      setPendingPowerPlan(settings.powerPlan);
      setPendingVisualEffects(settings.visualEffects);
    }
  }, [settings]);

  // 初回データフェッチ
  useInitialData(() => fetchSettings(), [fetchSettings]);

  // ローディング表示
  if (isLoading && !settings) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <div className="font-(--font-mono) text-xs font-bold text-cyan-500 tracking-[0.15em] shrink-0 pb-2 border-b border-border-subtle">
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
      {/* Error Banner */}
      {error && <ErrorBanner message={error} />}

      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="font-(--font-mono) text-xs font-bold text-cyan-500 tracking-[0.15em] shrink-0 pb-2 border-b border-border-subtle">
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

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* POWER Section */}
        <div className="bg-base-800 border border-border-subtle rounded p-3">
          <div className="font-(--font-mono) text-[10px] text-text-muted mb-2">POWER</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-(--font-mono) text-[11px] text-text-secondary">Power Plan</div>
              <div className="flex items-center gap-2">
                <select
                  value={pendingPowerPlan}
                  onChange={(e) => {
                    const plan = e.target.value as PowerPlan;
                    setPendingPowerPlan(plan);
                  }}
                  className="bg-base-700 border border-border-subtle text-text-primary font-(--font-mono) text-[11px] px-2 py-1 rounded"
                >
                  <option value={PowerPlan.Balanced}>Balanced</option>
                  <option value={PowerPlan.HighPerformance}>High Performance</option>
                  <option value={PowerPlan.PowerSaver}>Power Saver</option>
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setPowerPlan(pendingPowerPlan)}
                >
                  APPLY
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* GAMING Section */}
        <div className="bg-base-800 border border-border-subtle rounded p-3">
          <div className="font-(--font-mono) text-[10px] text-text-muted mb-2">GAMING</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-(--font-mono) text-[11px] text-text-secondary">Game Mode</div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${settings?.gameMode ? 'bg-success-500' : 'bg-text-muted'}`}
                />
                <span className="font-(--font-mono) text-[11px] text-text-primary">
                  {settings?.gameMode ? 'ENABLED' : 'DISABLED'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void toggleGameMode()}
                  disabled={isLoading}
                >
                  TOGGLE
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-(--font-mono) text-[11px] text-text-secondary">
                Fullscreen Opt.
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${settings?.fullscreenOptimization ? 'bg-success-500' : 'bg-text-muted'}`}
                />
                <span className="font-(--font-mono) text-[11px] text-text-primary">
                  {settings?.fullscreenOptimization ? 'ENABLED' : 'DISABLED'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void toggleFullscreenOptimization()}
                  disabled={isLoading}
                >
                  TOGGLE
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-(--font-mono) text-[11px] text-text-secondary">
                Hardware GPU Sched
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${settings?.hardwareGpuScheduling ? 'bg-success-500' : 'bg-text-muted'}`}
                />
                <span className="font-(--font-mono) text-[11px] text-text-primary">
                  {settings?.hardwareGpuScheduling ? 'ENABLED' : 'DISABLED'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void toggleHardwareGpuScheduling()}
                  disabled={isLoading}
                >
                  TOGGLE
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* VISUAL Section */}
        <div className="bg-base-800 border border-border-subtle rounded p-3">
          <div className="font-(--font-mono) text-[10px] text-text-muted mb-2">VISUAL</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-(--font-mono) text-[11px] text-text-secondary">
                Visual Effects
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pendingVisualEffects}
                  onChange={(e) => {
                    const effect = e.target.value as VisualEffects;
                    setPendingVisualEffects(effect);
                  }}
                  className="bg-base-700 border border-border-subtle text-text-primary font-(--font-mono) text-[11px] px-2 py-1 rounded"
                >
                  <option value={VisualEffects.BestPerformance}>Best Performance</option>
                  <option value={VisualEffects.Balanced}>Balanced</option>
                  <option value={VisualEffects.BestAppearance}>Best Appearance</option>
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setVisualEffects(pendingVisualEffects)}
                >
                  APPLY
                </Button>
              </div>
            </div>
            <div className="font-(--font-mono) text-[10px] text-text-muted">
              (Best Performance / Balanced / Best Appearance)
            </div>
          </div>
        </div>

        {/* Settings Advisor Section */}
        <SettingsAdvisorPanel />
      </div>
    </div>
  );
}
