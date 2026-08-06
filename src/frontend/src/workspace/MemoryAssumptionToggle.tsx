interface Props {
  memoryOpen: boolean;
  auditOpen: boolean;
  onMemoryToggle: () => void;
  onAuditToggle: () => void;
  memoryCount: number;
  assumptionCount: number;
}

export function MemoryAssumptionToggle({
  memoryOpen,
  auditOpen,
  onMemoryToggle,
  onAuditToggle,
  memoryCount,
  assumptionCount,
}: Props) {
  return (
    <div
      className="absolute bottom-6 left-16 flex rounded-lg shadow-sm border overflow-hidden z-40 transition-colors"
      style={{
        background: 'var(--color-frosted-white)',
        borderColor: 'var(--color-warm-stone)',
        fontFamily: 'var(--font-switzer)',
      }}
    >
      <button
        onClick={onMemoryToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
          memoryOpen ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
        style={{ color: 'var(--color-charcoal-body)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>memory</span>
        Memory
        {memoryCount > 0 && (
          <span className="ml-1 bg-gray-200 text-gray-700 px-1.5 rounded-full text-[10px]">
            {memoryCount}
          </span>
        )}
      </button>

      <div className="w-px" style={{ background: 'var(--color-warm-stone)' }} />

      <button
        onClick={onAuditToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
          auditOpen ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
        style={{ color: 'var(--color-charcoal-body)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>psychology_alt</span>
        Assumptions
        {assumptionCount > 0 && (
          <span className="ml-1 bg-yellow-100 text-yellow-800 px-1.5 rounded-full text-[10px]">
            {assumptionCount}
          </span>
        )}
      </button>
    </div>
  );
}
