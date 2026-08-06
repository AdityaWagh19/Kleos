import { useState } from 'react';
import type { WorkspaceMode } from '../types';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Props {
  canvasId: string | null;
  title: string | null;
  mode: WorkspaceMode;
  incognito: boolean;
  onTitleChange: (title: string) => void;
  onModeChange: (mode: WorkspaceMode) => void;
  onIncognitoToggle: () => void;
  onExport: () => void;
  onHamburger: () => void;
}

export function WorkspaceChrome({
  canvasId,
  title,
  mode,
  incognito,
  onTitleChange,
  onModeChange,
  onIncognitoToggle,
  onExport,
  onHamburger,
}: Props) {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title ?? 'Untitled Canvas');

  const handleBackToDashboard = async () => {
    if (!incognito && canvasId) {
      // Trigger session audit silently (fire-and-forget)
      api.get(`/api/canvas/${canvasId}/session-audit`).catch(() => {});
    }
    navigate('/dashboard');
  };

  const saveTitle = async () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() !== (title ?? '')) {
      onTitleChange(tempTitle.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTempTitle(title ?? 'Untitled Canvas');
    }
  };

  return (
    <div
      className="flex items-center gap-4 px-4 shrink-0 workspace-chrome w-full h-[48px]"
      style={{
        background: 'var(--color-frosted-white)',
        borderBottom: '1px solid var(--color-warm-stone)',
        fontFamily: 'var(--font-switzer)',
      }}
    >
      <button
        onClick={handleBackToDashboard}
        className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-gray-800"
        style={{ color: 'var(--color-charcoal-body)' }}
        aria-label="Back to Dashboard"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          arrow_back
        </span>
        Dashboard
      </button>

      <div className="w-px h-4" style={{ background: 'var(--color-warm-stone)' }} />

      {/* Title */}
      <div className="flex-1 flex items-center">
        {isEditingTitle ? (
          <input
            autoFocus
            className="bg-transparent border-none outline-none text-sm font-medium w-64"
            style={{ color: 'var(--color-charcoal-body)' }}
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={handleTitleKeyDown}
          />
        ) : (
          <button
            onClick={() => {
              setTempTitle(title ?? 'Untitled Canvas');
              setIsEditingTitle(true);
            }}
            className="text-sm font-medium text-left truncate transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-charcoal-body)', maxWidth: '300px' }}
            title="Click to edit title"
          >
            {title || 'Untitled Canvas'}
          </button>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Mode Dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
            style={{
              background: 'var(--color-frosted-white)',
              color: 'var(--color-charcoal-body)',
              borderColor: 'var(--color-warm-stone)',
            }}
            aria-label="Workspace Mode"
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background:
                  mode === 'analytical' ? '#4a90d9' :
                  mode === 'creative' ? '#7dcfb6' :
                  mode === 'critical' ? '#e84040' : '#f5c842',
              }}
            />
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              expand_more
            </span>
          </button>

          {/* Simple CSS-hover dropdown */}
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-32 rounded-lg border shadow-lg z-50 overflow-hidden"
               style={{ background: 'var(--color-frosted-white)', borderColor: 'var(--color-warm-stone)' }}>
            {(['analytical', 'creative', 'critical', 'strategic'] as WorkspaceMode[]).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors flex items-center gap-2"
                style={{ color: 'var(--color-charcoal-body)' }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background:
                      m === 'analytical' ? '#4a90d9' :
                      m === 'creative' ? '#7dcfb6' :
                      m === 'critical' ? '#e84040' : '#f5c842',
                  }}
                />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {incognito && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-sm border"
            style={{
              color: 'var(--color-charcoal-body)',
              background: 'var(--color-warm-stone)',
              borderColor: 'var(--color-quartz)',
            }}
          >
            Incognito
          </span>
        )}

        <button
          onClick={onIncognitoToggle}
          className="material-symbols-outlined transition-colors p-1 rounded hover:bg-gray-100"
          style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}
          title={incognito ? 'Incognito ON — no memory writes' : 'Enable Incognito'}
          aria-label={incognito ? 'Disable Incognito' : 'Enable Incognito'}
        >
          {incognito ? 'visibility_off' : 'visibility'}
        </button>

        <button
          onClick={onExport}
          className="material-symbols-outlined transition-colors p-1 rounded hover:bg-gray-100"
          style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}
          title="Export"
          aria-label="Export canvas"
        >
          download
        </button>

        <div className="w-px h-4 mx-1" style={{ background: 'var(--color-warm-stone)' }} />

        <button
          onClick={onHamburger}
          className="material-symbols-outlined transition-colors p-1 rounded hover:bg-gray-100"
          style={{ fontSize: '20px', color: 'var(--color-charcoal-body)' }}
          title="Menu"
          aria-label="Open menu"
        >
          menu
        </button>
      </div>
    </div>
  );
}
