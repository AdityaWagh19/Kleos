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
            style={{ background: 'var(--color-linen-canvas)' }}
          />

          {/* Narration card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute left-1/2 -translate-x-1/2 z-30 font-switzer shadow-2xl"
            style={{
              bottom:       24,
              width:        480,
              background:   'var(--color-frosted-white)',
              border:       '1px solid var(--color-warm-stone)',
              borderRadius: '12px',
              padding:      '20px',
            }}
          >
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: '11px', color: 'var(--color-slate-caption)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Step {currentStep + 1} of {steps.length}
              </span>
              <div style={{ flex: 1, height: 4, background: 'var(--color-warm-stone)', borderRadius: '9999px' }}>
                <div style={{
                  width:        `${((currentStep + 1) / steps.length) * 100}%`,
                  height:       '100%',
                  background:   'var(--color-graphite-ink)',
                  borderRadius: '9999px',
                  transition:   'width 0.3s',
                }} />
              </div>
            </div>

            {/* Step content */}
            {step && (
              <div className="mb-4">
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-charcoal-body)', marginBottom: 6, textTransform: 'capitalize' }}>
                  {step.action.replace(/_/g, ' ')}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-slate-caption)', margin: 0, lineHeight: '1.5' }}>{step.detail}</p>
              </div>
            )}

            {/* Feedback at final step */}
            {isLast && (
              <div className="mb-4 p-4" style={{ background: '#f9f9f9', borderRadius: '8px', border: '1px solid var(--color-warm-stone)' }}>
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal-body)', marginBottom: 12, fontWeight: 500 }}>
                  Did this reasoning make sense?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onFeedback(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:opacity-80"
                    style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>thumb_up</span>
                    Yes
                  </button>
                  <button
                    onClick={() => onFeedback(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:opacity-80"
                    style={{ background: '#ffebee', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>thumb_down</span>
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--color-warm-stone)' }}>
              <button onClick={onPrev} disabled={currentStep === 0}
                      className="flex items-center gap-1 disabled:opacity-30 transition-colors hover:text-gray-800"
                      style={{ fontSize: '12px', color: 'var(--color-slate-caption)', fontWeight: 500 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                Previous
              </button>
              <button onClick={onExit} style={{ fontSize: '11px', color: 'var(--color-slate-caption)' }} className="hover:text-gray-800 transition-colors">
                Exit Walk (Esc)
              </button>
              {!isLast && (
                <button onClick={onNext} className="flex items-center gap-1 transition-colors hover:text-gray-800"
                        style={{ fontSize: '12px', color: 'var(--color-charcoal-body)', fontWeight: 600 }}>
                  Next
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
