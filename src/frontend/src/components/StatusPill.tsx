import { useState } from 'react';
import { motion } from 'framer-motion';
import type { StatusPillState, ReasoningStep } from '../types';

const CONFIG: Record<
  StatusPillState,
  { label: string; dotColor: string; animate: boolean; icon: string | null; clickable: boolean }
> = {
  working:   { label: 'Working...', dotColor: '#f5c842', animate: true,  icon: null,  clickable: true  },
  listening: { label: 'Listening',  dotColor: '#e84040', animate: true,  icon: 'mic', clickable: false },
  ready:     { label: 'Ready',      dotColor: '#7dcfb6', animate: false, icon: null,  clickable: false },
};

interface Props {
  state: StatusPillState;
  lastSteps?: ReasoningStep[];
}

export function StatusPill({ state, lastSteps = [] }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cfg = CONFIG[state];

  return (
    <div className="relative font-switzer z-50">
      <button
        role="status"
        aria-label={`Canvas status: ${cfg.label}`}
        aria-live="polite"
        disabled={!cfg.clickable}
        onClick={() => cfg.clickable && setShowTooltip(s => !s)}
        className="flex items-center gap-1.5 px-3 py-1.5 transition-colors disabled:cursor-default outline-none shadow-sm"
        style={{
          background:   'var(--color-warm-stone)',
          border:       '1px solid var(--color-quartz)',
          borderRadius: '200px', // Pill shape
          fontSize:     '11px',
          fontWeight:   500,
          color:        'var(--color-charcoal-body)',
        }}
      >
        {cfg.icon ? (
          <motion.span
            className="material-symbols-outlined"
            style={{ fontSize: '14px', color: cfg.dotColor }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            {cfg.icon}
          </motion.span>
        ) : (
          <motion.div
            style={{
              width:        8,
              height:       8,
              borderRadius: '50%',
              background:   cfg.dotColor,
              boxShadow:    cfg.animate ? `0 0 6px ${cfg.dotColor}` : 'none',
            }}
            animate={cfg.animate ? { opacity: [1, 0.5, 1], scale: [1, 0.9, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        {cfg.label}
      </button>

      {/* Tooltip: last 3 ribbon steps */}
      {showTooltip && lastSteps.length > 0 && (
        <div
          className="absolute top-full mt-2 right-0 z-50 shadow-xl"
          style={{
            width:        280,
            background:   'var(--color-frosted-white)',
            border:       '1px solid var(--color-warm-stone)',
            borderRadius: '12px',
            padding:      '12px',
          }}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Recent Thinking Steps</h4>
          {lastSteps.slice(-3).map((s, i) => (
            <div
              key={i}
              className="py-1.5"
              style={{
                fontSize:    '11px',
                color:       'var(--color-slate-caption)',
                borderBottom: i < Math.min(lastSteps.length, 3) - 1 ? '1px solid var(--color-warm-stone)' : 'none',
              }}
            >
              <span style={{ color: 'var(--color-charcoal-body)', fontWeight: 500 }}>{s.action.replace(/_/g, ' ')}</span>
              {' — '}
              {s.detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
