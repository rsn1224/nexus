import { create } from 'zustand';
import type { WingId } from '../types';

interface NavStore {
  navigate: ((wing: WingId) => void) | null;
  setNavigate: (fn: (wing: WingId) => void) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  navigate: null,
  setNavigate: (fn) => set({ navigate: fn }),
}));
