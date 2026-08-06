import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, openStream } from './services/api';
import { useVoice } from './hooks/useVoice';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Layout
import { WorkspaceChrome } from './workspace/WorkspaceChrome';
import { HamburgerDrawer } from './workspace/HamburgerDrawer';
import { BottomChatBar } from './workspace/BottomChatBar';
import { CanvasLeftRail } from './workspace/CanvasLeftRail';
import { MemoryAssumptionToggle } from './workspace/MemoryAssumptionToggle';
import { SourcesToggle } from './workspace/SourcesToggle';
import { ShortcutLegend } from './workspace/ShortcutLegend';

// Canvas
import { KleosCanvas } from './canvas/KleosCanvas';
import { useCanvas } from './hooks/useCanvas';

// Overlays/Panels
import { MemoryPanel } from './panels/MemoryPanel';
import { AssumptionAuditPanel } from './panels/AssumptionAuditPanel';
import { MemoryNegotiationCard } from './cards/MemoryNegotiationCard';
import { SessionMemoryAuditCard } from './cards/SessionMemoryAuditCard';
import { ExportDialog } from './cards/ExportDialog';
import { ActivityLog } from './panels/ActivityLog';
import { SuggestionChips } from './onboarding/SuggestionChips';
import { VoiceTranscript } from './components/VoiceTranscript';
import { ReasoningRibbon } from './components/ReasoningRibbon';

import type {
  WorkspaceMode, Assumption, Branch, ReasoningStep,
  ActivityEvent,
} from './types';

