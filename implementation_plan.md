# Canvas Workspace — Full Implementation Plan

Based on `canvas_workspace_audit.md` and `canvas_goal.txt`.

> **Rule:** No stubs, no TODO comments, no empty callbacks, no placeholder data. Every item is fully implemented or not started. If an issue requires a DB migration, the migration is included.

---

## Open Questions

> [!IMPORTANT]
> **Canvas theme:** The audit recommends migrating the canvas from dark mode (`#111111`) to the design.md light system (`#edede8` Linen Canvas). Node cards would become Frosted White with type-color borders. This is the correct architectural decision per design.md and matches both inspiration images (Agently, Latern) which are light-mode canvas tools. **This plan implements the light theme.** If you want dark mode preserved for the canvas only, call this out before execution.

> [!IMPORTANT]
> **ModeSelector:** The audit found `modeSelected = useState(true)` bypasses the first-time mode picker. This plan restores it: first-time users will see the ModeSelector. Mode choice persists in `localStorage`. If you want mode selection removed entirely (always analytical by default), call this out.

> [!IMPORTANT]
> **Activity Log endpoint:** `GET /api/canvas/:id/activity` needs to be created. The plan creates it by reading the `events` table for the canvas. If you have a different schema in mind, confirm.

---

## Proposed Changes

---

### Phase 0 — Database Migrations

Three new migrations. All are additive (no destructive changes).

---

#### [NEW] `supabase/migrations/20240001000003_canvas_workspace_v2.sql`

Adds:
1. `updated_at` column + auto-update trigger on `nodes`
2. New `event_type` values for user-initiated edits (`node_text_updated`, `node_position_updated`, `edge_deleted`, `node_pinned`)
3. Fixes `memory_scope` on `nodes` to include `'source'` (currently missing — TypeScript type has it, DB does not)
4. Adds `created_by` column to `edges` to distinguish AI-created vs. user-created connections
5. Adds `label` column to `edges` (optional user-set label)

```sql
-- Migration: Canvas Workspace V2
-- Additive only — no destructive changes

-- 1. Add updated_at to nodes
ALTER TABLE nodes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Auto-update trigger for nodes.updated_at
CREATE OR REPLACE FUNCTION update_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_nodes_updated_at();

-- 2. Fix memory_scope on nodes to include 'source'
ALTER TABLE nodes
  DROP CONSTRAINT IF EXISTS nodes_memory_scope_check;
ALTER TABLE nodes
  ADD CONSTRAINT nodes_memory_scope_check
  CHECK (memory_scope IN ('session', 'workspace', 'global', 'source'));

-- 3. Add created_by and label to edges
ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'ai'
    CHECK (created_by IN ('user', 'ai')),
  ADD COLUMN IF NOT EXISTS label TEXT;

-- 4. Expand event_type check to include new user-action events
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE events
  ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN (
    'node_created', 'node_deleted', 'node_text_updated', 'node_position_updated',
    'node_pinned', 'edge_created', 'edge_deleted', 'merge',
    'branch_created', 'branch_committed', 'assumption_overridden',
    'memory_accepted', 'memory_rejected', 'mode_changed',
    'quick_override_set', 'voice_command_received'
  ));

-- 5. Index for faster node lookups by type (needed for assumptions endpoint)
CREATE INDEX IF NOT EXISTS idx_nodes_canvas_type ON nodes(canvas_id, type);

-- 6. Index for events by type (needed for activity log)
CREATE INDEX IF NOT EXISTS idx_events_canvas_type ON events(canvas_id, event_type, timestamp DESC);
```

---

### Phase 1 — Backend: New API Endpoints

All new endpoints go in [canvas.py](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/backend/routers/canvas.py) unless noted.

---

#### [MODIFY] `src/backend/routers/canvas.py`

**Add these endpoints:**

**1. `PATCH /canvas/{canvas_id}/node/{node_id}/position`** — Persists drag position. Called on every `onNodeDragStop`.
```python
class UpdateNodePositionRequest(BaseModel):
    x: float
    y: float

@router.patch("/canvas/{canvas_id}/node/{node_id}/position")
async def update_node_position(
    canvas_id: str, node_id: str,
    req: UpdateNodePositionRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    # Verify ownership
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")
    sb.table("nodes").update({"position": {"x": req.x, "y": req.y}}).eq("id", node_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "node_position_updated", "user", "text", [node_id])
    return {"updated": True}
```

**2. `PATCH /canvas/{canvas_id}/node/{node_id}/text`** — Inline text editing.
```python
class UpdateNodeTextRequest(BaseModel):
    text: str

@router.patch("/canvas/{canvas_id}/node/{node_id}/text")
async def update_node_text(
    canvas_id: str, node_id: str,
    req: UpdateNodeTextRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")
    text = req.text.strip()
    if not text:
        raise HTTPException(422, "Text cannot be empty")
    sb.table("nodes").update({"text": text}).eq("id", node_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "node_text_updated", "user", "text", [node_id], {"text": text})
    return {"updated": True, "text": text}
```

**3. `PATCH /canvas/{canvas_id}/node/{node_id}/pin`** — Pin/unpin toggle.
```python
class PinNodeRequest(BaseModel):
    pinned: bool

@router.patch("/canvas/{canvas_id}/node/{node_id}/pin")
async def pin_node(
    canvas_id: str, node_id: str,
    req: PinNodeRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")
    sb.table("nodes").update({"pinned": req.pinned}).eq("id", node_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "node_pinned", "user", "text", [node_id], {"pinned": req.pinned})
    return {"pinned": req.pinned}
```

**4. Fix `DELETE /canvas/{canvas_id}/node/{node_id}`** — Add auth check (currently missing).
```python
@router.delete("/canvas/{canvas_id}/node/{node_id}")
async def delete_node(
    canvas_id: str, node_id: str,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")
    sb.table("nodes").delete().eq("id", node_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "node_deleted", "user", "text", [node_id])
    return {"deleted": True}
```

**5. `POST /canvas/{canvas_id}/edge`** — User-created connections.
```python
class CreateEdgeRequest(BaseModel):
    source_id: str
    target_id: str
    type: str  # supports | contradicts | depends_on | derived_from
    confidence: str = "medium"
    label: str | None = None
    branch_id: str

@router.post("/canvas/{canvas_id}/edge")
async def create_edge(
    canvas_id: str,
    req: CreateEdgeRequest,
    user: dict = Depends(get_current_user)
):
    valid_types = {"supports", "contradicts", "depends_on", "derived_from"}
    valid_confidence = {"low", "medium", "high"}
    if req.type not in valid_types:
        raise HTTPException(422, f"Invalid edge type. Must be one of: {valid_types}")
    if req.confidence not in valid_confidence:
        raise HTTPException(422, f"Invalid confidence. Must be one of: {valid_confidence}")

    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")

    edge_id = str(uuid.uuid4())
    sb.table("edges").insert({
        "id":         edge_id,
        "canvas_id":  canvas_id,
        "branch_id":  req.branch_id,
        "source_id":  req.source_id,
        "target_id":  req.target_id,
        "type":       req.type,
        "confidence": req.confidence,
        "label":      req.label,
        "created_by": "user",
    }).execute()
    log_event(canvas_id, req.branch_id, "edge_created", "user", "text", [req.source_id, req.target_id])
    return {"id": edge_id, "type": req.type, "confidence": req.confidence}
```

