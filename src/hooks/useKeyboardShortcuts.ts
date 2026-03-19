import { useEffect } from 'react';
import { useModalStore } from '../stores/useModalStore';
import { useNavStore } from '../stores/useNavStore';
import type { WingId } from '../types';

const WING_SHORTCUT_MAP: Record<string, WingId> = {
  '1': 'core',
  '2': 'arsenal',
  '3': 'tactics',
  '4': 'logs',
  '5': 'settings',
};

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        const { isOpen, emitClose } = useModalStore.getState();
        if (isOpen) {
          emitClose();
        } else {
          const { activeWing, wingStates, popSubpage } = useNavStore.getState();
          if (wingStates[activeWing].subpageStack.length > 0) {
            popSubpage(activeWing);
          }
        }
        return;
      }

      if (!e.ctrlKey || e.shiftKey || e.altKey) return;

      const wingId = WING_SHORTCUT_MAP[e.key];
      if (wingId) {
        e.preventDefault();
        useNavStore.getState().navigate(wingId);
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        useNavStore.getState().navigate('arsenal');
        return;
      }

      if (e.key === ',') {
        e.preventDefault();
        useNavStore.getState().navigate('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
