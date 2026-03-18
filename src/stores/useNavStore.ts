import { create } from 'zustand';
import type { WingId } from '../types';

interface NavStore {
  navigate: (wing: WingId) => void;
  setNavigate: (fn: (wing: WingId) => void) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  navigate: () => {},
  setNavigate: (fn) => set({ navigate: fn }),
}));
