import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import type { Assumption } from '../types';

interface Props {
  open: boolean;
  assumptions: Assumption[];
  onClose: () => void;
  onHoverAssumption: (nodeId: string, impactNodes: string[]) => void;
  onLeaveAssumption: () => void;
  onOverride: (nodeId: string, newText: string) => void;
  onAccept: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onAskAI: (nodeId: string) => void;
}

export function AssumptionAuditPanel({
  open, assumptions, onClose,
  onHoverAssumption, onLeaveAssumption,
  onOverride, onAccept, onDelete, onAskAI,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed right-0 top-[48px] bottom-0 z-40 flex flex-col shadow-2xl"
          style={{ width: 340, background: 'var(--color-frosted-white)', borderLeft: '1px solid var(--color-warm-stone)', fontFamily: 'var(--font-switzer)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-white"
            style={{ borderBottom: '1px solid var(--color-warm-stone)' }}
          >
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-charcoal-body)' }}>
                Assumption Audit
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-slate-caption)', marginLeft: 8 }}>
                {assumptions.length} found
              </span>
            </div>
            <button
              onClick={onClose}
              className="material-symbols-outlined hover:text-gray-800 transition-colors"
              style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}
            >
              close
            </button>
          </div>

          {/* Empty state */}
          {assumptions.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <span
                  className="material-symbols-outlined block mb-2"
                  style={{ fontSize: '32px', color: 'var(--color-slate-caption)' }}
                >
                  help_outline
                </span>
                <p style={{ fontSize: '12px', color: 'var(--color-slate-caption)', lineHeight: '1.5' }}>
                  No assumptions detected yet.
                  <br />
                  Speak or drop content to begin.
                </p>
              </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {assumptions.map((assumption) => (
              <AssumptionRow
                key={assumption.node_id}
                assumption={assumption}
                onHover={() => onHoverAssumption(assumption.node_id, assumption.impact_nodes)}
                onLeave={onLeaveAssumption}
                onOverride={(text) => onOverride(assumption.node_id, text)}
                onAccept={() => onAccept(assumption.node_id)}
                onDelete={() => onDelete(assumption.node_id)}
                onAskAI={() => onAskAI(assumption.node_id)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AssumptionRow({
  assumption,
  onHover, onLeave,
  onOverride, onAccept, onDelete, onAskAI,
}: {
  assumption: Assumption;
  onHover: () => void;
  onLeave: () => void;
  onOverride: (text: string) => void;
  onAccept: () => void;
  onDelete: () => void;
  onAskAI: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [overrideText, setOverrideText] = useState(assumption.statement);

  return (
    <div
      className="px-4 py-4 cursor-default transition-colors hover:bg-gray-50"
      style={{ borderBottom: '1px solid var(--color-warm-stone)' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <ProvenanceBadge type={assumption.provenance_type} />
        <span style={{ fontSize: '10px', color: 'var(--color-slate-caption)' }}>
          {assumption.impact_nodes.length} impacted
        </span>
      </div>

      {editing ? (
        <div className="mb-2">
          <textarea
            value={overrideText}
            onChange={e => setOverrideText(e.target.value)}
            rows={3}
            className="w-full resize-none p-2 text-[12px] leading-[1.4] outline-none font-switzer"
            style={{
              background:   '#ffffff',
              border:       '1px solid var(--color-warm-stone)',
              borderRadius: '4px',
              color:        'var(--color-charcoal-body)',
            }}
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => { onOverride(overrideText); setEditing(false); }}
              className="px-2 py-1 text-[10px] font-medium"
              style={{ background: 'var(--color-graphite-ink)', color: 'var(--color-frosted-white)', borderRadius: '4px' }}
            >
              Apply Override
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{ fontSize: '10px', color: 'var(--color-slate-caption)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-[13px] leading-[1.4]" style={{ color: 'var(--color-charcoal-body)' }}>
          {assumption.statement}
        </p>
      )}

      <ConfidenceBar confidence={assumption.confidence} />

      <div className="flex gap-1.5 mt-3 flex-wrap">
        {[
          { label: 'Accept',   icon: 'check',       action: onAccept,               style: 'color:#2e7d32;border-color:#2e7d32;background:#e8f5e9' },
          { label: 'Override', icon: 'edit',        action: () => setEditing(true), style: 'color:var(--color-charcoal-body);border-color:var(--color-warm-stone);background:#ffffff' },
          { label: 'Ask AI',   icon: 'psychology',  action: onAskAI,                style: 'color:var(--color-charcoal-body);border-color:var(--color-warm-stone);background:#ffffff' },
          { label: 'Delete',   icon: 'delete',      action: onDelete,               style: 'color:#c62828;border-color:#c62828;background:#ffebee' },
        ].map(({ label, icon, action, style }) => (
          <button
            key={label}
            onClick={action}
            className="flex items-center gap-1 px-2 py-1 transition-colors hover:opacity-80 shadow-sm"
            style={{
              fontSize:     '10px',
              fontWeight:   500,
              borderRadius: '4px',
              ...Object.fromEntries(
                style.split(';').filter(Boolean).map(s => {
                  const [k, v] = s.split(':');
                  return [k.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v?.trim()];
                })
              ),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
