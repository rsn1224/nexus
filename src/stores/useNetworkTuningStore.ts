import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { NetworkQualitySnapshot, TcpAutoTuningLevel, TcpTuningState } from '../types';

// ─── ストア型定義 ─────────────────────────────────────────────────────────────

interface NetworkTuningStoreState {
  tcpState: TcpTuningState | null;
  qualitySnapshot: NetworkQualitySnapshot | null;
  isLoading: boolean;
  isApplying: boolean;
  isMeasuring: boolean;
  error: string | null;
}

interface NetworkTuningStoreActions {
  fetchTcpState: () => Promise<void>;
  setNagleDisabled: (disabled: boolean) => Promise<void>;
  setDelayedAckDisabled: (disabled: boolean) => Promise<void>;
  setNetworkThrottling: (index: number) => Promise<void>;
  setQosReservedBandwidth: (percent: number) => Promise<void>;
  setTcpAutoTuning: (level: TcpAutoTuningLevel) => Promise<void>;
  applyGamingPreset: () => Promise<void>;
  resetDefaults: () => Promise<void>;
  measureNetworkQuality: (target: string, count: number) => Promise<void>;
  clearError: () => void;
}

// ─── ストア ───────────────────────────────────────────────────────────────────

export const useNetworkTuningStore = create<NetworkTuningStoreState & NetworkTuningStoreActions>(
  (set) => ({
    // 状態
    tcpState: null,
    qualitySnapshot: null,
    isLoading: false,
    isApplying: false,
    isMeasuring: false,
    error: null,

    fetchTcpState: async () => {
      set({ isLoading: true, error: null });
      try {
        const state = await invoke<TcpTuningState>('get_tcp_tuning_state');
        set({ tcpState: state, isLoading: false });
        log.info({ state }, 'networkTuning: TCP状態取得完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: TCP状態取得失敗: %s', msg);
        set({ isLoading: false, error: msg });
      }
    },

    setNagleDisabled: async (disabled: boolean) => {
      set({ isApplying: true, error: null });
      try {
        await invoke('set_nagle_disabled', { disabled });
        set((s) => ({
          isApplying: false,
          tcpState: s.tcpState ? { ...s.tcpState, nagleDisabled: disabled } : null,
        }));
        log.info({ disabled }, 'networkTuning: Nagle設定完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: Nagle設定失敗: %s', msg);
        set({ isApplying: false, error: msg });
      }
    },

    setDelayedAckDisabled: async (disabled: boolean) => {
      set({ isApplying: true, error: null });
      try {
        await invoke('set_delayed_ack_disabled', { disabled });
        set((s) => ({
          isApplying: false,
          tcpState: s.tcpState ? { ...s.tcpState, delayedAckDisabled: disabled } : null,
        }));
        log.info({ disabled }, 'networkTuning: DelayedACK設定完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: DelayedACK設定失敗: %s', msg);
        set({ isApplying: false, error: msg });
      }
    },

    setNetworkThrottling: async (index: number) => {
      set({ isApplying: true, error: null });
      try {
        await invoke('set_network_throttling', { index });
        set((s) => ({
          isApplying: false,
          tcpState: s.tcpState ? { ...s.tcpState, networkThrottlingIndex: index } : null,
        }));
        log.info({ index }, 'networkTuning: NetworkThrottling設定完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: NetworkThrottling設定失敗: %s', msg);
        set({ isApplying: false, error: msg });
      }
    },

    setQosReservedBandwidth: async (percent: number) => {
      set({ isApplying: true, error: null });
      try {
        await invoke('set_qos_reserved_bandwidth', { percent });
        set((s) => ({
          isApplying: false,
          tcpState: s.tcpState ? { ...s.tcpState, qosReservedBandwidthPct: percent } : null,
        }));
        log.info({ percent }, 'networkTuning: QoS帯域幅設定完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: QoS帯域幅設定失敗: %s', msg);
        set({ isApplying: false, error: msg });
      }
    },

    setTcpAutoTuning: async (level: TcpAutoTuningLevel) => {
      set({ isApplying: true, error: null });
      try {
        await invoke('set_tcp_auto_tuning', { level });
        set((s) => ({
          isApplying: false,
          tcpState: s.tcpState ? { ...s.tcpState, tcpAutoTuning: level } : null,
        }));
        log.info({ level }, 'networkTuning: AutoTuning設定完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: AutoTuning設定失敗: %s', msg);
        set({ isApplying: false, error: msg });
      }
    },

    applyGamingPreset: async () => {
      set({ isApplying: true, error: null });
      try {
        const state = await invoke<TcpTuningState>('apply_gaming_network_preset');
        set({ tcpState: state, isApplying: false });
        log.info('networkTuning: ゲーミングプリセット適用完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: ゲーミングプリセット適用失敗: %s', msg);
        set({ isApplying: false, error: msg });
      }
    },

    resetDefaults: async () => {
      set({ isApplying: true, error: null });
      try {
        const state = await invoke<TcpTuningState>('reset_network_defaults');
        set({ tcpState: state, isApplying: false });
        log.info('networkTuning: デフォルトリセット完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: デフォルトリセット失敗: %s', msg);
        set({ isApplying: false, error: msg });
      }
    },

    measureNetworkQuality: async (target: string, count: number) => {
      set({ isMeasuring: true, error: null });
      try {
        const snapshot = await invoke<NetworkQualitySnapshot>('measure_network_quality', {
          target,
          count,
        });
        set({ qualitySnapshot: snapshot, isMeasuring: false });
        log.info({ snapshot }, 'networkTuning: ネットワーク品質測定完了');
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'networkTuning: ネットワーク品質測定失敗: %s', msg);
        set({ isMeasuring: false, error: msg });
      }
    },

    clearError: () => set({ error: null }),
  }),
);

// ─── useShallow セレクタ ──────────────────────────────────────────────────────

export const useNetworkTuningState = () =>
  useNetworkTuningStore(
    useShallow((s) => ({
      tcpState: s.tcpState,
      qualitySnapshot: s.qualitySnapshot,
      isLoading: s.isLoading,
      isApplying: s.isApplying,
      isMeasuring: s.isMeasuring,
      error: s.error,
    })),
  );

export const useNetworkTuningActions = () =>
  useNetworkTuningStore(
    useShallow((s) => ({
      fetchTcpState: s.fetchTcpState,
      setNagleDisabled: s.setNagleDisabled,
      setDelayedAckDisabled: s.setDelayedAckDisabled,
      setNetworkThrottling: s.setNetworkThrottling,
      setQosReservedBandwidth: s.setQosReservedBandwidth,
      setTcpAutoTuning: s.setTcpAutoTuning,
      applyGamingPreset: s.applyGamingPreset,
      resetDefaults: s.resetDefaults,
      measureNetworkQuality: s.measureNetworkQuality,
      clearError: s.clearError,
    })),
  );
