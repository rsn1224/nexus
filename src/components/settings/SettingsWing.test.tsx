import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppSettings } from '../../stores/useAppSettingsStore';
import SettingsWing from './SettingsWing';

// Mock dependencies
vi.mock('../../stores/useAppSettingsStore', () => ({
  useAppSettings: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('../../services/perplexityService', () => ({
  testApiKey: vi.fn().mockResolvedValue({ ok: true, data: true }),
}));

vi.mock('../../hooks/useInitialData', () => ({
  useInitialData: vi.fn(),
  useStateSync: vi.fn(),
}));

// Import mocked hooks
import { useInitialData, useStateSync } from '../../hooks/useInitialData';

describe('SettingsWing', () => {
  const mockSettings = {
    perplexityApiKey: 'sk-test-key',
    startWithWindows: false,
    minimizeToTray: true,
  };

  const mockUseAppSettings = vi.mocked(useAppSettings);
  const mockInvoke = vi.mocked(invoke);
  const mockUseInitialData = vi.mocked(useInitialData);
  const mockUseStateSync = vi.mocked(useStateSync);

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

    mockUseInitialData.mockImplementation(() => {});
    mockUseStateSync.mockImplementation(() => {});
  });

  it('renders all sections correctly', () => {
    render(<SettingsWing />);

    // Check main sections (▶ SETTINGS header moved to WingHeader)
    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('APPLICATION')).toBeInTheDocument();
    expect(screen.getByText('MAINTENANCE')).toBeInTheDocument();
    expect(screen.getByText('ABOUT')).toBeInTheDocument();
  });

  it('renders maintenance buttons', () => {
    render(<SettingsWing />);

    // Check maintenance buttons
    expect(screen.getByText('↩ REVERT ALL')).toBeInTheDocument();
    expect(screen.getByText('✕ DELETE ALL DATA')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText('nexus が変更した Windows 設定を全て元に戻します')).toBeInTheDocument();
    expect(screen.getByText('プロファイル・設定・API キーを完全に削除します')).toBeInTheDocument();
  });

  it('handles revert all button click', async () => {
    const mockRevertResult = {
      items: [
        {
          category: 'Windows設定',
          label: 'テスト項目',
          success: true,
          detail: 'リバート完了',
        },
      ],
      total: 1,
      successCount: 1,
      failCount: 0,
    };

    mockInvoke.mockResolvedValue(mockRevertResult);

    render(<SettingsWing />);

    const revertButton = screen.getByText('↩ REVERT ALL');
    fireEvent.click(revertButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('revert_all_settings');
    });

    // Check result display
    await waitFor(() => {
      expect(screen.getByText('RESULT: 1 成功 / 0 失敗')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('[Windows設定]')).toBeInTheDocument();
      expect(screen.getByText('テスト項目')).toBeInTheDocument();
      expect(screen.getByText('— リバート完了')).toBeInTheDocument();
    });
  });

  it('opens cleanup confirmation modal', () => {
    render(<SettingsWing />);

    const deleteButton = screen.getByText('✕ DELETE ALL DATA');
    fireEvent.click(deleteButton);

    // Check modal content
    expect(screen.getByText('⚠ データ削除の確認')).toBeInTheDocument();
    expect(screen.getByText('以下のデータが完全に削除されます：')).toBeInTheDocument();
    expect(screen.getByText('ゲームプロファイル (profiles.json)')).toBeInTheDocument();
    expect(screen.getByText('アプリ設定 (app_settings.json)')).toBeInTheDocument();
    expect(screen.getByText('Windows 設定バックアップ (winopt_backup.json)')).toBeInTheDocument();
    expect(screen.getByText('API キー (keyring)')).toBeInTheDocument();
    expect(screen.getByText('⚠ この操作は元に戻せません')).toBeInTheDocument();
  });

  it('handles cleanup confirmation', async () => {
    const mockRevertResult = {
      items: [{ category: 'Windows設定', label: '項目1', success: true, detail: '完了' }],
      total: 1,
      successCount: 1,
      failCount: 0,
    };

    const mockCleanupItems = [
      { category: 'データ', label: 'profiles.json', success: true, detail: '削除完了' },
    ];

    mockInvoke
      .mockResolvedValueOnce(mockRevertResult) // First call for revert_all_settings
      .mockResolvedValueOnce(mockCleanupItems); // Second call for cleanup_app_data

    render(<SettingsWing />);

    // Open modal
    const deleteButton = screen.getByText('✕ DELETE ALL DATA');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('DELETE ALL DATA');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('revert_all_settings');
      expect(mockInvoke).toHaveBeenCalledWith('cleanup_app_data');
    });

    // Check combined result
    await waitFor(() => {
      expect(screen.getByText('RESULT: 2 成功 / 0 失敗')).toBeInTheDocument();
      expect(screen.getByText('[Windows設定]')).toBeInTheDocument();
      expect(screen.getByText('[データ]')).toBeInTheDocument();
    });
  });

  it('closes modal on cancel', () => {
    render(<SettingsWing />);

    // Open modal
    const deleteButton = screen.getByText('✕ DELETE ALL DATA');
    fireEvent.click(deleteButton);

    // Cancel
    const cancelButton = screen.getByText('CANCEL');
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByText('⚠ データ削除の確認')).not.toBeInTheDocument();
  });

  it('displays error state correctly', () => {
    mockUseAppSettings.mockReturnValue({
      settings: null,
      isLoading: false,
      error: 'Connection failed',
      fetchSettings: vi.fn(),
      saveSettings: vi.fn(),
      updateSettings: vi.fn(),
    });

    render(<SettingsWing />);

    expect(screen.getByText('ERROR: Connection failed')).toBeInTheDocument();
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

    const saveButton = screen.getByText('SAVE ALL');
    expect(saveButton).toBeDisabled();
  });
});
