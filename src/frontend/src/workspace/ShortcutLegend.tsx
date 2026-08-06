import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutLegend({ open, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const shortcuts = [
    { key: 'B', desc: 'Create new branch' },
    { key: 'M', desc: 'Merge selected nodes into insight' },
    { key: 'T', desc: 'Trace reasoning path for node' },
    { key: 'P', desc: 'Pin/unpin selected node' },
    { key: 'Backspace', desc: 'Delete selected node/edge' },
    { key: 'Ctrl + Enter', desc: 'Drop thought to canvas' },
    { key: '?', desc: 'Show this shortcut legend' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-xl shadow-xl outline-none"
        style={{ background: 'var(--color-frosted-white)', border: '1px solid var(--color-warm-stone)', fontFamily: 'var(--font-switzer)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-warm-stone)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-charcoal-body)' }}>Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-gray-400 hover:text-gray-800 transition-colors"
          >
            close
          </button>
        </div>

        <div className="p-4 space-y-3">
          {shortcuts.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--color-charcoal-body)' }}>{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-gray-100 border text-xs font-mono font-medium text-gray-700" style={{ borderColor: 'var(--color-warm-stone)' }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
