import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import log from '../../lib/logger';
import { useWindowsStore } from '../../stores/useWindowsStore';
import type { PowerPlan } from '../../types';

type PresetId = 'gaming' | 'balanced' | 'power-save';

interface Preset {
  id: PresetId;
  label: string;
  sub: string;
  plan: PowerPlan;
}

const PRESETS: Preset[] = [
  {
    id: 'gaming',
    label: 'GAMING',
    sub: 'High Performance',
    plan: 'HighPerformance',
  },
  {
    id: 'balanced',
    label: 'BALANCED',
    sub: 'Balanced',
    plan: 'Balanced',
  },
  {
    id: 'power-save',
    label: 'POWER SAVE',
    sub: 'Power Saver',
    plan: 'PowerSaver',
  },
];

function planToPreset(plan: PowerPlan | undefined): PresetId {
  switch (plan) {
    case 'HighPerformance':
      return 'gaming';
    case 'PowerSaver':
      return 'power-save';
    default:
      return 'balanced';
  }
}

const BoostView = memo(function BoostView(): React.ReactElement {
  const { settings, isLoading, fetchSettings, setPowerPlan } = useWindowsStore(
    useShallow((s) => ({
      settings: s.settings,
      isLoading: s.isLoading,
      fetchSettings: s.fetchSettings,
      setPowerPlan: s.setPowerPlan,
    })),
  );

  // CPU 優先度スライダー（視覚フィードバックのみ）
  const [cpuPriority, setCpuPriority] = useState(70);
  // メモリクリア頻度（視覚フィードバックのみ）
  const [memFreq, setMemFreq] = useState(2);

  useEffect(() => {
    if (settings === null) {
      void fetchSettings();
    }
  }, [settings, fetchSettings]);

  const handlePreset = useCallback(
    async (plan: PowerPlan) => {
      try {
        await setPowerPlan(plan);
      } catch (err) {
        log.error({ err }, 'set power plan failed');
      }
    },
    [setPowerPlan],
  );

  const activePreset = planToPreset(settings?.powerPlan);

  return (
    <div className="flex flex-col gap-3">
      {/* ─ プリセット選択 */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2">
          POWER PRESET
        </div>
        <div className="flex gap-2">
          {PRESETS.map((p) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => void handlePreset(p.plan)}
                disabled={isLoading}
                className={[
                  'flex-1 px-3 py-2.5 bg-base-700 border rounded cursor-pointer transition-colors text-left',
                  isActive
                    ? 'border-border-active bg-accent-500/10'
                    : 'border-white/[0.07] hover:border-border-active hover:bg-base-600',
                ].join(' ')}
              >
                <div
                  className={`text-[10px] font-bold tracking-[0.15em] ${isActive ? 'text-accent-400' : 'text-text-secondary'}`}
                >
                  {p.label}
                </div>
                <div className="text-[9px] mt-0.5 text-text-muted">{p.sub}</div>
                {isActive && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em] uppercase rounded-sm text-accent-400 bg-accent-500/10 border border-border-subtle">
                      ACTIVE
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─ CPU 優先度スライダー */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2">
          CPU PRIORITY
        </div>
        <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between py-2 border-b border-white/4 last:border-b-0">
            <div>
              <div className="text-[11px] text-text-secondary tracking-[0.04em]">
                Process Priority
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                ゲームプロセスへの CPU 時間割り当て
                {/* TODO: replace with invoke('set_cpu_priority', { percent: cpuPriority }) */}
              </div>
            </div>
            <span className="text-[13px] font-bold text-accent-400">{cpuPriority}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={cpuPriority}
            onChange={(e) => setCpuPriority(Number(e.target.value))}
            className="styled-range"
            aria-label="CPU 優先度"
          />
        </div>
      </div>

      {/* ─ メモリクリア頻度 */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-accent-500 mb-2">
          MEMORY CLEANUP
        </div>
        <div className="bg-base-800 border border-border-subtle rounded p-3">
          <div className="flex items-center justify-between py-2 border-b border-white/4 last:border-b-0">
            <div>
              <div className="text-[11px] text-text-secondary tracking-[0.04em]">
                Cleanup Frequency
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                自動メモリ解放の頻度
                {/* TODO: replace with invoke('set_mem_cleanup_freq', { level: memFreq }) */}
              </div>
            </div>
            <span className="text-[13px] font-bold text-accent-400">
              {['OFF', '低', '中', '高', '最高'][memFreq] ?? '中'}
            </span>
          </div>
          <div className="mt-2">
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={memFreq}
              onChange={(e) => setMemFreq(Number(e.target.value))}
              className="styled-range"
              aria-label="メモリクリア頻度"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default BoostView;
