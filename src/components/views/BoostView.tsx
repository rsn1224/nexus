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
        <div className="nx-section-lbl">POWER PRESET</div>
        <div className="flex gap-2">
          {PRESETS.map((p) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => void handlePreset(p.plan)}
                disabled={isLoading}
                className={`nx-preset-card${isActive ? ' nx-preset-card--active' : ''}`}
              >
                <div
                  className={`text-[10px] font-bold tracking-[0.15em] ${isActive ? 'text-accent-400' : 'text-text-secondary'}`}
                >
                  {p.label}
                </div>
                <div className="text-[9px] mt-0.5 text-text-muted">{p.sub}</div>
                {isActive && (
                  <div className="mt-2">
                    <span className="nx-tag nx-tag--cyan">ACTIVE</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─ CPU 優先度スライダー */}
      <div>
        <div className="nx-section-lbl">CPU PRIORITY</div>
        <div className="nx-card flex flex-col gap-3">
          <div className="nx-s-row">
            <div>
              <div className="nx-s-lbl">Process Priority</div>
              <div className="nx-s-sub">
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
            className="nx-slider"
            aria-label="CPU 優先度"
          />
        </div>
      </div>

      {/* ─ メモリクリア頻度 */}
      <div>
        <div className="nx-section-lbl">MEMORY CLEANUP</div>
        <div className="nx-card">
          <div className="nx-s-row">
            <div>
              <div className="nx-s-lbl">Cleanup Frequency</div>
              <div className="nx-s-sub">
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
              className="nx-slider"
              aria-label="メモリクリア頻度"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default BoostView;
