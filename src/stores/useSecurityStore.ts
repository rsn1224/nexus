import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { SecretReport, VulnerabilityReport } from '../types';

interface SecurityStore {
  vulnerabilityReport: VulnerabilityReport | null;
  secretReport: SecretReport | null;
  isVulnLoading: boolean;
  isSecretLoading: boolean;
  error: string | null;
  runVulnerabilityScan: () => Promise<void>;
  runSecretScan: () => Promise<void>;
}

export const useSecurityStore = create<SecurityStore>((set, get) => ({
  vulnerabilityReport: null,
  secretReport: null,
  isVulnLoading: false,
  isSecretLoading: false,
  error: null,

  runVulnerabilityScan: async () => {
    const state = get();
    if (state.isVulnLoading) return;

    log.info('Starting vulnerability scan...');
    set({ isVulnLoading: true, error: null });

    try {
      const report = await invoke<VulnerabilityReport>('run_vulnerability_scan');
      log.info('Vulnerability scan completed');
      set({
        vulnerabilityReport: report,
        isVulnLoading: false,
      });
    } catch (err) {
      log.error({ err }, 'security: vulnerability scan failed');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      set({
        error: `Vulnerability scan failed: ${errorMessage}`,
        isVulnLoading: false,
      });
    }
  },

  runSecretScan: async () => {
    const state = get();
    if (state.isSecretLoading) return;

    log.info('Starting secret scan...');
    set({ isSecretLoading: true, error: null });

    try {
      const report = await invoke<SecretReport>('run_secret_scan');
      log.info('Secret scan completed');
      set({
        secretReport: report,
        isSecretLoading: false,
      });
    } catch (err) {
      log.error({ err }, 'security: secret scan failed');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      set({
        error: `Secret scan failed: ${errorMessage}`,
        isSecretLoading: false,
      });
    }
  },
}));
