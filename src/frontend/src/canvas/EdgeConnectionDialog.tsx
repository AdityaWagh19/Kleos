import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Connection } from 'reactflow';
import type { RelationType, Confidence } from '../types';

interface Props {
  open: boolean;
  connection: Connection | null;
  onConfirm: (type: RelationType, confidence: Confidence, label?: string) => void;
  onCancel: () => void;
}

const EDGE_TYPES: Array<{ type: RelationType; label: string; icon: string; color: string }> = [
  { type: 'supports',       label: 'Supports',       icon: 'thumb_up',    color: '#2e7d32' },
  { type: 'contradicts',    label: 'Contradicts',    icon: 'thumb_down',  color: '#c62828' },
  { type: 'depends_on',     label: 'Depends On',     icon: 'account_tree',color: '#1565c0' },
  { type: 'derived_from',   label: 'Derived From',   icon: 'call_split',  color: '#f5c842' },
];

const CONFIDENCE_LEVELS: Array<{ level: Confidence; label: string }> = [
  { level: 'high',   label: 'High' },
  { level: 'medium', label: 'Medium' },
  { level: 'low',    label: 'Low' },
];

export function EdgeConnectionDialog({ open, connection, onConfirm, onCancel }: Props) {
  const [type, setType] = useState<RelationType>('supports');
  const [confidence, setConfidence] = useState<Confidence>('medium');
  const [label, setLabel] = useState('');

  if (!open || !connection) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center font-switzer">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-sm rounded-xl shadow-2xl p-5"
          style={{ background: 'var(--color-frosted-white)', border: '1px solid var(--color-warm-stone)' }}
        >
          <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--color-charcoal-body)' }}>
            Connect Nodes
          </h3>

          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-slate-caption)' }}>
              Relationship Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EDGE_TYPES.map(et => (
                <button
                  key={et.type}
                  onClick={() => setType(et.type)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md transition-all text-left border shadow-sm"
                  style={{
                    borderColor: type === et.type ? et.color : 'transparent',
                    background: type === et.type ? `${et.color}15` : '#ffffff',
                    color: 'var(--color-charcoal-body)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: et.color }}>
                    {et.icon}
                  </span>
                  <span className="text-[12px] font-medium">{et.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-slate-caption)' }}>
              Confidence
            </label>
            <div className="flex bg-white rounded-md border p-1" style={{ borderColor: 'var(--color-warm-stone)' }}>
              {CONFIDENCE_LEVELS.map(cl => (
                <button
                  key={cl.level}
                  onClick={() => setConfidence(cl.level)}
                  className={`flex-1 text-[12px] font-medium py-1.5 rounded transition-colors ${
                    confidence === cl.level ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {cl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-slate-caption)' }}>
              Label (Optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Based on 2023 Q4 data"
              className="w-full text-[13px] px-3 py-2 rounded-md border outline-none focus:border-gray-500"
              style={{ borderColor: 'var(--color-warm-stone)', background: '#ffffff', color: 'var(--color-charcoal-body)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm(type, confidence, label.trim() || undefined);
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-[13px] font-medium rounded-md hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-slate-caption)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(type, confidence, label.trim() || undefined)}
              className="px-4 py-2 text-[13px] font-semibold rounded-md shadow-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-graphite-ink)', color: '#ffffff' }}
            >
              Create Edge
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
