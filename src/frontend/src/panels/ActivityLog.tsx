import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityEvent } from '../types';

const EVENT_ICONS: Record<string, string> = {
  node_created:          'add_circle',
  node_deleted:          'remove_circle',
  edge_created:          'timeline',
  branch_created:        'fork_right',
  branch_committed:      'merge',
  memory_accepted:       'memory',
  memory_rejected:       'block',
  mode_changed:          'tune',
  assumption_overridden: 'edit',
  voice_command_received:'mic',
  quick_override_set:    'layers',
};

interface Props {
  open:    boolean;
  events:  ActivityEvent[];
  onClose: () => void;
}

export function ActivityLog({ open, events, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex justify-end"
          style={{ background: 'rgba(237, 237, 232, 0.4)', backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="h-full flex flex-col shadow-2xl"
            style={{ width: 320, background: 'var(--color-frosted-white)', borderLeft: '1px solid var(--color-warm-stone)', fontFamily: 'var(--font-switzer)' }}
          >
            <div className="flex items-center justify-between px-4 py-4"
                 style={{ borderBottom: '1px solid var(--color-warm-stone)' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-charcoal-body)' }}>Activity Log</span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '10px', color: 'var(--color-slate-caption)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Read-only</span>
                <button onClick={onClose} className="material-symbols-outlined hover:text-gray-800 transition-colors"
                        style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}>close</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {[...events].reverse().map(event => (
                <div key={event.event_id}
                     className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                     style={{ borderBottom: '1px solid var(--color-warm-stone)' }}>
                  <span className="material-symbols-outlined shrink-0 mt-0.5"
                        style={{ fontSize: '16px', color: 'var(--color-slate-caption)' }}>
                    {EVENT_ICONS[event.event_type] ?? 'circle'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: '12px', color: 'var(--color-charcoal-body)', fontWeight: 500 }}>
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span style={{
                        fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase',
                        background: event.author === 'user' ? '#e3f2fd' : '#fff3e0',
                        color:      event.author === 'user' ? '#1565c0' : '#e65100',
                      }}>
                        {event.author}
                      </span>
                      {event.input_modality === 'voice' && (
                        <span className="material-symbols-outlined"
                              style={{ fontSize: '12px', color: '#9a73d1' }}>mic</span>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--color-slate-caption)' }}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p style={{ fontSize: '12px', color: 'var(--color-slate-caption)' }}>No activity yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
