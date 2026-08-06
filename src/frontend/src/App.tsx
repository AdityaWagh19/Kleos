import { useState, useEffect, useCallback, useRef } from 'react';
import { KleosCanvas } from './canvas/KleosCanvas';
import { ModeSelector } from './onboarding/ModeSelector';
import { SuggestionChips } from './onboarding/SuggestionChips';
import { StatusPill } from './components/StatusPill';
import { ModeIndicator } from './components/ModeIndicator';
import { ReasoningRibbon } from './components/ReasoningRibbon';
import { MemoryPanel } from './panels/MemoryPanel';
import { AssumptionAuditPanel } from './panels/AssumptionAuditPanel';
import { MemoryNegotiationCard } from './cards/MemoryNegotiationCard';
import { SessionMemoryAuditCard } from './cards/SessionMemoryAuditCard';
import { ExportDialog } from './cards/ExportDialog';
import { BranchRail } from './components/BranchRail';
import { PauseStopControls } from './components/PauseStopControls';
import { VoiceTranscript } from './components/VoiceTranscript';
import { ActivityLog } from './panels/ActivityLog';
import { SourceFilter } from './components/SourceFilter';
import { TextInputBar } from './components/TextInputBar';
import { useVoice } from './hooks/useVoice';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { api } from './services/api';
import type {
  WorkspaceMode, Assumption, Branch, ReasoningStep,
  ActivityEvent, ProvenanceType,
} from './types';

// ─── App shell ──────────────────────────────────────────────────────────────

