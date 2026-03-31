import type React from 'react';
import { memo } from 'react';
import { formatTimestamp } from '../lib/formatters';
import { useOptimizeStore } from '../stores/useOptimizeStore';

const QuickInfo = memo(function QuickInfo(): React.ReactElement {
  const history = useOptimizeStore((s) => s.history);
  const lastSession = history[0];

  return (
    <div className="flex items-center gap-4">
      <InfoItem label="SESSIONS" value={String(history.length)} />
      {lastSession && <InfoItem label="LAST OPT" value={formatTimestamp(lastSession.timestamp)} />}
    </div>
  );
});

function InfoItem({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold tracking-[0.12em] text-text-muted uppercase">
        {label}
      </span>
      <span className="text-[12px] text-text-primary">{value}</span>
    </div>
  );
}

export default QuickInfo;
