import type React from 'react';
import { useEventSubscription } from '../../hooks/useInitialData';
import {
  createDiskProgressBar,
  useHardwareData,
  useHardwareStore,
} from '../../stores/useHardwareStore';
import { Card, EmptyState, ErrorBanner, ErrorBoundary, LoadingState } from '../ui';
import CpuSection from './CpuSection';
import EcoModePanel from './EcoModePanel';
import GpuSection from './GpuSection';
import MemorySection from './MemorySection';

export default function HardwareWing(): React.JSX.Element {
  const { subscribe } = useHardwareStore();
  const { info, isLoading, error, memUsagePercent, formattedUptime, formattedBootTime } =
    useHardwareData();

  useEventSubscription(() => subscribe(), [subscribe]);

  if (isLoading) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <LoadingState message="LOADING HARDWARE INFO..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <ErrorBanner message={`ERROR: ${error}`} />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <EmptyState message="NO HARDWARE DATA" action="PRESS REFRESH" />
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <ErrorBoundary name="CPU">
        <CpuSection
          cpuName={info.cpuName}
          cpuCores={info.cpuCores}
          cpuThreads={info.cpuThreads}
          cpuBaseGhz={info.cpuBaseGhz}
          cpuTempC={info.cpuTempC}
        />
      </ErrorBoundary>
      <ErrorBoundary name="GPU">
        <GpuSection
          gpuName={info.gpuName}
          gpuVramTotalMb={info.gpuVramTotalMb}
          gpuTempC={info.gpuTempC}
          gpuUsagePercent={info.gpuUsagePercent}
        />
      </ErrorBoundary>
      <ErrorBoundary name="メモリ">
        <MemorySection
          memTotalGb={info.memTotalGb}
          memUsedGb={info.memUsedGb}
          memUsagePercent={memUsagePercent}
          createProgressBar={createDiskProgressBar}
        />
      </ErrorBoundary>

      <Card title="STORAGE" className="mb-4">
        <div className="text-xs text-text-secondary space-y-3">
          {info.disks.map((disk) => (
            <div key={disk.mount} className="border-b border-border-subtle pb-2 last:border-b-0">
              <div className="flex justify-between mb-1">
                <span className="text-text-primary">{disk.mount}</span>
                <span
                  className={`text-[10px] ${disk.kind === 'SSD' ? 'text-success-500' : 'text-text-secondary'}`}
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

      <Card title="SYSTEM" className="mb-4">
        <div className="text-xs text-text-secondary space-y-2">
          <div className="flex justify-between">
            <span>OS:</span>
            <span className="text-text-primary">
              {info.osName} {info.osVersion}
            </span>
          </div>
          <div className="flex justify-between">
            <span>HOSTNAME:</span>
            <span className="text-text-primary">{info.hostname}</span>
          </div>
          <div className="flex justify-between">
            <span>UPTIME:</span>
            <span className="text-text-primary">{formattedUptime}</span>
          </div>
          <div className="flex justify-between">
            <span>BOOT TIME:</span>
            <span className="text-text-primary">{formattedBootTime}</span>
          </div>
        </div>
      </Card>

      <ErrorBoundary name="省電モード">
        <EcoModePanel />
      </ErrorBoundary>
    </div>
  );
}
