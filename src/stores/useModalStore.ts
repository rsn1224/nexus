import { create } from 'zustand';

interface ModalStore {
  closeSignal: number;
  emitClose: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  closeSignal: 0,
  emitClose: () => set((s) => ({ closeSignal: s.closeSignal + 1 })),
}));
