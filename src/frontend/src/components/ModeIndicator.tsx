import type { WorkspaceMode } from '../types';

const MODE_COLORS: Record<WorkspaceMode, string> = {
  analytical: '#4a90d9',
  creative:   '#9c4af5',
  critical:   '#e84040',
  strategic:  '#4caf7d',
};

const MODE_ICONS: Record<WorkspaceMode, string> = {
  analytical: 'analytics',
  creative:   'lightbulb',
  critical:   'gavel',
  strategic:  'route',
};

const ORDER: WorkspaceMode[] = ['analytical', 'creative', 'critical', 'strategic'];

interface Props {
  mode: WorkspaceMode;
  onClick?: () => void;
}

export function ModeIndicator({ mode, onClick }: Props) {
  const color = MODE_COLORS[mode];
  const nextMode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      title={onClick ? `Switch to ${nextMode} mode (click to cycle)` : mode}
      className="flex items-center gap-1.5 px-2 py-1 transition-opacity hover:opacity-80 disabled:cursor-default"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '4px' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '12px', color }}>
        {MODE_ICONS[mode]}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 500, color, textTransform: 'capitalize' }}>
        {mode}
      </span>
      {onClick && (
        <span className="material-symbols-outlined" style={{ fontSize: '10px', color, opacity: 0.6 }}>
          swap_horiz
        </span>
      )}
    </button>
  );
}