export default function App() {
  const { canvasId: urlCanvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();
  
  // ── Core State ───────────────────────────────────────────────────────────
  const [canvasId, setCanvasId] = useState<string | null>(urlCanvasId || null);
  const [branchId, setBranchId] = useState<string>('');
  const [title, setTitle] = useState<string | null>(null);
  const [mode, setMode] = useState<WorkspaceMode>('analytical');
  const [incognito, setIncognito] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Drawer State ─────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // ── Panel State ──────────────────────────────────────────────────────────
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // ── Compilation & Pipeline State ─────────────────────────────────────────
  const [isCompiling, setIsCompiling] = useState(false);
  const [ribbonSteps, setRibbonSteps] = useState<ReasoningStep[]>([]);
  const [dropError, setDropError] = useState<string | null>(null);
  const sseRef = useRef<{ close: () => void } | null>(null);

  // ── Audit & Negotiation ──────────────────────────────────────────────────
  const [showAuditCard, setShowAuditCard] = useState(false);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [negCardOpen, setNegCardOpen] = useState(false);
  const [negCardObs, setNegCardObs] = useState('');
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);

  // ── Canvas Hook ──────────────────────────────────────────────────────────
  const {
    nodes,
    status: pillState,
    setStatus: setPillState,
    loadCanvas,
    activeSourceFilter,
    setActiveSourceFilter,
    mergeNodes,
  } = useCanvas(canvasId || '', branchId);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!urlCanvasId) {
      setError('No canvas ID provided');
      setLoading(false);
      return;
    }
    api.get<{ canvas: any, branches: Branch[] }>(`/api/canvas/${urlCanvasId}`)
      .then(res => {
        setCanvasId(res.canvas.id);
        setTitle(res.canvas.title);
        setMode(res.canvas.workspace_mode as WorkspaceMode);
        setIncognito(res.canvas.incognito_mode);
        const active = res.branches.find(b => b.status === 'active') || res.branches[0];
        if (active) setBranchId(active.id);
        setBranches(res.branches);
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, [urlCanvasId]);

  // Load assumptions & activity when panels open
  useEffect(() => {
    if (auditOpen && canvasId) {
      api.get<{ assumptions: Assumption[] }>(`/api/canvas/${canvasId}/assumptions?branch_id=${branchId}`)
        .then(res => setAssumptions(res.assumptions));
    }
  }, [auditOpen, canvasId, branchId]);

  useEffect(() => {
    if (drawerOpen && canvasId) {
      api.get<{ events: ActivityEvent[] }>(`/api/canvas/${canvasId}/activity`)
        .then(res => setActivityEvents(res.events));
    }
  }, [drawerOpen, canvasId]);

  // ── Input Drop ───────────────────────────────────────────────────────────
  const handleTextDrop = useCallback(async (text: string) => {
    if (!canvasId || !branchId) return;
    setDropError(null);
    setIsCompiling(true);
    setPillState('working');
    setRibbonSteps([]);

    try {
      const url = `/api/canvas/${canvasId}/stream?text=${encodeURIComponent(text)}&workspace_mode=${mode}&branch_id=${branchId}`;
      const sse = openStream(
        url,
        (payload) => {
          if (payload.type === 'step' && payload.data) {
            setRibbonSteps(prev => [...prev, payload.data as ReasoningStep]);
          } else if (payload.type === 'memory_card_trigger') {
            if (payload.observation) {
              setNegCardObs(payload.observation as string);
              setNegCardOpen(true);
            }
          }
        },
        () => {
          sseRef.current = null;
          setIsCompiling(false);
          setPillState('ready');
          loadCanvas(); // DB is updated, load canvas
        },
        (msg) => {
          setDropError(msg);
          setIsCompiling(false);
          setPillState('ready');
        }
      );
      sseRef.current = sse;
    } catch (err) {
      setDropError(String(err));
      setIsCompiling(false);
      setPillState('ready');
    }
  }, [canvasId, branchId, mode, loadCanvas, setPillState]);

  const handleFileDrop = useCallback(async (file: File) => {
    if (!canvasId) return;
    setDropError(null);
    setIsCompiling(true);
    setPillState('working');
    setRibbonSteps([]);

    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.postFormData(`/api/canvas/${canvasId}/drop`, formData);
      loadCanvas();
    } catch (err) {
      setDropError(String(err));
    } finally {
      setIsCompiling(false);
      setPillState('ready');
    }
  }, [canvasId, loadCanvas, setPillState]);

  // ── Voice ────────────────────────────────────────────────────────────────
  const { startVoice, stopVoice, status: voiceStatus } = useVoice({
    canvasId: canvasId ?? '',
    onToolCall: (tool) => {
      const mutators = new Set(['create_node', 'create_edge', 'merge_nodes', 'create_branch']);
      if (mutators.has(tool)) setTimeout(loadCanvas, 600);
    },
    onStatusChange: (s) => {
      if (s === 'listening' || s === 'reconnecting') setPillState('listening');
      else if (s === 'idle') setPillState('ready');
    },
  });

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────
  useKeyboardShortcuts({
    onBranch: () => setDrawerOpen(true),
    onMerge: () => {
      if (selectedNodeIds.length >= 2) {
        setMergeDialogOpen(true);
      }
    },
    onCompare: () => setCompareMode(!compareMode),
    onTrace: () => { /* phase 6 */ },
    onPin: () => { /* phase 6 */ },
    onDismiss: () => {
      setMemoryOpen(false);
      setAuditOpen(false);
      setNegCardOpen(false);
      setExportOpen(false);
      setDrawerOpen(false);
      setShortcutsOpen(false);
    },
  });
  useEffect(() => {
    const handleLegend = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setShortcutsOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleLegend);
    return () => window.removeEventListener('keydown', handleLegend);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) return <div className="flex h-screen w-screen items-center justify-center text-xs text-gray-500">Initialising workspace...</div>;
  if (error || !canvasId) return <div className="flex h-screen w-screen items-center justify-center text-xs text-red-500">{error}</div>;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--color-linen-canvas)]">
      
      {/* ── Chrome ── */}
      <WorkspaceChrome
        canvasId={canvasId}
        title={title}
        mode={mode}
        incognito={incognito}
        onTitleChange={async (t) => {
          setTitle(t);
          await api.patch(`/api/canvas/${canvasId}/title`, { title: t });
        }}
        onModeChange={async (m) => {
          setMode(m);
          await api.put(`/api/canvas/${canvasId}/mode`, { mode: m });
        }}
        onIncognitoToggle={async () => {
          setIncognito(!incognito);
          await api.put(`/api/canvas/${canvasId}/incognito`, { enabled: !incognito });
        }}
        onExport={() => setExportOpen(true)}
        onHamburger={() => setDrawerOpen(true)}
      />

      {/* ── Main Canvas Area ── */}
      <div className="flex-1 relative flex">
        
        {/* Left Rail */}
        <CanvasLeftRail
          nodes={nodes}
          onNodeSelect={() => {}} // phase 6 focus
        />

        {/* Canvas (ReactFlow) */}
        <div className="flex-1 relative">
          <KleosCanvas canvasId={canvasId} branchId={branchId} onNodeSelect={setSelectedNodeIds} />

          <SuggestionChips
            visible={nodes.length === 0}
            onStartVoice={startVoice}
            onFocusText={() => document.querySelector<HTMLTextAreaElement>('.bottom-chat-bar textarea')?.focus()}
            onOpenDrop={() => document.querySelector<HTMLInputElement>('.bottom-chat-bar input[type="file"]')?.click()}
          />

          {/* ── Bottom Overlay Elements ── */}
          <MemoryAssumptionToggle
            memoryOpen={memoryOpen}
            auditOpen={auditOpen}
            onMemoryToggle={() => setMemoryOpen(!memoryOpen)}
            onAuditToggle={() => setAuditOpen(!auditOpen)}
            memoryCount={0} // TODO derived from useCanvas/memory cache
            assumptionCount={assumptions.length}
          />

          <SourcesToggle
            activeFilter={activeSourceFilter}
            onFilterChange={setActiveSourceFilter}
            sources={Array.from(new Set(nodes.filter(n => n.type === 'source').map(n => ({ id: n.data.provenance_type, name: n.data.text }))))}
          />

          <BottomChatBar
            canvasId={canvasId}
            branchId={branchId}
            isCompiling={isCompiling}
            pillState={pillState}
            onSubmit={handleTextDrop}
            onFileAttach={handleFileDrop}
            onVoiceToggle={() => voiceStatus === 'idle' ? startVoice() : stopVoice()}
            voiceActive={voiceStatus !== 'idle'}
            onPause={() => { sseRef.current?.close(); setIsCompiling(false); setPillState('ready'); }}
            onStop={() => { sseRef.current?.close(); setIsCompiling(false); setPillState('ready'); loadCanvas(); }}
          />

          <VoiceTranscript transcript="" isActive={voiceStatus !== 'idle'} />
          <ReasoningRibbon steps={ribbonSteps} isActive={isCompiling} onStepClick={() => {}} />

          {dropError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-100 text-red-800 text-xs rounded shadow z-50 flex items-center gap-2 border border-red-200">
              {dropError}
              <button onClick={() => setDropError(null)} className="material-symbols-outlined text-[16px]">close</button>
            </div>
          )}
        </div>

      </div>

      {/* ── Drawer & Modals ── */}
      <HamburgerDrawer
        open={drawerOpen}
        canvasId={canvasId}
        branchId={branchId}
        branches={branches}
        activeBranchId={branchId}
        compareMode={compareMode}
        activityEvents={activityEvents}
        incognito={incognito}
        onClose={() => setDrawerOpen(false)}
        onBranchSwitch={(id) => { setBranchId(id); setDrawerOpen(false); }}
        onCompare={() => setCompareMode(true)}
        onBranchCreated={(b) => setBranches([...branches, b])}
      />

      <ShortcutLegend open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {memoryOpen && <MemoryPanel open={memoryOpen} canvasId={canvasId} onClose={() => setMemoryOpen(false)} />}
      
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

      <MemoryNegotiationCard
        open={negCardOpen}
        observation={negCardObs}
        onChoice={async (scope) => {
          setNegCardOpen(false);
          if (scope !== 'later' && scope !== 'none') {
            const mems = await api.get<any[]>(`/api/canvas/${canvasId}/memory`);
            const pending = mems.filter(m => m.tier === 2 && m.quarantined);
            if (pending.length > 0) {
              await api.post(`/api/canvas/${canvasId}/memory/${pending[0].id}/ratify`, { scope });
            }
          }
        }}
      />

      {showAuditCard && <SessionMemoryAuditCard canvasId={canvasId} items={auditItems} onComplete={() => setShowAuditCard(false)} />}
      
      <ExportDialog open={exportOpen} canvasId={canvasId} branchId={branchId} onClose={() => setExportOpen(false)} />

      <NodeMergeDialog
        open={mergeDialogOpen}
        selectedNodeIds={selectedNodeIds}
        nodes={nodes}
        onCancel={() => setMergeDialogOpen(false)}
        onConfirm={async () => {
          await mergeNodes(selectedNodeIds, branchId);
          setMergeDialogOpen(false);
        }}
      />

    </div>
  );
}
