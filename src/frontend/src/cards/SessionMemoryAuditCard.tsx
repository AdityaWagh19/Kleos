import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

interface AuditItem {
  memory_id: string;
  text: string;
  confidence: 'low' | 'medium' | 'high';
}

type Action = 'accept' | 'reject' | 'edit';

interface Props {
  canvasId: string;
  items: AuditItem[];
  onComplete: () => void;
}

export function SessionMemoryAuditCard({ canvasId, items, onComplete }: Props) {
  const [decisions, setDecisions] = useState<Record<string, { action: Action; text?: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const setDecision = (id: string, action: Action, text?: string) =>
    setDecisions(prev => ({ ...prev, [id]: { action, text } }));

  const submit = async (acceptAll: boolean) => {
    const resolved = { ...decisions };
    if (acceptAll) {
      items.forEach(item => { if (!resolved[item.memory_id]) resolved[item.memory_id] = { action: 'accept' }; });
    }
    const payload = items.map(item => ({
      memory_id: item.memory_id,
      action:    resolved[item.memory_id]?.action ?? 'reject',
      text:      resolved[item.memory_id]?.text,
      scope:     'session',
    }));
    await api.post(`/api/canvas/${canvasId}/audit`, { items: payload });
    onComplete();
  };

  const CONF_COLORS = { low: '#e84040', medium: '#f5c842', high: '#4caf7d' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(17,17,17,0.9)' }}
    >
      <div className="w-full max-w-md overflow-hidden" style={{
        background: '#1a1a1a', border: '1px solid #2b2b2b', borderRadius: '12px',
      }}>
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #2b2b2b' }}>
          <p style={{ fontSize: '16px', fontWeight: 500, color: '#f9f9f9', margin: 0 }}>
            This session taught me {items.length} new {items.length === 1 ? 'thing' : 'things'} about you.
          </p>
          <p style={{ fontSize: '12px', color: '#9c9c9c', marginTop: 4 }}>
            Accept what you'd like me to remember. Rejected items are permanently excluded.
          </p>
        </div>

        {/* Items */}
        <div style={{ maxHeight: 256, overflowY: 'auto' }}>
          {items.map((item, i) => {
            const d = decisions[item.memory_id];
            return (
              <div key={item.memory_id} className="px-5 py-3"
                   style={{ borderBottom: '1px solid #2b2b2b' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span style={{ fontSize: '10px', color: '#9c9c9c', marginRight: 4 }}>{i + 1}.</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 500, textTransform: 'uppercase',
                      color: CONF_COLORS[item.confidence],
                    }}>
                      {item.confidence}
                    </span>
                    {editingId === item.memory_id ? (
                      <input
                        defaultValue={item.text}
                        onBlur={e => { setDecision(item.memory_id, 'edit', e.target.value); setEditingId(null); }}
                        autoFocus
                        className="w-full mt-1 px-2 py-1 outline-none"
                        style={{ background: '#111111', border: '1px solid #e5ff5d', borderRadius: '4px',
                                 fontSize: '12px', color: '#f9f9f9' }}
                      />
                    ) : (
                      <span style={{ display: 'block', fontSize: '12px', color: '#f9f9f9', marginTop: 2 }}>
                        {d?.text ?? item.text}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {[
                      { action: 'accept' as Action, color: '#4caf7d', label: 'Accept' },
                      { action: 'edit'   as Action, color: '#f5c842', label: 'Edit',   onClick: () => setEditingId(item.memory_id) },
                      { action: 'reject' as Action, color: '#e84040', label: 'Reject' },
                    ].map(({ action, color, label, onClick }) => (
                      <button
                        key={action}
                        onClick={onClick ?? (() => setDecision(item.memory_id, action))}
                        className="px-2 py-1 transition-colors"
                        style={{
                          fontSize: '10px',
                          borderRadius: '4px',
                          border: `1px solid ${color}`,
                          background: d?.action === action ? color : 'transparent',
                          color: d?.action === action ? '#111111' : color,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-between items-center"
             style={{ borderTop: '1px solid #2b2b2b' }}>
          <button onClick={() => submit(false)} style={{ fontSize: '11px', color: '#9c9c9c' }}>
            Skip (reject all)
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => submit(true)}
              style={{ padding: '6px 12px', background: '#e5ff5d', color: '#111111',
                       fontSize: '12px', fontWeight: 500, borderRadius: '4px' }}
            >
              Accept All
            </button>
            <button
              onClick={() => submit(false)}
              style={{ padding: '6px 12px', border: '1px solid #565656', color: '#f9f9f9',
                       fontSize: '12px', borderRadius: '4px' }}
            >
              Apply Choices
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
