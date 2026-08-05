import { motion, AnimatePresence } from 'framer-motion';

interface Keyframe {
  event_id:    string;
  timestamp:   string;
  event_type:  string;
  workspace_mode: string;
}

const EVENT_LABELS: Record<string, string> = {
  branch_created:       'Branch',
  memory_accepted:      'Memory saved',
  mode_changed:         'Mode changed',
  branch_committed:     'Branch committed',
  assumption_overridden:'Assumption changed',
};

interface Props {
  visible:         boolean;
  keyframes:       Keyframe[];
  currentPosition: number;   // 0–1
  onRewind:        (eventId: string) => void;
  onToggle:        () => void;
}

export function ThinkingTimeline({
  visible, keyframes, currentPosition, onRewind, onToggle,
}: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 56 }}
          exit={{ opacity: 0, height: 0 }}
          style={{ background: '#1a1a1a', borderTop: '1px solid #2b2b2b', overflow: 'hidden' }}
        >
          <div className="h-full flex items-center px-4 gap-3">
            {/* Track */}
            <div className="flex-1 relative" style={{ height: 32 }}>
              {/* Background track */}
              <div className="absolute"
                   style={{ top: '50%', left: 0, right: 0, height: 1, background: '#2b2b2b', transform: 'translateY(-50%)' }} />

              {/* Progress fill */}
              <div className="absolute"
                   style={{ top: '50%', left: 0, width: `${currentPosition * 100}%`,
                            height: 1, background: '#565656', transform: 'translateY(-50%)', transition: 'width 0.3s' }} />

              {/* Keyframe markers */}
              {keyframes.map((kf, i) => {
                const pct = keyframes.length > 1 ? i / (keyframes.length - 1) : 0;
                return (
                  <button
                    key={kf.event_id}
                    onClick={() => onRewind(kf.event_id)}
                    title={`${EVENT_LABELS[kf.event_type] ?? kf.event_type} — ${new Date(kf.timestamp).toLocaleTimeString()}`}
                    className="absolute group"
                    style={{ left: `${pct * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#2b2b2b', border: '1px solid #565656',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    className="group-hover:border-[#e5ff5d] group-hover:bg-[#e5ff5d]"
                    />
                  </button>
                );
              })}

              {/* Current position marker */}
              <div style={{
                position:    'absolute',
                left:        `${currentPosition * 100}%`,
                top:         '50%',
                transform:   'translate(-50%, -50%)',
                width:        12,
                height:       12,
                borderRadius: '50%',
                background:   '#e5ff5d',
                pointerEvents: 'none',
                transition:   'left 0.3s',
              }} />
            </div>

            {/* Toggle button */}
            <button onClick={onToggle} title="Hide timeline"
                    style={{ color: '#9c9c9c' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