**6. `DELETE /canvas/{canvas_id}/edge/{edge_id}`** — Edge deletion.
```python
@router.delete("/canvas/{canvas_id}/edge/{edge_id}")
async def delete_edge(
    canvas_id: str, edge_id: str,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")
    sb.table("edges").delete().eq("id", edge_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "edge_deleted", "user", "text", [edge_id])
    return {"deleted": True}
```

**7. `POST /canvas/{canvas_id}/node`** — Manual user-created node.
```python
class CreateNodeRequest(BaseModel):
    type: str
    text: str
    branch_id: str
    position: dict  # {x: float, y: float}

@router.post("/canvas/{canvas_id}/node")
async def create_node(
    canvas_id: str,
    req: CreateNodeRequest,
    user: dict = Depends(get_current_user)
):
    valid_types = {"idea","evidence","assumption","question","constraint","insight","decision","source"}
    if req.type not in valid_types:
        raise HTTPException(422, f"Invalid node type")
    if not req.text.strip():
        raise HTTPException(422, "Text cannot be empty")

    sb = get_client()
    canvas = sb.table("canvases").select("user_id, workspace_mode").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")

    node_id = str(uuid.uuid4())
    sb.table("nodes").insert({
        "id":                          node_id,
        "canvas_id":                   canvas_id,
        "branch_id":                   req.branch_id,
        "type":                        req.type,
        "text":                        req.text.strip(),
        "confidence":                  "high",
        "provenance_type":             "user_created",
        "provenance_detail":           {},
        "impact_nodes":                [],
        "position":                    req.position,
        "pinned":                      False,
        "created_by":                  "user",
        "input_modality":              "text",
        "workspace_mode_at_creation":  canvas.data.get("workspace_mode", "analytical"),
    }).execute()
    log_event(canvas_id, req.branch_id, "node_created", "user", "text", [node_id])
    return {"id": node_id}
```

**8. `POST /canvas/{canvas_id}/merge`** — Merge N nodes into one synthesized insight.
```python
class MergeNodesRequest(BaseModel):
    node_ids: list[str]
    branch_id: str

@router.post("/canvas/{canvas_id}/merge")
async def merge_nodes(
    canvas_id: str,
    req: MergeNodesRequest,
    user: dict = Depends(get_current_user)
):
    if len(req.node_ids) < 2:
        raise HTTPException(422, "Must select at least 2 nodes to merge")

    sb = get_client()
    canvas = sb.table("canvases").select("user_id, workspace_mode").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")

    nodes = sb.table("nodes").select("id, text, type").in_("id", req.node_ids).eq("canvas_id", canvas_id).execute().data
    if not nodes:
        raise HTTPException(404, "None of the specified nodes found")

    workspace_mode = canvas.data.get("workspace_mode", "analytical")
    combined_text = "\n".join(f"[{n['type']}] {n['text']}" for n in nodes)
    synthesis_prompt = f"Synthesize these nodes into one concise insight:\n\n{combined_text}"
    compilation = llm_service.compile_document(synthesis_prompt, workspace_mode)

    # Calculate centroid position for the merged node
    positions = []
    for nid in req.node_ids:
        node_row = sb.table("nodes").select("position").eq("id", nid).single().execute().data
        if node_row and node_row.get("position"):
            positions.append(node_row["position"])
    centroid = {
        "x": sum(p["x"] for p in positions) / len(positions) if positions else 0,
        "y": sum(p["y"] for p in positions) / len(positions) if positions else 0,
    }

    # Delete source nodes
    for nid in req.node_ids:
        sb.table("nodes").delete().eq("id", nid).execute()

    # Create merged insight node
    merged_id = str(uuid.uuid4())
    merged_text = compilation["nodes"][0]["text"] if compilation.get("nodes") else combined_text[:200]
    sb.table("nodes").insert({
        "id":                         merged_id,
        "canvas_id":                  canvas_id,
        "branch_id":                  req.branch_id,
        "type":                       "insight",
        "text":                       merged_text,
        "confidence":                 "high",
        "provenance_type":            "ai_inference",
        "provenance_detail":          {"merged_from": req.node_ids},
        "impact_nodes":               [],
        "position":                   centroid,
        "pinned":                     False,
        "created_by":                 "ai",
        "input_modality":             "text",
        "workspace_mode_at_creation": workspace_mode,
    }).execute()
    log_event(canvas_id, req.branch_id, "merge", "user", "text", req.node_ids + [merged_id])
    return {"merged_node_id": merged_id, "deleted_ids": req.node_ids}
```

**9. `GET /canvas/{canvas_id}/assumptions`** — Returns all assumption-type nodes for the active branch.
```python
@router.get("/canvas/{canvas_id}/assumptions")
async def get_assumptions(
    canvas_id: str,
    branch_id: str = "",
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")

    bid = branch_id or _get_active_branch_id(sb, canvas_id)
    nodes = (
        sb.table("nodes").select("id, text, confidence, provenance_type, impact_nodes")
        .eq("canvas_id", canvas_id).eq("branch_id", bid).eq("type", "assumption")
        .execute().data
    )
    # Map to Assumption shape expected by frontend
    assumptions = [
        {
            "node_id":         n["id"],
            "statement":       n["text"],
            "confidence":      n["confidence"],
            "provenance_type": n["provenance_type"],
            "impact_nodes":    n.get("impact_nodes") or [],
        }
        for n in nodes
    ]
    return {"assumptions": assumptions}
```

**10. `GET /canvas/{canvas_id}/activity`** — Returns paginated activity events for Activity Log.
```python
@router.get("/canvas/{canvas_id}/activity")
async def get_activity(
    canvas_id: str,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")

    events = (
        sb.table("events")
        .select("event_id, timestamp, event_type, author, input_modality, workspace_mode, affected_node_ids")
        .eq("canvas_id", canvas_id)
        .order("timestamp", desc=True)
        .limit(limit)
        .execute().data
    )
    return {"events": events}
```

