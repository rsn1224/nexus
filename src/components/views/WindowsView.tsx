import { Monitor, RefreshCw } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { useWindowsStore } from '../../stores/useWindowsStore';
import type { PowerPlan, VisualEffects } from '../../types';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';
import SectionLabel from '../ui/SectionLabel';
import { Toggle } from '../ui/Toggle';

const POWER_PLAN_LABELS: Record<PowerPlan, string> = {
  Balanced: 'バランス',
  HighPerformance: '高パフォーマンス',
  PowerSaver: '省電力',
};

const VISUAL_EFFECTS_LABELS: Record<VisualEffects, string> = {
  BestPerformance: '最高パフォーマンス',
  Balanced: 'バランス',
  BestAppearance: '最高の外観',
};

const POWER_PLANS: PowerPlan[] = ['HighPerformance', 'Balanced', 'PowerSaver'];
const VISUAL_EFFECTS_OPTIONS: VisualEffects[] = ['BestPerformance', 'Balanced', 'BestAppearance'];

const WindowsView = memo(function WindowsView(): React.ReactElement {
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
    clearError,
  } = useWindowsStore();

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handlePowerPlan = useCallback((plan: PowerPlan) => void setPowerPlan(plan), [setPowerPlan]);
  const handleVisualEffects = useCallback(
    (effect: VisualEffects) => void setVisualEffects(effect),
    [setVisualEffects],
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-accent-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary leading-none">
            Windows Settings
          </h2>
        </div>
        <Button variant="ghost" onClick={() => void fetchSettings()} loading={isLoading}>
          <RefreshCw size={12} />
          <span className="ml-1">更新</span>
        </Button>
      </div>

      {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

      {isLoading && !settings ? (
        <span className="text-[11px] text-text-muted">読み込み中...</span>
      ) : settings ? (
        <div className="flex flex-col gap-4">
          {/* 電源プラン */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-2">
            <SectionLabel label="電源プラン" />
            <div className="flex gap-2 flex-wrap">
              {POWER_PLANS.map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => handlePowerPlan(plan)}
                  disabled={isLoading}
                  className={[
                    'px-3 py-1.5 rounded text-[11px] font-semibold border transition-colors',
                    settings.powerPlan === plan
                      ? 'bg-accent-500/20 border-accent-500/60 text-accent-500'
                      : 'bg-base-700 border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-500/30',
                  ].join(' ')}
                >
                  {POWER_PLAN_LABELS[plan]}
                </button>
              ))}
            </div>
          </div>

          {/* ゲーミング設定 */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-1">
            <SectionLabel label="ゲーミング設定" />
            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-primary">ゲームモード</span>
                <span className="text-[10px] text-text-muted">Windows ゲームモードを有効化</span>
              </div>
              <Toggle
                enabled={settings.gameMode}
                onToggle={() => void toggleGameMode()}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-primary">
                  ハードウェア GPU スケジューリング
                </span>
                <span className="text-[10px] text-text-muted">
                  GPU スケジューリングをハードウェアで処理
                </span>
              </div>
              <Toggle
                enabled={settings.hardwareGpuScheduling}
                onToggle={() => void toggleHardwareGpuScheduling()}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-primary">フルスクリーン最適化</span>
                <span className="text-[10px] text-text-muted">
                  フルスクリーンアプリのパフォーマンスを最適化
                </span>
              </div>
              <Toggle
                enabled={settings.fullscreenOptimization}
                onToggle={() => void toggleFullscreenOptimization()}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 視覚効果 */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-2">
            <SectionLabel label="視覚効果" />
            <div className="flex gap-2 flex-wrap">
              {VISUAL_EFFECTS_OPTIONS.map((effect) => (
                <button
                  key={effect}
                  type="button"
                  onClick={() => handleVisualEffects(effect)}
                  disabled={isLoading}
                  className={[
                    'px-3 py-1.5 rounded text-[11px] font-semibold border transition-colors',
                    settings.visualEffects === effect
                      ? 'bg-accent-500/20 border-accent-500/60 text-accent-500'
                      : 'bg-base-700 border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-500/30',
                  ].join(' ')}
                >
                  {VISUAL_EFFECTS_LABELS[effect]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default WindowsView;
