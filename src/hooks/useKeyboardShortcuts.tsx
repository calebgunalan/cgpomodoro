import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onSpace?: () => void;
  onR?: () => void;
  onS?: () => void;
  on1?: () => void;
  on2?: () => void;
  on3?: () => void;
  on4?: () => void;
  on5?: () => void;
  on6?: () => void;
  on7?: () => void;
  onBracketLeft?: () => void;
  onBracketRight?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSpace,
  onR,
  onS,
  on1,
  on2,
  on3,
  on4,
  on5,
  on6,
  on7,
  onBracketLeft,
  onBracketRight,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger with modifier keys for number shortcuts
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          onSpace?.();
          break;
        case 'KeyR':
          event.preventDefault();
          onR?.();
          break;
        case 'KeyS':
          event.preventDefault();
          onS?.();
          break;
        case 'Digit1':
        case 'Numpad1':
          on1?.();
          break;
        case 'Digit2':
        case 'Numpad2':
          on2?.();
          break;
        case 'Digit3':
        case 'Numpad3':
          on3?.();
          break;
        case 'Digit4':
        case 'Numpad4':
          on4?.();
          break;
        case 'Digit5':
        case 'Numpad5':
          on5?.();
          break;
        case 'Digit6':
        case 'Numpad6':
          on6?.();
          break;
        case 'Digit7':
        case 'Numpad7':
          on7?.();
          break;
        case 'BracketLeft':
          onBracketLeft?.();
          break;
        case 'BracketRight':
          onBracketRight?.();
          break;
      }
    },
    [onSpace, onR, onS, on1, on2, on3, on4, on5, on6, on7, onBracketLeft, onBracketRight]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