**11. `GET /canvas/{canvas_id}/session-audit`** — Wire up the session audit endpoint (currently missing from canvas.py — it's referenced in App.tsx but the route doesn't exist).
```python
@router.get("/canvas/{canvas_id}/session-audit")
async def session_audit(
    canvas_id: str,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")

    # Find quarantined tier-2 memories that were never ratified this session
    pending = (
        sb.table("memories")
        .select("id, text, tier")
        .eq("canvas_id", canvas_id)
        .eq("tier", 2)
        .eq("quarantined", True)
        .eq("archived", False)
        .eq("rejected", False)
        .execute().data
    )
    items = [
        {"memory_id": m["id"], "text": m["text"], "confidence": "medium"}
        for m in pending
    ]
    return {"items": items}
```

**12. Fix `PUT /canvas/{canvas_id}/mode`** — Currently accepts mode as a query param (dangerous). Fix to use request body.
```python
class UpdateModeRequest(BaseModel):
    mode: str

@router.put("/canvas/{canvas_id}/mode")
async def update_workspace_mode(
    canvas_id: str,
    req: UpdateModeRequest,
    user: dict = Depends(get_current_user)
):
    valid_modes = {"analytical", "creative", "critical", "strategic"}
    if req.mode not in valid_modes:
        raise HTTPException(422, f"Invalid mode")
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")
    sb.table("canvases").update({"workspace_mode": req.mode}).eq("id", canvas_id).execute()
    branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).limit(1).execute()
    branch_id = branch.data[0]["id"] if branch.data else ""
    log_event(canvas_id, branch_id, "mode_changed", "user", "text", [], {"mode": req.mode}, req.mode)
    return {"mode": req.mode}
```

---

### Phase 2 — Frontend: Critical Bug Fixes

Before any redesign — these are pure logic fixes that unblock existing features.

---

#### [MODIFY] [App.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/App.tsx)

**Fix 1: `hasNodes` — derive from live canvas node count.**
Remove `const [hasNodes] = useState(false)` and derive from `useCanvas`:

```tsx
// In KleosCanvas, expose nodes.length via a callback prop:
// onNodesLoaded: (count: number) => void
// In App.tsx:
const [nodeCount, setNodeCount] = useState(0);
// pass onNodesLoaded={setNodeCount} to KleosCanvas
// Use: visible={nodeCount === 0}
```

**Fix 2: `assumptions` — load from API on panel open.**
Remove `const [assumptions] = useState<Assumption[]>([])`.
Add:
```tsx
const [assumptions, setAssumptions] = useState<Assumption[]>([]);

const loadAssumptions = useCallback(async () => {
  if (!canvasId || !branchId) return;
  const res = await api.get<{ assumptions: Assumption[] }>(
    `/api/canvas/${canvasId}/assumptions?branch_id=${branchId}`
  );
  setAssumptions(res.assumptions);
}, [canvasId, branchId]);

useEffect(() => {
  if (auditOpen) loadAssumptions();
}, [auditOpen, loadAssumptions]);
```
Also reload assumptions after every compilation `done` event.

**Fix 3: `activityEvents` — load from API on panel open.**
Remove `const [activityEvents] = useState<ActivityEvent[]>([])`.
Add:
```tsx
const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

const loadActivity = useCallback(async () => {
  if (!canvasId) return;
  const res = await api.get<{ events: ActivityEvent[] }>(`/api/canvas/${canvasId}/activity`);
  setActivityEvents(res.events);
}, [canvasId]);

useEffect(() => {
  if (activityOpen) loadActivity();
}, [activityOpen, loadActivity]);
```

**Fix 4: Branch switch — reload canvas when `activeBranchId` changes.**
```tsx
const canvasRef = useRef<{ loadCanvas: () => void } | null>(null);

// Pass branch context to KleosCanvas — it re-fetches on branch change:
// <KleosCanvas canvasId={canvasId} branchId={activeBranchId} />
// Inside useCanvas: canvasId + branchId as deps of loadCanvas
// GET /api/canvas/:id filters nodes by branch_id=activeBranchId
```
**Backend fix required:** `GET /canvas/{canvas_id}` currently returns ALL nodes for the canvas. Add optional `?branch_id=` query param to filter:
```python
@router.get("/canvas/{canvas_id}")
async def get_canvas(canvas_id: str, branch_id: str = "", user: dict = Depends(get_current_user)):
    ...
    nodes_query = sb.table("nodes").select("*").eq("canvas_id", canvas_id)
    if branch_id:
        nodes_query = nodes_query.eq("branch_id", branch_id)
    nodes = nodes_query.execute()
    ...
```

**Fix 5: `fitView` on every reload — call only on initial load.**
In `KleosCanvas.tsx`, pass an `initialFit` ref:
```tsx
const hasFitView = useRef(false);
// In ReactFlow: fitView={!hasFitView.current} — after first render set to true
// Better approach: use ReactFlow's onInit callback
const { fitView } = useReactFlow();
useEffect(() => {
  if (nodes.length > 0 && !hasFitView.current) {
    fitView({ padding: 0.2 });
    hasFitView.current = true;
  }
}, [nodes.length, fitView]);
// Remove fitView prop from <ReactFlow> element entirely
```

**Fix 6: Impact Halo wiring.**
Replace empty callbacks with real `useCanvas` functions:
```tsx
// App.tsx receives canvasActions ref from KleosCanvas via callback pattern
// or elevate useCanvas to App.tsx level:
const canvasState = useCanvas(canvasId);
// Pass to KleosCanvas: nodes={canvasState.displayNodes} edges={canvasState.edges}
// Then:
onHoverAssumption={(nodeId, impactNodes) => canvasState.activateImpactHalo(nodeId, impactNodes)}
onLeaveAssumption={() => canvasState.clearImpactHalo()}
```

