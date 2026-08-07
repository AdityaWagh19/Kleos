import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { StatusPillState } from '../types';

interface Props {
  canvasId: string | null;
  branchId: string;
  isCompiling: boolean;
  pillState: StatusPillState;
  onSubmit: (text: string) => void;
  onFileAttach: (file: File) => void;
  onVoiceToggle: () => void;
  voiceActive: boolean;
  onPause: () => void;
  onStop: () => void;
}

export interface BottomChatBarRef {
  focus: () => void;
  openFilePicker: () => void;
}

export const BottomChatBar = forwardRef<BottomChatBarRef, Props>(function BottomChatBar(
  { isCompiling, pillState, onSubmit, onFileAttach, onVoiceToggle, voiceActive, onPause, onStop },
  ref
) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    openFilePicker: () => fileInputRef.current?.click(),
  }));

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (text.trim() && !isCompiling) {
        onSubmit(text);
        setText('');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExts = ['.pdf', '.docx', '.txt', '.md', '.json'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert(`Unsupported file type: ${ext}. Please upload a PDF, DOCX, or text file.`);
        e.target.value = '';
        return;
      }
      onFileAttach(file);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  // Status indicator dot
  const statusColor = 
    pillState === 'working' ? '#f5c842' : 
    pillState === 'listening' ? '#e84040' : 
    '#7dcfb6';

  return (
    <div
      className="bottom-chat-bar flex flex-col transition-all mx-auto"
      style={{
        width: 'calc(100% - 48px)',
        maxWidth: '680px',
        padding: '12px 16px',
        fontFamily: 'var(--font-switzer)',
      }}
    >
      <div className="flex items-end gap-3">
        {/* Status indicator */}
        <div className="flex items-center justify-center pb-2 shrink-0">
          <div
            style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: pillState === 'working' ? '0 0 8px #f5c842' : 'none',
              animation: pillState !== 'ready' ? 'pulse 1.5s infinite' : 'none',
            }}
            title={`Status: ${pillState}`}
          />
        </div>

        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompiling}
          className="pb-1 shrink-0 text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-colors"
          title="Attach PDF or DOCX"
          aria-label="Attach file"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>attach_file</span>
        </button>
        <input
          id="chat-file-upload"
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          id="chat-textarea"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isCompiling}
          placeholder={isCompiling ? "Compiling..." : "Type your thought... (Ctrl+Enter to drop)"}
          className="flex-1 resize-none bg-transparent outline-none placeholder-gray-400 py-1"
          style={{
            minHeight: '24px',
            maxHeight: '120px',
            color: 'var(--color-charcoal-body)',
            fontSize: '14px',
          }}
        />

        {/* Mic or Submit */}
        {text.trim().length > 0 ? (
          <button
            onClick={() => {
              onSubmit(text);
              setText('');
            }}
            disabled={isCompiling}
            className={`pb-1 shrink-0 transition-colors text-gray-800 disabled:opacity-50`}
            title="Submit thought (Ctrl+Enter)"
            aria-label="Submit thought"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              send
            </span>
          </button>
        ) : (
          <button
            onClick={onVoiceToggle}
            disabled={isCompiling}
            className={`pb-1 shrink-0 transition-colors ${voiceActive ? 'text-red-500' : 'text-gray-500 hover:text-gray-800'} disabled:opacity-50`}
            title={voiceActive ? 'Stop Voice' : 'Start Voice'}
            aria-label={voiceActive ? 'Stop voice input' : 'Start voice input'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              {voiceActive ? 'mic' : 'mic_none'}
            </span>
          </button>
        )}

        {/* Submit or Stop */}
        {isCompiling ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onPause}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--color-warm-stone)', color: 'var(--color-charcoal-body)' }}
              title="Pause Compilation"
              aria-label="Pause compilation"
            >
              Pause
            </button>
            <button
              onClick={onStop}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--color-error)', color: 'white' }}
              title="Stop and Revert"
              aria-label="Stop and revert compilation"
            >
              Stop
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (text.trim()) {
                onSubmit(text);
                setText('');
              }
            }}
            disabled={!text.trim()}
            className="px-5 py-1.5 rounded-full text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              background: 'var(--color-graphite-ink)',
              color: 'white',
            }}
            title="Drop to canvas"
            aria-label="Submit thought"
          >
            Think
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
});
