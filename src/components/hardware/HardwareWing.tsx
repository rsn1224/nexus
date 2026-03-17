import type React from 'react';
import { useEffect } from 'react';
import { createDiskProgressBar, useHardwareData } from '../../stores/useHardwareStore';
import { Button } from '../ui';

export default function HardwareWing(): React.ReactElement {
  const {
    info,
    isLoading,
    error,
    memUsagePercent,
    formattedUptime,
    formattedBootTime,
    fetchHardware,
  } = useHardwareData();

  // 初回読み込み
  useEffect(() => {
    void fetchHardware();
  }, [fetchHardware]);

  // エラーバナー（インライン展開）
  const errorBanner = error ? (
    <div className="px-4 py-2 mb-4 bg-red-500/10 border-b border-red-600 text-red-500 font-[var(--font-mono)] text-[10px] rounded">
      ERROR: {error}
    </div>
  ) : null;

  // ローディング表示
  if (isLoading && !info) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <div className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-cyan-500)] tracking-[0.15em] shrink-0 pb-2 border-b border-[var(--color-border-subtle)]">
            ▶ HARDWARE / INFO
          </div>
          <Button variant="ghost" size="sm" disabled loading>
            ↻ REFRESH
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-muted)]">
            読み込み中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-cyan-500)] tracking-[0.15em] shrink-0 pb-2 border-b border-[var(--color-border-subtle)]">
          ▶ HARDWARE / INFO
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void fetchHardware()}
          disabled={isLoading}
          loading={isLoading}
        >
          ↻ REFRESH
        </Button>
      </div>

      {/* Error Banner */}
      {errorBanner}

      {/* Content Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto">
        {/* CPU Section */}
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            CPU
          </div>
          <div className="space-y-1">
            <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-primary)]">
              {info?.cpuName || 'Unknown'}
            </div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              {info?.cpuCores || 0}C / {info?.cpuThreads || 0}T
            </div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Base: {(info?.cpuBaseGhz || 0).toFixed(1)} GHz
            </div>
            {info?.cpuTempC && (
              <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                Temp: {info.cpuTempC.toFixed(1)}°C
              </div>
            )}
          </div>
        </div>

        {/* MEMORY Section */}
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            MEMORY
          </div>
          <div className="space-y-1">
            <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-primary)]">
              {(info?.memTotalGb || 0).toFixed(1)} GB RAM
            </div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Used: {(info?.memUsedGb || 0).toFixed(1)} GB / {(info?.memTotalGb || 0).toFixed(1)} GB
            </div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-accent-500)]">
              {createDiskProgressBar(info?.memUsedGb || 0, info?.memTotalGb || 0)}{' '}
              {memUsagePercent.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* STORAGE Section */}
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            STORAGE
          </div>
          <div className="space-y-2">
            {info?.disks.map((disk) => (
              <div key={disk.mount} className="space-y-1">
                <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-primary)]">
                  {disk.mount} {disk.kind} {disk.totalGb.toFixed(0)}GB
                </div>
                <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                  Used: {disk.usedGb.toFixed(0)} GB / {disk.totalGb.toFixed(0)} GB
                </div>
                <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-accent-500)]">
                  {createDiskProgressBar(disk.usedGb, disk.totalGb)}
                </div>
              </div>
            )) || (
              <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
                No disk information
              </div>
            )}
          </div>
        </div>

        {/* SYSTEM Section */}
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            SYSTEM
          </div>
          <div className="space-y-1">
            <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-primary)]">
              {info?.osName || 'Unknown'} {info?.osVersion || ''}
            </div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Hostname: {info?.hostname || 'Unknown'}
            </div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Uptime: {formattedUptime}
            </div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Boot: {formattedBootTime}
            </div>
          </div>
        </div>

        {/* GPU Section (if available) */}
        {info?.gpuName && (
          <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
              GPU
            </div>
            <div className="space-y-1">
              <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-primary)]">
                {info.gpuName}
              </div>
              {info.gpuVramTotalMb && (
                <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                  VRAM: {(info.gpuVramTotalMb / 1024).toFixed(1)} GB
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
