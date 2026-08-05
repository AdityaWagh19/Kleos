# Phase 6 — Branch, Compare, and Governance

**Hours:** 18–22
**Team:** All 4 (BE1: branch API + Incognito | BE2: Compare diff | FE1: Branch Rail + Compare UI | FE2: Pause/Stop + keyboard shortcuts)
**Depends on:** Phase 2 (canvas nodes to fork), Phase 5 (workspace mode persists on canvas)
**Unlocks:** Phase 7 (export needs branch awareness), Phase 8 (Counterfactuals require Branch infrastructure)

---

## Objective

By the end of this phase: users can branch the canvas into parallel timelines, switch between branches via a Branch Rail, compare two branches side-by-side with delta highlighting, enter Incognito Mode (zero memory writes), and control AI compilation with Pause/Stop. All 6 keyboard shortcuts are functional.

---

## Scope

**Backend:**
- `POST /api/canvas/{id}/branch` — fork all nodes/edges from active branch to a new branch
- `GET /api/canvas/{id}/branches` — list all branches with status
- Incognito Mode flag on canvas (prevents all memory writes during session)

**Frontend:**
- `BranchRail.tsx` — full tab strip (branch name, status, Compare action, Commit action), replaces stub from Phase 2
- Branch creation verb UI (toolbar button + voice-triggered)
- Compare Mode: side-by-side split view, delta nodes highlighted amber
- Incognito Mode: dark chrome border + "Incognito" badge in header, Session Audit skipped
- Pause/Stop controls: halt SSE stream mid-compilation
- Keyboard shortcuts: `B`=Branch, `M`=Merge, `C`=Compare, `T`=Trace, `P`=Pin, `Esc`=dismiss panels

---

## Design Decisions and Rationale

**Branch fork implementation: duplicate node rows in DB**
When a branch is created, all node and edge rows are duplicated with the new `branch_id`. This is simple and fast at demo scale (< 20 nodes). It allows independent modification of each branch without cross-contamination. At V1 scale, a copy-on-write approach (only storing deltas) would be more efficient — but that complexity is not justified at hackathon scale.

**Compare Mode: client-side diff (not API-side)**
The canvas already has both branch states loaded in the react-flow `nodes` array (one per branch). Compare Mode simply renders two react-flow instances side-by-side with delta computation done in the browser. No additional API call required. Delta = nodes in Branch B that don't exist in Branch A (or have different text).

**Why Pause/Stop control the SSE stream (not the backend LLM call)?**
Canceling an OpenAI API call mid-stream is not straightforward — the HTTP response is already in flight. The practical approach is: on Pause, stop consuming the SSE stream (frontend closes the EventSource reader) and show partial nodes; on Stop, close the EventSource AND revert affected nodes to their pre-compilation state using the Event Log delta. The LLM call continues to completion in the backend but its output is discarded by the frontend.

**Incognito Mode enforced at the backend memory write layer:**
When `incognito_mode=TRUE` on the canvas, the `propose_inferred_memory()` function in `memory_service.py` returns early without writing to the DB. The frontend also skips the Session Memory Audit card at canvas close. This ensures no memory leaks even if the frontend is bypassed.

---

## Sequential Implementation Tasks

### BE1: Branch API

