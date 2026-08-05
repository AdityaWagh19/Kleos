# Phase 8 — Advanced Features (Restored MVP)

**Hours:** 32–42
**Team:** All 4 (assign by feature affinity)
**Depends on:** Phase 5 (Memory Freshness needs memory data), Phase 6 (Counterfactuals need Branch), Phase 4 (Path Walk needs canvas nodes)
**Unlocks:** Phase 9 (Polish works on completed feature set)

---

## Objective

Implement the six MVP features that were restored for the 4-person team but scheduled last due to their dependency on earlier phases: A5 Memory Freshness Indicators, B5 Counterfactual Branches, B6 Reasoning Path Walk, C3 Thinking Timeline, C7 Quick Override, D3 Activity Log. B4 Trust Lens Toggle is implemented last in the buffer window (Hours 42-48) only if all other features are stable and tested.

---

## Scope

| Feature | Code Owner | Estimate |
|---|---|---|
| A5. Memory Freshness Indicators | BE2 + FE2 | 1.5 hours |
| B5. Counterfactual Branches | BE1 + FE1 | 2.5 hours |
| B6. Reasoning Path Walk | FE1 | 1.5 hours |
| C3. Thinking Timeline | BE2 + FE2 | 2 hours |
| C7. Quick Override | BE1 + FE2 | 1 hour |
| D3. Activity Log | FE1 | 1 hour |
| B4. Trust Lens Toggle | FE2 | Buffer only |

---

## A5 — Memory Freshness Indicators

### Design
Age badges show relative time since memory creation. Staleness flags appear when a memory's text appears to contradict current canvas content. **Both computed at canvas load — not continuously during session** (per test.md Section 18).

**Task 8.1 — Freshness computation in `services/memory_service.py`**
```python
from datetime import datetime, timezone

def compute_freshness(memories: list[dict], canvas_nodes: list[dict]) -> dict[str, dict]:
    """
    Returns {memory_id: {age_label, stale}} for each memory.
    Computed once at canvas load. Not updated during session.
    """
    now = datetime.now(timezone.utc)
    result = {}
    node_texts = [n["text"].lower() for n in canvas_nodes]

    for mem in memories:
        created = datetime.fromisoformat(mem["created_at"])
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        delta = now - created
        days = delta.days

        if days == 0:
            age_label = "Today"
        elif days == 1:
            age_label = "Yesterday"
        elif days < 7:
            age_label = f"{days} days ago"
        elif days < 30:
            age_label = f"{days // 7}w ago"
        else:
            age_label = f"{days // 30}mo ago"

        # Simple staleness check: does any canvas node appear to contradict the memory?
        # This is a keyword-based heuristic — not LLM-based (too expensive at load time)
        mem_words = set(mem["text"].lower().split())
        stale = False
        for node_text in node_texts:
            node_words = set(node_text.lower().split())
            # Staleness signal: memory mentions X but canvas has "not X", "no X", "against X"
            negation_words = {"not", "no", "against", "rejected", "false", "incorrect", "wrong"}
            if mem_words & node_words and negation_words & node_words:
                stale = True
                break

        result[mem["id"]] = {"age_label": age_label, "stale": stale}
    return result
```

**Task 8.2 — Add age badge + staleness flag to `MemoryItem` in `MemoryPanel.tsx`**
```tsx
// In MemoryItem, add freshness display:
// Props: freshness?: { age_label: string; stale: boolean }
<div className="flex items-center justify-between mb-1">
  <span className="text-[9px] text-[#565656]">{freshness?.age_label}</span>
  {freshness?.stale && (
    <span className="flex items-center gap-0.5 text-[9px] text-[#f5c842]">
      <span className="material-symbols-outlined text-[11px]">warning</span>
      May be outdated
    </span>
  )}
</div>
```

---

## B5 — Counterfactual Branches

### Design
Right-click Assumption node → "What changes if I remove this?" → creates a new branch with the assumption deleted → AI recompiles only the affected subgraph (nodes in `impact_nodes`) → changed nodes highlighted amber.

