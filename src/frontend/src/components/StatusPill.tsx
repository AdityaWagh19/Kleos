import { useState } from 'react';
import { motion } from 'framer-motion';
import type { StatusPillState, ReasoningStep } from '../types';

const CONFIG: Record<
  StatusPillState,
  { label: string; dotColor: string; animate: boolean; icon: string | null; clickable: boolean }
> = {
  working:   { label: 'Working...', dotColor: '#4a90d9', animate: true,  icon: null,  clickable: true  },
  listening: { label: 'Listening',  dotColor: '#e5ff5d', animate: true,  icon: 'mic', clickable: false },
  ready:     { label: 'Ready',      dotColor: '#4caf7d', animate: false, icon: null,  clickable: false },
};

interface Props {
  state: StatusPillState;
  lastSteps?: ReasoningStep[];
}

export function StatusPill({ state, lastSteps = [] }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cfg = CONFIG[state];

  return (
    <div className="relative">
      <button
        disabled={!cfg.clickable}
        onClick={() => cfg.clickable && setShowTooltip(s => !s)}
        className="flex items-center gap-1.5 px-2 py-1 transition-colors disabled:cursor-default"
        style={{
          background:   '#2b2b2b',
          border:       '1px solid #565656',
          borderRadius: '4px',
          fontSize:     '11px',
          fontWeight:   500,
          color:        '#9c9c9c',
        }}
      >
        {cfg.icon ? (
          <motion.span
            className="material-symbols-outlined"
            style={{ fontSize: '12px', color: cfg.dotColor }}
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
            }}
            animate={cfg.animate ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        {cfg.label}
      </button>

      {/* Tooltip: last 3 ribbon steps */}
      {showTooltip && lastSteps.length > 0 && (
        <div
          className="absolute top-full mt-1 right-0 z-50"
          style={{
            width:        260,
            background:   '#2b2b2b',
            border:       '1px solid #565656',
            borderRadius: '8px',
            padding:      '8px',
          }}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {lastSteps.slice(-3).map((s, i) => (
            <div
              key={i}
              className="py-1"
              style={{
                fontSize:    '11px',
                color:       '#9c9c9c',
                borderBottom: i < 2 ? '1px solid #565656' : 'none',
              }}
            >
              <span style={{ color: '#f9f9f9' }}>{s.action.replace(/_/g, ' ')}</span>
              {' — '}
              {s.detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
