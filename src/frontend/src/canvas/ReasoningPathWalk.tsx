import { motion, AnimatePresence } from 'framer-motion';
import type { ReasoningStep } from '../types';

interface Props {
  active:       boolean;
  steps:        ReasoningStep[];
  currentStep:  number;
  onNext:       () => void;
  onPrev:       () => void;
  onFeedback:   (positive: boolean) => void;
  onExit:       () => void;
}

export function ReasoningPathWalk({
  active, steps, currentStep, onNext, onPrev, onFeedback, onExit,
}: Props) {
  const isLast = currentStep >= steps.length - 1;
  const step   = steps[currentStep];

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Canvas dimming overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-20"
            style={{ background: '#111111' }}
          />

          {/* Narration card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute left-1/2 -translate-x-1/2 z-30"
            style={{
              bottom:       16,
              width:        480,
              background:   '#1a1a1a',
              border:       '1px solid #2b2b2b',
              borderRadius: '12px',
              padding:      '16px',
            }}
          >
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: '10px', color: '#9c9c9c' }}>
                Step {currentStep + 1} of {steps.length}
              </span>
              <div style={{ flex: 1, height: 2, background: '#2b2b2b', borderRadius: '9999px' }}>
                <div style={{
                  width:        `${((currentStep + 1) / steps.length) * 100}%`,
                  height:       '100%',
                  background:   '#e5ff5d',
                  borderRadius: '9999px',
                  transition:   'width 0.3s',
                }} />
              </div>
            </div>

            {/* Step content */}
            {step && (
              <div className="mb-3">
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#f9f9f9', marginBottom: 4 }}>
                  {step.action.replace(/_/g, ' ')}
                </p>
                <p style={{ fontSize: '12px', color: '#9c9c9c', margin: 0 }}>{step.detail}</p>
              </div>
            )}

            {/* Feedback at final step */}
            {isLast && (
              <div className="mb-3 p-3" style={{ background: '#2b2b2b', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#f9f9f9', marginBottom: 8 }}>
                  Did this reasoning make sense?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onFeedback(true)}
                    className="flex items-center gap-1 px-2 py-1"
                    style={{ background: '#4caf7d', color: '#111111', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>thumb_up</span>
                    Yes
                  </button>
                  <button
                    onClick={() => onFeedback(false)}
                    className="flex items-center gap-1 px-2 py-1"
                    style={{ background: '#e84040', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>thumb_down</span>
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={onPrev} disabled={currentStep === 0}
                      className="flex items-center gap-1 disabled:opacity-30"
                      style={{ fontSize: '11px', color: '#9c9c9c' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
                Previous
              </button>
              <button onClick={onExit} style={{ fontSize: '11px', color: '#9c9c9c' }}>
                Exit Walk (Esc)
              </button>
              {!isLast && (
                <button onClick={onNext} className="flex items-center gap-1"
                        style={{ fontSize: '11px', color: '#f9f9f9' }}>
                  Next
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
