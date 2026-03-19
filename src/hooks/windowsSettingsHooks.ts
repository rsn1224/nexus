import { useWindowsSettingsStore } from '../stores/useWindowsSettingsStore';

export const useWindowsSettings = () => {
  const {
    settings,
    advisorResult,
    isLoading,
    advisorLoading,
    error,
    advisorError,
    fetchSettings,
    setPowerPlan,
    toggleGameMode,
    toggleFullscreenOptimization,
    toggleHardwareGpuScheduling,
    setVisualEffects,
    fetchAdvisorResult,
    applyRecommendation,
    applyAllSafeRecommendations,
  } = useWindowsSettingsStore();

  return {
    settings,
    advisorResult,
    isLoading,
    advisorLoading,
    error,
    advisorError,
    fetchSettings,
    setPowerPlan,
    toggleGameMode,
    toggleFullscreenOptimization,
    toggleHardwareGpuScheduling,
    setVisualEffects,
    fetchAdvisorResult,
    applyRecommendation,
    applyAllSafeRecommendations,
  };
};
