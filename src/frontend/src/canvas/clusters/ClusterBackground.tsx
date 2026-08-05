import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { WorkspaceMode } from '../../types';

export interface ClusterData {
  label: string;
  color: string;
  width: number;
  height: number;
  overrideMode?: WorkspaceMode;
}

const MODE_COLORS: Record<WorkspaceMode, string> = {
  analytical: '#4a90d9',
  creative:   '#9c4af5',
  critical:   '#e84040',
  strategic:  '#4caf7d',
};

export const ClusterBackground = memo(function ClusterBackground({
  data,
}: NodeProps<ClusterData>) {
  return (
    <div
      className="pointer-events-none flex items-start p-3"
      style={{
        width:        data.width,
        height:       data.height,
        background:   `${data.color}0d`,
        border:       `1px solid ${data.color}33`,
        borderRadius: '12px',
      }}
    >
      <span
        className="text-[11px] font-medium tracking-[0.03em] uppercase"
        style={{ color: `${data.color}80` }}
      >
        {data.label}
      </span>

      {/* Quick Override badge */}
      {data.overrideMode && (
        <span
          className="ml-1.5 px-1 py-0.5 text-[8px] font-medium rounded uppercase tracking-[0.04em]"
          style={{
            background: `${MODE_COLORS[data.overrideMode]}20`,
            color:       MODE_COLORS[data.overrideMode],
            border:      `1px solid ${MODE_COLORS[data.overrideMode]}40`,
          }}
        >
          {data.overrideMode}
        </span>
      )}
    </div>
  );
});
