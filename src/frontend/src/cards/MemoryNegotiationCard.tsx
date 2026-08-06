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
            boxShadow: ['0 4px 12px rgba(0,0,0,0.1)', '0 8px 24px rgba(245,200,66,0.3)', '0 4px 12px rgba(0,0,0,0.1)'],
          }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="absolute bottom-20 right-6 z-50 font-switzer"
          style={{
            width:        300,
            background:   'var(--color-frosted-white)',
            border:       '2px solid #f5c842',
            borderRadius: '12px',
            padding:      '16px',
          }}
        >
          {/* Observation */}
          <div className="flex gap-2 mb-4">
            <span className="material-symbols-outlined shrink-0 mt-0.5"
                  style={{ fontSize: '18px', color: '#e65100' }}>
              psychology
            </span>
            <p style={{ fontSize: '13px', color: 'var(--color-charcoal-body)', lineHeight: '1.4', margin: 0, fontWeight: 500 }}>
              {observation}
            </p>
          </div>

          {/* 2×2 scope options */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Remember Always',   scope: 'global'    as MemoryScope, color: '#2e7d32', bg: '#e8f5e9', icon: 'all_inclusive' },
              { label: 'This Project Only', scope: 'workspace' as MemoryScope, color: '#1565c0', bg: '#e3f2fd', icon: 'folder_special' },
              { label: "Don't Remember",    scope: 'none'                    , color: '#c62828', bg: '#ffebee', icon: 'block' },
              { label: 'Not Now',           scope: 'later'                   , color: 'var(--color-slate-caption)', bg: '#f3f4f6', icon: 'schedule' },
            ].map(({ label, scope, color, bg, icon }) => (
              <button
                key={label}
                onClick={() => onChoice(scope as MemoryScope | 'none' | 'later')}
                className="flex items-center gap-1.5 px-2 py-2 text-left transition-colors hover:opacity-80 shadow-sm"
                style={{
                  background:   bg,
                  border:       `1px solid ${color}`,
                  borderRadius: '6px',
                  color:        color,
                }}
              >
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: '14px' }}>
                  {icon}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, lineHeight: '1.2' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => onChoice('later')}
            className="mt-3 w-full transition-colors hover:text-gray-800"
            style={{ fontSize: '11px', color: 'var(--color-slate-caption)' }}
          >
            Dismiss (Esc)
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
