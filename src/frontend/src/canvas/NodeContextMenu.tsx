import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  nodeId: string;
  nodeText: string;
  x: number;
  y: number;
  isPinned: boolean;
  selectedNodeIds: string[];
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
  onMerge: () => void;
  onCreateEdgeFrom: () => void;
  onViewProvenance: () => void;
  onAskAI: () => void;
  onClose: () => void;
}

export function NodeContextMenu({
  nodeId, nodeText, x, y, isPinned, selectedNodeIds,
  onEdit, onPin, onDelete, onMerge, onCreateEdgeFrom, onViewProvenance, onAskAI, onClose
}: Props) {
  const canMerge = selectedNodeIds.length > 1 && selectedNodeIds.includes(nodeId);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 shadow-xl rounded-lg py-1 flex flex-col font-switzer"
        style={{
          left: x,
          top: y,
          width: 220,
          background: 'var(--color-frosted-white)',
          border: '1px solid var(--color-warm-stone)',
        }}
      >
        <ContextMenuItem icon="edit" label="Edit text" onClick={() => { onEdit(); onClose(); }} />
        <ContextMenuItem icon={isPinned ? "keep_off" : "push_pin"} label={isPinned ? "Unpin node" : "Pin node"} onClick={() => { onPin(); onClose(); }} />
        <ContextMenuItem icon="polyline" label="Create connection" onClick={() => { onCreateEdgeFrom(); onClose(); }} />
        
        {canMerge && (
          <ContextMenuItem icon="merge" label={`Merge ${selectedNodeIds.length} selected`} onClick={() => { onMerge(); onClose(); }} />
        )}
        
        <div className="my-1 border-b" style={{ borderColor: 'var(--color-warm-stone)' }} />
        
        <ContextMenuItem icon="history_edu" label="View provenance" onClick={() => { onViewProvenance(); onClose(); }} />
        <ContextMenuItem icon="psychology" label="Ask AI about this" onClick={() => { onAskAI(); onClose(); }} />
        
        <div className="my-1 border-b" style={{ borderColor: 'var(--color-warm-stone)' }} />
        
        <ContextMenuItem icon="delete" label="Delete node" onClick={() => { onDelete(); onClose(); }} danger />
      </motion.div>
    </>
  );
}

function ContextMenuItem({ icon, label, onClick, danger = false }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 flex items-center gap-2 text-[13px] font-medium transition-colors hover:bg-gray-100 ${danger ? 'text-red-600 hover:text-red-700' : ''}`}
      style={{ color: danger ? '#e84040' : 'var(--color-charcoal-body)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </button>
  );
}
