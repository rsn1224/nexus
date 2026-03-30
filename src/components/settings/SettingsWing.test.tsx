import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppSettings } from '../../stores/useAppSettingsStore';
import SettingsWing from './SettingsWing';

// Mock dependencies
vi.mock('../../stores/useAppSettingsStore', () => ({
  useAppSettings: vi.fn(),
}));

vi.mock('../../hooks/useInitialData', () => ({
  useInitialData: vi.fn(),
  useStateSync: vi.fn(),
}));

describe('SettingsWing', () => {
  const mockSettings = {
    perplexityApiKey: 'sk-test-key',
    startWithWindows: false,
    minimizeToTray: true,
  };

  const mockUseAppSettings = vi.mocked(useAppSettings);

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAppSettings.mockReturnValue({
      settings: mockSettings,
      isLoading: false,
      error: null,
      fetchSettings: vi.fn(),
      saveSettings: vi.fn(),
      updateSettings: vi.fn(),
    });
  });

  it('renders main sections correctly', () => {
    render(<SettingsWing />);

    // Check main header (i18n key: "title")
    expect(screen.getByText('title')).toBeInTheDocument();

    // Check configuration module (kept as-is, not translated)
    expect(screen.getByText('CONFIGURATION_MODULE_07')).toBeInTheDocument();

    // Check tabs (i18n keys)
    expect(screen.getByText('appConfig')).toBeInTheDocument();
    expect(screen.getByText('windows.title')).toBeInTheDocument();
  });

  it('renders UI customization section', () => {
    render(<SettingsWing />);

    // i18n keys for UI customization
    expect(screen.getByText('ui.title')).toBeInTheDocument();
    expect(screen.getByText('ui.neonIntensityLabel')).toBeInTheDocument();
    expect(screen.getByText('ui.aiRendering')).toBeInTheDocument();
    expect(screen.getByText('ui.autoPowerOpt')).toBeInTheDocument();
  });

  it('displays API key section', () => {
    render(<SettingsWing />);

    // i18n key for system access key
    expect(screen.getByText('apiKey.systemAccessKey')).toBeInTheDocument();

    // Check masked key input
    const keyInput = screen.getByDisplayValue('••••••••••••••••');
    expect(keyInput).toBeInTheDocument();

    // Check buttons exist
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders hardware system tree', () => {
    render(<SettingsWing />);

    // i18n key for hardware title
    expect(screen.getByText('hardware.title')).toBeInTheDocument();
    // Technical labels are kept as-is
    expect(screen.getByText('CORE_PROC_01')).toBeInTheDocument();
    expect(screen.getByText('MEMORY_ARRAY')).toBeInTheDocument();
    expect(screen.getByText('RENDER_ENGINE')).toBeInTheDocument();
    expect(screen.getByText('STORAGE_VOL')).toBeInTheDocument();
    expect(screen.getByText('hardware.integratedHub')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<SettingsWing />);

    // i18n keys for action buttons
    expect(screen.getByText('restoreAll')).toBeInTheDocument();
    expect(screen.getByText('saveSettings')).toBeInTheDocument();
  });

  it('displays neon intensity slider', () => {
    render(<SettingsWing />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();

    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('displays toggle switches', () => {
    render(<SettingsWing />);

    const toggleSwitches = screen.getAllByRole('switch');
    expect(toggleSwitches.length).toBe(2);
  });

  it('displays error state correctly', () => {
    mockUseAppSettings.mockReturnValue({
      settings: mockSettings,
      isLoading: false,
      error: 'ERROR: Connection failed',
      fetchSettings: vi.fn(),
      saveSettings: vi.fn(),
      updateSettings: vi.fn(),
    });

    render(<SettingsWing />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    mockUseAppSettings.mockReturnValue({
      settings: mockSettings,
      isLoading: true,
      error: null,
      fetchSettings: vi.fn(),
      saveSettings: vi.fn(),
      updateSettings: vi.fn(),
    });

    render(<SettingsWing />);

    // loading 時もタブバーは表示される
    expect(screen.getByText('appConfig')).toBeInTheDocument();
  });
});
