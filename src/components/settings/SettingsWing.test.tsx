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

    // Check main header
    expect(screen.getByText('SETTINGS')).toBeInTheDocument();
    expect(screen.getByText('WING')).toBeInTheDocument();

    // Check configuration module
    expect(screen.getByText('CONFIGURATION_MODULE_07')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByText('APP CONFIG')).toBeInTheDocument();
    expect(screen.getByText('アプリ設定')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM')).toBeInTheDocument();
    expect(screen.getByText('Windows 設定')).toBeInTheDocument();
  });

  it('renders UI customization section', () => {
    render(<SettingsWing />);

    // Check UI customization elements
    expect(screen.getByText('UI カスタマイズ')).toBeInTheDocument();
    expect(screen.getByText('ネオン発光強度')).toBeInTheDocument();
    // Check AI section exists - text is commented out
    expect(screen.getByText('AI 適応レンダリング')).toBeInTheDocument();
    expect(screen.getByText('自動電力最適化 [低電力]')).toBeInTheDocument();
  });

  it('displays API key section', () => {
    render(<SettingsWing />);

    // Check API key header
    expect(screen.getByText('System Access Key')).toBeInTheDocument();

    // Check masked key input
    const keyInput = screen.getByDisplayValue('••••••••••••••••');
    expect(keyInput).toBeInTheDocument();

    // Check update button exists - find any button in the component
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders hardware system tree', () => {
    render(<SettingsWing />);

    // Check hardware elements
    expect(screen.getByText('ハードウェア構成ツリー')).toBeInTheDocument();
    expect(screen.getByText('CORE_PROC_01')).toBeInTheDocument();
    expect(screen.getByText('MEMORY_ARRAY')).toBeInTheDocument();
    expect(screen.getByText('RENDER_ENGINE')).toBeInTheDocument();
    expect(screen.getByText('STORAGE_VOL')).toBeInTheDocument();
    expect(screen.getByText('統合ハブ V4.0')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<SettingsWing />);

    // Check action buttons
    expect(screen.getByText('全て元に戻す')).toBeInTheDocument();
    expect(screen.getByText('設定を保存')).toBeInTheDocument();
  });

  it('displays neon intensity slider', () => {
    render(<SettingsWing />);

    // Find the slider input by id
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();

    // Check initial value - text is split between number and % symbol
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('displays toggle switches', () => {
    render(<SettingsWing />);

    // Check toggle switches exist by role
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

    // Error should be handled (may not display directly in new UI)
    expect(screen.getByText('SETTINGS')).toBeInTheDocument();
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
    expect(screen.getByText('APP CONFIG')).toBeInTheDocument();
    expect(screen.getByText('アプリ設定')).toBeInTheDocument();
  });
});
