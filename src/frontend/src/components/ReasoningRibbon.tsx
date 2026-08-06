import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReasoningStep } from '../types';

interface Props {
  steps: ReasoningStep[];
  isActive: boolean;
  onStepClick: (step: ReasoningStep) => void;
}

export function ReasoningRibbon({ steps, isActive, onStepClick }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (steps.length > 0) setVisible(true);
  }, [steps.length]);

  // Fade 2 seconds after compilation completes
  useEffect(() => {
    if (!isActive && steps.length > 0) {
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isActive, steps.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 overflow-x-auto px-4 font-switzer scrollbar-hide"
          style={{
            height:     '40px',
            background: 'var(--color-frosted-white)',
            borderTop:  '1px solid var(--color-warm-stone)',
          }}
        >
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => onStepClick(step)}
              title={step.detail}
              className="flex items-center gap-1.5 shrink-0 hover:opacity-70 transition-opacity outline-none"
            >
              <span
                className="flex items-center justify-center rounded-full text-[9px] font-bold"
                style={{
                  width:      18,
                  height:     18,
                  background: 'var(--color-linen-canvas)',
                  border:     '1px solid var(--color-warm-stone)',
                  color:      'var(--color-slate-caption)',
                }}
              >
                {step.step}
              </span>
              <span className="text-[11px] max-w-[180px] truncate font-medium text-transform-capitalize" style={{ color: 'var(--color-charcoal-body)' }}>
                {step.action.replace(/_/g, ' ')}
              </span>
              {i < steps.length - 1 && (
                <span className="material-symbols-outlined" style={{ fontSize: '12px', color: 'var(--color-warm-stone)' }}>
                  chevron_right
                </span>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
