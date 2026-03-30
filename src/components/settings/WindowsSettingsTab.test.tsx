import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/useWindowsSettingsStore', () => ({
  useWindowsSettings: vi.fn(),
}));

vi.mock('../../hooks/useInitialData', () => ({
  useInitialData: vi.fn(),
  useStateSync: vi.fn(),
}));

vi.mock('./SettingsAdvisorPanel', () => ({
  default: () => <div data-testid="advisor-panel" />,
}));

import { useWindowsSettings } from '../../stores/useWindowsSettingsStore';
import { PowerPlan, VisualEffects } from '../../types';
import WindowsSettingsTab from './WindowsSettingsTab';

const mockUseWindowsSettings = vi.mocked(useWindowsSettings);

const BASE_STORE = {
  settings: null,
  advisorResult: null,
  isLoading: false,
  advisorLoading: false,
  error: null,
  advisorError: null,
  lastUpdated: null,
  fetchSettings: vi.fn(),
  fetchAdvisorResult: vi.fn(),
  setPowerPlan: vi.fn(),
  toggleGameMode: vi.fn(),
  toggleFullscreenOptimization: vi.fn(),
  toggleHardwareGpuScheduling: vi.fn(),
  setVisualEffects: vi.fn(),
  applyRecommendation: vi.fn(),
  applyAllSafeRecommendations: vi.fn(),
  clearError: vi.fn(),
  clearAdvisorError: vi.fn(),
};

const MOCK_SETTINGS = {
  powerPlan: PowerPlan.Balanced,
  gameMode: true,
  fullscreenOptimization: true,
  hardwareGpuScheduling: false,
  visualEffects: VisualEffects.Balanced,
};

describe('WindowsSettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE });
  });

  it('renders loading state when isLoading and no settings', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, isLoading: true });
    render(<WindowsSettingsTab />);
    expect(screen.getByText('loading')).toBeTruthy();
  });

  it('renders header when settings loaded', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsSettingsTab />);
    expect(screen.getByText(/windows\.header/)).toBeTruthy();
  });

  it('renders error banner when error is set', () => {
    mockUseWindowsSettings.mockReturnValue({
      ...BASE_STORE,
      settings: MOCK_SETTINGS,
      error: 'registry error',
    });
    render(<WindowsSettingsTab />);
    expect(screen.getByText(/registry error/i)).toBeTruthy();
  });

  it('renders POWER section with power plan selector', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsSettingsTab />);
    expect(screen.getByText('windows.power')).toBeTruthy();
    expect(screen.getByText('windows.powerPlan')).toBeTruthy();
  });

  it('renders GAMING section with game mode toggle', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsSettingsTab />);
    expect(screen.getByText('windows.gaming')).toBeTruthy();
    expect(screen.getByText('windows.gameMode')).toBeTruthy();
    expect(screen.getByText('windows.fullscreenOpt')).toBeTruthy();
    expect(screen.getByText('windows.gpuScheduling')).toBeTruthy();
  });

  it('shows enabled status for active game mode', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsSettingsTab />);
    const enabledElements = screen.getAllByText('enabled');
    expect(enabledElements.length).toBeGreaterThan(0);
  });

  it('renders VISUAL section', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsSettingsTab />);
    expect(screen.getByText('windows.visual')).toBeTruthy();
    expect(screen.getByText('windows.visualEffects')).toBeTruthy();
  });

  it('renders advisor panel', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsSettingsTab />);
    expect(screen.getByTestId('advisor-panel')).toBeTruthy();
  });
});
