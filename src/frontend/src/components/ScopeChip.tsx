import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryScope } from '../types';

const SCOPE_ORDER: MemoryScope[] = ['session', 'workspace', 'global'];

const SCOPE_CONFIG: Record<MemoryScope, { label: string; color: string; next: string }> = {
  session:   { label: 'Session',   color: '#4a90d9', next: 'Click for Workspace scope' },
  workspace: { label: 'Workspace', color: '#9c4af5', next: 'Click for Global scope' },
  global:    { label: 'Global',    color: '#4caf7d', next: 'Click for Session scope' },
  source:    { label: 'Source',    color: '#9c9c9c', next: '' },
};

interface Props {
  scope: MemoryScope;
  nodeId: string;
  onScopeChange?: (nodeId: string, newScope: MemoryScope) => void;
  className?: string;
}

export function ScopeChip({ scope, nodeId, onScopeChange, className = '' }: Props) {
  const config = SCOPE_CONFIG[scope] ?? SCOPE_CONFIG.session;

  const handleClick = () => {
    if (!onScopeChange || scope === 'source') return;
    const idx = SCOPE_ORDER.indexOf(scope);
    const next = SCOPE_ORDER[(idx + 1) % SCOPE_ORDER.length];
    onScopeChange(nodeId, next);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={scope}
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 2 }}
        transition={{ duration: 0.12 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={!onScopeChange || scope === 'source'}
        title={config.next}
        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium
                    cursor-pointer disabled:cursor-default transition-colors ${className}`}
        style={{
          background: `${config.color}18`,
          border:     `1px solid ${config.color}60`,
          color:      config.color,
        }}
      >
        [{config.label}]
      </motion.button>
    </AnimatePresence>
  );
}
