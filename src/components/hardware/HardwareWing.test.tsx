import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/useHardwareStore', () => ({
  useHardwareStore: vi.fn(),
  useHardwareActions: vi.fn(),
  useHardwareData: vi.fn(),
  createDiskProgressBar: vi.fn(() => '████░░'),
}));

vi.mock('../../hooks/useInitialData', () => ({
  useInitialData: vi.fn(),
  useStateSync: vi.fn(),
  useEventSubscription: vi.fn(),
}));

vi.mock('./EcoModePanel', () => ({
  default: () => <div data-testid="eco-mode-panel" />,
}));

import { useHardwareActions, useHardwareData } from '../../stores/useHardwareStore';
import HardwareWing from './HardwareWing';

const mockUseHardwareActions = vi.mocked(useHardwareActions);
const mockUseHardwareData = vi.mocked(useHardwareData);

const MOCK_INFO = {
  cpuName: 'Intel Core i9-13900K',
  cpuCores: 24,
  cpuThreads: 32,
  cpuBaseGhz: 3.0,
  cpuTempC: 65,
  memTotalGb: 32,
  memUsedGb: 16,
  osName: 'Windows 11',
  osVersion: '22H2',
  hostname: 'TEST-PC',
  uptimeSecs: 3600,
  bootTimeUnix: 1_700_000_000,
  disks: [{ mount: 'C:', kind: 'SSD', totalGb: 1000, usedGb: 500 }],
  gpuName: 'NVIDIA RTX 4090',
  gpuVramTotalMb: 24576,
  gpuVramUsedMb: 8192,
  gpuTempC: 70,
  gpuUsagePercent: 40,
};

describe('HardwareWing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHardwareActions.mockReturnValue({
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearError: vi.fn(),
    });
    mockUseHardwareData.mockReturnValue({
      info: null,
      isLoading: false,
      error: null,
      memUsagePercent: 0,
      formattedUptime: '0h 0m',
      formattedBootTime: 'N/A',
      diskUsagePercent: null,
      fetchHardware: vi.fn(),
    } as unknown as ReturnType<typeof useHardwareData>);
  });

  it('renders loading state when isLoading', () => {
    mockUseHardwareData.mockReturnValue({
      info: null,
      isLoading: true,
      error: null,
      memUsagePercent: 0,
      formattedUptime: '',
      formattedBootTime: '',
      diskUsagePercent: null,
      fetchHardware: vi.fn(),
    } as unknown as ReturnType<typeof useHardwareData>);
    render(<HardwareWing />);
    expect(screen.getByText(/LOADING HARDWARE INFO/i)).toBeTruthy();
  });

  it('renders error state when error is set', () => {
    mockUseHardwareData.mockReturnValue({
      info: null,
      isLoading: false,
      error: 'hardware error',
      memUsagePercent: 0,
      formattedUptime: '',
      formattedBootTime: '',
      diskUsagePercent: null,
      fetchHardware: vi.fn(),
    } as unknown as ReturnType<typeof useHardwareData>);
    render(<HardwareWing />);
    expect(screen.getByText(/hardware error/i)).toBeTruthy();
  });

  it('renders empty state when no info', () => {
    render(<HardwareWing />);
    expect(screen.getByText(/NO HARDWARE DATA/i)).toBeTruthy();
  });

  it('renders hardware info when data is available', () => {
    mockUseHardwareData.mockReturnValue({
      info: MOCK_INFO,
      isLoading: false,
      error: null,
      memUsagePercent: 50,
      formattedUptime: '1h 0m',
      formattedBootTime: '2024-01-01',
      diskUsagePercent: 50,
      fetchHardware: vi.fn(),
    } as unknown as ReturnType<typeof useHardwareData>);
    render(<HardwareWing />);
    expect(screen.getByText(/Intel Core i9/i)).toBeTruthy();
  });

  it('renders eco mode panel', () => {
    mockUseHardwareData.mockReturnValue({
      info: MOCK_INFO,
      isLoading: false,
      error: null,
      memUsagePercent: 50,
      formattedUptime: '1h 0m',
      formattedBootTime: '2024-01-01',
      diskUsagePercent: 50,
      fetchHardware: vi.fn(),
    } as unknown as ReturnType<typeof useHardwareData>);
    render(<HardwareWing />);
    expect(screen.getByTestId('eco-mode-panel')).toBeTruthy();
  });
});
