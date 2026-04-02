import { Cpu, RefreshCw } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { formatGb } from '../../lib/formatters';
import { useHardwareStore } from '../../stores/useHardwareStore';
import type { DiskInfo } from '../../types';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';
import SectionLabel from '../ui/SectionLabel';

const TEMP_WARN = 80;
const TEMP_DANGER = 95;

function tempColor(temp: number | null): string {
  if (temp === null) return 'text-text-muted';
  if (temp >= TEMP_DANGER) return 'text-danger-500';
  if (temp >= TEMP_WARN) return 'text-warning-500';
  return 'text-accent-500';
}

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle last:border-0">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className="text-[11px] text-text-primary font-mono">{value}</span>
    </div>
  );
}

function DiskBar({ disk }: { disk: DiskInfo }): React.ReactElement {
  const pct = disk.totalGb > 0 ? (disk.usedGb / disk.totalGb) * 100 : 0;
  const barColor = pct >= 90 ? 'bg-danger-500' : pct >= 75 ? 'bg-warning-500' : 'bg-accent-500';
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-primary font-mono">{disk.mount}</span>
        <span className="text-[10px] text-text-muted">
          {disk.kind} · {formatGb(disk.usedGb)}/{formatGb(disk.totalGb)} GB
        </span>
      </div>
      <div className="h-1 bg-base-700 rounded overflow-hidden">
        <div
          className={`h-full ${barColor} rounded w-(--bar-w)`}
          style={{ '--bar-w': `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

function formatUptime(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}日 ${h}時間`;
  if (h > 0) return `${h}時間 ${m}分`;
  return `${m}分`;
}

const HardwareView = memo(function HardwareView(): React.ReactElement {
  const { info, isLoading, error, fetchInfo, clearError } = useHardwareStore();

  useEffect(() => {
    void fetchInfo();
  }, [fetchInfo]);

  const handleRefresh = useCallback(() => void fetchInfo(), [fetchInfo]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary leading-none">
            Hardware Details
          </h2>
        </div>
        <Button variant="ghost" onClick={handleRefresh} loading={isLoading}>
          <RefreshCw size={12} />
          <span className="ml-1">更新</span>
        </Button>
      </div>

      {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

      {isLoading && !info ? (
        <span className="text-[11px] text-text-muted">読み込み中...</span>
      ) : info ? (
        <div className="flex flex-col gap-5">
          {/* CPU */}
          <div className="flex flex-col gap-2 bg-base-800 border border-border-subtle rounded p-3">
            <SectionLabel label="CPU" />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[12px] text-text-primary">{info.cpuName}</span>
              <div className="flex items-center gap-3 text-[11px] text-text-muted">
                <span>
                  {info.cpuCores}C/{info.cpuThreads}T
                </span>
                <span>{info.cpuBaseGhz.toFixed(1)} GHz</span>
                {info.cpuTempC !== null && (
                  <span className={tempColor(info.cpuTempC)}>{info.cpuTempC.toFixed(0)}°C</span>
                )}
              </div>
            </div>
          </div>

          {/* GPU + Memory */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0 bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-2">
              <SectionLabel label="GPU" />
              {info.gpuName ? (
                <>
                  <span className="text-[11px] text-text-primary">{info.gpuName}</span>
                  <InfoRow
                    label="使用率"
                    value={
                      info.gpuUsagePercent !== null ? `${info.gpuUsagePercent.toFixed(0)}%` : '--'
                    }
                  />
                  <InfoRow
                    label="温度"
                    value={info.gpuTempC !== null ? `${info.gpuTempC.toFixed(0)}°C` : '--'}
                  />
                  <InfoRow
                    label="VRAM"
                    value={
                      info.gpuVramUsedMb !== null && info.gpuVramTotalMb !== null
                        ? `${(info.gpuVramUsedMb / 1024).toFixed(1)} / ${(info.gpuVramTotalMb / 1024).toFixed(1)} GB`
                        : '--'
                    }
                  />
                </>
              ) : (
                <span className="text-[11px] text-text-muted">GPU 情報なし</span>
              )}
            </div>

            <div className="flex-1 min-w-0 bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-2">
              <SectionLabel label="Memory" />
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[24px] font-bold leading-none text-text-primary">
                  {formatGb(info.memUsedGb)}
                </span>
                <span className="text-[11px] text-text-muted">
                  / {formatGb(info.memTotalGb)} GB
                </span>
              </div>
              <div className="h-1 bg-base-700 rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-accent-500 rounded w-(--bar-w)"
                  style={
                    {
                      '--bar-w': `${(info.memUsedGb / info.memTotalGb) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          </div>

          {/* System */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-2">
            <SectionLabel label="System" />
            <InfoRow label="OS" value={`${info.osName} ${info.osVersion}`} />
            <InfoRow label="ホスト名" value={info.hostname} />
            <InfoRow label="稼働時間" value={formatUptime(info.uptimeSecs)} />
          </div>

          {/* Storage */}
          {info.disks.length > 0 && (
            <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-3">
              <SectionLabel label="Storage" />
              {info.disks.map((disk) => (
                <DiskBar key={disk.mount} disk={disk} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});

export default HardwareView;
