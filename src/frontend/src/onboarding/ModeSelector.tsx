import { motion } from 'framer-motion';
import type { WorkspaceMode } from '../types';

const MODES: Array<{
  mode: WorkspaceMode;
  label: string;
  description: string;
  icon: string;
  color: string;
}> = [
  { mode: 'analytical', label: 'Analytical', color: '#4a90d9', icon: 'analytics',  description: 'Evidence-first. Every claim requires a source.' },
  { mode: 'creative',   label: 'Creative',   color: '#9c4af5', icon: 'lightbulb',  description: 'Embrace possibility. Ideas flow freely.' },
  { mode: 'critical',   label: 'Critical',   color: '#e84040', icon: 'gavel',      description: 'Challenge everything. The AI argues back.' },
  { mode: 'strategic',  label: 'Strategic',  color: '#4caf7d', icon: 'route',      description: 'Synthesise and converge. Decisions first.' },
];

interface Props {
  onSelect: (mode: WorkspaceMode) => void;
}

export function ModeSelector({ onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8"
      style={{ background: '#111111' }}
    >
      <p style={{ fontSize: '12px', color: '#9c9c9c', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: '16px' }}>
        What kind of thinking are you doing today?
      </p>
      <h1 style={{ fontSize: '48px', fontWeight: 400, color: '#f9f9f9',
                   letterSpacing: '-0.02em', textTransform: 'uppercase',
                   lineHeight: '1.1', textAlign: 'center', marginBottom: '48px' }}>
        Choose your<br />reasoning mode
      </h1>

      <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 560, width: '100%' }}>
        {MODES.map(({ mode, label, description, icon, color }) => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(mode)}
            className="p-5 text-left transition-colors"
            style={{
              background:   '#1a1a1a',
              border:       '1px solid #2b2b2b',
              borderRadius: '12px',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color }}>
                {icon}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#f9f9f9' }}>{label}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#9c9c9c', lineHeight: '1.4', margin: 0 }}>
              {description}
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
