import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/useLogStore', () => ({
  useLogState: vi.fn(),
  useLogActions: vi.fn(),
}));

vi.mock('../../hooks/useInitialData', () => ({
  useInitialData: vi.fn(),
  useStateSync: vi.fn(),
}));

vi.mock('./LogActions', () => ({
  default: () => <div data-testid="log-actions" />,
}));

vi.mock('./LogAnalysisPanel', () => ({
  LogAnalysisPanel: () => <div data-testid="log-analysis-panel" />,
}));

vi.mock('./LogEntries', () => ({
  default: () => <div data-testid="log-entries" />,
}));

vi.mock('./LogFilters', () => ({
  default: () => <div data-testid="log-filters" />,
}));

vi.mock('./LogStats', () => ({
  default: () => <div data-testid="log-stats" />,
}));

import { useLogActions, useLogState } from '../../stores/useLogStore';
import LogWing from './LogWing';

const mockUseLogState = vi.mocked(useLogState);
const mockUseLogActions = vi.mocked(useLogActions);

const BASE_STATE = {
  logs: [],
  analysis: null,
  isLoading: false,
  error: null,
  selectedLevel: 'All' as const,
  selectedSource: '',
  searchQuery: '',
};

const BASE_ACTIONS = {
  getSystemLogs: vi.fn(),
  getApplicationLogs: vi.fn(),
  analyzeLogs: vi.fn(),
  exportLogs: vi.fn(),
  setSelectedLevel: vi.fn(),
  setSelectedSource: vi.fn(),
  setSearchQuery: vi.fn(),
  clearLogs: vi.fn(),
  clearError: vi.fn(),
  reset: vi.fn(),
};

describe('LogWing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLogState.mockReturnValue({ ...BASE_STATE });
    mockUseLogActions.mockReturnValue({ ...BASE_ACTIONS });
  });

  it('renders header', () => {
    render(<LogWing />);
    expect(screen.getByText('LOG MANAGEMENT')).toBeTruthy();
  });

  it('renders log filters', () => {
    render(<LogWing />);
    expect(screen.getByTestId('log-filters')).toBeTruthy();
  });

  it('renders log actions', () => {
    render(<LogWing />);
    expect(screen.getByTestId('log-actions')).toBeTruthy();
  });

  it('shows empty state when no logs', () => {
    render(<LogWing />);
    expect(screen.getByText('No logs available')).toBeTruthy();
  });

  it('shows error banner when error is set', () => {
    mockUseLogState.mockReturnValue({ ...BASE_STATE, error: 'fetch failed' });
    render(<LogWing />);
    expect(screen.getByText(/fetch failed/i)).toBeTruthy();
  });

  it('shows log stats when logs are present', () => {
    mockUseLogState.mockReturnValue({
      ...BASE_STATE,
      logs: [
        {
          timestamp: '2024-01-01T00:00:00',
          level: 'Info' as const,
          source: 'System',
          message: 'Test log',
        },
      ],
    });
    render(<LogWing />);
    expect(screen.getByTestId('log-stats')).toBeTruthy();
    expect(screen.getByTestId('log-entries')).toBeTruthy();
  });

  it('shows analysis panel when analysis is present', () => {
    mockUseLogState.mockReturnValue({
      ...BASE_STATE,
      analysis: {
        totalEntries: 1,
        errorCount: 0,
        warningCount: 0,
        infoCount: 1,
        debugCount: 0,
        topSources: [],
        timeRange: '1h',
      },
    });
    render(<LogWing />);
    expect(screen.getByTestId('log-analysis-panel')).toBeTruthy();
  });
});
