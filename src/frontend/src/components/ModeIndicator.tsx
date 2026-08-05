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

interface Props {
  mode: WorkspaceMode;
}

export function ModeIndicator({ mode }: Props) {
  const color = MODE_COLORS[mode];
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '4px' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '12px', color }}>
        {MODE_ICONS[mode]}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 500, color, textTransform: 'capitalize' }}>
        {mode}
      </span>
    </div>
  );
}