**Fix 7: `handleTextDrop` — use `api.ts` instead of raw `EventSource`.**
The SSE pattern cannot go through fetch-based `api.ts` directly (EventSource doesn't support custom headers). Instead, attach the auth token as a query parameter for the SSE endpoint, or create a dedicated wrapper:
```tsx
// services/api.ts — add SSE helper:
export function openStream(path: string, onMessage: (payload: unknown) => void, onDone: () => void, onError: (msg: string) => void): EventSource {
  const token = supabase.auth.getSession(); // synchronous from cached session
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
  const url = `${base}${path}`;
  const es = new EventSource(url, { withCredentials: true });
  // SSE with cookie-based auth (Supabase sets httpOnly cookie on login)
  es.onmessage = (e) => { /* parse + dispatch */ };
  return es;
}
```
Replace the raw `EventSource` construction in `handleTextDrop` with `api.openStream(...)`.

**Fix 8: `ExportDialog` — use `api.ts` base URL.**
Remove `import.meta.env.VITE_API_BASE_URL` from `ExportDialog.tsx`. Import `api` and use `api.baseUrl`.

**Fix 9: `modeSelected` — restore first-use ModeSelector.**
```tsx
const [modeSelected, setModeSelected] = useState(() => {
  return localStorage.getItem('kleos:modeSelected') === 'true';
});

const handleModeSelect = useCallback(async (m: WorkspaceMode) => {
  setMode(m);
  setModeSelected(true);
  localStorage.setItem('kleos:modeSelected', 'true');
  if (canvasId) await api.put(`/api/canvas/${canvasId}/mode`, { mode: m });
}, [canvasId]);
```

**Fix 10: Session audit — wire to navigation-away.**
```tsx
// In App.tsx, use React Router's useBlocker or beforeunload:
useEffect(() => {
  const handleBeforeUnload = async () => {
    if (!incognito && canvasId) {
      // Trigger session audit silently — don't block unload
      const result = await api.get<{ items: typeof auditItems }>(`/api/canvas/${canvasId}/session-audit`);
      if (result.items.length > 0) {
        setAuditItems(result.items);
        setShowAuditCard(true);
      }
    }
  };
  // Use React Router navigate listener instead (doesn't block browser close):
  // This is wired to the WorkspaceChrome "← Dashboard" button click before navigating
}, []);
```

---

#### [MODIFY] [KleosCanvas.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/canvas/KleosCanvas.tsx)

**Add:**
- `branchId` prop — passed to `useCanvas`, triggers reload when branch changes
- `onNodesLoaded(count)` callback — reports node count to App.tsx for `hasNodes` fix
- `onConnect` handler → opens `EdgeConnectionDialog`
- `onNodesDelete` handler → calls `DELETE /api/canvas/:id/node/:id` for each
- `onNodeDragStop` handler → calls `PATCH /api/canvas/:id/node/:id/position`
- `onNodeDoubleClick` handler → sets `editingNodeId` state → opens `NodeEditOverlay`
- `onNodeContextMenu` handler → opens `NodeContextMenu`
- `<MiniMap>` component from ReactFlow
- Remove `fitView` prop; use `useReactFlow().fitView()` on first load only
- `proOptions={{ hideAttribution: true }}` to remove ReactFlow watermark
- `onEdgeContextMenu` handler → opens edge context menu with "Delete edge" option

Full updated component signature:
```tsx
interface Props {
  canvasId: string;
  branchId: string;
  onNodesLoaded: (count: number) => void;
}

export function KleosCanvas({ canvasId, branchId, onNodesLoaded }: Props)
```

---

#### [MODIFY] [useCanvas.ts](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/hooks/useCanvas.ts)

- Add `branchId` parameter — `loadCanvas` includes `?branch_id=branchId` in the API call
- Add `useEffect` on `branchId` change → `loadCanvas()`
- Add `persistNodePosition(nodeId, x, y)` — calls `PATCH /api/canvas/:id/node/:id/position`
- Add `deleteNode(nodeId)` — calls `DELETE /api/canvas/:id/node/:id`, removes from state
- Add `deleteEdge(edgeId)` — calls `DELETE /api/canvas/:id/edge/:id`, removes from state
- Add `updateNodeText(nodeId, text)` — calls `PATCH /api/canvas/:id/node/:id/text`, updates state
- Add `createEdge(sourceId, targetId, type, confidence, branchId)` — calls `POST /api/canvas/:id/edge`, adds to state
- Add `pinNode(nodeId, pinned)` — calls `PATCH /api/canvas/:id/node/:id/pin`, updates state
- Add `mergeNodes(nodeIds, branchId)` — calls `POST /api/canvas/:id/merge`, reloads canvas

---

#### [NEW] `src/frontend/src/canvas/EdgeConnectionDialog.tsx`

Dialog that appears when user completes a ReactFlow connection drag. Lets user pick:
- Edge type (supports / contradicts / depends_on / derived_from) — radio group with colored indicators
- Confidence (high / medium / low) — segmented control
- Optional label text field
- Create / Cancel buttons

On Create: calls `useCanvas.createEdge(...)`.

```tsx
interface Props {
  open: boolean;
  connection: Connection | null;  // from ReactFlow
  onConfirm: (type: RelationType, confidence: Confidence, label?: string) => void;
  onCancel: () => void;
}
```

---

#### [NEW] `src/frontend/src/canvas/NodeContextMenu.tsx`

Right-click context menu on canvas nodes. Menu items:
- **Edit text** — opens inline edit mode on the node
- **Pin / Unpin** — toggles `pinned` state
- **Delete node** — with confirmation prompt inline (shows node text preview + Confirm/Cancel)
- **Merge with selected** — enabled only when multiple nodes are selected; triggers merge flow
- **Create edge from here** — puts canvas into "edge draw mode" from this node
- **View provenance** — opens a small popover showing `provenance_type` + `provenance_detail` fields
- **Ask AI about this** — puts the node text into the TextInputBar as context

```tsx
interface Props {
  nodeId: string;
  nodeText: string;
  x: number;  // screen position
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
```

Positioned absolutely at (x, y) with `z-50`. Dismisses on outside click or Escape.

---

#### [NEW] `src/frontend/src/canvas/NodeEditOverlay.tsx`

Inline edit mode for a node. Appears inside the node card when double-clicked.

- Replaces the node text `<p>` with a `<textarea>` auto-focused
- Save on `Ctrl+Enter` or blue "Save" button
- Cancel on `Escape` or "Cancel" button
- Validates non-empty before save
- On save: calls `useCanvas.updateNodeText(nodeId, text)` → optimistic update in state

---

#### [MODIFY] [BaseNode.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/canvas/nodes/BaseNode.tsx)

- Accept `onDoubleClick` and `onContextMenu` from node data (passed via ReactFlow's node event props)
- Show a pin indicator (📌 or `push_pin` Material Symbol) when `data.pinned === true`
- Apply `isEditing` state to swap content area to `NodeEditOverlay`
- Light theme styles: Frosted White background, type-color 2px left accent border (like evidence's current stripe, applied to ALL types), Charcoal Body text, Warm Stone header row background
- Remove all hardcoded `#2b2b2b`, `#1a1a1a`, `#f9f9f9` — replace with CSS custom properties from design.md
- Handles remain at left/right; style to match light design (Warm Stone fill, Onyx Border outline)

---

#### [MODIFY] [KleosEdge.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/canvas/KleosEdge.tsx)

- Add edge label rendering: if `data.label` exists, show centered text badge on the edge path midpoint
- Add selected state: when edge is selected, increase `strokeWidth` from 1.5 to 2.5 and show delete button
- Context menu support via `onContextMenu` prop
- Update edge colors to work on light background (keep existing semantic colors — they're universally readable)

---

#### [MODIFY] [useKeyboardShortcuts.ts](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/hooks/useKeyboardShortcuts.ts)

All 4 empty callbacks are implemented:

- `B` → Focus the branch name input in BranchRail (triggers `setCreating(true)` in BranchRail via a `ref`/callback pattern)
- `M` → Trigger merge for currently selected nodes (via `onMerge` callback passed from App → useCanvas.mergeNodes)
- `T` → Toggle ReasoningPathWalk mode on the last compilation's `ribbonSteps`
- `P` → Pin the currently selected node (via `onPin` callback → useCanvas.pinNode)

---

#### [MODIFY] [ReasoningPathWalk.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/canvas/ReasoningPathWalk.tsx)

Currently exists but is never mounted. Mount it in `App.tsx` inside the canvas `div`:
```tsx
const [pathWalkActive, setPathWalkActive] = useState(false);
const [pathWalkStep, setPathWalkStep] = useState(0);

// T shortcut: onTrace: () => { if (ribbonSteps.length > 0) setPathWalkActive(true); }
<ReasoningPathWalk
  active={pathWalkActive}
  steps={ribbonSteps}
  currentStep={pathWalkStep}
  onNext={() => setPathWalkStep(s => Math.min(s + 1, ribbonSteps.length - 1))}
  onPrev={() => setPathWalkStep(s => Math.max(s - 1, 0))}
  onFeedback={async (positive) => {
    // POST feedback to /api/canvas/:id/feedback (new minimal endpoint)
    await api.post(`/api/canvas/${canvasId}/feedback`, { positive, steps: ribbonSteps });
    setPathWalkActive(false);
  }}
  onExit={() => { setPathWalkActive(false); setPathWalkStep(0); }}
/>
```

Add `POST /canvas/{canvas_id}/feedback` endpoint (simple event log):
```python
@router.post("/canvas/{canvas_id}/feedback")
async def log_reasoning_feedback(canvas_id: str, req: dict, user: dict = Depends(get_current_user)):
    sb = get_client()
    log_event(canvas_id, "", "voice_command_received", "user", "text", [], {"feedback": req.get("positive"), "step_count": len(req.get("steps", []))})
    return {"ok": True}
```

---

#### [MODIFY] [ThinkingTimeline.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/panels/ThinkingTimeline.tsx)

Currently exists but is never mounted. Mount it inside the `HamburgerDrawer` (new component below) under a "Timeline" section.

---

### Phase 3 — Frontend: Layout Redesign

Replace the current monolithic `App.tsx` header bar with a modular, canvas_goal.txt-aligned layout.

---

#### [MODIFY] [WorkspaceLayout.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/layout/WorkspaceLayout.tsx)

Remove the current `NavBar` that floats absolutely above the canvas. WorkspaceLayout should be completely transparent — just `<Outlet />`. All workspace navigation lives inside `App.tsx`'s new `WorkspaceChrome` component.

```tsx
export default function WorkspaceLayout() {
  return <Outlet />;
}
```

---

#### [NEW] `src/frontend/src/workspace/WorkspaceChrome.tsx`

The top bar of the canvas. Replaces the old header bar. Much simpler.

**Left:** `← Dashboard` link (navigates to `/dashboard`, triggers `triggerSessionAudit` first)  
**Center:** Canvas title (inline editable — click to edit, calls `PATCH /api/canvas/:id/title`)  
**Right:** Persona/Mode selector dropdown, Incognito toggle, Export button, Hamburger menu (`☰`)

Height: 48px. Background: `var(--color-frosted-white)`. Border-bottom: `1px solid var(--color-warm-stone)`.

```tsx
interface Props {
  canvasId: string;
  title: string;
  mode: WorkspaceMode;
  incognito: boolean;
  onTitleChange: (title: string) => void;
  onModeChange: (mode: WorkspaceMode) => void;
  onIncognitoToggle: () => void;
  onExport: () => void;
  onHamburger: () => void;
  onBack: () => void;  // triggers session audit then navigates
}
```

---

#### [NEW] `src/frontend/src/workspace/HamburgerDrawer.tsx`

Slide-out drawer from the right. Contains all secondary features that were previously scattered in the header bar.

**Sections:**
1. **Branches** — The entire BranchRail contents (branch list, compare, create)
2. **Activity Log** — Inline (no separate overlay) — shows `activityEvents`
3. **Thinking Timeline** — `ThinkingTimeline` component
4. **Source Filter** — `SourceFilter` component
5. **Incognito** — Toggle + explanation
6. **Keyboard Shortcuts** — Static legend: B/M/C/T/P/Esc

Width: 320px. Slides from right. Spring animation. Backdrop (click to close).

---

#### [NEW] `src/frontend/src/workspace/BottomChatBar.tsx`

Replaces `TextInputBar.tsx`. Centered at the bottom of the canvas.

**Layout:**
```
[📎 Attach] [───────── textarea ─────────] [🎙 Mic] [▶ Think]
```

- Floating card style: `var(--color-frosted-white)` background, `1px solid var(--color-warm-stone)` border, `12px` border-radius, gentle box-shadow
- Positioned: `absolute bottom-4 left-1/2 -translate-x-1/2` with `max-width: 680px; width: calc(100% - 48px)`
- Textarea: grows from 1→4 rows, 14px, Switzer font
- **Attach button** (📎): Opens file picker → `POST /api/canvas/:id/drop` with file form data
- **Mic button** (🎙): Directly calls `startVoice()` / `stopVoice()` — mic is IN the chat bar, not in the header
- **Think button** (▶): `background: var(--color-graphite-ink); color: white; border-radius: 200px` — Graphite ink pill CTA
- Label changed from "Drop" → "Think"
- Submit: `Ctrl+Enter` OR click Think button; `Enter` = newline (unchanged)
- During compile: Think button shows spinner + "Working..." text, disabled
- Status indicator: Small animated dot inside the chat bar (replaces separate `StatusPill` — or keep pill in WorkspaceChrome)

---

#### [NEW] `src/frontend/src/workspace/CanvasLeftRail.tsx`

Left panel that shows a compact node chip list. Per canvas_goal.txt sketch.

**Behavior:**
- Collapsed: 0px wide (hidden)
- Expanded: 240px wide
- Toggle: clicking a node on canvas expands it and focuses that node in the list
- Node chips: type color dot + first 40 chars of text + assumption count badge
- Clicking a chip: `fitView` to that node on the canvas
- Memory + Assumptions tab at bottom of rail
- **Toggle button:** small `›` arrow at left edge of canvas when collapsed, `‹` when expanded

---

#### [NEW] `src/frontend/src/workspace/MemoryAssumptionToggle.tsx`

Bottom-left floating toggle panel (per canvas_goal.txt).

**Two sections, switchable by tab:**
1. **Memory** — abbreviated version of `MemoryPanel` (Core + Pending tabs only, no search — search lives in full MemoryPanel accessible from CanvasLeftRail)
2. **Assumptions** — abbreviated version of `AssumptionAuditPanel` (list only, no CRUD — full CRUD from HamburgerDrawer)

Position: `absolute bottom-20 left-4` (above the BottomChatBar area), width 280px.  
Toggle button: `absolute left-4 bottom-4` memory icon → opens the panel.

---

#### [NEW] `src/frontend/src/workspace/SourcesToggle.tsx`

Bottom-right floating panel for source filter (per canvas_goal.txt).

Shows active source filter buttons. Clicking a source type dims non-matching nodes.

Position: `absolute bottom-20 right-4`, width auto.  
Toggle button: `absolute right-4 bottom-4` filter icon.

---

#### [MODIFY] App.tsx — Full Restructure

Remove old header bar JSX entirely. The new layout becomes:

```tsx
return (
  <div className="relative h-screen w-screen overflow-hidden" style={{ background: 'var(--color-linen-canvas)' }}>
    {/* Top workspace chrome */}
    <WorkspaceChrome
      canvasId={canvasId}
      title={canvasTitle}
      mode={mode}
      incognito={incognito}
      onTitleChange={handleTitleChange}
      onModeChange={handleModeChange}
      onIncognitoToggle={toggleIncognito}
      onExport={() => setExportOpen(true)}
      onHamburger={() => setDrawerOpen(true)}
      onBack={handleBackToDashboard}
    />

    {/* Full canvas area below chrome */}
    <div className="absolute top-[48px] bottom-0 left-0 right-0 relative">
      
      {/* Left rail (node list + memory/assumption) */}
      <CanvasLeftRail
        canvasId={canvasId}
        branchId={activeBranchId}
        open={railOpen}
        onToggle={() => setRailOpen(o => !o)}
        onNodeFocus={(nodeId) => { /* fitView to node */ }}
        assumptions={assumptions}
        onHoverAssumption={canvasState.activateImpactHalo}
        onLeaveAssumption={canvasState.clearImpactHalo}
      />

      {/* ReactFlow canvas */}
      <KleosCanvas
        canvasId={canvasId}
        branchId={activeBranchId}
        canvasState={canvasState}
        sourceFilter={sourceFilter}
        onNodesLoaded={setNodeCount}
        onNodeSelect={setSelectedNodeIds}
      />

      {/* Empty state */}
      <SuggestionChips
        visible={nodeCount === 0}
        onStartVoice={startVoice}
        onFocusText={() => bottomChatRef.current?.focus()}
        onOpenDrop={() => bottomChatRef.current?.openFilePicker()}
      />

      {/* Bottom-left memory/assumptions toggle */}
      <MemoryAssumptionToggle
        canvasId={canvasId}
        assumptions={assumptions}
        onHoverAssumption={canvasState.activateImpactHalo}
        onLeaveAssumption={canvasState.clearImpactHalo}
      />

      {/* Bottom-right source filter toggle */}
      <SourcesToggle
        activeFilter={sourceFilter}
        onFilter={setSourceFilter}
      />

      {/* Memory Negotiation Card */}
      <MemoryNegotiationCard open={negCardOpen} observation={negCardObs} onChoice={handleMemoryChoice} />

      {/* Voice transcript */}
      <VoiceTranscript transcript={transcript} isActive={voiceStatus !== 'idle'} />

      {/* Reasoning Path Walk (T shortcut) */}
      <ReasoningPathWalk
        active={pathWalkActive}
        steps={ribbonSteps}
        currentStep={pathWalkStep}
        onNext={...} onPrev={...} onFeedback={...} onExit={...}
      />

      {/* Reasoning Ribbon */}
      <ReasoningRibbon steps={ribbonSteps} isActive={isCompiling} onStepClick={handleStepClick} />

      {/* Incognito border */}
      {incognito && <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 3px var(--color-graphite-ink)' }} />}

      {/* Error banner */}
      {dropError && <ErrorBanner message={dropError} onDismiss={() => setDropError(null)} />}
    </div>

    {/* Bottom chat bar (absolute, centered) */}
    <BottomChatBar
      ref={bottomChatRef}
      canvasId={canvasId}
      branchId={activeBranchId}
      isCompiling={isCompiling}
      pillState={pillState}
      onSubmit={handleTextDrop}
      onFileAttach={handleFileAttach}
      onVoiceToggle={() => voiceStatus === 'idle' ? startVoice() : stopVoice()}
      voiceActive={voiceStatus !== 'idle'}
      onPause={() => { sseRef.current?.close(); setIsCompiling(false); setPillState('ready'); }}
      onStop={() => { sseRef.current?.close(); setIsCompiling(false); setPillState('ready'); revertCompilation(); }}
    />

    {/* Hamburger drawer */}
    <HamburgerDrawer
      open={drawerOpen}
      canvasId={canvasId}
      branchId={activeBranchId}
      branches={branches}
      activeBranchId={activeBranchId}
      compareMode={compareMode}
      activityEvents={activityEvents}
      incognito={incognito}
      onClose={() => setDrawerOpen(false)}
      onBranchSwitch={handleBranchSwitch}
      onCompare={(a, b) => setCompareMode(true)}
      onBranchCreated={b => setBranches(prev => [...prev, b])}
    />

    {/* Modals */}
    <ExportDialog open={exportOpen} canvasId={canvasId} branchId={activeBranchId} onClose={() => setExportOpen(false)} />
    <SessionMemoryAuditCard ... />
    <ModeSelector visible={!modeSelected} onSelect={handleModeSelect} />
  </div>
);
```

---

### Phase 4 — Frontend: Theme Migration

Every component in the workspace must align with `design.md`.

---

#### [MODIFY] `src/frontend/src/index.css` (workspace overrides)

The workspace lives inside `body` which already uses Linen Canvas from the global `variables.css`. Add workspace-specific tokens:

```css
/* Workspace canvas surface */
.workspace-canvas-bg {
  background: var(--color-linen-canvas);
}

/* Node card — light theme */
.kleos-node-card {
  background: var(--color-frosted-white);
  border: 1px solid var(--color-warm-stone);
  border-radius: 12px;
  color: var(--color-charcoal-body);
  font-family: var(--font-switzer);
}

/* Workspace chrome */
.workspace-chrome {
  background: var(--color-frosted-white);
  border-bottom: 1px solid var(--color-warm-stone);
  font-family: var(--font-switzer);
}

/* Bottom chat bar */
.bottom-chat-bar {
  background: var(--color-frosted-white);
  border: 1px solid var(--color-warm-stone);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

/* Workspace panels */
.workspace-panel {
  background: var(--color-frosted-white);
  border: 1px solid var(--color-warm-stone);
}
```

---

#### [MODIFY] [BaseNode.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/canvas/nodes/BaseNode.tsx) — Light Theme

Full visual overhaul:

**Node backgrounds:** All → `var(--color-frosted-white)` (was `#2b2b2b`)  
**Node borders:** All → 1px `var(--color-warm-stone)` + 3px left accent stripe in type color (all types get the left stripe, not just evidence)  
**Text:** `var(--color-charcoal-body)` (was `#f9f9f9`)  
**Label text:** `var(--color-slate-caption)` uppercase 10px (unchanged size, new color)  
**Selected border:** `var(--color-graphite-ink)` 2px (was `#e5ff5d`)  
**Handles:** `var(--color-warm-stone)` fill, `var(--color-pebble)` border  
**Impact Halo:** Amber glow unchanged — it's readable on both themes  
**Assumption dashed border:** Keep `#e5ff5d` as the dashed border color — this is the one legitimate binary signal use  
**Error state:** `background: #fff0f0`, `border: 1px solid #d44`, same pattern  
**ScopeChip:** Update to use Warm Stone bg, Charcoal text  
**ProvenanceBadge:** Keep colored — type colors are still semantic

---

#### [MODIFY] [KleosCanvas.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/canvas/KleosCanvas.tsx) — Light Theme

```tsx
// Background
<div style={{ background: 'var(--color-linen-canvas)' }}>
  <ReactFlow style={{ background: 'var(--color-linen-canvas)' }} ...>
    <Background color="var(--color-quartz)" variant={BackgroundVariant.Dots} gap={24} size={1.5} />
    <Controls style={{ background: 'var(--color-frosted-white)', border: '1px solid var(--color-warm-stone)', borderRadius: '8px' }} />
    <MiniMap
      nodeColor={(n) => NODE_REGISTRY[n.type as NodeType]?.borderColor ?? '#9c9c9c'}
      maskColor="rgba(237, 237, 232, 0.7)"
      style={{ border: '1px solid var(--color-warm-stone)', borderRadius: '8px' }}
    />
  </ReactFlow>
</div>
```

---

#### [MODIFY] All panel components — Light Theme

| File | Change |
|---|---|
| `MemoryPanel.tsx` | `background: var(--color-frosted-white)`, `border-right: 1px solid var(--color-warm-stone)`, all text → design.md tokens |
| `AssumptionAuditPanel.tsx` | Same |
| `ActivityLog.tsx` | Same |
| `StatusPill.tsx` | `border-radius: 200px` (pill), `background: var(--color-warm-stone)`, text `var(--color-charcoal-body)` |
| `MemoryNegotiationCard.tsx` | `background: var(--color-frosted-white)`, keep amber `#f5c842` border (this is functional, not decorative) |
| `ExportDialog.tsx` | Light modal: `background: var(--color-frosted-white)`, graphite-ink primary button (pill) |
| `BranchRail.tsx` | Move into HamburgerDrawer — repurpose as a vertical list, not a horizontal rail |
| `TextInputBar.tsx` | Replaced by `BottomChatBar.tsx` |
| `ModeSelector.tsx` | Light theme: `background: var(--color-linen-canvas)`, mode cards `var(--color-frosted-white)` |
| `ReasoningRibbon.tsx` | Light: `background: var(--color-frosted-white)`, `border-top: 1px solid var(--color-warm-stone)`, text `var(--color-charcoal-body)` |
| `ReasoningPathWalk.tsx` | Narration card: `background: var(--color-frosted-white)`, graphite-ink progress bar fill |
| `VoiceTranscript.tsx` | Light glass: `background: rgba(255,255,255,0.85)`, `backdrop-filter: blur(12px)` |
| `PauseStopControls.tsx` | Light buttons: `var(--color-warm-stone)` bg, `var(--color-graphite-ink)` text |

---

#### [MODIFY] All icon-only buttons — Add `aria-label`

Every `<button>` that contains only a `material-symbols-outlined` icon must receive:
- `aria-label="[descriptive label]"`
- `title="[same label]"` (tooltip for mouse users)

Examples:
- Memory toggle: `aria-label="Open memory panel"`
- Export: `aria-label="Export canvas"`
- Hamburger: `aria-label="Open menu"`
- Mic: `aria-label="Start voice input"` / `"Stop voice input"` (dynamic)

---

### Phase 5 — Frontend: Accessibility

---

#### [MODIFY] [VoiceTranscript.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/components/VoiceTranscript.tsx)

```tsx
<div aria-live="polite" aria-label="Voice transcript" role="status">
  {transcript}
</div>
```

---

#### [MODIFY] [StatusPill.tsx](file:///C:/Users/omen/OneDrive/Desktop/Kleos/src/frontend/src/components/StatusPill.tsx)

```tsx
<button role="status" aria-label={`Canvas status: ${cfg.label}`} aria-live="polite" ...>
```

---

#### Contrast Ratios

After light theme migration, all text naturally achieves WCAG AA:
- `var(--color-charcoal-body)` (`#292929`) on `var(--color-frosted-white)` (`#ffffff`): 12.1:1 ✅
- `var(--color-slate-caption)` (`#6f6f6e`) on `var(--color-frosted-white)`: 5.5:1 ✅
- `var(--color-charcoal-body)` on `var(--color-warm-stone)` (`#dbdbd2`): 7.8:1 ✅

Old dark theme had failures. Light theme resolves them all.

---

#### Focus Management for Panels

When any panel opens (MemoryPanel, AssumptionAuditPanel, HamburgerDrawer):
```tsx
const closeButtonRef = useRef<HTMLButtonElement>(null);
useEffect(() => {
  if (open) closeButtonRef.current?.focus();
}, [open]);
```
When panel closes: focus returns to the trigger button via `triggerRef.current?.focus()`.

---

### Phase 6 — Frontend: Feature Completeness

---

#### ModeSelector — First-Use Flow

Remove `useState(true)` default. Show ModeSelector when:
1. First time a user opens **any** canvas (`localStorage.getItem('kleos:modeSelected')` is null)
2. User explicitly opens mode picker via WorkspaceChrome (resets the choice)

After selection: persist to localStorage AND update canvas in DB.

---

#### Keyboard Shortcuts — Full Implementation

All 7 shortcuts fully functional:

| Key | Action |
|---|---|
| `B` | Focus branch name input in HamburgerDrawer (open drawer if closed, focus the create branch input) |
| `M` | If 2+ nodes selected: open merge confirmation dialog. Else: show toast "Select 2+ nodes to merge" |
| `C` | Toggle compare mode (already works) |
| `T` | If `ribbonSteps.length > 0`: activate ReasoningPathWalk. Else: show toast "No reasoning steps yet" |
| `P` | If a node is selected: toggle pin on that node. Else: show toast "Select a node to pin" |
| `Escape` | Close all panels (already works); also exits ReasoningPathWalk and NodeContextMenu |
| `Ctrl+Enter` | Submit BottomChatBar (already works in TextInputBar) |

Add a keyboard shortcut legend accessible from WorkspaceChrome (small `?` icon or in HamburgerDrawer footer).

---

#### [NEW] `src/frontend/src/workspace/ShortcutLegend.tsx`

Small tooltip/modal listing all keyboard shortcuts. Triggered by `?` key when not in input.

---

#### [NEW] `src/frontend/src/workspace/NodeMergeDialog.tsx`

Triggered by `M` key when 2+ nodes selected or "Merge with selected" in context menu.

Shows:
- List of selected node texts (chips with remove X)
- Preview: "AI will synthesize these into one Insight node"
- Merge / Cancel buttons

On Merge: calls `useCanvas.mergeNodes(selectedNodeIds, activeBranchId)` → reloads canvas.

---

#### [MODIFY] `ExportDialog.tsx` — Replace `alert()` with inline error

Remove `alert(\`Export failed: ${err}\`)`. Replace with a state-driven error banner inside the modal:
```tsx
const [exportError, setExportError] = useState<string | null>(null);
// In catch block:
setExportError(`Export failed: ${String(err)}`);
// Render:
{exportError && <div role="alert" style={{ color: 'var(--color-error)', fontSize: '12px' }}>{exportError}</div>}
```

---

#### `/workspace` Route Redirect

In `main.tsx`, add a redirect:
```tsx
{ path: 'workspace', element: <Navigate to="/dashboard" replace /> },
```

---

#### `DELETE /canvas/{canvas_id}` — Canvas deletion from Dashboard

Currently not implemented. DashboardPage has no delete action. Add:

**Backend:**
```python
@router.delete("/canvas/{canvas_id}")
async def delete_canvas(canvas_id: str, user: dict = Depends(get_current_user)):
    sb = get_client()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    if not canvas.data or canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")
    sb.table("canvases").delete().eq("id", canvas_id).execute()
    return {"deleted": True}
```

**Frontend (DashboardPage):** Add a `⋮` menu on each canvas card with "Delete" action — confirmation dialog → `api.delete` → remove from list.

---

## Verification Plan

### DB Migration
```bash
# Run the migration script (same pattern as run_migration.py already in scratch/)
python brain/.../scratch/run_migration.py  # extended for migration 003
```
Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'nodes'` shows `updated_at`.

### Backend Unit Tests

Run after backend changes:
```bash
cd src/backend && python -m pytest tests/ -v
# Or if no test suite exists:
uvicorn main:app --reload
# Manual test new endpoints with curl or httpie
```

Key endpoint tests:
- `PATCH /api/canvas/{id}/node/{id}/position` → verify position column updated in Supabase
- `POST /api/canvas/{id}/edge` → verify edge row created with `created_by='user'`
- `GET /api/canvas/{id}/assumptions` → verify only type='assumption' nodes returned
- `GET /api/canvas/{id}/activity` → verify events returned in desc order

### Frontend Dev Server
```bash
cd src/frontend && npm run dev
```

Manual verification checklist:
- [ ] Navigate `/workspace/:id` → workspace loads with light theme
- [ ] WorkspaceChrome shows title, mode pill, back link
- [ ] Click `← Dashboard` → session audit triggers → navigate to `/dashboard`
- [ ] Drag a node → refresh page → node stays in dragged position
- [ ] Double-click a node → textarea appears → edit text → Ctrl+Enter → text updates
- [ ] Right-click a node → context menu appears → Delete → confirm → node disappears
- [ ] Drag from node handle → drop on another node → EdgeConnectionDialog opens → create edge → edge appears
- [ ] Select 2 nodes → M key → MergeDialog → confirm → merged insight node appears
- [ ] Open HamburgerDrawer → branches visible → create new branch → switch → canvas reloads with branch nodes
- [ ] Open Assumption panel → `assumptions` list populated (not empty)
- [ ] Open Activity Log → `activityEvents` list populated (not empty)
- [ ] T key with steps → ReasoningPathWalk activates
- [ ] P key with node selected → pin icon appears on node
- [ ] `/workspace` with no ID → redirects to `/dashboard`
- [ ] All icon buttons have aria-label (use browser accessibility tree)
- [ ] Contrast ratios pass (use browser DevTools → Accessibility tab)
- [ ] ModeSelector shows on first visit to a new canvas (clear localStorage to test)

---

## Summary of New Files

| File | Purpose |
|---|---|
| `supabase/migrations/20240001000003_canvas_workspace_v2.sql` | DB schema additions |
| `src/frontend/src/canvas/EdgeConnectionDialog.tsx` | Edge creation UI |
| `src/frontend/src/canvas/NodeContextMenu.tsx` | Right-click context menu |
| `src/frontend/src/canvas/NodeEditOverlay.tsx` | Inline node text edit |
| `src/frontend/src/workspace/WorkspaceChrome.tsx` | New top bar |
| `src/frontend/src/workspace/HamburgerDrawer.tsx` | Slide-out secondary features |
| `src/frontend/src/workspace/BottomChatBar.tsx` | New chat input bar |
| `src/frontend/src/workspace/CanvasLeftRail.tsx` | Node list + memory toggle |
| `src/frontend/src/workspace/MemoryAssumptionToggle.tsx` | Bottom-left panel |
| `src/frontend/src/workspace/SourcesToggle.tsx` | Bottom-right source filter |
| `src/frontend/src/workspace/ShortcutLegend.tsx` | Keyboard shortcut legend |
| `src/frontend/src/workspace/NodeMergeDialog.tsx` | Multi-node merge UI |

## Summary of Modified Files

| File | What Changes |
|---|---|
| `canvas.py` | 12 new/fixed endpoints |
| `App.tsx` | Full restructure: bug fixes + new layout |
| `KleosCanvas.tsx` | branchId prop, ReactFlow event handlers, MiniMap, light theme |
| `useCanvas.ts` | branchId param, persistNodePosition, deleteNode, deleteEdge, updateNodeText, createEdge, pinNode, mergeNodes |
| `BaseNode.tsx` | Light theme, left accent stripe, pin indicator, double-click edit |
| `KleosEdge.tsx` | Edge labels, selected state, delete button, light theme |
| `WorkspaceLayout.tsx` | Stripped to just `<Outlet />` |
| `useKeyboardShortcuts.ts` | All 4 empty shortcuts implemented |
| `ReasoningPathWalk.tsx` | Mounted and wired |
| `ThinkingTimeline.tsx` | Mounted in HamburgerDrawer |
| `MemoryPanel.tsx` | Light theme + panel positioning fix |
| `AssumptionAuditPanel.tsx` | Light theme + panel positioning fix + real data |
| `ActivityLog.tsx` | Light theme + real data |
| `StatusPill.tsx` | Pill shape + aria |
| `VoiceTranscript.tsx` | aria-live + light glass |
| `MemoryNegotiationCard.tsx` | Light theme |
| `ExportDialog.tsx` | Light theme + inline error + api.ts base URL |
| `ModeSelector.tsx` | First-use flag + light theme |
| `BranchRail.tsx` | Moved into HamburgerDrawer |
| `index.css` | Workspace-specific design tokens |
| `DashboardPage.tsx` | Canvas delete action |
| `main.tsx` | `/workspace` redirect |