**Task 6.1 — Add branch endpoints to `routers/canvas.py`**
```python
from pydantic import BaseModel as PM

class CreateBranchRequest(PM):
    name: str
    based_on_branch_id: str = None  # Defaults to current active branch

@router.post("/canvas/{canvas_id}/branch")
async def create_branch(canvas_id: str, req: CreateBranchRequest):
    """Forks all nodes and edges from the source branch into a new branch."""
    sb = get_client()

    # Determine source branch
    if req.based_on_branch_id:
        source_branch_id = req.based_on_branch_id
    else:
        branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
        source_branch_id = branch.data[0]["id"] if branch.data else None

    if not source_branch_id:
        raise HTTPException(400, "No active branch to fork from")

    # Create new branch row
    new_branch_id = str(uuid.uuid4())
    sb.table("branches").insert({
        "id": new_branch_id, "canvas_id": canvas_id, "name": req.name
    }).execute()

    # Duplicate all nodes from source branch
    source_nodes = sb.table("nodes").select("*").eq("canvas_id", canvas_id).eq("branch_id", source_branch_id).execute().data
    if source_nodes:
        new_nodes = []
        for n in source_nodes:
            new_n = {**n, "id": str(uuid.uuid4()), "branch_id": new_branch_id}
            new_nodes.append(new_n)
        sb.table("nodes").insert(new_nodes).execute()

    # Duplicate all edges from source branch
    source_edges = sb.table("edges").select("*").eq("canvas_id", canvas_id).eq("branch_id", source_branch_id).execute().data
    if source_edges:
        # Build old→new node ID map
        old_to_new = {old["id"]: new["id"] for old, new in zip(source_nodes, new_nodes)}
        new_edges = []
        for e in source_edges:
            new_edges.append({
                **e,
                "id": str(uuid.uuid4()),
                "branch_id": new_branch_id,
                "source_id": old_to_new.get(e["source_id"], e["source_id"]),
                "target_id": old_to_new.get(e["target_id"], e["target_id"]),
            })
        sb.table("edges").insert(new_edges).execute()

    log_event(canvas_id, new_branch_id, "branch_created", "user", "text", [])
    return {"branch_id": new_branch_id, "node_count": len(source_nodes)}


@router.get("/canvas/{canvas_id}/branches")
async def list_branches(canvas_id: str):
    sb = get_client()
    branches = sb.table("branches").select("*").eq("canvas_id", canvas_id).order("created_at").execute()
    return branches.data


@router.post("/canvas/{canvas_id}/branch/{branch_id}/commit")
async def commit_branch(canvas_id: str, branch_id: str):
    """Mark branch as committed. Creates a Decision node on main branch."""
    sb = get_client()
    sb.table("branches").update({"status": "committed"}).eq("id", branch_id).execute()

    # Create a Decision node on the main branch
    main_branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("name", "main").execute()
    if main_branch.data:
        import uuid as _uuid
        sb.table("nodes").insert({
            "id": str(_uuid.uuid4()), "canvas_id": canvas_id,
            "branch_id": main_branch.data[0]["id"],
            "type": "decision", "text": f"Committed branch: {branch_id[:8]}",
            "confidence": "high", "provenance_type": "user_created",
            "impact_nodes": [], "position": {"x": 600, "y": 100},
            "created_by": "user", "input_modality": "text",
        }).execute()
    log_event(canvas_id, branch_id, "branch_committed", "user", "text", [])
    return {"committed": True}
```

**Task 6.2 — Incognito Mode enforcement in `memory_service.py`**
```python
# Add to propose_inferred_memory():
def propose_inferred_memory(canvas_id: str, text: str, trigger: str, input_modality: str) -> str | None:
    """Returns None and does nothing if canvas is in Incognito Mode."""
    sb = get_client()
    canvas = sb.table("canvases").select("incognito_mode").eq("id", canvas_id).single().execute()
    if canvas.data.get("incognito_mode"):
        return None  # Incognito: no memory writes at all
    # ... rest of the function unchanged

# Add Incognito toggle endpoint to routers/canvas.py:
@router.put("/canvas/{canvas_id}/incognito")
async def set_incognito(canvas_id: str, enabled: bool):
    sb = get_client()
    sb.table("canvases").update({"incognito_mode": enabled}).eq("id", canvas_id).execute()
    return {"incognito_mode": enabled}
```

---

### FE1: Branch Rail + Compare Mode

