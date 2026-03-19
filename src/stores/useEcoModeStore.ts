import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import type { EcoModeConfig, MonthlyCostEstimate, PowerEstimate } from '../types';

interface EcoModeStoreState {
  config: EcoModeConfig | null;
  powerEstimate: PowerEstimate | null;
  costEstimate: MonthlyCostEstimate | null;
  isLoading: boolean;
  error: string | null;
}

interface EcoModeStoreActions {
  fetchConfig: () => Promise<void>;
  saveConfig: (config: EcoModeConfig) => Promise<void>;
  toggleEcoMode: (enabled: boolean) => Promise<void>;
  fetchPowerEstimate: () => Promise<void>;
  fetchCostEstimate: (hoursPerDay: number) => Promise<void>;
  updateConfig: (updates: Partial<EcoModeConfig>) => void;
}

type EcoModeStore = EcoModeStoreState & EcoModeStoreActions;

export const useEcoModeStore = create<EcoModeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        config: null,
        powerEstimate: null,
        costEstimate: null,
        isLoading: false,
        error: null,

        // Actions
        fetchConfig: async () => {
          set({ isLoading: true, error: null });
          try {
            const config = await invoke<EcoModeConfig>('get_eco_mode_config');
            set({ config, isLoading: false });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch eco mode config';
            log.error({ err }, 'ecoMode: config取得失敗: %s', msg);
            set({ error: msg, isLoading: false });
          }
        },

        saveConfig: async (config) => {
          set({ isLoading: true, error: null });
          try {
            await invoke('save_eco_mode_config', { config });
            set({ config, isLoading: false });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to save eco mode config';
            log.error({ err }, 'ecoMode: config保存失敗: %s', msg);
            set({ error: msg, isLoading: false });
          }
        },

        toggleEcoMode: async (enabled) => {
          set({ isLoading: true, error: null });
          try {
            const currentConfig = get().config;
            if (!currentConfig) {
              throw new Error('No config available');
            }

            await invoke('set_eco_mode', { enabled, config: currentConfig });

            // Update local config
            set({
              config: { ...currentConfig, enabled },
              isLoading: false,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to toggle eco mode';
            log.error({ err }, 'ecoMode: トグル失敗: %s', msg);
            set({ error: msg, isLoading: false });
          }
        },

        fetchPowerEstimate: async () => {
          set({ isLoading: true, error: null });
          try {
            const estimate = await invoke<PowerEstimate>('get_power_estimate');
            set({ powerEstimate: estimate, isLoading: false });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch power estimate';
            log.error({ err }, 'ecoMode: 電力推定取得失敗: %s', msg);
            set({ error: msg, isLoading: false });
          }
        },

        fetchCostEstimate: async (hoursPerDay) => {
          set({ isLoading: true, error: null });
          try {
            const config = get().config;
            if (!config) {
              throw new Error('No config available for cost estimation');
            }

            const estimate = await invoke<MonthlyCostEstimate>('get_monthly_cost_estimate', {
              config,
              hoursPerDay,
            });
            set({ costEstimate: estimate, isLoading: false });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch cost estimate';
            log.error({ err }, 'ecoMode: コスト推定取得失敗: %s', msg);
            set({ error: msg, isLoading: false });
          }
        },

        updateConfig: (updates) => {
          const currentConfig = get().config;
          if (currentConfig) {
            set({ config: { ...currentConfig, ...updates } });
          }
        },
      }),
      {
        name: 'eco-mode-store',
        partialize: (state) => ({
          config: state.config,
        }),
      },
    ),
    {
      name: 'eco-mode',
    },
  ),
);

// Selectors for optimized re-renders
export const useEcoModeConfig = () => useEcoModeStore((state) => state.config);
export const usePowerEstimate = () => useEcoModeStore((state) => state.powerEstimate);
export const useCostEstimate = () => useEcoModeStore((state) => state.costEstimate);
export const useEcoModeLoading = () => useEcoModeStore((state) => state.isLoading);
export const useEcoModeError = () => useEcoModeStore((state) => state.error);
export const useEcoModeActions = () =>
  useEcoModeStore(
    useShallow((state) => ({
      fetchConfig: state.fetchConfig,
      saveConfig: state.saveConfig,
      toggleEcoMode: state.toggleEcoMode,
      fetchPowerEstimate: state.fetchPowerEstimate,
      fetchCostEstimate: state.fetchCostEstimate,
      updateConfig: state.updateConfig,
    })),
  );
