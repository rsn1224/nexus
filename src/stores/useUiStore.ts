import { create } from 'zustand';

interface UiStore {
  isSettingsOpen: boolean;
  isHistoryOpen: boolean;
  isRevertDialogOpen: boolean;
  openSettings: () => void;
  openHistory: () => void;
  openRevertDialog: () => void;
  closeAll: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isSettingsOpen: false,
  isHistoryOpen: false,
  isRevertDialogOpen: false,

  openSettings: () =>
    set({ isSettingsOpen: true, isHistoryOpen: false, isRevertDialogOpen: false }),

  openHistory: () => set({ isHistoryOpen: true, isSettingsOpen: false, isRevertDialogOpen: false }),

  openRevertDialog: () => set({ isRevertDialogOpen: true }),

  closeAll: () => set({ isSettingsOpen: false, isHistoryOpen: false, isRevertDialogOpen: false }),
}));
