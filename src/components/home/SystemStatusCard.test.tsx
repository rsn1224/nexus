import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import SystemStatusCard from './SystemStatusCard';

// Mock stores
vi.mock('../../stores/useHardwareStore');
vi.mock('../../stores/usePulseStore');

const mockUseHardwareData = vi.mocked(useHardwareData);
const mockUsePulseStore = vi.mocked(usePulseStore);

const mockPulseData = {
  snapshots: [
    {
      timestamp: Date.now(),
      cpuPercent: 45.2,
      memUsedMb: 8192,
      memTotalMb: 16384,
      diskReadKb: 1024,
      diskWriteKb: 512,
      netRecvKb: 2048,
      netSentKb: 1024,
    },
  ],
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  isSubscribed: false,
};

const baseHardwareInfo = {
  cpuName: 'Test CPU',
  cpuCores: 8,
  cpuThreads: 16,
  cpuBaseGhz: 3.2,
  cpuTempC: 65.0,
  memTotalGb: 16.0,
  memUsedGb: 8.0,
  osName: 'Windows',
  osVersion: '10',
  hostname: 'test-pc',
  uptimeSecs: 3600,
  bootTimeUnix: 1640995200,
  disks: [{ mount: 'C:', kind: 'SSD', totalGb: 500, usedGb: 250 }],
};

function makeHardwareData(overrides: object = {}) {
  return {
    info: {
      ...baseHardwareInfo,
      gpuName: null,
      gpuVramTotalMb: null,
      gpuVramUsedMb: null,
      gpuTempC: null,
      gpuUsagePercent: null,
      ...overrides,
    },
    isLoading: false,
    error: null,
    memUsagePercent: 50.0,
    formattedUptime: '1h 0m',
    formattedBootTime: '2022/01/01 00:00',
    diskUsagePercent: 50.0,
    fetchHardware: vi.fn(),
  };
}

describe('SystemStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePulseStore.mockReturnValue(mockPulseData);
  });

  it('GPU% 行が表示されること', () => {
    mockUseHardwareData.mockReturnValue(
      makeHardwareData({
        gpuName: 'NVIDIA GeForce RTX 4070',
        gpuVramTotalMb: 12288,
        gpuVramUsedMb: 6234,
        gpuTempC: 62.0,
        gpuUsagePercent: 45.2,
      }),
    );

    render(<SystemStatusCard />);

    expect(screen.getByText('GPU%')).toBeInTheDocument();
    expect(screen.getByText('45.2%')).toBeInTheDocument();
  });

  it('GPU 情報が null の場合 N/A と表示されること', () => {
    mockUseHardwareData.mockReturnValue(makeHardwareData());

    render(<SystemStatusCard />);

    expect(screen.getByText('GPU%')).toBeInTheDocument();
    expect(screen.getAllByText('--').length).toBeGreaterThan(0);
  });

  it('その他のシステムステータス項目も表示されること', () => {
    mockUseHardwareData.mockReturnValue(makeHardwareData());

    render(<SystemStatusCard />);

    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('MEM')).toBeInTheDocument();
    expect(screen.getByText('DISK R')).toBeInTheDocument();
    expect(screen.getByText('DISK W')).toBeInTheDocument();
    expect(screen.getByText('NET ↓')).toBeInTheDocument();
    expect(screen.getByText('NET ↑')).toBeInTheDocument();
    expect(screen.getByText('DISK')).toBeInTheDocument();
    expect(screen.getByText('GPU%')).toBeInTheDocument();
  });
});
