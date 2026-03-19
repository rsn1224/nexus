import { useShallow } from 'zustand/react/shallow';
import { useNetworkTuningStore } from '../stores/useNetworkTuningStore';

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
