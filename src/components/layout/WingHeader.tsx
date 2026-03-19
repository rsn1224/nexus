import type React from 'react';
import { buildBreadcrumbs, useNavStore } from '../../stores/useNavStore';
import type { WingId } from '../../types';

interface WingHeaderProps {
  wingId: WingId;
}

const WING_ACCENT: Partial<Record<string, string>> = {
  home: 'text-accent-500',
  performance: 'text-warm-500',
  games: 'text-warm-500',
  hardware: 'text-purple-500',
  network: 'text-info-500',
  storage: 'text-purple-500',
  log: 'text-info-500',
  settings: 'text-accent-500',
};

const WING_BAR: Partial<Record<string, string>> = {
  home: 'bg-accent-500',
  performance: 'bg-warm-500',
  games: 'bg-warm-500',
  hardware: 'bg-purple-500',
  network: 'bg-info-500',
  storage: 'bg-purple-500',
  log: 'bg-info-500',
  settings: 'bg-accent-500',
};

export default function WingHeader({ wingId }: WingHeaderProps): React.ReactElement {
  const wingState = useNavStore((s) => s.wingStates[wingId]);
  const { clearSubpages, setTab, popSubpage } = useNavStore.getState();
  const crumbs = buildBreadcrumbs(wingId, wingState, { clearSubpages, setTab, popSubpage });

  const accentText = WING_ACCENT[wingId] ?? 'text-text-primary';
  const barColor = WING_BAR[wingId] ?? 'bg-accent-500';

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle bg-base-900/80 backdrop-blur-sm shrink-0">
      <div className={`w-0.5 h-3.5 rounded-full ${barColor} shrink-0`} />
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-xs text-text-muted select-none" aria-hidden="true">
              /
            </span>
          )}
          {crumb.onClick !== null ? (
            <button
              type="button"
              onClick={crumb.onClick}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              {crumb.label}
            </button>
          ) : (
            <span
              className={`text-xs font-bold uppercase tracking-wide ${accentText}`}
              aria-current="page"
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
