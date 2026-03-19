import type React from 'react';
import { buildBreadcrumbs, useNavStore } from '../../stores/useNavStore';
import type { WingId } from '../../types';

interface WingHeaderProps {
  wingId: WingId;
}

export default function WingHeader({ wingId }: WingHeaderProps): React.ReactElement {
  const wingState = useNavStore((s) => s.wingStates[wingId]);

  const { clearSubpages, setTab, popSubpage } = useNavStore.getState();
  const crumbs = buildBreadcrumbs(wingId, wingState, { clearSubpages, setTab, popSubpage });

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border-subtle bg-base-900 shrink-0">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-1">
          {i > 0 && (
            <span className="font-mono text-[9px] text-text-muted select-none" aria-hidden="true">
              /
            </span>
          )}
          {crumb.onClick !== null ? (
            <button
              type="button"
              onClick={crumb.onClick}
              className="font-mono text-[10px] text-text-muted hover:text-accent-500 transition-colors cursor-pointer tracking-widest"
            >
              {crumb.label}
            </button>
          ) : (
            <span
              className="font-mono text-[10px] text-text-primary font-semibold tracking-widest"
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