**Task 8.3 — `POST /api/canvas/{id}/counterfactual` endpoint**
```python
# Add to routers/canvas.py

class CounterfactualRequest(PM):
    assumption_node_id: str
    branch_name: str = None

@router.post("/canvas/{canvas_id}/counterfactual")
async def create_counterfactual(canvas_id: str, req: CounterfactualRequest):
    """
    Creates a Counterfactual Branch:
    1. Fork current active branch
    2. Delete the assumption node in the new branch
    3. Recompile only the affected subgraph (impact_nodes)
    4. Return new branch_id + list of changed node IDs
    """
    sb = get_client()

    # Get the assumption node
    assumption = sb.table("nodes").select("*").eq("id", req.assumption_node_id).single().execute().data
    impact_node_ids = assumption.get("impact_nodes", [])

    # Fork the branch
    branch_name = req.branch_name or f"Counterfactual: without '{assumption['text'][:30]}...'"
    fork_result = await create_branch(canvas_id, CreateBranchRequest(name=branch_name))
    new_branch_id = fork_result["branch_id"]

    # Delete the assumption node in the new branch (find the forked copy)
    forked_assumption = sb.table("nodes").select("id").eq("canvas_id", canvas_id)\
        .eq("branch_id", new_branch_id).eq("text", assumption["text"]).execute()
    if forked_assumption.data:
        sb.table("nodes").delete().eq("id", forked_assumption.data[0]["id"]).execute()

    # Get text of impacted nodes for recompilation context
    impacted_nodes = sb.table("nodes").select("id,text,type").eq("canvas_id", canvas_id)\
        .eq("branch_id", new_branch_id).in_("id", impact_node_ids).execute().data

    if impacted_nodes:
        # Recompile affected subgraph
        context_text = f"Recompile these nodes WITHOUT the assumption: '{assumption['text']}'\n\n"
        context_text += "\n".join(f"[{n['type']}] {n['text']}" for n in impacted_nodes)

        canvas_row = sb.table("canvases").select("workspace_mode").eq("id", canvas_id).single().execute().data
        compilation = llm_service.compile_document(context_text, canvas_row.get("workspace_mode", "analytical"))

        # Track which nodes changed (delete old impacted + add new from recompilation)
        changed_node_ids = [n["id"] for n in impacted_nodes]
        for nid in changed_node_ids:
            sb.table("nodes").delete().eq("id", nid).execute()
        canvas_service.apply_compilation(canvas_id, new_branch_id, compilation, "text", canvas_row["workspace_mode"])

    log_event(canvas_id, new_branch_id, "branch_created", "user", "text", [], {"counterfactual": True})
    return {"branch_id": new_branch_id, "changed_node_ids": impact_node_ids, "summary": f"Removed assumption affected {len(impact_node_ids)} nodes"}
```

**Task 8.4 — Counterfactual context menu in `BaseNode.tsx`**
```tsx
// Add context menu to assumption nodes only
{data.type === 'assumption' && (
  <div className="absolute -bottom-6 left-0 hidden group-hover:flex gap-1 z-10">
    <button
      onClick={() => onCounterfactual?.(data.id)}
      className="text-[9px] px-1.5 py-0.5 bg-[#2b2b2b] border border-[#f5c842] text-[#f5c842] rounded-[4px] whitespace-nowrap hover:bg-[#2b2000] transition-colors"
    >
      What changes if I remove this?
    </button>
  </div>
)}
```

---

## B6 — Reasoning Path Walk

### Design
Activating Trace on any node dims the canvas, reveals only the reasoning chain nodes, narrates each step, and asks for feedback at the end.

**Task 8.5 — `src/frontend/src/canvas/ReasoningPathWalk.tsx`**
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import type { KleosNode, ReasoningStep } from '../types';

interface Props {
  active: boolean;
  targetNode: KleosNode | null;
  chainNodes: KleosNode[];       // Nodes in the reasoning chain
  steps: ReasoningStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onFeedback: (positive: boolean) => void;
  onExit: () => void;
}

