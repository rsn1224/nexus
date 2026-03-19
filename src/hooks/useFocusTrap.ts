import { type RefObject, useEffect } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Modal 等のコンテナ内で Tab フォーカスを循環させるフック。
 * isActive が true のとき、最初のフォーカス可能要素にフォーカスし、
 * Tab / Shift+Tab でコンテナ内を循環する。
 */
export function useFocusTrap(ref: RefObject<HTMLDivElement | null>, isActive: boolean): void {
  useEffect(() => {
    if (!isActive) return;
    const container = ref.current;
    if (!container) return;

    const focusables = (): HTMLElement[] => [
      ...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
    ];

    focusables()[0]?.focus();

    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isActive, ref]);
}
