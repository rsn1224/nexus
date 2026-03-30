import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { extractErrorMessage } from '../../lib/tauri';
import type { CoreParkingState } from '../../types';

export const CpuPanel = memo(function CpuPanel() {
  const { t } = useTranslation('tactics');
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
    { label: '0% (ALL ACTIVE)', value: 0, desc: t('cpu.allActive') },
    { label: '25% (DEFAULT)', value: 25, desc: t('cpu.windowsDefault') },
    { label: '50%', value: 50, desc: t('cpu.balancedMode') },
  ];

  if (loading && !parking) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-xs font-mono">
        {t('cpu.loading')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
      {error && (
        <div className="glass-panel bloom-border p-4 border-l-4 border-l-danger-500">
          <div className="flex items-center justify-between">
            <span className="text-danger-500 text-xs font-data">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-danger-500 text-xs font-data hover:text-text-primary"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel bloom-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-white/30">memory</span>
          <h3 className="text-[10px] tracking-widest text-white/60 uppercase">
            {t('cpu.coreParking')}
          </h3>
        </div>
        {parking && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-data text-white/60">{t('cpu.acMinCores')}</span>
              <span className="text-lg font-data text-accent-500">
                {parking.minCoresPercentAc}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-data text-white/60">{t('cpu.dcMinCores')}</span>
              <span className="text-lg font-data text-accent-500">
                {parking.minCoresPercentDc}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel bloom-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-white/30">tune</span>
          <h3 className="text-[10px] tracking-widest text-white/60 uppercase">
            {t('cpu.presets')}
          </h3>
        </div>
        <div className="space-y-3">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => void setMin(p.value)}
              disabled={applying || parking?.minCoresPercentAc === p.value}
              className={`glass-panel p-4 text-left transition-all ${
                parking?.minCoresPercentAc === p.value
                  ? 'bg-accent-500/10 border-accent-500'
                  : 'hover:bg-white/5 border-white/10'
              } disabled:opacity-40`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-sm">{p.label}</span>
                  <p className="text-xs text-white/60 mt-1">{p.desc}</p>
                </div>
                {parking?.minCoresPercentAc === p.value && (
                  <span className="text-accent-500 text-xs font-data">{t('cpu.active')}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
