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
          style={{ background: 'rgba(17,17,17,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="h-full flex flex-col"
            style={{ width: 288, background: '#1a1a1a', borderLeft: '1px solid #2b2b2b' }}
          >
            <div className="flex items-center justify-between px-4 py-3"
                 style={{ borderBottom: '1px solid #2b2b2b' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#f9f9f9' }}>Activity Log</span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '10px', color: '#565656' }}>Read-only</span>
                <button onClick={onClose} className="material-symbols-outlined"
                        style={{ fontSize: '18px', color: '#9c9c9c' }}>close</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {[...events].reverse().map(event => (
                <div key={event.event_id}
                     className="flex items-start gap-2 px-3 py-2 hover:bg-[#222222] transition-colors"
                     style={{ borderBottom: '1px solid #2b2b2b' }}>
                  <span className="material-symbols-outlined shrink-0 mt-0.5"
                        style={{ fontSize: '14px', color: '#565656' }}>
                    {EVENT_ICONS[event.event_type] ?? 'circle'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: '11px', color: '#f9f9f9' }}>
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span style={{
                        fontSize: '9px', padding: '1px 4px', borderRadius: '2px',
                        background: event.author === 'user' ? '#4a90d920' : '#f5c84220',
                        color:      event.author === 'user' ? '#4a90d9'   : '#f5c842',
                      }}>
                        {event.author}
                      </span>
                      {event.input_modality === 'voice' && (
                        <span className="material-symbols-outlined"
                              style={{ fontSize: '10px', color: '#e5ff5d' }}>mic</span>
                      )}
                      <span style={{ fontSize: '9px', color: '#565656' }}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p style={{ fontSize: '11px', color: '#565656' }}>No activity yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
