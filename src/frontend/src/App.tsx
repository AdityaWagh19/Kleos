import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
import { ReactFlowProvider } from 'reactflow';
import { KleosCanvas } from './canvas/KleosCanvas';
import { useCanvas } from './hooks/useCanvas';

// Overlays/Panels
import { MemoryPanel } from './panels/MemoryPanel';
import { AssumptionAuditPanel } from './panels/AssumptionAuditPanel';
import { MemoryNegotiationCard } from './cards/MemoryNegotiationCard';
import { SessionMemoryAuditCard } from './cards/SessionMemoryAuditCard';
import { ExportDialog } from './cards/ExportDialog';
import { SuggestionChips } from './onboarding/SuggestionChips';
import { VoiceTranscript } from './components/VoiceTranscript';
import { ReasoningRibbon } from './components/ReasoningRibbon';
import { NodeMergeDialog } from './workspace/NodeMergeDialog';

import type {
  WorkspaceMode, Assumption, Branch, ReasoningStep,
  ActivityEvent,
} from './types';

// ── Helpers ──────────────────────────────────────────────────────────────────
interface CanvasState {
  nodes: any[];
  edges: any[];
}

function toReactFlowNode(n: any) {
  return {
    id: n.id,
    type: n.type ?? 'default',
    position: n.position ?? { x: 0, y: 0 },
    data: n.data ?? n,
  };
}

function toReactFlowEdge(e: any) {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type ?? 'default',
  };
}