export function ReasoningPathWalk({
  active, targetNode, chainNodes, steps,
  currentStep, onNext, onPrev, onFeedback, onExit
}: Props) {
  const isLastStep = currentStep >= steps.length - 1;

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Canvas dimming overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#111111] pointer-events-none z-20"
          />

          {/* Bottom narration card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[480px] bg-[#1a1a1a] border border-[#2b2b2b] rounded-[12px] p-4 z-30"
          >
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[#9c9c9c] uppercase tracking-[0.04em]">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex-1 h-0.5 bg-[#2b2b2b] rounded-full">
                <div
                  className="h-full bg-[#e5ff5d] rounded-full transition-all"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current step narration */}
            {steps[currentStep] && (
              <div className="mb-3">
                <p className="text-[14px] text-[#f9f9f9] font-medium mb-1">
                  {steps[currentStep].action.replace(/_/g, ' ')}
                </p>
                <p className="text-[12px] text-[#9c9c9c]">{steps[currentStep].detail}</p>
              </div>
            )}

            {/* Feedback at final step */}
            {isLastStep && (
              <div className="mb-3 p-3 bg-[#2b2b2b] rounded-[8px]">
                <p className="text-[12px] text-[#f9f9f9] mb-2">Did this reasoning make sense?</p>
                <div className="flex gap-2">
                  <button onClick={() => onFeedback(true)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#4caf7d] text-[#111111] rounded-[4px] text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[13px]">thumb_up</span> Yes
                  </button>
                  <button onClick={() => onFeedback(false)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#e84040] text-white rounded-[4px] text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[13px]">thumb_down</span> No
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={onPrev} disabled={currentStep === 0}
                      className="flex items-center gap-1 text-[11px] text-[#9c9c9c] disabled:opacity-30">
                <span className="material-symbols-outlined text-[14px]">arrow_back</span> Previous
              </button>
              <button onClick={onExit}
                      className="text-[11px] text-[#9c9c9c] hover:text-[#f9f9f9] transition-colors">
                Exit Walk (Esc)
              </button>
              {!isLastStep && (
                <button onClick={onNext}
                        className="flex items-center gap-1 text-[11px] text-[#f9f9f9]">
                  Next <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

The "chain nodes" visible during the walk are determined by the node's `impact_nodes` array traced back to root sources. Nodes NOT in the chain are dimmed using `opacity: 0.15` via the canvas overlay — only chain nodes have `z-index` above the overlay.

---

## C3 — Thinking Timeline

### Design
A horizontal scrubber showing canvas history as keyframes. Hidden by default (toggle-only). Keyframes are derived from the `events` table at major milestones.

**Task 8.6 — `GET /api/canvas/{id}/timeline` endpoint**
```python
# Add to routers/canvas.py
@router.get("/canvas/{canvas_id}/timeline")
async def get_timeline(canvas_id: str):
    """Returns keyframe events for the Thinking Timeline."""
    sb = get_client()
    # Get significant events only (not every node creation)
    keyframe_types = ["branch_created", "memory_accepted", "mode_changed", "branch_committed", "assumption_overridden"]
    events = sb.table("events").select("event_id,timestamp,event_type,workspace_mode") \
        .eq("canvas_id", canvas_id).in_("event_type", keyframe_types) \
        .order("timestamp").execute()
    return {"keyframes": events.data}
```

**Task 8.7 — `src/frontend/src/panels/ThinkingTimeline.tsx`**
```tsx
import { motion, AnimatePresence } from 'framer-motion';

interface Keyframe {
  event_id: string;
  timestamp: string;
  event_type: string;
  workspace_mode: string;
}

interface Props {
  visible: boolean;
  keyframes: Keyframe[];
  currentPosition: number;  // 0–1 (relative position in timeline)
  onRewind: (eventId: string) => void;
  onToggle: () => void;
}

const EVENT_LABELS: Record<string, string> = {
  branch_created: 'Branch',
  memory_accepted: 'Memory saved',
  mode_changed: 'Mode changed',
  branch_committed: 'Branch committed',
  assumption_overridden: 'Assumption changed',
};

export function ThinkingTimeline({ visible, keyframes, currentPosition, onRewind, onToggle }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 56 }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-[#1a1a1a] border-t border-[#2b2b2b] overflow-hidden"
        >
          <div className="h-full flex items-center px-4 gap-3">
            {/* Timeline track */}
            <div className="flex-1 relative h-8">
              {/* Track */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#2b2b2b] -translate-y-1/2" />

              {/* Progress */}
              <div
                className="absolute top-1/2 left-0 h-px bg-[#565656] -translate-y-1/2 transition-all"
                style={{ width: `${currentPosition * 100}%` }}
              />

              {/* Keyframe thumbnails */}
              {keyframes.map((kf, i) => {
                const pct = keyframes.length > 1 ? i / (keyframes.length - 1) : 0;
                return (
                  <button
                    key={kf.event_id}
                    onClick={() => onRewind(kf.event_id)}
                    title={`${EVENT_LABELS[kf.event_type] ?? kf.event_type} — ${new Date(kf.timestamp).toLocaleTimeString()}`}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                    style={{ left: `${pct * 100}%` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2b2b2b] border border-[#565656] group-hover:border-[#e5ff5d] group-hover:bg-[#e5ff5d] transition-colors" />
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#2b2b2b] border border-[#565656] rounded-[4px] px-1.5 py-0.5 text-[9px] text-[#9c9c9c] whitespace-nowrap hidden group-hover:block z-10">
                      {EVENT_LABELS[kf.event_type]}
                    </div>
                  </button>
                );
              })}

              {/* Current position indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#e5ff5d] -translate-x-1/2 transition-all"
                style={{ left: `${currentPosition * 100}%` }}
              />
            </div>

            {/* Toggle button */}
            <button onClick={onToggle} className="text-[#9c9c9c] hover:text-[#f9f9f9] transition-colors">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## C7 — Quick Override

### Design
Right-click any cluster → "Override mode for this cluster" → per-cluster reasoning mode. Override badge visible on cluster. Does not affect memory behavior. Expires at session end.

**Task 8.8 — Quick Override state (frontend-only)**
Quick Override is a session-only setting stored in React state (not persisted to DB). It configures the reasoning mode for the next AI call on that cluster only.

```typescript
// Add to useCanvas.ts:
const [clusterOverrides, setClusterOverrides] = useState<Map<string, WorkspaceMode>>(new Map());

const setQuickOverride = useCallback((clusterId: string, mode: WorkspaceMode) => {
  setClusterOverrides(prev => new Map(prev).set(clusterId, mode));
  // Log to Event Log
  api.post(`/api/canvas/${canvasId}/events`, {
    event_type: 'quick_override_set',
    author: 'user',
    input_modality: 'text',
    delta: { cluster_id: clusterId, mode },
  });
}, [canvasId]);
```

**Task 8.9 — Override badge in `ClusterBackground.tsx`**
```tsx
// Add override badge prop to ClusterBackground:
{overrideMode && (
  <span
    className="ml-1 px-1 py-0.5 text-[8px] font-medium rounded-[2px] uppercase tracking-[0.04em]"
    style={{
      background: MODE_COLORS[overrideMode] + '20',
      color: MODE_COLORS[overrideMode],
      border: `1px solid ${MODE_COLORS[overrideMode]}40`,
    }}
  >
    {overrideMode}
  </span>
)}
```

---

## D3 — Activity Log

### Design
Read-only overlay showing all canvas operations. Toggle button in toolbar. Shows: event type, author, input modality, timestamp.

**Task 8.10 — `src/frontend/src/panels/ActivityLog.tsx`**
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import type { WorkspaceMode } from '../types';

interface ActivityEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  author: 'user' | 'ai';
  input_modality: string;
  workspace_mode: WorkspaceMode;
}

interface Props {
  open: boolean;
  events: ActivityEvent[];
  onClose: () => void;
}

const EVENT_ICONS: Record<string, string> = {
  node_created: 'add_circle', node_deleted: 'remove_circle',
  edge_created: 'timeline', branch_created: 'fork_right',
  memory_accepted: 'memory', memory_rejected: 'block',
  mode_changed: 'tune', assumption_overridden: 'edit',
  voice_command_received: 'mic',
};

export function ActivityLog({ open, events, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#111111]/85 z-40 flex justify-end"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-72 h-full bg-[#1a1a1a] border-l border-[#2b2b2b] flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2b2b]">
              <span className="text-[13px] font-medium text-[#f9f9f9]">Activity Log</span>
              <span className="text-[10px] text-[#565656]">Read-only</span>
              <button onClick={onClose} className="material-symbols-outlined text-[18px] text-[#9c9c9c] hover:text-[#f9f9f9]">close</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {events.slice().reverse().map(event => (
                <div key={event.event_id} className="flex items-start gap-2 px-3 py-2 border-b border-[#2b2b2b] hover:bg-[#222222]">
                  <span className="material-symbols-outlined text-[14px] text-[#565656] mt-0.5 shrink-0">
                    {EVENT_ICONS[event.event_type] ?? 'circle'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-[#f9f9f9]">
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] px-1 rounded-[2px] ${event.author === 'user' ? 'bg-[#4a90d920] text-[#4a90d9]' : 'bg-[#f5c84220] text-[#f5c842]'}`}>
                        {event.author}
                      </span>
                      {event.input_modality === 'voice' && (
                        <span className="text-[9px] text-[#e5ff5d]">
                          <span className="material-symbols-outlined text-[10px]">mic</span>
                        </span>
                      )}
                      <span className="text-[9px] text-[#565656]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p className="text-[11px] text-[#565656]">No activity yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## B4 — Trust Lens Toggle (Buffer — Hours 42-48 only if stable)

### Design
When active: node border sharpness encodes confidence (crisp=high, feathered=low); cluster fill opacity encodes average confidence. Off by default. Toggle state not persisted.

**Task 8.11 — Trust Lens toggle in `BaseNode.tsx` (conditional on trust lens state)**
```tsx
// Add trustLensActive and confidence to BaseNode props:
// When trustLensActive=true, apply blur filter based on confidence:
const getBlurStyle = (confidence: string, trustLens: boolean) => {
  if (!trustLens) return {};
  return { filter: { high: 'none', medium: 'blur(0.3px)', low: 'blur(1px)' }[confidence] };
};
```

**Task 8.12 — Trust Lens toggle button (toolbar)**
```tsx
<button
  onClick={onToggleTrustLens}
  title="Trust Lens Toggle (confidence topology)"
  className={`p-1.5 rounded-[4px] transition-colors ${trustLensActive ? 'bg-[#e5ff5d] text-[#111111]' : 'text-[#9c9c9c] hover:text-[#f9f9f9]'}`}
>
  <span className="material-symbols-outlined text-[16px]">visibility</span>
</button>
```

---

## Validation Strategy

Run each feature's corresponding test section from `project-context/test.md`:
- A5: test.md Section 18 (Memory Freshness)
- B5: test.md Section 20 (Counterfactual Branches)
- B6: test.md Section 21 (Reasoning Path Walk)
- C3: test.md Section 22 (Thinking Timeline)
- C7: test.md Section 23 (Quick Override)
- D3: test.md Section 24 (Activity Log)
- B4: test.md Section 19 (Trust Lens Toggle)

---

## Acceptance Criteria

**A5 Memory Freshness:**
- [ ] Each memory item shows age badge ("Today", "3 days ago", etc.)
- [ ] Staleness flag appears on memory items that contradict canvas content
- [ ] Freshness computed at canvas load, not in real time

**B5 Counterfactual Branches:**
- [ ] Right-click Assumption node shows "What changes if I remove this?"
- [ ] New branch created with assumption node deleted
- [ ] Only `impact_nodes` are recompiled (not full canvas)
- [ ] Changed nodes highlighted amber in new branch

**B6 Reasoning Path Walk:**
- [ ] `T` key or right-click Trace activates Path Walk
- [ ] Canvas dims to overlay; only reasoning chain nodes fully visible
- [ ] Step-through narration card at bottom with Previous/Next
- [ ] Feedback prompt at final step; response logged
- [ ] `Esc` exits Path Walk

**C3 Thinking Timeline:**
- [ ] Timeline hidden by default (no vertical space consumed)
- [ ] Toggle reveals horizontal scrubber with keyframe thumbnails
- [ ] Clicking keyframe rewinds canvas to that state
- [ ] Toggle hides timeline again

**C7 Quick Override:**
- [ ] Right-click cluster → "Override mode for this cluster" menu option
- [ ] Selected mode shown as badge on cluster label
- [ ] Override expires when canvas is reopened (not persisted)

**D3 Activity Log:**
- [ ] Toggle shows read-only overlay with all events in reverse chronological order
- [ ] Each event shows: type, author (user/AI), modality, timestamp
- [ ] Voice events show mic icon

**B4 Trust Lens (buffer only):**
- [ ] Toggle in toolbar activates Trust Lens
- [ ] High-confidence nodes: crisp borders; Low-confidence: blurred borders
- [ ] Toggle off: all borders return to normal

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| Counterfactual recompile produces too many changes | Low | Only recompile `impact_nodes` — cap at 8 nodes to control cost and latency |
| Path Walk "chain nodes" selection is incorrect | Medium | Initially use `impact_nodes` array traversal; fall back to showing all assumption+evidence nodes if chain is unclear |
| Timeline Rewind is too slow at scale | Low | At demo scale (< 30 events), Supabase query is fast; V1 will need pagination |
| B4 Trust Lens blur interferes with text readability | Low | Use `blur(0.3px)` max for medium confidence — barely visible; `blur(1px)` for low is noticeable but readable |

---

## Deliverables

- `src/backend/routers/canvas.py` — counterfactual + timeline endpoints
- `src/backend/services/memory_service.py` — `compute_freshness()`
- `src/frontend/src/canvas/ReasoningPathWalk.tsx`
- `src/frontend/src/panels/ThinkingTimeline.tsx`
- `src/frontend/src/panels/ActivityLog.tsx`
- Updated `MemoryPanel.tsx` (freshness badges)
- Updated `BaseNode.tsx` (counterfactual context menu, Trust Lens filter)
- Updated `ClusterBackground.tsx` (Quick Override badge)
- Updated `useCanvas.ts` (Quick Override state)

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 32–42: Polish and Hardening" in progress
- `project-context/tasks.md` — Mark all Hours 32–42 advanced feature tasks [x]

---

## Dependencies

- Phase 5 complete: Memory data for freshness computation
- Phase 6 complete: Branch infrastructure for Counterfactuals
- Phase 4 complete: Canvas nodes + impact_nodes for Path Walk chain
- Phase 7 complete: Event log populated for Timeline keyframes
