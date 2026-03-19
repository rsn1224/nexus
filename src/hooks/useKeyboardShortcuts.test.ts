import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useModalStore } from '../stores/useModalStore';
import { useNavStore } from '../stores/useNavStore';
import type { WingId } from '../types';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function fireKey(key: string, ctrlKey = false, target?: HTMLElement): void {
  const el = target ?? window;
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true }));
  });
}

describe('useKeyboardShortcuts', () => {
  let navigateMock: (wing: WingId) => void;

  beforeEach(() => {
    navigateMock = vi.fn() as unknown as (wing: WingId) => void;
    useNavStore.setState({
      navigate: navigateMock,
      activeWing: 'home',
      wingStates: useNavStore.getInitialState().wingStates,
    });
    useModalStore.setState({ closeSignal: 0, isOpen: false, openCount: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Ctrl+1 → navigate("home")', () => {
    renderHook(() => useKeyboardShortcuts());
    fireKey('1', true);
    expect(navigateMock).toHaveBeenCalledWith('home');
  });

  it('Ctrl+2 → navigate("performance")', () => {
    renderHook(() => useKeyboardShortcuts());
    fireKey('2', true);
    expect(navigateMock).toHaveBeenCalledWith('performance');
  });

  it('Ctrl+7 → navigate("settings")', () => {
    renderHook(() => useKeyboardShortcuts());
    fireKey('7', true);
    expect(navigateMock).toHaveBeenCalledWith('settings');
  });

  it('Ctrl+B → navigate("performance")', () => {
    renderHook(() => useKeyboardShortcuts());
    fireKey('b', true);
    expect(navigateMock).toHaveBeenCalledWith('performance');
  });

  it('Ctrl+, → navigate("settings")', () => {
    renderHook(() => useKeyboardShortcuts());
    fireKey(',', true);
    expect(navigateMock).toHaveBeenCalledWith('settings');
  });

  it('Escape: モーダルが開いているとき → closeSignal がインクリメントされる', () => {
    useModalStore.setState({ isOpen: true, openCount: 1 });
    renderHook(() => useKeyboardShortcuts());
    const before = useModalStore.getState().closeSignal;
    fireKey('Escape');
    expect(useModalStore.getState().closeSignal).toBe(before + 1);
  });

  it('Escape: モーダルなし + サブページあり → popSubpage(activeWing) を呼ぶ', () => {
    const entry = { id: 'profile-edit', params: {}, title: 'Edit' };
    useNavStore.setState((s) => ({
      activeWing: 'performance',
      wingStates: {
        ...s.wingStates,
        performance: { activeTab: 'profiles', subpageStack: [entry] },
      },
    }));
    renderHook(() => useKeyboardShortcuts());
    fireKey('Escape');
    expect(useNavStore.getState().wingStates.performance.subpageStack).toHaveLength(0);
  });

  it('Escape: モーダルなし + サブページなし → closeSignal は変化しない', () => {
    renderHook(() => useKeyboardShortcuts());
    const before = useModalStore.getState().closeSignal;
    fireKey('Escape');
    expect(useModalStore.getState().closeSignal).toBe(before);
  });

  it('input フォーカス中は navigate を呼ばない', () => {
    renderHook(() => useKeyboardShortcuts());
    const input = document.createElement('input');
    document.body.appendChild(input);
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true, bubbles: true }));
    });
    expect(navigateMock).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('修飾キーなしでは navigate を呼ばない', () => {
    renderHook(() => useKeyboardShortcuts());
    fireKey('1', false);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