export default function App() {
  // Canvas lifecycle
  const [canvasId, setCanvasId]     = useState<string | null>(null);
  const [branchId, setBranchId]     = useState<string>('');
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState<string | null>(null);

  // Workspace mode
  const [mode,         setMode]         = useState<WorkspaceMode>('analytical');
  const [modeSelected, setModeSelected] = useState(false);

  // Canvas state
  const [hasNodes] = useState(false);
  const [branches,  setBranches]  = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState('');
  const [compareMode, setCompareMode]       = useState(false);

  // AI compilation state
  const [ribbonSteps,  setRibbonSteps] = useState<ReasoningStep[]>([]);
  const [isCompiling,  setIsCompiling] = useState(false);
  const [pillState,    setPillState]   = useState<'working' | 'listening' | 'ready'>('ready');
  const [dropError,    setDropError]   = useState<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Panels
  const [memoryOpen,      setMemoryOpen]      = useState(false);
  const [auditOpen,       setAuditOpen]       = useState(false);
  const [activityOpen,    setActivityOpen]    = useState(false);
  const [exportOpen,      setExportOpen]      = useState(false);
  const [showAuditCard,   setShowAuditCard]   = useState(false);
  const [auditItems,      setAuditItems]      = useState<Array<{ memory_id: string; text: string; confidence: 'low' | 'medium' | 'high' }>>([]);
  const [assumptions]     = useState<Assumption[]>([]);
  const [activityEvents]  = useState<ActivityEvent[]>([]);
  const [incognito,       setIncognito]       = useState(false);

  // Memory negotiation card
  const [negCardOpen, setNegCardOpen] = useState(false);
  const [negCardObs,  setNegCardObs]  = useState('I noticed a pattern in your session.');

  // Voice
  const [transcript, setTranscript] = useState('');
  const [sourceFilter, setSourceFilter] = useState<ProvenanceType | null>(null);

  // Incognito visual state
  const [showIncognitoBorder, setShowIncognitoBorder] = useState(false);

  // ── Bootstrap ───────────────────────────────────────────────────────────

  useEffect(() => {
    api.post<{ id: string; branch_id: string }>('/api/canvas', { workspace_mode: 'analytical' })
      .then(res => {
        setCanvasId(res.id);
        setBranchId(res.branch_id);
        setActiveBranchId(res.branch_id);
        setBranches([{ id: res.branch_id, canvas_id: res.id, name: 'main', created_at: new Date().toISOString(), status: 'active' }]);
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  // ── Text / file drop ─────────────────────────────────────────────────────

  const handleTextDrop = useCallback(async (text: string) => {
    if (!canvasId || !branchId) return;
    setDropError(null);
    setIsCompiling(true);
    setPillState('working');
    setRibbonSteps([]);

    try {
      const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

      // Open SSE stream first to capture ribbon steps
      const streamUrl = `${base}/api/canvas/${canvasId}/stream?text=${encodeURIComponent(text)}&workspace_mode=${mode}&branch_id=${branchId}`;
      const es = new EventSource(streamUrl);
      sseRef.current = es;

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data as string) as { type: string; data?: unknown; observation?: string };
          if (payload.type === 'step' && payload.data) {
            setRibbonSteps(prev => [...prev, payload.data as ReasoningStep]);
          } else if (payload.type === 'compilation') {
            // Nodes are NOT in DB yet — backend writes AFTER emitting this event.
            // Do NOT reload canvas here. Wait for 'done'.
            setPillState('working'); // keep working indicator until done
          } else if (payload.type === 'memory_card_trigger') {
            // Fix 5: Show Memory Negotiation Card after compilation
            if (payload.observation) {
              setNegCardObs(payload.observation as string);
              setNegCardOpen(true);
            }
          } else if (payload.type === 'done') {
            // Nodes are now persisted in DB — safe to reload canvas
            es.close();
            sseRef.current = null;
            setIsCompiling(false);
            setPillState('ready');
            window.dispatchEvent(new CustomEvent('kleos:reload-canvas'));
          } else if (payload.type === 'error') {
            es.close();
            sseRef.current = null;
            setDropError('Compilation failed — check backend logs.');
            setIsCompiling(false);
            setPillState('ready');
          }
        } catch {}
      };
      es.onerror = () => {
        es.close();
        setDropError('Connection error during compilation.');
        setIsCompiling(false);
        setPillState('ready');
      };
    } catch (err) {
      setDropError(String(err));
      setIsCompiling(false);
      setPillState('ready');
    }
  }, [canvasId, branchId, mode]);

  // ── Mode selection ───────────────────────────────────────────────────────

  const handleModeSelect = useCallback(async (m: WorkspaceMode) => {
    setMode(m);
    setModeSelected(true);
    if (canvasId) await api.put(`/api/canvas/${canvasId}/mode?mode=${m}`, {});
  }, [canvasId]);

  // ── Voice ────────────────────────────────────────────────────────────────

  const { startVoice, stopVoice, status: voiceStatus } = useVoice({
    canvasId: canvasId ?? '',
    onToolCall: (tool, _args, _result) => {
      // Reload canvas whenever a tool call modifies canvas state
      const canvasMutatingTools = new Set([
        'create_node', 'create_edge', 'merge_nodes', 'collapse_cluster',
        'flag_contradiction', 'create_branch',
      ]);
      if (canvasMutatingTools.has(tool)) {
        // Small delay to ensure Supabase write completes before reload
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('kleos:reload-canvas'));
        }, 600);
      }
    },
    onTranscript: (text, _isFinal) => setTranscript(text),
    onStatusChange: (s) => {
      if (s === 'listening')         setPillState('listening');
      else if (s === 'idle')         setPillState('ready');
      else if (s === 'reconnecting') setPillState('listening');
    },
  });

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  useKeyboardShortcuts({
    onBranch:  () => { /* Branch Rail handles UI */ },
    onMerge:   () => { /* TODO Phase post-9 */ },
    onCompare: () => setCompareMode(c => !c),
    onTrace:   () => { /* Reasoning Path Walk launched from node context menu */ },
    onPin:     () => { /* TODO */ },
    onDismiss: () => {
      setMemoryOpen(false);
      setAuditOpen(false);
      setNegCardOpen(false);
      setExportOpen(false);
      setActivityOpen(false);
      setCompareMode(false);
    },
  });

  // ── Incognito ────────────────────────────────────────────────────────────

  const toggleIncognito = async () => {
    if (!canvasId) return;
    const next = !incognito;
    setIncognito(next);
    setShowIncognitoBorder(next);
    await api.put(`/api/canvas/${canvasId}/incognito?enabled=${next}`, {});
  };

  // ── Canvas close → Session Audit ────────────────────────────────────────
  // Called externally when user clicks "Close canvas" (wired in a future nav bar)
  // Called when user closes canvas (wired to a "Close" button in future nav iterations)
  const triggerSessionAudit = useCallback(async () => {
    if (!canvasId || incognito) return;
    const result = await api.get<{ items: typeof auditItems }>(`/api/canvas/${canvasId}/session-audit`);
    if (result.items.length > 0) {
      setAuditItems(result.items);
      setShowAuditCard(true);
    }
  }, [canvasId, incognito]); // eslint-disable-line react-hooks/exhaustive-deps
  void triggerSessionAudit; // exposed for external caller

  // ── Loading / error states ───────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center"
         style={{ background: '#111111', color: '#9c9c9c', fontSize: '12px' }}>
      Initialising canvas...
    </div>
  );
  if (error || !canvasId) return (
    <div className="flex h-screen w-screen items-center justify-center text-center p-6"
         style={{ background: '#111111', color: '#e84040', fontSize: '12px' }}>
      Failed to connect to backend. Is it running on port 8000?<br />{error}
    </div>
  );

  // ── First-use Mode Selector ──────────────────────────────────────────────

  if (!modeSelected) {
    return <ModeSelector onSelect={handleModeSelect} />;
  }

  // ── Main canvas layout ───────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#111111' }}>
      {/* ── Left panel: Memory ── */}
      {memoryOpen && (
        <MemoryPanel open={memoryOpen} canvasId={canvasId} onClose={() => setMemoryOpen(false)} />
      )}

      {/* ── Main canvas area ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* Header bar */}
        <div className="flex items-center gap-2 px-4 shrink-0"
             style={{ height: '48px', background: '#1a1a1a', borderBottom: '1px solid #2b2b2b' }}>

          {/* Memory panel toggle */}
          <button onClick={() => setMemoryOpen(o => !o)} title="Memory Panel"
                  className="material-symbols-outlined transition-colors"
                  style={{ fontSize: '18px', color: memoryOpen ? '#e5ff5d' : '#9c9c9c' }}>
            memory
          </button>

          {/* Mode indicator — click to cycle through modes */}
          <ModeIndicator
            mode={mode}
            onClick={async () => {
              const ORDER: WorkspaceMode[] = ['analytical', 'creative', 'critical', 'strategic'];
              const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
              setMode(next);
              if (canvasId) await api.put(`/api/canvas/${canvasId}/mode?mode=${next}`, {});
            }}
          />

          {/* Source filter */}
          <SourceFilter activeFilter={sourceFilter} onFilter={setSourceFilter} />

          <div className="flex-1" />

          {/* Status Pill */}
          <StatusPill state={pillState} lastSteps={ribbonSteps.slice(-3)} />

          {/* Pause/Stop controls */}
          <PauseStopControls
            isCompiling={isCompiling}
            onPause={() => { sseRef.current?.close(); setIsCompiling(false); setPillState('ready'); }}
            onStop={()  => { sseRef.current?.close(); setIsCompiling(false); setPillState('ready'); }}
          />

          {/* Voice toggle */}
          <button
            onClick={() => voiceStatus === 'idle' ? startVoice() : stopVoice()}
            title={voiceStatus === 'idle' ? 'Start voice' : 'Stop voice'}
            className="material-symbols-outlined transition-colors"
            style={{ fontSize: '18px', color: voiceStatus !== 'idle' ? '#e5ff5d' : '#9c9c9c' }}
          >
            {voiceStatus !== 'idle' ? 'mic' : 'mic_off'}
          </button>

          {/* Incognito toggle */}
          <button onClick={toggleIncognito} title={incognito ? 'Incognito ON — no memory writes' : 'Enable Incognito'}
                  className="material-symbols-outlined transition-colors"
                  style={{ fontSize: '18px', color: incognito ? '#f9f9f9' : '#9c9c9c' }}>
            {incognito ? 'visibility_off' : 'visibility'}
          </button>

          {/* Assumption Audit Panel toggle */}
          <button onClick={() => setAuditOpen(o => !o)} title="Assumption Audit Panel"
                  className="material-symbols-outlined transition-colors"
                  style={{ fontSize: '18px', color: auditOpen ? '#e5ff5d' : '#9c9c9c' }}>
            help
          </button>

          {/* Activity Log toggle */}
          <button onClick={() => setActivityOpen(o => !o)} title="Activity Log"
                  className="material-symbols-outlined transition-colors"
                  style={{ fontSize: '18px', color: activityOpen ? '#e5ff5d' : '#9c9c9c' }}>
            history
          </button>

          {/* Export */}
          <button onClick={() => setExportOpen(true)} title="Export"
                  className="material-symbols-outlined transition-colors"
                  style={{ fontSize: '18px', color: '#9c9c9c' }}>
            download
          </button>

          {/* Incognito badge */}
          {incognito && (
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#f9f9f9',
                           background: '#2b2b2b', border: '1px solid #f9f9f9',
                           borderRadius: '4px', padding: '2px 8px' }}>
              Incognito
            </span>
          )}
        </div>

        {/* Branch Rail */}
        <BranchRail
          canvasId={canvasId}
          branches={branches}
          activeBranchId={activeBranchId}
          compareMode={compareMode}
          onBranchSwitch={id => setActiveBranchId(id)}
          onCompare={(_a, _b) => setCompareMode(true)}
          onBranchCreated={b => setBranches(prev => [...prev, b])}
        />

        {/* Canvas */}
        <div className="flex-1 relative">
          <KleosCanvas canvasId={canvasId} />

          {/* Suggestion chips (empty canvas) */}
          <SuggestionChips
            visible={!hasNodes}
            onStartVoice={startVoice}
            onFocusText={() => {}}
            onOpenDrop={() => {}}
          />

          {/* Incognito border */}
          {showIncognitoBorder && (
            <div className="absolute inset-0 pointer-events-none"
                 style={{ boxShadow: 'inset 0 0 0 3px #f9f9f9', borderRadius: 0 }} />
          )}

          {/* Right panel: Assumption Audit */}
          <AssumptionAuditPanel
            open={auditOpen}
            assumptions={assumptions}
            onClose={() => setAuditOpen(false)}
            onHoverAssumption={() => {}}
            onLeaveAssumption={() => {}}
            onOverride={() => {}}
            onAccept={() => {}}
            onDelete={() => {}}
            onAskAI={() => {}}
          />

          {/* Memory Negotiation Card */}
          <MemoryNegotiationCard
            open={negCardOpen}
            observation={negCardObs}
            onChoice={async (scope) => {
              setNegCardOpen(false);
              if (scope !== 'later' && scope !== 'none') {
                // Ratify the most recent Tier 2 memory
                const mems = await api.get<Array<{ id: string; tier: number; quarantined: boolean }>>(
                  `/api/canvas/${canvasId}/memory`
                );
                const pending = mems.filter(m => m.tier === 2 && m.quarantined);
                if (pending.length > 0) {
                  await api.post(`/api/canvas/${canvasId}/memory/${pending[0].id}/ratify`, { scope });
                }
              }
            }}
          />

          {/* Voice transcript */}
          <VoiceTranscript transcript={transcript} isActive={voiceStatus !== 'idle'} />

          {/* Reasoning Ribbon */}
          <ReasoningRibbon
            steps={ribbonSteps}
            isActive={isCompiling}
            onStepClick={() => {}}
          />
        </div>

        {/* Drop error banner */}
        {dropError && (
          <div className="px-4 py-2 flex items-center justify-between"
               style={{ background: '#3a1a1a', borderTop: '1px solid #e84040' }}>
            <span style={{ fontSize: '12px', color: '#e84040' }}>{dropError}</span>
            <button onClick={() => setDropError(null)}
                    className="material-symbols-outlined" style={{ fontSize: '16px', color: '#e84040' }}>
              close
            </button>
          </div>
        )}

        {/* Text input bar */}
        <TextInputBar
          onSubmit={handleTextDrop}
          isCompiling={isCompiling}
        />
      </main>

      {/* ── Overlays ── */}
      {activityOpen && (
        <ActivityLog open={activityOpen} events={activityEvents} onClose={() => setActivityOpen(false)} />
      )}

      {showAuditCard && (
        <SessionMemoryAuditCard
          canvasId={canvasId}
          items={auditItems}
          onComplete={() => { setShowAuditCard(false); setAuditItems([]); }}
        />
      )}

      <ExportDialog
        open={exportOpen}
        canvasId={canvasId}
        branchId={branchId}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
