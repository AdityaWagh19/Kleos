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
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
          style={{
            maxWidth:     480,
            background:   '#1a1a1a',
            border:       '1px solid #2b2b2b',
            borderRadius: '8px',
            padding:      '8px 16px',
          }}
        >
          <div className="flex items-center gap-2">
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#e5ff5d', flexShrink: 0 }}
              />
            )}
            <p style={{ fontSize: '13px', color: '#f9f9f9', margin: 0 }}>
              {transcript || (isActive ? 'Listening...' : '')}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
