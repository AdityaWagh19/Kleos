import { useState, useRef, useEffect } from 'react';
import type { Branch, ActivityEvent } from '../types';

interface Props {
  open: boolean;
  canvasId: string | null;
  branchId: string;
  branches: Branch[];
  activeBranchId: string;
  compareMode: boolean;
  activityEvents: ActivityEvent[];
  incognito: boolean;
  onClose: () => void;
  onBranchSwitch: (id: string) => void;
  onCompare: (branchA: string, branchB: string) => void;
  onBranchCreated: (b: Branch) => void;
  onOpenMemory: () => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  onOpenSessionAudit?: () => void;
}

export function HamburgerDrawer({
  open,
  canvasId,
  branches,
  activeBranchId,
  compareMode,
  activityEvents,
  incognito,
  onClose,
  onBranchSwitch,
  onCompare,
  onBranchCreated,
  onOpenMemory,
  onOpenExport,
  onOpenShortcuts,
  onOpenSessionAudit,
}: Props) {
  // Focus management
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  // Branch creation
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  
  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || !canvasId) return;
    try {
      // Assuming api is passed in or imported
      const { api } = await import('../services/api');
      const res = await api.post<{ branch_id: string }>(`/api/canvas/${canvasId}/branch`, {
        name: newBranchName.trim(),
        based_on_branch_id: activeBranchId,
      });
      onBranchCreated({
        id: res.branch_id,
        canvas_id: canvasId,
        name: newBranchName.trim(),
        created_at: new Date().toISOString(),
        status: 'active',
      });
      onBranchSwitch(res.branch_id);
      setIsCreatingBranch(false);
      setNewBranchName('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-50 transition-opacity backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 bottom-0 w-[340px] shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col font-switzer ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: 'var(--header-height, 48px)', background: 'var(--color-frosted-white)', borderLeft: '1px solid var(--color-warm-stone)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-white" style={{ borderBottom: '1px solid var(--color-warm-stone)' }}>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-charcoal-body)' }}>Workspace Menu</h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="material-symbols-outlined text-gray-400 hover:text-gray-800 transition-colors p-1"
            aria-label="Close menu"
          >
            close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          
          {/* Section: Branches */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-slate-caption)' }}>
              Branches
            </h3>
            <div className="space-y-2">
              {branches.map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <button
                    onClick={() => onBranchSwitch(b.id)}
                    className={`flex-1 text-left px-3 py-2.5 rounded-md text-[13px] transition-colors border ${
                      b.id === activeBranchId 
                        ? 'bg-gray-100 border-gray-300 font-semibold shadow-sm' 
                        : 'bg-white border-transparent hover:border-gray-200 shadow-sm'
                    }`}
                    style={{ color: 'var(--color-charcoal-body)' }}
                  >
                    {b.name}
                    {b.id === activeBranchId && <span className="ml-2 text-xs font-normal text-gray-500">(active)</span>}
                  </button>
                  {b.id !== activeBranchId && (
                    <button
                      onClick={() => onCompare(activeBranchId, b.id)}
                      className={`material-symbols-outlined p-1 rounded-md transition-colors border ${compareMode ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 hover:text-gray-800 hover:border-gray-300 shadow-sm'}`}
                      style={{ fontSize: '18px' }}
                      title="Compare with active"
                      aria-label={`Compare with ${b.name}`}
                    >
                      compare_arrows
                    </button>
                  )}
                </div>
              ))}

              {isCreatingBranch ? (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    autoFocus
                    className="flex-1 text-[13px] px-3 py-2 border rounded-md outline-none focus:border-gray-500 shadow-sm"
                    style={{ borderColor: 'var(--color-warm-stone)', color: 'var(--color-charcoal-body)' }}
                    placeholder="Branch name..."
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateBranch();
                      if (e.key === 'Escape') setIsCreatingBranch(false);
                    }}
                  />
                  <button onClick={handleCreateBranch} className="material-symbols-outlined text-green-600 hover:opacity-70 p-1">check_circle</button>
                  <button onClick={() => setIsCreatingBranch(false)} className="material-symbols-outlined text-gray-400 hover:text-gray-800 p-1">cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreatingBranch(true)}
                  className="flex items-center gap-1.5 text-[12px] font-medium mt-3 transition-colors hover:text-gray-800"
                  style={{ color: 'var(--color-slate-caption)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                  New Branch (B)
                </button>
              )}
            </div>
          </section>

          {/* Section: Activity Log (Preview) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-slate-caption)' }}>
                Activity Log
              </h3>
            </div>
            {activityEvents.length === 0 ? (
              <p className="text-[12px] text-gray-400 italic">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activityEvents.slice(0, 5).map(e => (
                  <div key={e.event_id} className="text-[12px] flex gap-3 pb-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-400 shrink-0 w-12 font-mono text-[10px] mt-0.5">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ color: 'var(--color-charcoal-body)' }}>
                      {e.author === 'user' ? 'You ' : 'Kleos '} 
                      <span className="font-semibold text-transform-capitalize">{e.event_type.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                ))}
                {activityEvents.length > 5 && (
                  <p className="text-[11px] text-gray-500 mt-3 cursor-pointer hover:text-gray-800 font-medium transition-colors">View all {activityEvents.length} events...</p>
                )}
              </div>
            )}
          </section>

          {/* Section: Tools */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-slate-caption)' }}>
              Tools
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => { onClose(); onOpenMemory(); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors hover:bg-gray-100"
                style={{ color: 'var(--color-charcoal-body)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}>memory</span>
                Memory Panel
              </button>
              <button
                onClick={() => { onClose(); onOpenExport(); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors hover:bg-gray-100"
                style={{ color: 'var(--color-charcoal-body)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}>ios_share</span>
                Export Canvas
              </button>
              <button
                onClick={() => { onClose(); onOpenShortcuts(); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors hover:bg-gray-100"
                style={{ color: 'var(--color-charcoal-body)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}>keyboard</span>
                Keyboard Shortcuts
              </button>
              {onOpenSessionAudit && (
                <button
                  onClick={() => { onClose(); onOpenSessionAudit(); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors hover:bg-gray-100"
                  style={{ color: 'var(--color-charcoal-body)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}>verified_user</span>
                  Session Audit
                </button>
              )}
            </div>
          </section>

          {/* Section: Settings */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-slate-caption)' }}>
              Settings
            </h3>
            <div className="space-y-2 text-[13px] bg-white p-4 rounded-lg border shadow-sm" style={{ borderColor: 'var(--color-warm-stone)', color: 'var(--color-charcoal-body)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-slate-caption)' }}>incognito</span>
                  Incognito Mode
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${incognito ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {incognito ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed m-0">
                When enabled, Kleos will not write anything to long-term or session memory.
              </p>
            </div>
          </section>

          {/* Section: Resources */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-slate-caption)' }}>
              Resources
            </h3>
            <div className="space-y-1">
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors hover:bg-gray-100"
                style={{ color: 'var(--color-charcoal-body)', textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}>menu_book</span>
                Documentation
              </a>
              <a
                href="/research"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] rounded-md transition-colors hover:bg-gray-100"
                style={{ color: 'var(--color-charcoal-body)', textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-slate-caption)' }}>science</span>
                Research Methods
              </a>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
