import type React from 'react';
import { usePulseStore } from '../../stores/usePulseStore';
import { Card, StatusBadge } from '../ui';

export default function PulseCard(): React.ReactElement {
  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  const cpuPercent = latestSnapshot?.cpuPercent ?? null;
  const memUsed = latestSnapshot?.memUsedMb ?? null;
  const memTotal = latestSnapshot?.memTotalMb ?? null;

  return (
    <Card title="システム監視">
      <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
        <div className="mb-1">
          CPU: <StatusBadge value={cpuPercent} unit="%" thresholds={{ warn: 50, danger: 80 }} />
        </div>
        <div>
          RAM:{' '}
          <span className="text-[var(--color-text-primary)]">
            {memUsed !== null && memTotal !== null
              ? `${memUsed.toFixed(0)} / ${memTotal.toFixed(0)} MB`
              : '--'}
          </span>
        </div>
      </div>
    </Card>
  );
}
