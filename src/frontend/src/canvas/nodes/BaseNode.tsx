import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { NODE_REGISTRY, BADGE_COLORS } from '../nodeRegistry';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import { ScopeChip } from '../../components/ScopeChip';
import type { KleosNode } from '../../types';

interface Props extends NodeProps {
  data: KleosNode;
}

export const BaseNode = memo(function BaseNode({ data, selected }: Props) {
  const config = NODE_REGISTRY[data.type] ?? NODE_REGISTRY.idea;

  const isInsight  = data.type === 'insight';
  const borderPx   = isInsight ? '2px' : '1px';
  
  // Selected state uses graphite-ink for strong contrast in light mode
  const activeBorder = selected ? 'var(--color-graphite-ink)' : config.borderColor;

  // All nodes get a left accent stripe in their type color or provenance color
  const borderLeft = data.type === 'evidence'
    ? `4px solid ${BADGE_COLORS[data.provenance_type] ?? '#4a90d9'}`
    : `4px solid ${config.borderColor === 'var(--color-warm-stone)' ? 'var(--color-charcoal-body)' : config.borderColor}`;

  // Impact Halo: amber glow when this node is in an assumption's impact_nodes
  const impactGlow = data.isImpacted
    ? { boxShadow: '0 0 0 2px #f5c842, 0 0 12px 4px #f5c84240' }
    : selected 
      ? { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } 
      : { boxShadow: '0 2px 6px rgba(0,0,0,0.05)' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{
        opacity: 1,
        scale:   1,
        ...impactGlow,
      }}
      transition={{
        duration: 0.18,
        ease:     'easeOut',
        delay:    data.entranceDelay ?? 0,
        // Impact glow pulses continuously while active
        ...(data.isImpacted
          ? { repeat: Infinity, repeatType: 'reverse', duration: 0.8 }
          : {}),
      }}
      className="relative min-w-[200px] max-w-[280px] group"
      style={{
        background:  config.backgroundColor,
        border:      `${borderPx} ${config.borderStyle} ${activeBorder}`,
        borderLeft,
        borderRadius: '12px',
        padding:      '10px 12px',
        opacity:      data.dimmed ? 0.15 : 1,
        transition:   'opacity 0.2s',
        fontFamily:   'var(--font-switzer)',
      }}
    >
      {/* Header row: icon + label + provenance badge */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '14px', color: config.borderColor === 'var(--color-warm-stone)' ? 'var(--color-slate-caption)' : config.borderColor }}
        >
          {config.icon}
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-[0.032em]"
          style={{ color: 'var(--color-slate-caption)' }}
        >
          {config.label}
        </span>
        <ProvenanceBadge type={data.provenance_type} className="ml-auto" />
      </div>

      {/* Node text content */}
      <p
        className="text-[13px] leading-[1.4]"
        style={{
          color:      config.labelColor,
          fontStyle:  data.type === 'question' ? 'italic' : 'normal',
          fontWeight: data.type === 'decision' ? 500 : 400,
        }}
      >
        {data.text}
      </p>

      {/* Memory scope chip (only when node carries a scope) */}
      {data.memory_scope && (
        <ScopeChip scope={data.memory_scope} nodeId={data.id} className="mt-2" />
      )}

      {/* Inline error state */}
      {data.error && (
        <div
          className="mt-2 px-2 py-1 rounded flex items-center justify-between gap-2 text-[10px] bg-red-50 text-red-600 border border-red-200"
        >
          <span>{data.error}</span>
          {data.onRetry && (
            <button
              onClick={data.onRetry}
              className="border border-current px-1.5 py-0.5 rounded hover:bg-red-600 hover:text-white transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* react-flow connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'white', border: '1px solid var(--color-warm-stone)', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: 'white', border: '1px solid var(--color-warm-stone)', width: 8, height: 8 }}
      />
    </motion.div>
  );
});
