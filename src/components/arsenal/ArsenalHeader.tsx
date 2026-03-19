import type React from 'react';
import { memo } from 'react';

interface Props {
  onApplyAll?: () => void;
}

export const ArsenalHeader = memo(function ArsenalHeader({
  onApplyAll,
}: Props): React.ReactElement {
  return (
    <div className="px-6 pt-6 pb-4">
      {/* Module label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] text-nexus-cyan font-light tracking-[0.3em] uppercase">
          Tactical_Advantage_Module
        </span>
        <div className="h-px flex-1 bg-linear-to-r from-nexus-cyan/50 to-transparent" />
      </div>

      {/* Main title */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-nexus-text uppercase leading-none">
            ARSENAL <span className="text-nexus-cyan">WING</span>
          </h1>
          <p className="text-nexus-muted font-light tracking-[0.6em] text-[9px] uppercase mt-2">
            System-wide synchronization and performance optimization
          </p>
        </div>

        {/* Apply All button */}
        <button
          type="button"
          onClick={onApplyAll}
          className="px-6 py-3 bg-nexus-green text-black font-black text-[10px] uppercase tracking-[0.3em] rounded hover:bg-nexus-cyan transition-colors"
        >
          [APPLY ALL]
        </button>
      </div>
    </div>
  );
});
