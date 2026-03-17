import type React from 'react';
import { useEffect } from 'react';
import {
  createDiskProgressBar,
  useHardwareData,
  useHardwareStore,
} from '../../stores/useHardwareStore';
import { Card } from '../ui';

export default function HardwareWing(): React.JSX.Element {
  const { subscribe } = useHardwareStore();
  const { info, isLoading, error, memUsagePercent, formattedUptime, formattedBootTime } =
    useHardwareData();

  useEffect(() => {
    subscribe(); // イベントリスナーを登録
  }, [subscribe]);

  if (isLoading) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-muted)] text-center py-8">
          LOADING HARDWARE INFO...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-danger-500)] text-center py-8">
          ERROR: {error}
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-muted)] text-center py-8">
          NO HARDWARE DATA
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-accent-500)] tracking-[0.15em] mb-1">
          ▶ HARDWARE
        </div>
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
          SYSTEM SPECIFICATIONS
        </div>
      </div>

      {/* CPU Information */}
      <Card title="CPU" className="mb-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] space-y-2">
          <div className="flex justify-between">
            <span>MODEL:</span>
            <span className="text-[var(--color-text-primary)]">{info.cpuName}</span>
          </div>
          <div className="flex justify-between">
            <span>CORES:</span>
            <span className="text-[var(--color-text-primary)]">
              {info.cpuCores}C / {info.cpuThreads}T
            </span>
          </div>
          <div className="flex justify-between">
            <span>BASE:</span>
            <span className="text-[var(--color-text-primary)]">
              {info.cpuBaseGhz.toFixed(1)} GHz
            </span>
          </div>
          {info.cpuTempC !== null && (
            <div className="flex justify-between">
              <span>TEMP:</span>
              <span
                className={
                  info.cpuTempC >= 80
                    ? 'text-[var(--color-danger-500)]'
                    : info.cpuTempC >= 70
                      ? 'text-[var(--color-accent-500)]'
                      : 'text-[var(--color-success-500)]'
                }
              >
                {info.cpuTempC.toFixed(1)}°C
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* GPU Information */}
      <Card title="GPU" className="mb-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] space-y-2">
          <div className="flex justify-between">
            <span>MODEL:</span>
            <span className="text-[var(--color-text-primary)]">{info.gpuName || 'N/A'}</span>
          </div>
          {info.gpuVramTotalMb !== null && (
            <div className="flex justify-between">
              <span>VRAM:</span>
              <span className="text-[var(--color-text-primary)]">
                {info.gpuVramTotalMb / 1024 >= 1
                  ? `${(info.gpuVramTotalMb / 1024).toFixed(1)} GB`
                  : `${info.gpuVramTotalMb} MB`}
              </span>
            </div>
          )}
          {info.gpuTempC !== null && (
            <div className="flex justify-between">
              <span>TEMP:</span>
              <span
                className={
                  info.gpuTempC >= 80
                    ? 'text-[var(--color-danger-500)]'
                    : info.gpuTempC >= 70
                      ? 'text-[var(--color-accent-500)]'
                      : 'text-[var(--color-success-500)]'
                }
              >
                {info.gpuTempC.toFixed(1)}°C
              </span>
            </div>
          )}
          {info.gpuUsagePercent !== null && (
            <div className="flex justify-between">
              <span>USAGE:</span>
              <span className="text-[var(--color-text-primary)]">
                {info.gpuUsagePercent.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Memory Information */}
      <Card title="MEMORY" className="mb-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] space-y-2">
          <div className="flex justify-between">
            <span>TOTAL:</span>
            <span className="text-[var(--color-text-primary)]">
              {info.memTotalGb.toFixed(1)} GB
            </span>
          </div>
          <div className="flex justify-between">
            <span>USED:</span>
            <span className="text-[var(--color-text-primary)]">
              {info.memUsedGb.toFixed(1)} GB ({memUsagePercent.toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span>FREE:</span>
            <span className="text-[var(--color-text-primary)]">
              {(info.memTotalGb - info.memUsedGb).toFixed(1)} GB
            </span>
          </div>
          <div className="mt-2">
            <div className="text-[var(--color-text-muted)] text-[10px] mb-1">USAGE BAR:</div>
            <div className="font-mono text-[10px]">
              {createDiskProgressBar(info.memUsedGb, info.memTotalGb)}
            </div>
          </div>
        </div>
      </Card>

      {/* Storage Information */}
      <Card title="STORAGE" className="mb-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] space-y-3">
          {info.disks.map((disk) => (
            <div
              key={disk.mount}
              className="border-b border-[var(--color-border-subtle)] pb-2 last:border-b-0"
            >
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-primary)]">{disk.mount}</span>
                <span
                  className={`text-[10px] font-[var(--font-mono)] ${disk.kind === 'SSD' ? 'text-[var(--color-success-500)]' : 'text-[var(--color-text-secondary)]'}`}
                >
                  {disk.kind}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>
                  {disk.usedGb.toFixed(1)} GB / {disk.totalGb.toFixed(1)} GB
                </span>
                <span>{((disk.usedGb / disk.totalGb) * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-1">
                <div className="font-mono text-[10px]">
                  {createDiskProgressBar(disk.usedGb, disk.totalGb)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Information */}
      <Card title="SYSTEM" className="mb-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] space-y-2">
          <div className="flex justify-between">
            <span>OS:</span>
            <span className="text-[var(--color-text-primary)]">
              {info.osName} {info.osVersion}
            </span>
          </div>
          <div className="flex justify-between">
            <span>HOSTNAME:</span>
            <span className="text-[var(--color-text-primary)]">{info.hostname}</span>
          </div>
          <div className="flex justify-between">
            <span>UPTIME:</span>
            <span className="text-[var(--color-text-primary)]">{formattedUptime}</span>
          </div>
          <div className="flex justify-between">
            <span>BOOT TIME:</span>
            <span className="text-[var(--color-text-primary)]">{formattedBootTime}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
