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
    useNavStore.setState({ navigate: navigateMock });
    useModalStore.setState({ closeSignal: 0 });
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

  it('Escape → closeSignal がインクリメントされる', () => {
    renderHook(() => useKeyboardShortcuts());
    const before = useModalStore.getState().closeSignal;
    fireKey('Escape');
    expect(useModalStore.getState().closeSignal).toBe(before + 1);
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
