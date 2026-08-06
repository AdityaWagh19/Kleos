import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryScope } from '../types';
import { useMemory, type MemoryWithFreshness } from '../hooks/useMemory';

type Tab = 'core' | 'session' | 'pending' | 'source';

interface Props {
  open: boolean;
  canvasId: string;
  onClose: () => void;
}

export function MemoryPanel({ open, canvasId, onClose }: Props) {
  const [activeTab, setActiveTab]     = useState<Tab>('core');
  const [searchQuery, setSearchQuery] = useState('');
  const { tier0, tier1, tier2, tier3, loadMemories, archiveMemory, updateMemory, ratifyMemory } =
    useMemory(canvasId);

  useEffect(() => { if (open) loadMemories(); }, [open, loadMemories]);

  const tabData: Record<Tab, { label: string; items: MemoryWithFreshness[]; count: number }> = {
    core:    { label: 'Core',    items: tier0, count: tier0.length },
    session: { label: 'Session', items: tier1, count: tier1.length },
    pending: { label: 'Pending', items: tier2, count: tier2.length },
    source:  { label: 'Source',  items: tier3, count: tier3.length },
  };

  const filtered = tabData[activeTab].items.filter(
    m => !searchQuery || m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className={`fixed top-[48px] bottom-0 left-0 w-[420px] shadow-2xl z-40 transition-transform duration-300 ease-out flex flex-col ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            background: 'var(--color-frosted-white)',
            borderRight: '1px solid var(--color-warm-stone)',
            fontFamily: 'var(--font-switzer)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-warm-stone)' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-charcoal-body)' }}>memory</span>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-charcoal-body)' }}>Workspace Memory</h2>
            </div>
            <button
              onClick={onClose}
              className="material-symbols-outlined text-gray-500 hover:text-gray-800 transition-colors"
            >
              close
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--color-warm-stone)' }}>
            <div className="flex items-center gap-2 px-2 py-1.5"
                 style={{ background: '#ffffff', border: '1px solid var(--color-warm-stone)', borderRadius: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9ca3af' }}>search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="flex-1 outline-none"
                style={{ background: 'transparent', fontSize: '12px', color: 'var(--color-charcoal-body)' }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--color-warm-stone)' }}>
            {(Object.keys(tabData) as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 transition-colors"
                style={{
                  fontSize:    '10px',
                  fontWeight:  600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color:       activeTab === tab ? '#000000' : '#6b7280',
                  borderBottom: activeTab === tab ? '2px solid #000000' : '2px solid transparent',
                }}
              >
                {tabData[tab].label}
                {tabData[tab].count > 0 && (
                  <span style={{ marginLeft: 4, fontSize: '9px' }}>({tabData[tab].count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Pending banner */}
          {activeTab === 'pending' && tier2.length > 0 && (
            <div className="mx-3 mt-2 p-2 rounded" style={{
              background: '#fff3e0', border: '1px solid #ffe0b2'
            }}>
              <p style={{ fontSize: '11px', color: '#e65100', lineHeight: '1.4' }}>
                These have not influenced any response yet. Review before accepting.
              </p>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <span className="material-symbols-outlined block mb-2"
                      style={{ fontSize: '28px', color: 'var(--color-slate-caption)' }}>
                  {activeTab === 'pending' ? 'pending_actions' : 'memory'}
                </span>
                <p style={{ fontSize: '11px', color: 'var(--color-slate-caption)', lineHeight: '1.5' }}>
                  {activeTab === 'pending'
                    ? 'No pending memories.\nKleos will ask before storing anything.'
                    : 'No memories stored yet.\nKleos will only remember what you approve.'}
                </p>
              </div>
            </div>
          )}

          {/* Memory list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(memory => (
              <MemoryItem
                key={memory.id}
                memory={memory}
                showRatify={activeTab === 'pending'}
                onArchive={() => archiveMemory(memory.id)}
                onUpdate={text => updateMemory(memory.id, text)}
                onRatify={scope => ratifyMemory(memory.id, scope)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MemoryItem({
  memory, showRatify, onArchive, onUpdate, onRatify,
}: {
  memory: MemoryWithFreshness;
  showRatify: boolean;
  onArchive: () => void;
  onUpdate: (text: string) => void;
  onRatify: (scope: MemoryScope) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText]       = useState(memory.text);

  const TIER_COLORS: Record<number, string> = { 0: '#2e7d32', 1: '#1565c0', 2: '#e65100', 3: 'var(--color-slate-caption)' };
  const TIER_LABELS: Record<number, string> = { 0: 'Core', 1: 'Session', 2: 'Pending', 3: 'Source' };

  return (
    <div className="px-3 py-2.5 transition-colors hover:bg-gray-50"
         style={{ borderBottom: '1px solid var(--color-warm-stone)' }}>
      <div className="flex items-start justify-between mb-1">
        <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                       color: TIER_COLORS[memory.tier as 0|1|2|3] }}>
          {TIER_LABELS[memory.tier as 0|1|2|3]}
        </span>
        <div className="flex items-center gap-1.5">
          {memory.freshness?.stale && (
            <span className="material-symbols-outlined" style={{ fontSize: '11px', color: '#e65100' }} title="May be outdated">
              warning
            </span>
          )}
          <span style={{ fontSize: '9px', color: 'var(--color-slate-caption)' }}>
            {memory.freshness?.age_label || new Date(memory.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {editing ? (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            className="w-full resize-none p-1.5 outline-none font-switzer text-[12px]"
            style={{ background: '#ffffff', border: '1px solid var(--color-warm-stone)', borderRadius: '4px',
                     color: 'var(--color-charcoal-body)' }}
          />
          <div className="flex gap-2 mt-1">
            <button onClick={() => { onUpdate(text); setEditing(false); }}
                    style={{ fontSize: '10px', fontWeight: 500, background: 'var(--color-graphite-ink)',
                             color: 'var(--color-frosted-white)', borderRadius: '4px', padding: '2px 8px' }}>
              Save
            </button>
            <button onClick={() => setEditing(false)} style={{ fontSize: '10px', color: 'var(--color-slate-caption)' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '12px', color: 'var(--color-charcoal-body)', lineHeight: '1.4', marginBottom: 8 }}>
          {memory.text}
        </p>
      )}

      {/* Ratify buttons for Pending */}
      {showRatify && !editing && (
        <div className="flex gap-1 flex-wrap mb-1">
          {([
            { scope: 'global',    label: 'Remember Always',   color: '#2e7d32', bg: '#e8f5e9' },
            { scope: 'workspace', label: 'This Project',      color: '#1565c0', bg: '#e3f2fd' },
            { scope: 'session',   label: 'This Session',      color: '#6a1b9a', bg: '#f3e5f5' },
          ] as Array<{ scope: MemoryScope; label: string; color: string; bg: string }>).map(({ scope, label, color, bg }) => (
            <button key={scope} onClick={() => onRatify(scope)}
                    className="px-1.5 py-0.5 transition-colors font-semibold"
                    style={{ fontSize: '9px', background: bg,
                             border: `1px solid ${color}`, color, borderRadius: '4px' }}>
              {label}
            </button>
          ))}
          <button onClick={onArchive}
                  className="px-1.5 py-0.5 transition-colors font-semibold"
                  style={{ fontSize: '9px', border: '1px solid #c62828',
                           color: '#c62828', borderRadius: '4px' }}>
            Reject
          </button>
        </div>
      )}

      {/* Standard CRUD actions */}
      {!editing && !showRatify && (
        <div className="flex gap-1">
          {[
            { icon: 'edit',    label: 'Edit',    action: () => setEditing(true) },
            { icon: 'archive', label: 'Archive', action: onArchive },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 transition-colors bg-white hover:bg-gray-100 shadow-sm"
                    style={{ fontSize: '9px', color: 'var(--color-charcoal-body)', border: '1px solid var(--color-warm-stone)',
                             borderRadius: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
