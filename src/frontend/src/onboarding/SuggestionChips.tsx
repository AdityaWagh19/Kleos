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
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        >
          <div className="flex flex-col items-center gap-3 pointer-events-auto">
            <p style={{ fontSize: '12px', color: '#565656', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              How would you like to start?
            </p>
            <div className="flex flex-wrap gap-2 justify-center" style={{ maxWidth: 480 }}>
              {CHIPS.map(({ label, icon, note, action }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => action(props)}
                  className="flex items-center gap-1.5 px-3 py-2 transition-colors"
                  style={{
                    background:   '#2b2b2b',
                    border:       '1px solid #565656',
                    borderRadius: '4px',
                    fontSize:     '12px',
                    color:        '#9c9c9c',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{icon}</span>
                  {label}
                  {note && (
                    <span style={{ fontSize: '9px', color: '#e5ff5d', marginLeft: 4 }}>{note}</span>
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
