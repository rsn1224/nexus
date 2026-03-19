import { create } from 'zustand';

interface ModalStore {
  /** 現在開いているモーダルの数。0 = モーダルなし。 */
  openCount: number;
  /** モーダルが 1 つ以上開いているか */
  isOpen: boolean;
  /** モーダルを開く際に呼ぶ（カウンターを +1） */
  openModal: () => void;
  /** モーダルを閉じる際に呼ぶ（カウンターを -1、最小 0） */
  closeModal: () => void;
  /**
   * 閉じるシグナル（後方互換）。
   * Escape キーハンドラーから呼ばれる。モーダル側は closeSignal の変化を listen して閉じる。
   */
  closeSignal: number;
  emitClose: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  openCount: 0,
  isOpen: false,
  openModal: () =>
    set((s) => {
      const next = s.openCount + 1;
      return { openCount: next, isOpen: next > 0 };
    }),
  closeModal: () =>
    set((s) => {
      const next = Math.max(0, s.openCount - 1);
      return { openCount: next, isOpen: next > 0 };
    }),
  closeSignal: 0,
  emitClose: () => set((s) => ({ closeSignal: s.closeSignal + 1 })),
}));
