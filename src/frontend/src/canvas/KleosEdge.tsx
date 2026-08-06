import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import type { KleosEdge as KleosEdgeData } from '../types';

const EDGE_COLORS: Record<string, string> = {
  supports:     '#4a90d9',
  contradicts:  '#e84040',
  depends_on:   '#f5c842',
  derived_from: 'var(--color-quartz)',
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
  selected,
}: EdgeProps<KleosEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const color = selected ? 'var(--color-graphite-ink)' : EDGE_COLORS[data?.type ?? 'derived_from'];
  const dasharray = DASH_ARRAYS[data?.confidence ?? 'medium'];

  return (
    <>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={24} className="react-flow__edge-interaction" />
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 2.5 : 1.5}
        strokeDasharray={dasharray}
        opacity={selected ? 1 : 0.7}
        className="react-flow__edge-path"
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'var(--color-frosted-white)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 500,
              color: color,
              border: `1px solid ${color}`,
              pointerEvents: 'all',
              fontFamily: 'var(--font-switzer)',
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
