import type React from 'react';
import {
  useHardwareData,
  useThermalActions,
  useThermalAlerts,
} from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import type { ThermalAlert } from '../../types';
import { Card } from '../ui';

function formatNetSpeed(kb: number): string {
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB/s`;
  }
  return `${kb.toFixed(0)} KB/s`;
}

// Thermal Alert Banner component
function ThermalAlertBanner({
  alerts,
  onClear,
}: {
  alerts: ThermalAlert[];
  onClear: (component: string) => void;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-3 flex flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={`${alert.component}-${alert.timestamp}`}
          className={`flex items-center justify-between p-2 rounded ${
            alert.level === 'Critical'
              ? 'bg-red-500/10 border border-red-500/30'
              : 'bg-yellow-500/10 border border-yellow-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold ${
                alert.level === 'Critical' ? 'text-red-400' : 'text-yellow-400'
              }`}
            >
              {alert.level === 'Critical' ? '🔥' : '⚠️'}
            </span>
            <span className="text-xs text-[var(--color-text)]">
              {alert.component}{' '}
              {alert.level === 'Critical' ? 'サーマルスロットリング検知' : '温度警告'} (
              {alert.currentTempC}℃)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onClear(alert.component)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default function SystemStatusCard(): React.ReactElement {
  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  const thermalAlerts = useThermalAlerts();
  const { clearThermalAlert } = useThermalActions();

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
      {/* サーマルアラートバナー */}
      <ThermalAlertBanner alerts={thermalAlerts} onClear={clearThermalAlert} />

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
