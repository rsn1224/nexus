import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/useNetoptStore', () => ({
  useNetopt: vi.fn(),
}));

vi.mock('../../hooks/useInitialData', () => ({
  useInitialData: vi.fn(),
  useStateSync: vi.fn(),
}));

import { useNetopt } from '../../stores/useNetoptStore';
import NetoptWing from './NetoptWing';

const mockUseNetopt = vi.mocked(useNetopt);

const BASE_STORE = {
  adapters: [],
  currentDns: [] as string[],
  pingResult: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  fetchAdapters: vi.fn(),
  fetchCurrentDns: vi.fn(),
  setDns: vi.fn(),
  pingHost: vi.fn(),
  clearError: vi.fn(),
  reset: vi.fn(),
  dnsPresets: [
    { name: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1' },
    { name: 'Google', primary: '8.8.8.8', secondary: '8.8.4.4' },
  ],
};

describe('NetoptWing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNetopt.mockReturnValue({ ...BASE_STORE });
  });

  it('renders header', () => {
    render(<NetoptWing />);
    expect(screen.getByText(/▶ NETWORK/i)).toBeTruthy();
  });

  it('renders refresh button', () => {
    render(<NetoptWing />);
    expect(screen.getByText(/REFRESH/i)).toBeTruthy();
  });

  it('shows no adapter message when adapters is empty', () => {
    render(<NetoptWing />);
    expect(screen.getByText(/No connected adapters found/i)).toBeTruthy();
  });

  it('shows adapter details when adapter is available', () => {
    mockUseNetopt.mockReturnValue({
      ...BASE_STORE,
      adapters: [
        { name: 'Ethernet', ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:FF', isConnected: true },
      ],
    });
    render(<NetoptWing />);
    expect(screen.getByText('Ethernet')).toBeTruthy();
    expect(screen.getByText('192.168.1.1')).toBeTruthy();
  });

  it('shows error banner when error is set', () => {
    mockUseNetopt.mockReturnValue({ ...BASE_STORE, error: 'network error' });
    render(<NetoptWing />);
    expect(screen.getByText(/network error/i)).toBeTruthy();
  });

  it('renders DNS section with preset selector', () => {
    render(<NetoptWing />);
    expect(screen.getAllByText(/DNS/).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('Cloudflare')).toBeTruthy();
  });

  it('renders ping target input and ping button', () => {
    render(<NetoptWing />);
    expect(screen.getByPlaceholderText('8.8.8.8')).toBeTruthy();
    expect(screen.getByText(/▶ PING/i)).toBeTruthy();
  });

  it('shows ping success result', () => {
    mockUseNetopt.mockReturnValue({
      ...BASE_STORE,
      pingResult: { target: '8.8.8.8', latencyMs: 12, success: true },
    });
    render(<NetoptWing />);
    expect(screen.getByText('12ms')).toBeTruthy();
    expect(screen.getByText('OK')).toBeTruthy();
  });

  it('shows ping failure result', () => {
    mockUseNetopt.mockReturnValue({
      ...BASE_STORE,
      pingResult: { target: '8.8.8.8', latencyMs: null, success: false },
    });
    render(<NetoptWing />);
    expect(screen.getByText('TIMEOUT')).toBeTruthy();
  });

  it('renders current DNS when set', () => {
    mockUseNetopt.mockReturnValue({
      ...BASE_STORE,
      currentDns: ['1.1.1.1', '1.0.0.1'],
    });
    render(<NetoptWing />);
    expect(screen.getByText('1.1.1.1, 1.0.0.1')).toBeTruthy();
  });

  it('calls pingHost when ping button clicked', async () => {
    const pingHost = vi.fn().mockResolvedValue(undefined);
    mockUseNetopt.mockReturnValue({ ...BASE_STORE, pingHost });
    render(<NetoptWing />);
    fireEvent.click(screen.getByText(/▶ PING/i));
    await vi.waitFor(() => {
      expect(pingHost).toHaveBeenCalledWith('8.8.8.8');
    });
  });
});