**Task 6.3 — `src/frontend/src/components/BranchRail.tsx`** (replaces stub from Phase 2)
```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Branch } from '../types';
import { api } from '../services/api';

interface Props {
  canvasId: string;
  branches: Branch[];
  activeBranchId: string;
  onBranchSwitch: (branchId: string) => void;
  onCompare: (branchA: string, branchB: string) => void;
  onBranchCreated: (branch: Branch) => void;
  compareMode: boolean;
}

export function BranchRail({
  canvasId, branches, activeBranchId, onBranchSwitch, onCompare, onBranchCreated, compareMode
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [compareTarget, setCompareTarget] = useState<string | null>(null);

  const createBranch = async () => {
    if (!newName.trim()) return;
    const result = await api.post<{ branch_id: string }>(`/api/canvas/${canvasId}/branch`, {
      name: newName.trim(),
    });
    const newBranch: Branch = {
      id: result.branch_id, canvas_id: canvasId,
      name: newName.trim(), created_at: new Date().toISOString(), status: 'active',
    };
    onBranchCreated(newBranch);
    setCreating(false);
    setNewName('');
    onBranchSwitch(result.branch_id);
  };

  return (
    <div className="h-9 bg-[#1a1a1a] border-b border-[#2b2b2b] flex items-center px-3 gap-1.5 overflow-x-auto shrink-0">
      {branches.map(branch => (
        <div key={branch.id} className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onBranchSwitch(branch.id)}
            className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${
              activeBranchId === branch.id
                ? 'bg-[#2b2b2b] text-[#f9f9f9] border border-[#e5ff5d]'
                : 'text-[#9c9c9c] hover:text-[#f9f9f9] hover:bg-[#2b2b2b]'
            }`}
          >
            {branch.name}
            {branch.status === 'committed' && (
              <span className="material-symbols-outlined text-[10px] ml-1 text-[#4caf7d]">check</span>
            )}
          </button>

          {/* Compare button (only for non-active branches) */}
          {activeBranchId !== branch.id && (
            <button
              onClick={() => onCompare(activeBranchId, branch.id)}
              title={`Compare with ${branch.name}`}
              className="text-[10px] text-[#9c9c9c] hover:text-[#f9f9f9] px-1"
            >
              <span className="material-symbols-outlined text-[13px]">compare_arrows</span>
            </button>
          )}
        </div>
      ))}

      {/* New branch button */}
      {creating ? (
        <div className="flex items-center gap-1 ml-1">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createBranch(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="Branch name..."
            autoFocus
            className="px-2 py-0.5 bg-[#111111] border border-[#e5ff5d] rounded-[4px] text-[11px] text-[#f9f9f9] w-28 outline-none"
          />
          <button onClick={createBranch} className="text-[#e5ff5d] text-[10px] font-medium">Create</button>
          <button onClick={() => setCreating(false)} className="text-[#9c9c9c] text-[10px]">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="ml-1 text-[#9c9c9c] hover:text-[#f9f9f9] transition-colors"
          title="Create branch (B)"
        >
          <span className="material-symbols-outlined text-[16px]">fork_right</span>
        </button>
      )}

      {/* Incognito indicator */}
      {compareMode && (
        <span className="ml-auto text-[10px] text-[#f5c842] uppercase tracking-[0.04em] flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">compare</span>Compare Mode
        </span>
      )}
    </div>
  );
}
```

**Task 6.4 — Compare Mode component**
```tsx
// src/frontend/src/canvas/CompareMode.tsx
import ReactFlow, { Background, BackgroundVariant } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import type { KleosNode } from '../types';

interface Props {
  branchANodes: Node<KleosNode>[];
  branchBNodes: Node<KleosNode>[];
  branchAEdges: Edge[];
  branchBEdges: Edge[];
  nodeTypes: Record<string, unknown>;
  edgeTypes: Record<string, unknown>;
  onExit: () => void;
}

function computeDelta(a: Node<KleosNode>[], b: Node<KleosNode>[]): Set<string> {
  // Delta: nodes in B that have no matching text in A (new or changed)
  const aTexts = new Set(a.map(n => n.data.text));
  return new Set(b.filter(n => !aTexts.has(n.data.text)).map(n => n.id));
}

