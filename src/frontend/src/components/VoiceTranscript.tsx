import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  transcript: string;
  isActive: boolean;
}

export function VoiceTranscript({ transcript, isActive }: Props) {
  const show = isActive || !!transcript;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="z-20 font-switzer mx-auto mb-2"
          role="status"
          aria-live="polite"
          aria-label="Voice transcript"
          style={{
            maxWidth:     480,
            background:   'var(--color-frosted-white)',
            border:       '1px solid var(--color-warm-stone)',
            borderRadius: '8px',
            padding:      '8px 16px',
            boxShadow:    '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-2">
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#e84040', flexShrink: 0, boxShadow: '0 0 6px rgba(232, 64, 64, 0.4)' }}
              />
            )}
            <p style={{ fontSize: '14px', color: 'var(--color-charcoal-body)', margin: 0, fontWeight: 500 }}>
              {transcript || (isActive ? 'Listening...' : '')}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
