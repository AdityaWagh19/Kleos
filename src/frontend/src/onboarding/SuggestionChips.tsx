import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
  onStartVoice: () => void;
  onFocusText:  (placeholder?: string) => void;
  onOpenDrop:   () => void;
}

const CHIPS: Array<{
  label: string;
  icon:  string;
  note?: string;
  action: (props: Props) => void;
}> = [
  {
    label:  'Drop your documents here',
    icon:   'upload_file',
    action: p => p.onOpenDrop(),
  },
  {
    label:  'Say something',
    icon:   'mic',
    note:   '← primary input',
    action: p => p.onStartVoice(),
  },
  {
    label:  'Type an idea',
    icon:   'edit',
    action: p => p.onFocusText(),
  },
  {
    label:  "Describe what you're deciding",
    icon:   'psychology',
    action: p => p.onFocusText("What decision are you working through?"),
  },
];

export function SuggestionChips(props: Props) {
  return (
    <AnimatePresence>
      {props.visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 font-switzer"
        >
          <div className="flex flex-col items-center gap-4 pointer-events-auto">
            <p style={{ fontSize: '12px', color: 'var(--color-slate-caption)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              How would you like to start?
            </p>
            <div className="flex flex-wrap gap-3 justify-center" style={{ maxWidth: 480 }}>
              {CHIPS.map(({ label, icon, note, action }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => action(props)}
                  className="flex items-center gap-2 px-4 py-2.5 transition-colors shadow-sm outline-none"
                  style={{
                    background:   'var(--color-frosted-white)',
                    border:       '1px solid var(--color-warm-stone)',
                    borderRadius: '8px',
                    fontSize:     '13px',
                    fontWeight:   500,
                    color:        'var(--color-charcoal-body)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-slate-caption)' }}>{icon}</span>
                  {label}
                  {note && (
                    <span style={{ fontSize: '10px', color: '#e65100', marginLeft: 6, fontWeight: 600 }}>{note}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
