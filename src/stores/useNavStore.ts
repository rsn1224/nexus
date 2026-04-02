import { create } from 'zustand';

export type NavView =
  | 'dashboard'
  | 'hardware'
  | 'optimize'
  | 'network'
  | 'windows'
  | 'memory'
  | 'timer'
  | 'settings';

interface NavStore {
  activeView: NavView;
  setView: (view: NavView) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  activeView: 'dashboard',
  setView: (view) => set({ activeView: view }),
}));
