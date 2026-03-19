import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useState } from 'react';
import { extractErrorMessage } from '../../lib/tauri';
import type { CoreParkingState } from '../../types';

export const CpuPanel = memo(function CpuPanel() {
  const [parking, setParking] = useState<CoreParkingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const s = await invoke<CoreParkingState>('get_core_parking');
      setParking(s);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const setMin = useCallback(
    async (minCoresPercent: number): Promise<void> => {
      setApplying(true);
      setError(null);
      try {
        await invoke('set_core_parking', { minCoresPercent });
        await fetch();
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setApplying(false);
      }
    },
    [fetch],
  );

  const PRESETS = [
    { label: '0% (ALL ACTIVE)', value: 0, desc: 'すべてのコアを常時稼働' },
    { label: '25% (DEFAULT)', value: 25, desc: 'Windows デフォルト' },
    { label: '50%', value: 50, desc: 'バランスモード' },
  ];

  if (loading && !parking) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-xs font-mono">
        LOADING...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
      {error && (
        <div className="px-3 py-2 bg-danger-500/10 border border-danger-500/30 rounded text-xs font-mono text-danger-500">
          {error}
        </div>
      )}

      <div className="piano-surface rounded p-4 flex flex-col gap-2">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          CORE PARKING
        </p>
        {parking && (
          <div className="text-text-secondary text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span>AC MIN CORES</span>
              <span className="text-text-primary">{parking.minCoresPercentAc}%</span>
            </div>
            <div className="flex justify-between">
              <span>DC MIN CORES</span>
              <span className="text-text-primary">{parking.minCoresPercentDc}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="piano-surface rounded p-3 flex flex-col gap-2">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest mb-1">
          PRESETS
        </p>
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => void setMin(p.value)}
            disabled={applying || parking?.minCoresPercentAc === p.value}
            className={`flex items-center justify-between px-3 py-2 rounded border transition-colors text-xs font-mono ${
              parking?.minCoresPercentAc === p.value
                ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                : 'border-border-subtle text-text-secondary hover:border-accent-500/50 hover:text-text-primary disabled:opacity-40'
            }`}
          >
            <span className="font-bold">{p.label}</span>
            <span className="opacity-60">{p.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
