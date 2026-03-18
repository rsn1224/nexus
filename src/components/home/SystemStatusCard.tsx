import type React from 'react';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { Card } from '../ui';

function formatNetSpeed(kb: number): string {
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB/s`;
  }
  return `${kb.toFixed(0)} KB/s`;
}

export default function SystemStatusCard(): React.ReactElement {
  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  const cpuPercent = latestSnapshot?.cpuPercent ?? null;
  const memUsed = latestSnapshot?.memUsedMb ?? null;
  const memTotal = latestSnapshot?.memTotalMb ?? null;
  const diskRead = latestSnapshot?.diskReadKb ?? null;
  const diskWrite = latestSnapshot?.diskWriteKb ?? null;
  const netRecv = latestSnapshot?.netRecvKb ?? null;
  const netSent = latestSnapshot?.netSentKb ?? null;

  const hardwareData = useHardwareData();
  const gpuUsagePercent = hardwareData.info?.gpuUsagePercent ?? null;

  return (
    <Card title="システムステータス" className="mt-4">
      <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
        <div>
          CPU{'     '}
          <span className="text-[var(--color-accent-500)]">
            {cpuPercent !== null ? `${cpuPercent.toFixed(1)}%` : '--'}
          </span>
        </div>
        <div>
          MEM{'     '}
          <span className="text-[var(--color-accent-500)]">
            {memUsed !== null && memTotal !== null
              ? `${memUsed.toFixed(0)} / ${memTotal.toFixed(0)} MB (${(
                  (memUsed / memTotal) * 100
                ).toFixed(0)}%)`
              : '--'}
          </span>
        </div>
        <div>
          DISK R{'  '}
          <span className="text-[var(--color-accent-500)]">
            {diskRead !== null ? formatNetSpeed(diskRead) : '--'}
          </span>
        </div>
        <div>
          DISK W{'  '}
          <span className="text-[var(--color-accent-500)]">
            {diskWrite !== null ? formatNetSpeed(diskWrite) : '--'}
          </span>
        </div>
        <div>
          NET ↓{'   '}
          <span className="text-[var(--color-accent-500)]">
            {netRecv !== null ? formatNetSpeed(netRecv) : '--'}
          </span>
        </div>
        <div>
          NET ↑{'   '}
          <span className="text-[var(--color-accent-500)]">
            {netSent !== null ? formatNetSpeed(netSent) : '--'}
          </span>
        </div>
        <div>
          DISK {'   '}
          <span className="text-[var(--color-accent-500)]">
            {hardwareData.diskUsagePercent !== null
              ? `${hardwareData.diskUsagePercent.toFixed(0)}%`
              : '--'}
          </span>
        </div>
        <div>
          GPU%{'    '}
          <span className="text-[var(--color-accent-500)]">
            {gpuUsagePercent !== null ? `${gpuUsagePercent.toFixed(1)}%` : '--'}
          </span>
        </div>
      </div>
    </Card>
  );
}
