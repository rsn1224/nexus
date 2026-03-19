import { memo } from 'react';
import type { AppliedAction } from '../../types/v2';

interface Props {
  appliedActions: AppliedAction[];
}

export const AppliedBadgeRow = memo(function AppliedBadgeRow({ appliedActions }: Props) {
  if (appliedActions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 h-10 shrink-0 border-t border-border-subtle overflow-x-auto">
      <span className="text-text-secondary text-xs font-mono uppercase tracking-widest shrink-0">
        APPLIED:
      </span>
      {appliedActions.map((action) => (
        <span
          key={action.id}
          className="flex items-center gap-1 text-xs font-mono text-success-500 border border-success-500/30 bg-success-500/10 px-2 py-0.5 rounded-full shrink-0"
        >
          <span>✓</span>
          <span>{action.label}</span>
        </span>
      ))}
    </div>
  );
});
