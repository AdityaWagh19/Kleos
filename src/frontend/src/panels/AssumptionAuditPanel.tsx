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
          className="absolute right-0 top-0 bottom-0 z-30 flex flex-col"
          style={{ width: 300, background: '#1a1a1a', borderLeft: '1px solid #2b2b2b' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid #2b2b2b' }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#f9f9f9' }}>
                Assumption Audit
              </span>
              <span style={{ fontSize: '10px', color: '#9c9c9c', marginLeft: 8 }}>
                {assumptions.length} found
              </span>
            </div>
            <button
              onClick={onClose}
              className="material-symbols-outlined hover:opacity-70 transition-opacity"
              style={{ fontSize: '18px', color: '#9c9c9c' }}
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
                  style={{ fontSize: '32px', color: '#565656' }}
                >
                  help_outline
                </span>
                <p style={{ fontSize: '12px', color: '#565656', lineHeight: '1.5' }}>
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
      className="px-4 py-3 cursor-default transition-colors hover:bg-[#222222]"
      style={{ borderBottom: '1px solid #2b2b2b' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <ProvenanceBadge type={assumption.provenance_type} />
        <span style={{ fontSize: '9px', color: '#565656' }}>
          {assumption.impact_nodes.length} impacted
        </span>
      </div>

      {editing ? (
        <div className="mb-2">
          <textarea
            value={overrideText}
            onChange={e => setOverrideText(e.target.value)}
            rows={3}
            className="w-full resize-none p-2 text-[12px] leading-[1.4] outline-none"
            style={{
              background:   '#111111',
              border:       '1px solid #e5ff5d',
              borderRadius: '4px',
              color:        '#f9f9f9',
            }}
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => { onOverride(overrideText); setEditing(false); }}
              className="px-2 py-1 text-[10px] font-medium"
              style={{ background: '#e5ff5d', color: '#111111', borderRadius: '4px' }}
            >
              Apply Override
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{ fontSize: '10px', color: '#9c9c9c' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-2 text-[12px] leading-[1.4]" style={{ color: '#f9f9f9' }}>
          {assumption.statement}
        </p>
      )}

      <ConfidenceBar confidence={assumption.confidence} />

      <div className="flex gap-1 mt-2 flex-wrap">
        {[
          { label: 'Accept',   icon: 'check',      action: onAccept,            style: '' },
          { label: 'Override', icon: 'edit',        action: () => setEditing(true), style: '' },
          { label: 'Ask AI',   icon: 'psychology',  action: onAskAI,             style: '' },
          { label: 'Delete',   icon: 'delete',      action: onDelete,            style: 'color:#e84040;border-color:#e84040' },
        ].map(({ label, icon, action, style }) => (
          <button
            key={label}
            onClick={action}
            className="flex items-center gap-0.5 px-1.5 py-0.5 transition-colors"
            style={{
              fontSize:     '10px',
              color:        '#9c9c9c',
              border:       '1px solid #565656',
              borderRadius: '4px',
              ...Object.fromEntries(
                style.split(';').filter(Boolean).map(s => {
                  const [k, v] = s.split(':');
                  return [k.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v?.trim()];
                })
              ),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
