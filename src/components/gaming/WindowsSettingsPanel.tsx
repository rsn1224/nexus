import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useState } from 'react';
import log from '../../lib/logger';
import { extractErrorMessage } from '../../lib/tauri';
import type { WindowsSettings } from '../../types';
import { PowerPlan, VisualEffects } from '../../types';

export const WindowsSettingsPanel = memo(function WindowsSettingsPanel() {
  const [settings, setSettings] = useState<WindowsSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const s = await invoke<WindowsSettings>('get_windows_settings');
      setSettings(s);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const toggle = useCallback(
    async (command: string, args: Record<string, unknown> = {}): Promise<void> => {
      try {
        await invoke(command, args);
        await fetchSettings();
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'windows: command failed: %s', msg);
        setError(msg);
      }
    },
    [fetchSettings],
  );

  if (loading && !settings) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-xs font-mono">
        LOADING...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
      {error && (
        <div className="px-3 py-2 bg-danger-500/10 border border-danger-500/30 rounded text-xs font-mono text-danger-500">
          {error}
        </div>
      )}

      <div className="card-glass rounded p-3 flex flex-col gap-2">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">GAME MODE</p>
        <div className="flex items-center justify-between">
          <span className="text-text-primary text-xs font-mono">
            {settings?.gameMode ? 'ENABLED' : 'DISABLED'}
          </span>
          <button
            type="button"
            onClick={() => void toggle('toggle_game_mode')}
            className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
              settings?.gameMode
                ? 'border-success-500/40 text-success-500 hover:border-danger-500 hover:text-danger-500'
                : 'border-accent-500 text-accent-500 hover:bg-accent-500/10'
            }`}
          >
            {settings?.gameMode ? 'DISABLE' : 'ENABLE'}
          </button>
        </div>
      </div>

      <div className="card-glass rounded p-3 flex flex-col gap-2">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          POWER PLAN
        </p>
        <div className="flex gap-2">
          {[PowerPlan.HighPerformance, PowerPlan.Balanced, PowerPlan.PowerSaver].map((plan) => (
            <button
              key={plan}
              type="button"
              onClick={() => void toggle('set_power_plan', { plan })}
              className={`flex-1 px-2 py-1 text-xs font-mono rounded border transition-colors ${
                settings?.powerPlan === plan
                  ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                  : 'border-border-subtle text-text-secondary hover:border-accent-500/50'
              }`}
            >
              {plan === PowerPlan.HighPerformance
                ? 'HIGH'
                : plan === PowerPlan.Balanced
                  ? 'BALANCED'
                  : 'SAVER'}
            </button>
          ))}
        </div>
      </div>

      <div className="card-glass rounded p-3 flex flex-col gap-2">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          VISUAL EFFECTS
        </p>
        <div className="flex gap-2">
          {[
            VisualEffects.BestPerformance,
            VisualEffects.Balanced,
            VisualEffects.BestAppearance,
          ].map((fx) => (
            <button
              key={fx}
              type="button"
              onClick={() => void toggle('set_visual_effects', { effect: fx })}
              className={`flex-1 px-2 py-1 text-xs font-mono rounded border transition-colors ${
                settings?.visualEffects === fx
                  ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                  : 'border-border-subtle text-text-secondary hover:border-accent-500/50'
              }`}
            >
              {fx === VisualEffects.BestPerformance
                ? 'PERF'
                : fx === VisualEffects.Balanced
                  ? 'BALANCED'
                  : 'BEST'}
            </button>
          ))}
        </div>
      </div>

      <div className="card-glass rounded p-3 flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
            HW GPU SCHEDULING
          </p>
          <p className="text-text-primary text-xs font-mono mt-0.5">
            {settings?.hardwareGpuScheduling ? 'ENABLED' : 'DISABLED'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggle('toggle_hardware_gpu_scheduling')}
          className="px-3 py-1 text-xs font-mono rounded border border-accent-500 text-accent-500 hover:bg-accent-500/10 transition-colors"
        >
          TOGGLE
        </button>
      </div>
    </div>
  );
});
