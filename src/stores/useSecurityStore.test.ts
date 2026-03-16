import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useSecurityStore } from './useSecurityStore';

function resetStore(): void {
  useSecurityStore.setState({
    vulnerabilityReport: null,
    secretReport: null,
    isVulnLoading: false,
    isSecretLoading: false,
    error: null,
  });
}

const MOCK_VULN_REPORT = {
  npm: [],
  cargo: [],
  summary: { critical: 0, high: 0, moderate: 0, low: 0, total: 0 },
  scannedAt: '2023-01-01T00:00:00Z',
};

const MOCK_SECRET_REPORT = {
  secrets: [
    { file: 'test.ts', line: 10, patternName: 'Generic API Key', preview: 'api_key = sk-...' },
  ],
  summary: { total: 1, filesAffected: 1 },
  scannedAt: '2023-01-01T00:00:00Z',
};

describe('useSecurityStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { vulnerabilityReport, secretReport, isVulnLoading, isSecretLoading, error } =
      useSecurityStore.getState();
    expect(vulnerabilityReport).toBeNull();
    expect(secretReport).toBeNull();
    expect(isVulnLoading).toBe(false);
    expect(isSecretLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('runVulnerabilityScan populates report on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_VULN_REPORT);
    await useSecurityStore.getState().runVulnerabilityScan();

    const { vulnerabilityReport, isVulnLoading, error } = useSecurityStore.getState();
    expect(vulnerabilityReport).toEqual(MOCK_VULN_REPORT);
    expect(isVulnLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('runVulnerabilityScan calls run_vulnerability_scan command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_VULN_REPORT);
    await useSecurityStore.getState().runVulnerabilityScan();

    expect(invoke).toHaveBeenCalledWith('run_vulnerability_scan');
  });

  it('runVulnerabilityScan sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Scan failed'));
    await useSecurityStore.getState().runVulnerabilityScan();

    const { error, isVulnLoading, vulnerabilityReport } = useSecurityStore.getState();
    expect(error).toBe('Vulnerability scan failed: Scan failed');
    expect(isVulnLoading).toBe(false);
    expect(vulnerabilityReport).toBeNull();
  });

  it('runVulnerabilityScan prevents concurrent scans', async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_VULN_REPORT);
    useSecurityStore.setState({ isVulnLoading: true });

    await useSecurityStore.getState().runVulnerabilityScan();

    expect(invoke).not.toHaveBeenCalled();
  });

  it('runSecretScan populates report on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SECRET_REPORT);
    await useSecurityStore.getState().runSecretScan();

    const { secretReport, isSecretLoading, error } = useSecurityStore.getState();
    expect(secretReport).toEqual(MOCK_SECRET_REPORT);
    expect(isSecretLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('runSecretScan calls run_secret_scan command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SECRET_REPORT);
    await useSecurityStore.getState().runSecretScan();

    expect(invoke).toHaveBeenCalledWith('run_secret_scan');
  });

  it('runSecretScan sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Secret scan failed'));
    await useSecurityStore.getState().runSecretScan();

    const { error, isSecretLoading, secretReport } = useSecurityStore.getState();
    expect(error).toBe('Secret scan failed: Secret scan failed');
    expect(isSecretLoading).toBe(false);
    expect(secretReport).toBeNull();
  });

  it('runSecretScan prevents concurrent scans', async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_SECRET_REPORT);
    useSecurityStore.setState({ isSecretLoading: true });

    await useSecurityStore.getState().runSecretScan();

    expect(invoke).not.toHaveBeenCalled();
  });

  it('runVulnerabilityScan clears previous error on new call', async () => {
    useSecurityStore.setState({ error: 'old error' });
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_VULN_REPORT);
    await useSecurityStore.getState().runVulnerabilityScan();

    expect(useSecurityStore.getState().error).toBeNull();
  });
});
