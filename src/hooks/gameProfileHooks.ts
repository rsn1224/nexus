import { useShallow } from 'zustand/react/shallow';
import { useGameProfileStore } from '../stores/useGameProfileStore';

export const useGameProfileState = () =>
  useGameProfileStore(
    useShallow((s) => ({
      profiles: s.profiles,
      activeProfileId: s.activeProfileId,
      currentGameExe: s.currentGameExe,
      applyResult: s.applyResult,
      isLoading: s.isLoading,
      isApplying: s.isApplying,
      error: s.error,
      isMonitoring: s.isMonitoring,
      cpuTopology: s.cpuTopology,
      coreParkingState: s.coreParkingState,
    })),
  );

export const useGameProfileActions = () =>
  useGameProfileStore(
    useShallow((s) => ({
      loadProfiles: s.loadProfiles,
      saveProfile: s.saveProfile,
      deleteProfile: s.deleteProfile,
      applyProfile: s.applyProfile,
      revertProfile: s.revertProfile,
      startMonitoring: s.startMonitoring,
      stopMonitoring: s.stopMonitoring,
      setupListeners: s.setupListeners,
      getCpuTopology: s.getCpuTopology,
      fetchCoreParking: s.fetchCoreParking,
      applyCoreParking: s.applyCoreParking,
      exportProfile: s.exportProfile,
      importProfile: s.importProfile,
      clearError: s.clearError,
    })),
  );
