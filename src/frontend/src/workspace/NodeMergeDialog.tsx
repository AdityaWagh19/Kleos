import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  selectedNodeIds: string[];
  nodes: { id: string; type: string; text: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function NodeMergeDialog({ open, selectedNodeIds, nodes, onConfirm, onCancel }: Props) {
  if (!open) return null;

  const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center font-switzer">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-md rounded-xl shadow-2xl p-5"
          style={{ background: 'var(--color-frosted-white)', border: '1px solid var(--color-warm-stone)' }}
        >
          <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--color-charcoal-body)' }}>
            Merge Selected Nodes
          </h3>
          <p className="text-[12px] mb-4" style={{ color: 'var(--color-slate-caption)' }}>
            AI will synthesize these {selectedNodes.length} nodes into one cohesive Insight node. The original nodes will be removed.
          </p>

          <div className="mb-5 max-h-40 overflow-y-auto space-y-2 pr-2">
            {selectedNodes.map(node => (
              <div key={node.id} className="flex gap-2 items-start p-2 rounded-md bg-white border" style={{ borderColor: 'var(--color-warm-stone)' }}>
                <span className="text-[10px] font-bold uppercase mt-0.5" style={{ color: 'var(--color-slate-caption)' }}>[{node.type}]</span>
                <span className="text-[12px] line-clamp-2" style={{ color: 'var(--color-charcoal-body)' }}>{node.text}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-[13px] font-medium rounded-md hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-slate-caption)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-[13px] font-semibold rounded-md shadow-sm transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ background: 'var(--color-graphite-ink)', color: '#ffffff' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>merge</span>
              Synthesize Insight
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
