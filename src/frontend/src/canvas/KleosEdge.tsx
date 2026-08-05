import { memo } from 'react';
import { getBezierPath, type EdgeProps } from 'reactflow';
import type { KleosEdge as KleosEdgeData } from '../types';

const EDGE_COLORS: Record<string, string> = {
  supports:     '#4a90d9',
  contradicts:  '#e84040',
  depends_on:   '#f5c842',
  derived_from: '#9c9c9c',
};

const DASH_ARRAYS: Record<string, string> = {
  high:   '0',
  medium: '6,3',
  low:    '3,3',
};

export const KleosEdgeComponent = memo(function KleosEdgeComponent({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data,
}: EdgeProps<KleosEdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const color     = EDGE_COLORS[data?.type ?? 'derived_from'];
  const dasharray = DASH_ARRAYS[data?.confidence ?? 'medium'];

  return (
    <g>
      {/* Wide transparent stroke for easier hover/click */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={16} />
      {/* Visible styled stroke */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dasharray}
        opacity={0.8}
      />
    </g>
  );
});
