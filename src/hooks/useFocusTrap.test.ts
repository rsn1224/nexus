import { renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

function createContainer(...tags: string[]): HTMLDivElement {
  const div = document.createElement('div');
  for (const tag of tags) {
    const el = document.createElement(tag);
    div.appendChild(el);
  }
  document.body.appendChild(div);
  return div;
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('非アクティブ時は何もしない', () => {
    const container = createContainer('button', 'input');
    const ref = { current: container } as RefObject<HTMLDivElement>;

    renderHook(() => useFocusTrap(ref, false));

    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(document.activeElement).not.toBe(btn);
  });

  it('アクティブ時に最初のフォーカス可能要素にフォーカスする', () => {
    const container = createContainer('button', 'input');
    const ref = { current: container } as RefObject<HTMLDivElement>;
    const firstBtn = container.querySelector('button') as HTMLButtonElement;
    vi.spyOn(firstBtn, 'focus');

    renderHook(() => useFocusTrap(ref, true));

    expect(firstBtn.focus).toHaveBeenCalled();
  });

  it('Tab キーで最後の要素から最初の要素にフォーカスが循環する', () => {
    const container = createContainer('button', 'input');
    const ref = { current: container } as RefObject<HTMLDivElement>;
    const firstBtn = container.querySelector('button') as HTMLButtonElement;
    const lastInput = container.querySelector('input') as HTMLInputElement;

    renderHook(() => useFocusTrap(ref, true));

    // 最後の要素にフォーカスを移動
    lastInput.focus();
    expect(document.activeElement).toBe(lastInput);

    vi.spyOn(firstBtn, 'focus');
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(firstBtn.focus).toHaveBeenCalled();
  });

  it('Shift+Tab で最初の要素から最後の要素にフォーカスが循環する', () => {
    const container = createContainer('button', 'input');
    const ref = { current: container } as RefObject<HTMLDivElement>;
    const firstBtn = container.querySelector('button') as HTMLButtonElement;
    const lastInput = container.querySelector('input') as HTMLInputElement;

    renderHook(() => useFocusTrap(ref, true));

    // 最初の要素にフォーカス（mount時に自動フォーカスされる）
    firstBtn.focus();
    expect(document.activeElement).toBe(firstBtn);

    vi.spyOn(lastInput, 'focus');
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(lastInput.focus).toHaveBeenCalled();
  });

  it('ref.current が null の場合は何もしない', () => {
    const ref = { current: null } as unknown as RefObject<HTMLDivElement>;

    expect(() => {
      renderHook(() => useFocusTrap(ref, true));
    }).not.toThrow();
  });
});
