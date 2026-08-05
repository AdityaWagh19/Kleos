import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryScope } from '../types';

interface Props {
  open: boolean;
  observation: string;
  onChoice: (scope: MemoryScope | 'none' | 'later') => void;
}

export function MemoryNegotiationCard({ open, observation, onChoice }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{
            opacity: 1, y: 0, scale: 1,
            boxShadow: ['0 0 0 0 rgba(245,200,66,0)', '0 0 20px 4px rgba(245,200,66,0.2)', '0 0 0 0 rgba(245,200,66,0)'],
          }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="absolute bottom-16 right-4 z-40"
          style={{
            width:        288,
            background:   '#1a1a1a',
            border:       '1px solid #f5c842',
            borderRadius: '12px',
            padding:      '16px',
          }}
        >
          {/* Observation */}
          <div className="flex gap-2 mb-3">
            <span className="material-symbols-outlined shrink-0 mt-0.5"
                  style={{ fontSize: '16px', color: '#f5c842' }}>
              psychology
            </span>
            <p style={{ fontSize: '12px', color: '#f9f9f9', lineHeight: '1.5', margin: 0 }}>
              {observation}
            </p>
          </div>

          {/* 2×2 scope options */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Remember Always',   scope: 'global'    as MemoryScope, color: '#4caf7d', icon: 'all_inclusive' },
              { label: 'This Project Only', scope: 'workspace' as MemoryScope, color: '#4a90d9', icon: 'folder_special' },
              { label: "Don't Remember",    scope: 'none'                     , color: '#e84040', icon: 'block' },
              { label: 'Not Now',           scope: 'later'                    , color: '#9c9c9c', icon: 'schedule' },
            ].map(({ label, scope, color, icon }) => (
              <button
                key={label}
                onClick={() => onChoice(scope as MemoryScope | 'none' | 'later')}
                className="flex items-center gap-1.5 px-2 py-2 text-left transition-opacity hover:opacity-80"
                style={{
                  background:   `${color}0d`,
                  border:       `1px solid ${color}40`,
                  borderRadius: '4px',
                  color,
                }}
              >
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: '13px' }}>
                  {icon}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 500, lineHeight: '1.3' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => onChoice('later')}
            className="mt-2 w-full transition-colors"
            style={{ fontSize: '10px', color: '#565656' }}
          >
            Dismiss (Esc)
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
