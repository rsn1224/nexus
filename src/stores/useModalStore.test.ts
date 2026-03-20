import { beforeEach, describe, expect, it } from 'vitest';
import { useModalStore } from './useModalStore';

function resetStore(): void {
  useModalStore.setState({
    openCount: 0,
    isOpen: false,
    closeSignal: 0,
  });
}

describe('useModalStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('初期状態: モーダル閉じている', () => {
    const state = useModalStore.getState();
    expect(state.openCount).toBe(0);
    expect(state.isOpen).toBe(false);
    expect(state.closeSignal).toBe(0);
  });

  it('openModal でカウンター増加 + isOpen=true', () => {
    useModalStore.getState().openModal();
    const state = useModalStore.getState();
    expect(state.openCount).toBe(1);
    expect(state.isOpen).toBe(true);
  });

  it('複数回 openModal でカウンター累積', () => {
    useModalStore.getState().openModal();
    useModalStore.getState().openModal();
    const state = useModalStore.getState();
    expect(state.openCount).toBe(2);
    expect(state.isOpen).toBe(true);
  });

  it('closeModal でカウンター減少', () => {
    useModalStore.getState().openModal();
    useModalStore.getState().openModal();
    useModalStore.getState().closeModal();
    const state = useModalStore.getState();
    expect(state.openCount).toBe(1);
    expect(state.isOpen).toBe(true);
  });

  it('全モーダル閉じると isOpen=false', () => {
    useModalStore.getState().openModal();
    useModalStore.getState().closeModal();
    const state = useModalStore.getState();
    expect(state.openCount).toBe(0);
    expect(state.isOpen).toBe(false);
  });

  it('closeModal は0未満にならない', () => {
    useModalStore.getState().closeModal();
    useModalStore.getState().closeModal();
    const state = useModalStore.getState();
    expect(state.openCount).toBe(0);
    expect(state.isOpen).toBe(false);
  });

  it('emitClose で closeSignal 増加', () => {
    useModalStore.getState().emitClose();
    expect(useModalStore.getState().closeSignal).toBe(1);
    useModalStore.getState().emitClose();
    expect(useModalStore.getState().closeSignal).toBe(2);
  });
});
