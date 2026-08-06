import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onSubmit: (text: string) => void;
  isCompiling: boolean;
  placeholder?: string;
}

export function TextInputBar({ onSubmit, isCompiling, placeholder }: Props) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || isCompiling) return;
    onSubmit(trimmed);
    setText('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="shrink-0 flex items-end gap-2 px-4 py-3"
      style={{ background: '#1a1a1a', borderTop: '1px solid #2b2b2b' }}
    >
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        rows={2}
        placeholder={placeholder ?? 'Type an idea, paste text, or describe what you\'re deciding… (Ctrl+Enter to submit)'}
        className="flex-1 resize-none outline-none px-3 py-2"
        style={{
          background:   '#111111',
          border:       '1px solid #565656',
          borderRadius: '8px',
          fontSize:     '13px',
          color:        '#f9f9f9',
          lineHeight:   '1.5',
          fontFamily:   'inherit',
          transition:   'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = '#9c9c9c')}
        onBlur={e  => (e.target.style.borderColor = '#565656')}
      />
      <button
        onClick={submit}
        disabled={!text.trim() || isCompiling}
        className="flex items-center gap-1.5 px-3 py-2 transition-opacity disabled:opacity-40"
        style={{
          background:   '#e5ff5d',
          color:        '#111111',
          borderRadius: '8px',
          fontSize:     '12px',
          fontWeight:   500,
          whiteSpace:   'nowrap',
          height:       '40px',
        }}
      >
        {isCompiling ? (
          <>
            <motion.span
              className="material-symbols-outlined"
              style={{ fontSize: '16px' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              autorenew
            </motion.span>
            Working...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
            Drop
          </>
        )}
      </button>
    </div>
  );
}
