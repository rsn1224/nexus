import { create } from 'zustand';

export type ActiveTab = 'optimize' | 'monitor' | 'boost';
export type QuickPanel = 'game' | 'display' | 'security' | 'modules';

interface UiStore {
  // パネル開閉
  isSettingsOpen: boolean;
  isHistoryOpen: boolean;
  isRevertDialogOpen: boolean;
  openSettings: () => void;
  openHistory: () => void;
  openRevertDialog: () => void;
  closeAll: () => void;

  // タブ切り替え
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Quick Actions パネル
  activeQuickPanel: QuickPanel | null;
  setActiveQuickPanel: (panel: QuickPanel | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isSettingsOpen: false,
  isHistoryOpen: false,
  isRevertDialogOpen: false,

  openSettings: () =>
    set({ isSettingsOpen: true, isHistoryOpen: false, isRevertDialogOpen: false }),

  openHistory: () => set({ isHistoryOpen: true, isSettingsOpen: false, isRevertDialogOpen: false }),

  openRevertDialog: () => set({ isRevertDialogOpen: true }),

  closeAll: () =>
    set({
      isSettingsOpen: false,
      isHistoryOpen: false,
      isRevertDialogOpen: false,
      activeQuickPanel: null,
    }),

  activeTab: 'optimize',
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeQuickPanel: null,
  setActiveQuickPanel: (panel) => set({ activeQuickPanel: panel }),
}));
