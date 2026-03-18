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
import WindowsWing from './WindowsWing';

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

describe('WindowsWing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE });
  });

  it('renders loading state when isLoading and no settings', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, isLoading: true });
    render(<WindowsWing />);
    expect(screen.getByText(/LOADING/i)).toBeTruthy();
  });

  it('renders header when settings loaded', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsWing />);
    expect(screen.getByText(/WINDOWS.*SETTINGS/i)).toBeTruthy();
  });

  it('renders error banner when error is set', () => {
    mockUseWindowsSettings.mockReturnValue({
      ...BASE_STORE,
      settings: MOCK_SETTINGS,
      error: 'registry error',
    });
    render(<WindowsWing />);
    expect(screen.getByText(/registry error/i)).toBeTruthy();
  });

  it('renders POWER section with power plan selector', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsWing />);
    expect(screen.getByText('POWER')).toBeTruthy();
    expect(screen.getByText('Power Plan')).toBeTruthy();
  });

  it('renders GAMING section with game mode toggle', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsWing />);
    expect(screen.getByText('GAMING')).toBeTruthy();
    expect(screen.getByText('Game Mode')).toBeTruthy();
    expect(screen.getByText('Fullscreen Opt.')).toBeTruthy();
    expect(screen.getByText('Hardware GPU Sched')).toBeTruthy();
  });

  it('shows ENABLED for active game mode', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsWing />);
    const enabledElements = screen.getAllByText('ENABLED');
    expect(enabledElements.length).toBeGreaterThan(0);
  });

  it('renders VISUAL section', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsWing />);
    expect(screen.getByText('VISUAL')).toBeTruthy();
    expect(screen.getByText('Visual Effects')).toBeTruthy();
  });

  it('renders advisor panel', () => {
    mockUseWindowsSettings.mockReturnValue({ ...BASE_STORE, settings: MOCK_SETTINGS });
    render(<WindowsWing />);
    expect(screen.getByTestId('advisor-panel')).toBeTruthy();
  });
});
