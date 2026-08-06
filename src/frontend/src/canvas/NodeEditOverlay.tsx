import { useState, useRef, useEffect } from 'react';

interface Props {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function NodeEditOverlay({ initialText, onSave, onCancel }: Props) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(text.length, text.length);
    }
  }, [text.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.stopPropagation();
      if (text.trim()) onSave(text.trim());
    }
  };

  return (
    <div className="flex flex-col w-full h-full font-switzer">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full resize-none p-2 rounded outline-none text-[13px] leading-[1.5]"
        style={{
          minHeight: '80px',
          background: '#ffffff',
          color: 'var(--color-charcoal-body)',
          border: '1px solid var(--color-graphite-ink)',
        }}
      />
      <div className="flex items-center gap-2 mt-2 justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          className="text-[11px] font-medium hover:text-gray-800 transition-colors"
          style={{ color: 'var(--color-slate-caption)' }}
        >
          Cancel (Esc)
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (text.trim()) onSave(text.trim());
          }}
          disabled={!text.trim()}
          className="px-3 py-1 rounded text-[11px] font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--color-graphite-ink)' }}
        >
          Save (Ctrl+Enter)
        </button>
      </div>
    </div>
  );
}
