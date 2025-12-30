import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onSpace?: () => void;
  onR?: () => void;
  onS?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSpace,
  onR,
  onS,
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

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          onSpace?.();
          break;
        case 'KeyR':
          if (!event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onR?.();
          }
          break;
        case 'KeyS':
          if (!event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onS?.();
          }
          break;
      }
    },
    [onSpace, onR, onS]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
