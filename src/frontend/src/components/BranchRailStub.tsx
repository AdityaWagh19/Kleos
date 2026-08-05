/** Phase 2 stub — replaced by full BranchRail in Phase 6 */
export function BranchRailStub() {
  return (
    <div
      className="h-9 flex items-center px-4 gap-2 shrink-0"
      style={{ background: '#1a1a1a', borderBottom: '1px solid #2b2b2b' }}
    >
      <button
        className="px-3 py-1 text-[11px] font-medium tracking-[0.03em]"
        style={{
          background:   '#2b2b2b',
          color:        '#f9f9f9',
          border:       '1px solid #e5ff5d',
          borderRadius: '4px',
        }}
      >
        main
      </button>
      <span
        className="text-[10px] uppercase tracking-[0.04em] ml-2"
        style={{ color: '#565656' }}
      >
        Branch Rail
      </span>
    </div>
  );
}