export default function App() {
  const { canvasId: urlCanvasId } = useParams<{ canvasId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [compareBranchId, setCompareBranchId] = useState<string | null>(null);
  const [compareNodes, setCompareNodes] = useState<any[]>([]);
  const [compareEdges, setCompareEdges] = useState<any[]>([]);
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

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  // Warn before unload while compiling
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCompiling) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCompiling]);

  // ── Branch switching ──────────────────────────────────────────────────────
  const [isBranchSwitching, setIsBranchSwitching] = useState(false);
  const handleBranchSwitch = useCallback((id: string) => {
    setIsBranchSwitching(true);
    setBranchId(id);
    setSearchParams({ branch_id: id });
    setDrawerOpen(false);
    setTimeout(() => setIsBranchSwitching(false), 1500);
  }, [setSearchParams]);

  // ── Audit & Negotiation ──────────────────────────────────────────────────
  const [showAuditCard, setShowAuditCard] = useState(false);
  const [auditItems, setAuditItems] = useState<any[]>([]);

  const handleOpenSessionAudit = useCallback(async () => {
    if (!canvasId) return;
    try {
      const res = await api.get<{ items: any[] }>(`/api/canvas/${canvasId}/session-audit`);
      setAuditItems(res.items || []);
      setShowAuditCard(true);
    } catch (e) {
      console.error('Failed to load session audit:', e);
    }
  }, [canvasId]);

  const [negCardOpen, setNegCardOpen] = useState(false);
  const [negCardObs, setNegCardObs] = useState('');
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [modePromptBanner, setModePromptBanner] = useState<string | null>(null);

  // ── Canvas Hook ──────────────────────────────────────────────────────────
  const {
    nodes, edges,
    status: pillState,
    setStatus: setPillState,
    loadCanvas,
    activeSourceFilter,
    setActiveSourceFilter,
    mergeNodes,
    persistNodePosition,
    updateNodeText,
    updateNodeProperties,
    deleteNode,
    createEdge,
    pinNode,
    activateImpactHalo,
    clearImpactHalo,
    isLoading: isCanvasLoading,
  } = useCanvas(canvasId || '', branchId);

  // ── H-03: pan to node from CanvasLeftRail ─────────────────────────────────
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const handlePanToNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && reactFlowInstance) {
      reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 600 });
    }
  }, [nodes, reactFlowInstance]);

  // suppress unused warning — instance is set via KleosCanvas callback
  void setReactFlowInstance;

  // ── H-02: ask AI about a node from context menu ───────────────────────────
  const handleAskAIAboutNode = useCallback((_nodeId: string, text: string) => {
    const el = document.getElementById('chat-textarea') as HTMLTextAreaElement | null;
    if (el) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(el, `Tell me more about: "${text}"`);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.focus();
    }
  }, []);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  const sources = useMemo(() => {
    return nodes.filter(n => n.type === 'source').map(n => ({ id: n.id, name: n.data.text }));
  }, [nodes]);

  const displayNodes = useMemo(() => {
    if (!activeSourceFilter) return nodes;
    return nodes.map(n => {
      const match = n.id === activeSourceFilter || n.data.provenance_detail?.source_id === activeSourceFilter;
      return { ...n, hidden: !match };
    });
  }, [nodes, activeSourceFilter]);

  const displayEdges = useMemo(() => {
    if (!activeSourceFilter) return edges;
    const visibleNodeIds = new Set(displayNodes.filter(n => !n.hidden).map(n => n.id));
    return edges.map(e => ({
      ...e,
      hidden: !visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target),
    }));
  }, [edges, displayNodes, activeSourceFilter]);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!urlCanvasId) {
      setError('No canvas ID provided');
      setLoading(false);
      return;
    }
    api.get<{ canvas: any; branches: Branch[] }>(`/api/canvas/${urlCanvasId}`)
      .then(res => {
        setCanvasId(res.canvas.id);
        setTitle(res.canvas.title);
        setMode(res.canvas.workspace_mode as WorkspaceMode);
        setIncognito(res.canvas.incognito_mode);
        const active = res.branches.find(b => b.status === 'active') || res.branches[0];
        const urlBranchId = searchParams.get('branch_id');
        const targetBranchId = urlBranchId || (active ? active.id : '');
        setBranchId(targetBranchId);
        if (active && !urlBranchId) {
          setSearchParams({ branch_id: active.id }, { replace: true });
        }
        setBranches(res.branches);
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCanvasId]);

  // Load assumptions & memory counts in background
  useEffect(() => {
    if (canvasId) {
      api.get<{ assumptions: Assumption[] }>(`/api/canvas/${canvasId}/assumptions?branch_id=${branchId}`)
        .then(res => setAssumptions(res.assumptions))
        .catch(console.error);

      api.get<any[]>(`/api/canvas/${canvasId}/memory`)
        .then(res => setMemoryCount(res.length))
        .catch(console.error);
    }
  }, [canvasId, branchId]);

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
          } else if (payload.type === 'compilation' && payload.data) {
            const comp = payload.data as any;
            if (comp.warnings && comp.warnings.length > 0) {
              setDropError(comp.warnings.join(' '));
            }
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
          loadCanvas();
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
    if (!canvasId || !branchId) return;
    setDropError(null);
    setIsCompiling(true);
    setPillState('working');
    setRibbonSteps([]);

    const interval = setInterval(() => {
      setRibbonSteps(prev => {
        if (prev.length === 0) return [{ event: 'reasoning_step', step: 1, action: 'uploading', detail: `Uploading ${file.name}...`, confidence: 'high' }];
        if (prev.length === 1) return [...prev, { event: 'reasoning_step', step: 2, action: 'processing', detail: 'Extracting text and structure...', confidence: 'high' }];
        if (prev.length === 2) return [...prev, { event: 'reasoning_step', step: 3, action: 'classifying', detail: 'Generating canvas nodes...', confidence: 'medium' }];
        return prev;
      });
    }, 1500);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('branch_id', branchId);
    try {
      await api.postFormData(`/api/canvas/${canvasId}/drop`, formData);
      loadCanvas();
    } catch (err) {
      setDropError(String(err));
    } finally {
      clearInterval(interval);
      setIsCompiling(false);
      setPillState('ready');
    }
  }, [canvasId, branchId, loadCanvas, setPillState]);

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
      else if (s === 'error') setPillState('ready');
    },
    onTranscript: (text, isFinal) => {
      setVoiceTranscript(text);
      if (isFinal) {
        setTimeout(() => setVoiceTranscript(''), 2000);
      }
    },
    onError: (err) => {
      if (err === 'permission_denied') {
        setDropError('Microphone access denied. Please allow microphone permission in your browser settings.');
      } else if (err === 'not_supported') {
        setDropError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      } else if (err === 'connection_failed') {
        setDropError('Voice connection failed. Please check your internet connection and try again.');
      }
    },
  });

  // ── Compare Branches ──────────────────────────────────────────────────────
  const handleCompareBranches = useCallback(async (_b1: string, b2: string) => {
    setCompareMode(true);
    setCompareBranchId(b2);
    try {
      const state = await api.get<CanvasState>(`/api/canvas/${canvasId}?branch_id=${b2}`);
      setCompareNodes(state.nodes.map(toReactFlowNode));
      setCompareEdges(state.edges.map(toReactFlowEdge));
    } catch (e) {
      console.error(e);
    }
  }, [canvasId]);

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────
  useKeyboardShortcuts({
    onBranch: () => setDrawerOpen(true),
    onMerge: () => {
      if (selectedNodeIds.length >= 2) {
        setMergeDialogOpen(true);
      }
    },
    onCompare: () => setCompareMode(prev => !prev),
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
    onShortcuts: () => setShortcutsOpen(true),
  });

  // ── Render ────────────────────────────────────────────────────────────────
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
          setModePromptBanner(`Switched to ${m.toUpperCase()} mode. Re-evaluate canvas nodes?`);
        }}
        onIncognitoToggle={async () => {
          setIncognito(prev => !prev);
          await api.put(`/api/canvas/${canvasId}/incognito`, { enabled: !incognito });
        }}
        onExport={() => setExportOpen(true)}
        onHamburger={() => setDrawerOpen(true)}
      />

      {/* ── Main Canvas Area ── */}
      <div className="flex-1 relative flex overflow-hidden">

        {/* Left Rail */}
        <CanvasLeftRail
          nodes={nodes.map(n => n.data)}
          onNodeSelect={handlePanToNode}
        />

        {/* Canvas area (potentially split) */}
        <div className="flex-1 relative flex overflow-hidden">

          {/* Split-view banner */}
          {compareMode && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-3 font-switzer">
              <span>Split View: {branches.find(b => b.id === branchId)?.name} vs {branches.find(b => b.id === compareBranchId)?.name}</span>
              <button
                onClick={() => setCompareMode(false)}
                className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-[10px] uppercase font-bold"
              >
                Close Split View
              </button>
            </div>
          )}

          {/* Primary canvas pane */}
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <KleosCanvas
                canvasId={canvasId}
                branchId={branchId}
                nodes={displayNodes}
                edges={displayEdges}
                persistNodePosition={persistNodePosition}
                deleteNode={deleteNode}
                createEdge={createEdge}
                mergeNodes={mergeNodes}
                pinNode={pinNode}
                selectedNodeIds={selectedNodeIds}
                onNodeSelect={setSelectedNodeIds}
                onPanToNode={handlePanToNode}
                onAskAIAboutNode={handleAskAIAboutNode}
              />
            </ReactFlowProvider>
          </div>

          {/* Secondary (compare) canvas pane */}
          {compareMode && (
            <div className="flex-1 relative border-l border-gray-300">
              <ReactFlowProvider>
                <KleosCanvas
                  canvasId={canvasId}
                  branchId={compareBranchId || ''}
                  nodes={compareNodes}
                  edges={compareEdges}
                  persistNodePosition={() => {}}
                  deleteNode={() => {}}
                  createEdge={() => {}}
                  mergeNodes={async () => {}}
                  pinNode={() => {}}
                  selectedNodeIds={[]}
                />
              </ReactFlowProvider>
            </div>
          )}

          {/* H-08: Branch switching skeleton overlay */}
          {isBranchSwitching && (
            <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(237,237,232,0.7)', backdropFilter: 'blur(2px)' }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                <p style={{ fontSize: '12px', color: 'var(--color-slate-caption)', fontFamily: 'var(--font-switzer)' }}>Switching branch...</p>
              </div>
            </div>
          )}

          <SuggestionChips
            visible={!isCanvasLoading && nodes.length === 0}
            onStartVoice={startVoice}
            onFocusText={() => document.getElementById('chat-textarea')?.focus()}
            onOpenDrop={() => document.getElementById('chat-file-upload')?.click()}
          />

          {/* ── Bottom Overlay Elements ── */}
          <MemoryAssumptionToggle
            memoryOpen={memoryOpen}
            auditOpen={auditOpen}
            onMemoryToggle={() => setMemoryOpen(prev => !prev)}
            onAuditToggle={() => setAuditOpen(prev => !prev)}
            memoryCount={memoryCount}
            assumptionCount={assumptions.length}
          />

          <SourcesToggle
            activeFilter={activeSourceFilter}
            onFilterChange={setActiveSourceFilter}
            sources={sources}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 w-full px-4 pointer-events-none">
            <div className="pointer-events-auto w-full">
              <VoiceTranscript transcript={voiceTranscript} isActive={voiceStatus !== 'idle'} />
            </div>
            <div className="pointer-events-auto w-full">
              <ReasoningRibbon steps={ribbonSteps} isActive={isCompiling} onStepClick={() => {}} />
            </div>
            <div className="pointer-events-auto w-full">
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
            </div>
          </div>

          {/* Error banner */}
          {dropError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-100 text-red-800 text-xs rounded shadow z-50 flex items-center gap-2 border border-red-200">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{dropError}</span>
              <button onClick={() => setDropError(null)} className="ml-2 font-bold hover:opacity-75">×</button>
            </div>
          )}

          {/* Mode-change re-evaluate banner */}
          {modePromptBanner && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-50 text-amber-900 text-xs rounded-lg shadow-lg z-50 flex items-center gap-3 border border-amber-200 font-switzer">
              <span className="material-symbols-outlined text-sm text-amber-600">psychology</span>
              <span>{modePromptBanner}</span>
              <button
                onClick={() => {
                  loadCanvas();
                  setModePromptBanner(null);
                }}
                className="px-2 py-0.5 bg-amber-800 text-white font-medium rounded hover:bg-amber-900 transition-colors"
              >
                Re-evaluate
              </button>
              <button onClick={() => setModePromptBanner(null)} className="text-gray-400 hover:text-gray-700 font-bold ml-1">×</button>
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
        onBranchSwitch={handleBranchSwitch}
        onCompare={handleCompareBranches}
        onBranchCreated={(b) => setBranches(prev => [...prev, b])}
        onOpenMemory={() => setMemoryOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenSessionAudit={handleOpenSessionAudit}
      />

      <ExportDialog open={exportOpen} canvasId={canvasId} branchId={branchId} onClose={() => setExportOpen(false)} />

      <ShortcutLegend open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {memoryOpen && <MemoryPanel open={memoryOpen} canvasId={canvasId} onClose={() => setMemoryOpen(false)} />}

      <AssumptionAuditPanel
        open={auditOpen}
        assumptions={assumptions}
        onClose={() => setAuditOpen(false)}
        onHoverAssumption={activateImpactHalo}
        onLeaveAssumption={clearImpactHalo}
        onOverride={async (nodeId, text) => {
          await updateNodeText(nodeId, text);
        }}
        onAccept={async (nodeId) => {
          await updateNodeProperties(nodeId, { type: 'idea', confidence: 'high' });
        }}
        onDelete={async (nodeId) => {
          await deleteNode(nodeId);
        }}
        onAskAI={(nodeId) => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            const el = document.getElementById('chat-textarea') as HTMLTextAreaElement | null;
            if (el) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
              nativeInputValueSetter?.call(el, `Regarding assumption "${node.data.text}": `);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.focus();
            }
          }
          setAuditOpen(false);
        }}
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

      <NodeMergeDialog
        open={mergeDialogOpen}
        selectedNodeIds={selectedNodeIds}
        nodes={nodes.map(n => n.data)}
        onCancel={() => setMergeDialogOpen(false)}
        onConfirm={async () => {
          await mergeNodes(selectedNodeIds);
          setMergeDialogOpen(false);
        }}
      />
    </div>
  );
}
