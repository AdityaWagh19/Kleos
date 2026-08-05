import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isCompiling: boolean;
  onPause: () => void;
  onStop: () => void;
}

export function PauseStopControls({ isCompiling, onPause, onStop }: Props) {
  return (
    <AnimatePresence>
      {isCompiling && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex gap-1"
        >
          <button
            onClick={onPause}
            className="flex items-center gap-1 px-2 py-1 transition-colors"
            style={{ background: '#2b2b2b', border: '1px solid #f5c842',
                     color: '#f5c842', borderRadius: '4px', fontSize: '10px', fontWeight: 500 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>pause</span>
            Pause
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-1 px-2 py-1 transition-colors"
            style={{ background: '#2b2b2b', border: '1px solid #e84040',
                     color: '#e84040', borderRadius: '4px', fontSize: '10px', fontWeight: 500 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>stop</span>
            Stop
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