export function CompareMode({
  branchANodes, branchBNodes, branchAEdges, branchBEdges,
  nodeTypes, edgeTypes, onExit,
}: Props) {
  const deltaIds = computeDelta(branchANodes, branchBNodes);

  // Highlight delta nodes in amber
  const highlightedB = branchBNodes.map(n => ({
    ...n,
    data: { ...n.data, isImpacted: deltaIds.has(n.id) },  // Reuse isImpacted for amber highlight
  }));

  return (
    <div className="flex h-full w-full bg-[#111111]">
      {/* Branch A */}
      <div className="flex-1 border-r border-[#2b2b2b] relative">
        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-[#1a1a1a] border border-[#2b2b2b] rounded-[4px] text-[10px] text-[#9c9c9c]">
          Branch A (original)
        </div>
        <ReactFlow nodes={branchANodes} edges={branchAEdges}
                   nodeTypes={nodeTypes as Record<string, React.ComponentType>}
                   edgeTypes={edgeTypes as Record<string, React.ComponentType>}
                   fitView style={{ background: '#111111' }}>
          <Background color="#2b2b2b" variant={BackgroundVariant.Dots} gap={24} size={1} />
        </ReactFlow>
      </div>

      {/* Branch B */}
      <div className="flex-1 relative">
        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-[#1a1a1a] border border-[#e5ff5d] rounded-[4px] text-[10px] text-[#e5ff5d]">
          Branch B · <span className="text-[#f5c842]">{deltaIds.size} changes</span>
        </div>
        <ReactFlow nodes={highlightedB} edges={branchBEdges}
                   nodeTypes={nodeTypes as Record<string, React.ComponentType>}
                   edgeTypes={edgeTypes as Record<string, React.ComponentType>}
                   fitView style={{ background: '#111111' }}>
          <Background color="#2b2b2b" variant={BackgroundVariant.Dots} gap={24} size={1} />
        </ReactFlow>
      </div>

      {/* Exit Compare Mode */}
      <button
        onClick={onExit}
        className="absolute top-2 right-2 z-20 px-2 py-1 bg-[#2b2b2b] border border-[#565656] rounded-[4px] text-[11px] text-[#9c9c9c] hover:text-[#f9f9f9] transition-colors"
      >
        Exit Compare (Esc)
      </button>
    </div>
  );
}
```

---

### FE2: Governance Controls

**Task 6.5 — Pause/Stop controls**
```tsx
// src/frontend/src/components/PauseStopControls.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isCompiling: boolean;
  onPause: () => void;
  onStop: () => void;
}

export function PauseStopControls({ isCompiling, onPause, onStop }: Props) {
  return (
    <AnimatePresence>
      {isCompiling && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex gap-1"
        >
          <button
            onClick={onPause}
            className="flex items-center gap-1 px-2 py-1 bg-[#2b2b2b] border border-[#f5c842] text-[#f5c842] rounded-[4px] text-[10px] font-medium hover:bg-[#2b2200] transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">pause</span>
            Pause
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-1 px-2 py-1 bg-[#2b2b2b] border border-[#e84040] text-[#e84040] rounded-[4px] text-[10px] font-medium hover:bg-[#3a1a1a] transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">stop</span>
            Stop
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Task 6.6 — Incognito Mode toggle + visual indicator**
```tsx
// src/frontend/src/components/IncognitoMode.tsx
import { motion } from 'framer-motion';

interface Props {
  active: boolean;
  onToggle: () => void;
}

export function IncognitoToggle({ active, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={active ? 'Incognito Mode: Memory writes disabled' : 'Enable Incognito Mode'}
      className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-[10px] font-medium transition-colors border ${
        active
          ? 'bg-[#2b2b2b] border-[#f9f9f9] text-[#f9f9f9]'
          : 'border-[#565656] text-[#9c9c9c] hover:border-[#9c9c9c]'
      }`}
    >
      <span className="material-symbols-outlined text-[13px]">
        {active ? 'visibility_off' : 'visibility'}
      </span>
      {active ? 'Incognito' : ''}
    </button>
  );
}

// Incognito border overlay — wraps entire canvas area when active
export function IncognitoBorder({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 pointer-events-none z-50 rounded"
      style={{ boxShadow: 'inset 0 0 0 3px #f9f9f9' }}
    />
  );
}
```

**Task 6.7 — Keyboard shortcuts hook**
```typescript
// src/frontend/src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

interface Shortcuts {
  onBranch: () => void;
  onMerge: () => void;
  onCompare: () => void;
  onTrace: () => void;
  onPin: () => void;
  onDismiss: () => void;  // Esc
}

export function useKeyboardShortcuts({
  onBranch, onMerge, onCompare, onTrace, onPin, onDismiss
}: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only fire when not typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toUpperCase()) {
        case 'B': onBranch(); break;
        case 'M': onMerge(); break;
        case 'C': onCompare(); break;
        case 'T': onTrace(); break;
        case 'P': onPin(); break;
        case 'ESCAPE': onDismiss(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBranch, onMerge, onCompare, onTrace, onPin, onDismiss]);
}
```

---

## Validation Strategy

1. `POST /api/canvas/{id}/branch` → verify new branch row in DB, node rows duplicated with new `branch_id`
2. `GET /api/canvas/{id}/branches` → returns list including new branch
3. Branch Rail: click new tab → canvas re-renders with branch nodes
4. Compare Mode: activate → two canvases side-by-side; modify a node in Branch B → amber highlight appears on that node
5. Incognito Mode: toggle on → dark chrome border visible; drop PDF → no new memory items in DB
6. Pause: start compilation, click Pause → SSE stream stops, partial nodes visible; canvas does not change further
7. Stop: start compilation, click Stop → SSE stream stops, ALL new nodes from this compilation removed
8. Keyboard shortcuts: press `B` → Branch creation input appears; `Esc` → dismisses open panel

---

## Acceptance Criteria

- [ ] `POST /api/canvas/{id}/branch` creates new branch with duplicated nodes (verify node count = original)
- [ ] Branch Rail renders all branches as tabs; active branch has citrine border
- [ ] Clicking a tab switches canvas to that branch's nodes
- [ ] Compare Mode shows two canvases side-by-side; delta nodes in Branch B highlighted amber
- [ ] Incognito Mode: `incognito_mode=TRUE` on canvas → no memory writes during session
- [ ] Incognito Mode visual: dark chrome border (`inset 0 0 0 3px #f9f9f9`) around canvas
- [ ] "Incognito" badge visible in canvas header when mode is active
- [ ] Session Memory Audit card does NOT appear on canvas close when Incognito is active
- [ ] Pause control halts SSE stream; partial nodes visible; Reasoning Ribbon pauses
- [ ] Stop control cancels compilation; affected nodes revert to pre-operation state
- [ ] Keyboard `B` triggers branch creation input
- [ ] Keyboard `Esc` dismisses any open panel (Memory Panel, Assumption Audit, Negotiation Card)
- [ ] All 6 keyboard shortcuts functional (`B`, `M`, `C`, `T`, `P`, `Esc`)

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| Branch node duplication creates stale `impact_nodes` (IDs from original branch) | Medium | After fork, remap `impact_nodes` in duplicated nodes to the new node IDs (same pattern as Phase 2 remap step) |
| Compare Mode shows too many delta nodes (false positives) | Low | Delta based on text content equality — exact match only; no semantic similarity |
| Stop cancellation is incomplete (nodes partially written) | Low | Track node IDs created during this compilation; on Stop, delete them from DB |

---

## Deliverables

- `src/backend/routers/canvas.py` — branch create, list, commit endpoints
- `src/backend/services/memory_service.py` — Incognito guard in `propose_inferred_memory()`
- `src/frontend/src/components/BranchRail.tsx` (full version)
- `src/frontend/src/canvas/CompareMode.tsx`
- `src/frontend/src/components/PauseStopControls.tsx`
- `src/frontend/src/components/IncognitoMode.tsx`
- `src/frontend/src/hooks/useKeyboardShortcuts.ts`

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 18–22: Branch, Compare, Incognito, Controls" complete
- `project-context/tasks.md` — Mark all Hours 18–22 tasks [x]

---

## Dependencies

- Phase 2 complete: nodes exist in DB to fork
- Phase 5 complete: workspace mode stored on canvas (Incognito flag on same row)
