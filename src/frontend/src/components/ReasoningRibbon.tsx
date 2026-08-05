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
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 overflow-x-auto px-4"
          style={{
            height:     '36px',
            background: '#1a1a1a',
            borderTop:  '1px solid #2b2b2b',
          }}
        >
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => onStepClick(step)}
              title={step.detail}
              className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
            >
              <span
                className="flex items-center justify-center rounded-full text-[9px]"
                style={{
                  width:      16,
                  height:     16,
                  background: '#2b2b2b',
                  border:     '1px solid #565656',
                  color:      '#9c9c9c',
                }}
              >
                {step.step}
              </span>
              <span className="text-[11px] max-w-[180px] truncate" style={{ color: '#9c9c9c' }}>
                {step.action.replace(/_/g, ' ')}
              </span>
              {i < steps.length - 1 && (
                <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#565656' }}>
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
