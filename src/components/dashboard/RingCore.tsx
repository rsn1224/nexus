import type React from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface RingCoreProps {
  score: number;
  loading: boolean;
  statusLabel?: string;
}

const RingCore = memo(function RingCore({
  score,
  loading,
  statusLabel,
}: RingCoreProps): React.ReactElement {
  const { t } = useTranslation('core');
  const label = statusLabel ?? t('dashboard.optimal');

  return (
    <div className="flex flex-col items-center justify-center py-10 relative overflow-hidden">
      {/* Background Ring */}
      <div className="absolute inset-0 w-[500px] h-[500px] rounded-full border border-accent-500/20 animate-pulse opacity-20" />

      {/* Outer Ring */}
      <div className="absolute inset-0 w-[400px] h-[400px] rounded-full ring-core animate-[spin_10s_linear_infinite]" />

      {/* Inner Ring */}
      <div className="absolute inset-0 w-[300px] h-[300px] rounded-full ring-core border-dashed opacity-30 animate-[spin_15s_linear_infinite_reverse]" />

      {/* Core Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-[10px] md:text-xs tracking-[0.3em] text-text-secondary uppercase mb-2">
          {t('dashboard.powerCore')}
        </div>

        {loading ? (
          <div className="text-4xl md:text-6xl font-data font-bold text-accent-500 animate-pulse">
            ---
          </div>
        ) : (
          <div className="text-4xl md:text-6xl font-data font-bold text-accent-500">{score}</div>
        )}

        <div className="text-[8px] md:text-[10px] bg-accent-500/10 text-accent-500 px-2 py-0.5 mt-2 rounded-full uppercase">
          {label}
        </div>
      </div>
    </div>
  );
});

export default RingCore;
