import { useEffect } from 'react';

interface Shortcuts {
  onBranch: () => void;
  onMerge: () => void;
  onCompare: () => void;
  onTrace: () => void;
  onPin: () => void;
  onDismiss: () => void;
}

export function useKeyboardShortcuts({
  onBranch, onMerge, onCompare, onTrace, onPin, onDismiss,
}: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Do not fire when user is typing in an input or textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key.toUpperCase()) {
        case 'B':      onBranch();  break;
        case 'M':      onMerge();   break;
        case 'C':      onCompare(); break;
        case 'T':      onTrace();   break;
        case 'P':      onPin();     break;
        case 'ESCAPE': onDismiss(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBranch, onMerge, onCompare, onTrace, onPin, onDismiss]);
}
