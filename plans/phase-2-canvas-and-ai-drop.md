# Phase 2 — Canvas + AI Drop

**Hours:** 3–6
**Team:** FE1/FE2 (node rendering) + BE1/BE2 (GPT-4o integration)
**Depends on:** Phase 1 (all tables, FastAPI skeleton, canvas shell, TypeScript types)
**Unlocks:** Phase 3 (Reasoning Ribbon requires nodes in the DB), Phase 5 (Memory system operates on canvas nodes)

---

## Objective

By the end of this phase: dropping a PDF onto the canvas triggers AI compilation via GPT-4o, extracts typed nodes with pre-computed `impact_nodes`, and renders them on the canvas with correct visual treatments and provenance badges. The canvas is now the core product surface.

---

## Scope

**Backend:**
- GPT-4o integration with structured output (JSON mode)
- `POST /api/canvas/{id}/drop` endpoint (PDF + text, queued immediately to Celery for heavy docs)
- `impact_nodes` pre-computation at node creation time
- `POST /api/canvas` (create canvas + initial branch)
- `GET /api/canvas/{id}` (fetch canvas state: nodes + edges + branches)

**Frontend:**
- All 8 node type renderers with design.md visual treatments
- 6 provenance badge components
- Cluster background rendering
- Branch Rail stub (single "main" tab, no actions yet)
- Node type registry (declarative catalog pattern from JointJS, adapted for react-flow)
- Canvas state integration (load nodes from API into react-flow)

---

## Design Decisions and Rationale

**Why a Node Registry (Catalog Pattern)?**
Adapting the JointJS pattern: a `nodeRegistry.ts` file declaratively defines every node type's visual treatment, label, default provenance, and react-flow component mapping. This separates "what node types exist and how they look" from "how react-flow renders them." Adding a new node type only requires an entry in the registry — no scattered conditionals.

**Why pre-compute `impact_nodes` at creation?**
The Impact Halo must respond in < 100ms. Computing it on hover requires graph traversal over the entire canvas — too slow at scale. Pre-computing at creation means the hover handler is a simple array lookup: `node.impact_nodes.forEach(id => pulseNode(id))`. This is a performance-critical constraint (WOW #1 moment).

**Impact Halo algorithm:**
An assumption node A "impacts" node B if B's `reasoning_steps` reference A's text, or if B was derived from a cluster containing A. At compile time, the LLM includes `impact_nodes` in its structured output for assumption nodes. For non-assumption nodes, `impact_nodes = []`.

**Why 8 node types with distinct visuals (not colors only)?**
Per P1 (Thoughts are objects) and design.md: node type must be legible from shape/border/background, not just color. Color is reserved for provenance badge identity. Using both reduces cognitive load — users distinguish node type from badge at a glance.

**Why store nodes in Supabase immediately (not React state only)?**
The Rewind verb (Phase 8), Activity Log (Phase 8), and Thinking Timeline (Phase 8) all require the Event Log to have every node creation recorded. Storing in Supabase also enables real-time sync and allows multiple team members to demo from the same canvas. React state is derived from Supabase, not the primary store.

---

## Sequential Implementation Tasks

### BE1: GPT-4o Integration + Canvas API

**Task 2.1 — `services/llm_service.py` (initial)**
```python
import os, json
from openai import OpenAI
from typing import Generator

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

COMPILATION_SYSTEM_PROMPT = """
You are a structured knowledge extraction engine for a spatial reasoning canvas.
Extract typed, connected knowledge nodes from the provided content.

Output ONLY a valid JSON object matching this schema exactly:
{
  "nodes": [
    {
      "id": "uuid-string",
      "type": "idea|evidence|assumption|question|constraint|insight|decision|source",
      "text": "concise node content",
      "confidence": "low|medium|high",
      "provenance_type": "document|core_memory|ai_inference|parametric|user_created|voice_input",
      "impact_nodes": ["uuid", "uuid"]  // IDs of OTHER nodes in this output that this assumption directly influences
    }
  ],
  "reasoning_steps": [
    { "step": 1, "action": "extracted_from_source", "detail": "page 3, paragraph 2", "confidence": "high" }
  ],
  "contradictions": [
    { "node_a": "uuid", "node_b": "uuid", "explanation": "Node A claims X while Node B claims not-X" }
  ],
  "proposed_memories": [
    { "tier": 2, "text": "User preference observed", "trigger": "mentioned cost 3 times" }
  ]
}

RULES:
- Every assumption node MUST have impact_nodes listing all other nodes in this output that depend on it
- Every evidence node MUST have provenance_type=document
- Parametric knowledge (AI training data) MUST have provenance_type=parametric
- Classify uncertainty: if text uses "likely", "assumed", "probably" → type=assumption
- Maximum 15 nodes per compilation call
"""

def compile_document(text: str, workspace_mode: str = "analytical") -> dict:
    """Primary compilation: text → structured nodes. Returns CompilationOutput dict."""
    mode_suffix = {
        "analytical": "Weight evidence heavily. Flag all unsourced claims as parametric.",
        "creative": "Generate ideas freely. Uncertainty is acceptable.",
        "critical": "Challenge every claim. Create counter-argument nodes.",
        "strategic": "Synthesize. Focus on convergence and decisions.",
    }.get(workspace_mode, "")

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": COMPILATION_SYSTEM_PROMPT + f"\n\nMode: {mode_suffix}"},
            {"role": "user", "content": f"Extract knowledge from:\n\n{text}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    return json.loads(response.choices[0].message.content)
```

**Task 2.2 — `routers/canvas.py` (initial)**
```python
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import uuid, fitz  # PyMuPDF
from db.supabase import get_client
from services import llm_service, canvas_service

router = APIRouter()

class CreateCanvasRequest(BaseModel):
    workspace_mode: str = "analytical"

@router.post("/canvas")
async def create_canvas(req: CreateCanvasRequest):
    sb = get_client()
    canvas_id = str(uuid.uuid4())
    branch_id = str(uuid.uuid4())
    sb.table("canvases").insert({
        "id": canvas_id, "workspace_mode": req.workspace_mode
    }).execute()
    sb.table("branches").insert({
        "id": branch_id, "canvas_id": canvas_id, "name": "main"
    }).execute()
    return {"id": canvas_id, "branch_id": branch_id}

@router.get("/canvas/{canvas_id}")
async def get_canvas(canvas_id: str):
    sb = get_client()
    canvas = sb.table("canvases").select("*").eq("id", canvas_id).single().execute()
    nodes = sb.table("nodes").select("*").eq("canvas_id", canvas_id).execute()
    edges = sb.table("edges").select("*").eq("canvas_id", canvas_id).execute()
    branches = sb.table("branches").select("*").eq("canvas_id", canvas_id).execute()
    return {
        "canvas": canvas.data,
        "nodes": nodes.data,
        "edges": edges.data,
        "branches": branches.data,
    }

@router.post("/canvas/{canvas_id}/drop")
async def drop_artifact(canvas_id: str, file: UploadFile = File(None), text: str = None):
    """
    Accepts either a file upload (PDF/DOCX) or raw text.
    For PDFs > 5 pages: delegates to Celery.
    For small files + text: processes synchronously.
    """
    sb = get_client()
    canvas_row = sb.table("canvases").select("workspace_mode").eq("id", canvas_id).single().execute()
    workspace_mode = canvas_row.data["workspace_mode"]
    branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
    if not branch.data:
        raise HTTPException(404, "No active branch found")
    branch_id = branch.data[0]["id"]

    if file:
        content = await file.read()
        if file.filename.endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            if len(doc) > 5:
                # Offload to Celery for heavy processing
                from workers.document_worker import process_document
                task = process_document.delay(canvas_id, branch_id, content, workspace_mode)
                return {"status": "queued", "task_id": task.id}
            extracted_text = "\n".join(page.get_text() for page in doc)
        elif file.filename.endswith(".docx"):
            import docx, io
            doc = docx.Document(io.BytesIO(content))
            extracted_text = "\n".join(p.text for p in doc.paragraphs)
        else:
            extracted_text = content.decode("utf-8", errors="replace")
    elif text:
        extracted_text = text
    else:
        raise HTTPException(400, "Provide either a file or text")

    compilation = llm_service.compile_document(extracted_text, workspace_mode)
    nodes_created = canvas_service.apply_compilation(canvas_id, branch_id, compilation, "drop", workspace_mode)
    return {"status": "complete", "nodes_created": nodes_created, "compilation": compilation}
```

**Task 2.3 — `services/canvas_service.py` (initial)**
```python
import uuid
from db.supabase import get_client
from db.queries import log_event

def apply_compilation(canvas_id: str, branch_id: str, compilation: dict,
                      input_modality: str, workspace_mode: str) -> int:
    """
    Takes a CompilationOutput dict, writes nodes + edges + events to Supabase.
    Returns number of nodes created.
    Pre-computes impact_nodes from the compilation output (already provided by LLM).
    """
    sb = get_client()
    id_map: dict[str, str] = {}  # compilation temp_id → DB uuid

    # Create nodes
    for raw in compilation.get("nodes", []):
        db_id = str(uuid.uuid4())
        id_map[raw["id"]] = db_id
        node_row = {
            "id": db_id,
            "canvas_id": canvas_id,
            "branch_id": branch_id,
            "type": raw["type"],
            "text": raw["text"],
            "confidence": raw["confidence"],
            "provenance_type": raw["provenance_type"],
            "impact_nodes": raw.get("impact_nodes", []),  # LLM provides these
            "position": _auto_position(len(id_map)),
            "created_by": "ai",
            "input_modality": input_modality,
            "workspace_mode_at_creation": workspace_mode,
        }
        sb.table("nodes").insert(node_row).execute()
        log_event(canvas_id, branch_id, "node_created", "ai", input_modality, [db_id])

    # Remap impact_nodes from temp IDs to DB UUIDs
    for raw in compilation.get("nodes", []):
        db_id = id_map[raw["id"]]
        remapped = [id_map.get(imp, imp) for imp in raw.get("impact_nodes", [])]
        sb.table("nodes").update({"impact_nodes": remapped}).eq("id", db_id).execute()

    # Create contradiction edges
    for contradiction in compilation.get("contradictions", []):
        create_edge(
            canvas_id, branch_id,
            id_map.get(contradiction["node_a"], contradiction["node_a"]),
            id_map.get(contradiction["node_b"], contradiction["node_b"]),
            "contradicts", "high",
        )

    return len(compilation.get("nodes", []))

def create_edge(canvas_id, branch_id, source_id, target_id, edge_type, confidence):
    sb = get_client()
    edge_id = str(uuid.uuid4())
    sb.table("edges").insert({
        "id": edge_id, "canvas_id": canvas_id, "branch_id": branch_id,
        "source_id": source_id, "target_id": target_id,
        "type": edge_type, "confidence": confidence,
    }).execute()
    log_event(canvas_id, branch_id, "edge_created", "ai", "text", [source_id, target_id])
    return edge_id

def _auto_position(index: int) -> dict:
    """Simple auto-layout: nodes placed in a grid until react-flow takes over."""
    cols = 4
    x = (index % cols) * 280 + 80
    y = (index // cols) * 180 + 80
    return {"x": x, "y": y}
```

**Task 2.4 — `db/queries.py`**
```python
import uuid
from db.supabase import get_client

def log_event(canvas_id: str, branch_id: str, event_type: str,
              author: str, input_modality: str, affected_node_ids: list,
              delta: dict = None, workspace_mode: str = "analytical"):
    sb = get_client()
    sb.table("events").insert({
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "author": author,
        "input_modality": input_modality,
        "affected_node_ids": affected_node_ids,
        "delta": delta or {},
        "canvas_id": canvas_id,
        "branch_id": branch_id,
        "workspace_mode": workspace_mode,
    }).execute()
```

---

### FE1: Node Type Registry + Renderers

**Task 2.5 — `src/frontend/src/canvas/nodeRegistry.ts`**
```typescript
import type { NodeType, ProvenanceType } from '../types';

export interface NodeTypeConfig {
  label: string;
  borderStyle: 'solid' | 'dashed' | 'double';
  borderColor: string;     // CSS color
  backgroundColor: string; // CSS color
  labelColor: string;
  icon: string;            // Material Symbols name
  description: string;     // For Assumption Audit display
}

export const NODE_REGISTRY: Record<NodeType, NodeTypeConfig> = {
  idea: {
    label: 'Idea',
    borderStyle: 'solid',
    borderColor: '#565656',
    backgroundColor: '#2b2b2b',
    labelColor: '#f9f9f9',
    icon: 'lightbulb',
    description: 'A concept or possibility',
  },
  evidence: {
    label: 'Evidence',
    borderStyle: 'solid',
    borderColor: '#4a90d9',  // Blue — matches Document badge
    backgroundColor: '#2b2b2b',
    labelColor: '#f9f9f9',
    icon: 'article',
    description: 'A sourced claim from a dropped artifact',
    // Note: left border stripe (4px, source badge color) applied in component
  },
  assumption: {
    label: 'Assumption',
    borderStyle: 'dashed',
    borderColor: '#e5ff5d',  // Citrine — assumptions are high-attention
    backgroundColor: '#2b2b2b',
    labelColor: '#f9f9f9',
    icon: 'help',
    description: 'A belief the AI made that is not directly sourced',
  },
  question: {
    label: 'Question',
    borderStyle: 'solid',
    borderColor: '#9c9c9c',
    backgroundColor: '#2b2b2b',
    labelColor: '#9c9c9c',   // Italic style handled in CSS
    icon: 'question_mark',
    description: 'An open question on the canvas',
  },
  constraint: {
    label: 'Constraint',
    borderStyle: 'solid',
    borderColor: '#d97b4a',  // Amber — hard limits
    backgroundColor: '#3a2a1a',  // Warm dark fill
    labelColor: '#f9f9f9',
    icon: 'block',
    description: 'A hard limit or requirement',
  },
  insight: {
    label: 'Insight',
    borderStyle: 'solid',
    borderColor: '#7dcfb6',  // Teal — synthesis
    backgroundColor: '#2b2b2b',
    labelColor: '#f9f9f9',
    icon: 'psychology',
    description: 'A synthesized conclusion across multiple nodes',
    // Note: thicker border (2px vs 1px default) applied in component
  },
  decision: {
    label: 'Decision',
    borderStyle: 'solid',
    borderColor: '#f9f9f9',  // White border — committed choice
    backgroundColor: '#1a1a1a',
    labelColor: '#f9f9f9',
    icon: 'check_circle',
    description: 'A committed choice, result of Commit Branch',
  },
  source: {
    label: 'Source',
    borderStyle: 'solid',
    borderColor: '#565656',
    backgroundColor: '#1f2329',  // Slightly blue-dark — document origin
    labelColor: '#9c9c9c',
    icon: 'folder',
    description: 'A dropped artifact — parent of extracted nodes',
  },
};
```

**Task 2.6 — `src/frontend/src/canvas/nodes/BaseNode.tsx`**
```tsx
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { NODE_REGISTRY } from '../nodeRegistry';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import { ScopeChip } from '../../components/ScopeChip';
import type { KleosNode } from '../../types';

interface KleosNodeProps extends NodeProps {
  data: KleosNode;
}

export function BaseNode({ data, selected }: KleosNodeProps) {
  const config = NODE_REGISTRY[data.type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="relative min-w-[200px] max-w-[280px] rounded-[12px] p-3"
      style={{
        background: config.backgroundColor,
        border: `${data.type === 'insight' ? '2px' : '1px'} ${config.borderStyle} ${selected ? '#e5ff5d' : config.borderColor}`,
        // Evidence: left border stripe
        borderLeft: data.type === 'evidence'
          ? `4px solid ${getBadgeColor(data.provenance_type)}`
          : undefined,
      }}
    >
      {/* Node type label */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="material-symbols-outlined text-[14px]" style={{ color: config.borderColor }}>
          {config.icon}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.032em] text-stone-500">
          {config.label}
        </span>
        <ProvenanceBadge type={data.provenance_type} className="ml-auto" />
      </div>

      {/* Node content */}
      <p
        className="text-[14px] leading-[1.4] text-[#f9f9f9]"
        style={{
          fontStyle: data.type === 'question' ? 'italic' : 'normal',
          fontWeight: data.type === 'decision' ? 500 : 400,
        }}
      >
        {data.text}
      </p>

      {/* Scope chip (only on nodes with memory_scope) */}
      {data.memory_scope && (
        <ScopeChip scope={data.memory_scope} nodeId={data.id} className="mt-2" />
      )}

      {/* react-flow handles */}
      <Handle type="target" position={Position.Left} className="!bg-[#565656] !border-[#9c9c9c]" />
      <Handle type="source" position={Position.Right} className="!bg-[#565656] !border-[#9c9c9c]" />
    </motion.div>
  );
}

function getBadgeColor(provenance: string): string {
  const colors: Record<string, string> = {
    document: '#4a90d9',
    core_memory: '#4caf7d',
    ai_inference: '#f5c842',
    parametric: '#e84040',
    user_created: '#f9f9f9',
    voice_input: '#e5ff5d',
  };
  return colors[provenance] ?? '#9c9c9c';
}
```

**Task 2.7 — `src/frontend/src/components/ProvenanceBadge.tsx`**
```tsx
import type { ProvenanceType } from '../types';

const BADGE_CONFIG: Record<ProvenanceType, { color: string; icon: string; label: string; title: string }> = {
  document:     { color: '#4a90d9', icon: 'description',    label: 'DOC',   title: 'Sourced from a dropped document' },
  core_memory:  { color: '#4caf7d', icon: 'memory',         label: 'MEM',   title: 'Drawn from Core Memory (Tier 0)' },
  ai_inference: { color: '#f5c842', icon: 'psychology',     label: 'INF',   title: 'Derived from canvas context' },
  parametric:   { color: '#e84040', icon: 'warning',        label: 'PAR',   title: 'AI parametric knowledge — no source document. Hallucination risk.' },
  user_created: { color: '#f9f9f9', icon: 'person',         label: 'YOU',   title: 'Created directly by you' },
  voice_input:  { color: '#e5ff5d', icon: 'mic',            label: 'VOICE', title: 'Created via voice command' },
};

interface Props {
  type: ProvenanceType;
  className?: string;
  showTooltip?: boolean;
}

export function ProvenanceBadge({ type, className = '', showTooltip = true }: Props) {
  const config = BADGE_CONFIG[type];

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-[4px] text-[9px] font-medium tracking-[0.04em] ${className}`}
      style={{
        background: `${config.color}18`,  // 10% opacity background
        border: `1px solid ${config.color}60`,
        color: config.color,
      }}
      title={showTooltip ? config.title : undefined}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}
```

---

### FE2: Canvas State Management + Cluster Rendering

**Task 2.8 — `src/frontend/src/hooks/useCanvas.ts`**
```typescript
import { useState, useCallback } from 'react';
import { type Node, type Edge } from 'reactflow';
import { api } from '../services/api';
import type { KleosNode, KleosEdge, CanvasState } from '../types';

export function useCanvas(canvasId: string) {
  const [nodes, setNodes] = useState<Node<KleosNode>[]>([]);
  const [edges, setEdges] = useState<Edge<KleosEdge>[]>([]);
  const [status, setStatus] = useState<'working' | 'listening' | 'ready'>('ready');

  const loadCanvas = useCallback(async () => {
    const state = await api.get<CanvasState>(`/api/canvas/${canvasId}`);
    setNodes(state.nodes.map(toReactFlowNode));
    setEdges(state.edges.map(toReactFlowEdge));
  }, [canvasId]);

  const addNodes = useCallback((newNodes: KleosNode[]) => {
    setNodes(prev => [...prev, ...newNodes.map(toReactFlowNode)]);
  }, []);

  return { nodes, edges, status, setStatus, loadCanvas, addNodes };
}

function toReactFlowNode(n: KleosNode): Node<KleosNode> {
  return {
    id: n.id,
    type: n.type,  // maps to nodeTypes registry
    position: n.position,
    data: n,
  };
}

function toReactFlowEdge(e: KleosEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'kleos',  // custom edge type
    data: e,
  };
}
```

**Task 2.9 — `src/frontend/src/canvas/KleosEdge.tsx`**
```tsx
import { EdgeProps, getBezierPath } from 'reactflow';
import type { KleosEdge } from '../../types';

const EDGE_COLORS: Record<string, string> = {
  supports:     '#4a90d9',  // Blue
  contradicts:  '#e84040',  // Red
  depends_on:   '#f5c842',  // Yellow
  derived_from: '#9c9c9c',  // Gray
};

const LINE_STYLES: Record<string, string> = {
  high:   '0',        // Solid
  medium: '6,3',      // Dashed
  low:    '3,3',      // Dotted
};

export function KleosEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<KleosEdge>) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  const color = EDGE_COLORS[data?.type ?? 'derived_from'];
  const dasharray = LINE_STYLES[data?.confidence ?? 'medium'];

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray={dasharray}
      opacity={0.8}
    />
  );
}
```

**Task 2.10 — `src/frontend/src/canvas/clusters/ClusterBackground.tsx`**
Cluster backgrounds are rendered as react-flow background nodes behind their member nodes:
```tsx
import type { NodeProps } from 'reactflow';

interface ClusterData {
  label: string;
  color: string;  // CSS color, low opacity fill
  width: number;
  height: number;
}

export function ClusterBackground({ data }: NodeProps<ClusterData>) {
  return (
    <div
      className="pointer-events-none rounded-[12px] flex items-start p-3"
      style={{
        width: data.width,
        height: data.height,
        background: `${data.color}0d`,      // ~5% opacity
        border: `1px solid ${data.color}33`, // ~20% opacity border
      }}
    >
      <span className="text-[11px] font-medium tracking-[0.03em] uppercase"
            style={{ color: `${data.color}80` }}>
        {data.label}
      </span>
    </div>
  );
}
```

**Task 2.11 — `src/frontend/src/canvas/KleosCanvas.tsx` (updated)**
```tsx
import ReactFlow, { Background, Controls, BackgroundVariant, type NodeTypes, type EdgeTypes } from 'reactflow';
import { BaseNode } from './nodes/BaseNode';
import { KleosEdge } from './KleosEdge';
import { ClusterBackground } from './clusters/ClusterBackground';
import { BranchRailStub } from '../components/BranchRailStub';
import { useCanvas } from '../hooks/useCanvas';
import 'reactflow/dist/style.css';

const nodeTypes: NodeTypes = {
  // All 8 types use BaseNode — the registry drives their appearance
  idea: BaseNode, evidence: BaseNode, assumption: BaseNode,
  question: BaseNode, constraint: BaseNode, insight: BaseNode,
  decision: BaseNode, source: BaseNode,
  cluster: ClusterBackground,
};

const edgeTypes: EdgeTypes = { kleos: KleosEdge };

interface Props { canvasId: string }

export function KleosCanvas({ canvasId }: Props) {
  const { nodes, edges } = useCanvas(canvasId);

  return (
    <div className="flex flex-col h-full w-full bg-[#111111]">
      <BranchRailStub />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          style={{ background: '#111111' }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#2b2b2b" variant={BackgroundVariant.Dots} gap={24} size={1} />
          <Controls style={{ background: '#2b2b2b', border: '1px solid #565656' }} />
        </ReactFlow>
      </div>
    </div>
  );
}
```

**Task 2.12 — `src/frontend/src/components/BranchRailStub.tsx`**
```tsx
export function BranchRailStub() {
  return (
    <div className="h-9 bg-[#1a1a1a] border-b border-[#2b2b2b] flex items-center px-4 gap-2">
      <button className="px-3 py-1 rounded-[4px] text-[11px] font-medium tracking-[0.03em] bg-[#2b2b2b] text-[#f9f9f9] border border-[#e5ff5d]">
        main
      </button>
      <span className="text-[10px] text-[#565656] uppercase tracking-[0.04em] ml-2">Branch Rail</span>
    </div>
  );
}
```

---

## Validation Strategy

**Manual validation sequence:**
1. `POST /api/canvas` → get `canvas_id` and `branch_id`
2. `POST /api/canvas/{id}/drop` with a small PDF (< 5 pages) → get `compilation` in response
3. `GET /api/canvas/{id}` → verify nodes, edges, events are in Supabase
4. Verify every node has `impact_nodes` field (may be `[]` for non-assumptions)
5. Verify assumption nodes have non-empty `impact_nodes`
6. Load canvas in browser → verify all 8 node types render with correct visual treatments
7. Verify provenance badges display correct icon + color for each provenance type
8. Drop a text string with contradicting statements → verify contradiction edge appears (red)
9. Check react-flow node selection (click a node → gold border appears)
10. Check edge rendering: solid=high, dashed=medium, dotted=low confidence

---

## Acceptance Criteria

- [ ] `POST /api/canvas/{id}/drop` with a PDF returns `compilation.nodes` with > 0 nodes within 10s
- [ ] Each returned node has: `id`, `type` (valid NodeType), `confidence`, `provenance_type`, `impact_nodes`
- [ ] Assumption nodes have `impact_nodes` array with at least 1 entry (when other nodes reference them)
- [ ] All created nodes are written to Supabase `nodes` table with correct `canvas_id` and `branch_id`
- [ ] All node creations are logged in `events` table as `node_created`
- [ ] `GET /api/canvas/{id}` returns nodes in < 500ms
- [ ] Frontend renders all 8 node types with distinct visual treatments matching design.md
- [ ] Provenance badges render for all 6 types with correct colors (blue/green/yellow/red/white/lime)
- [ ] `contradicts` edges render as red dashed lines between contradicting nodes
- [ ] `supports` edges render as blue solid/dashed lines
- [ ] Canvas maintains dark (#111111) background with dot grid
- [ ] Selected node shows citrine (#e5ff5d) border — one lime element per viewport

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| GPT-4o `impact_nodes` IDs are inconsistent (temp IDs don't match real node IDs) | High | The remap step in `apply_compilation` (Task 2.3) handles this — LLM uses temp IDs within its output; we remap to DB UUIDs after insertion |
| GPT-4o produces malformed JSON output | Medium | Use `response_format={"type": "json_object"}` (JSON mode) + Pydantic validation before writing to DB |
| react-flow performance with many nodes | Low | At demo scale (< 20 nodes), not a concern. react-flow handles 300+ |
| Edge rendering on top of nodes | Low | react-flow z-index: edges render below nodes by default |
| Auto-layout grid positions overlap | Medium | The `_auto_position` function provides safe initial positions; react-flow auto-fit-view handles the rest |

---

## Deliverables

- `src/backend/services/llm_service.py` — `compile_document()` with JSON mode
- `src/backend/services/canvas_service.py` — `apply_compilation()` with impact_nodes remap
- `src/backend/routers/canvas.py` — `POST /api/canvas`, `GET /api/canvas/{id}`, `POST /api/canvas/{id}/drop`
- `src/backend/db/queries.py` — `log_event()` helper
- `src/frontend/src/canvas/nodeRegistry.ts` — declarative node type catalog
- `src/frontend/src/canvas/nodes/BaseNode.tsx` — single base node component for all 8 types
- `src/frontend/src/components/ProvenanceBadge.tsx` — 6-type badge component
- `src/frontend/src/canvas/KleosEdge.tsx` — typed relationship edge
- `src/frontend/src/canvas/clusters/ClusterBackground.tsx`
- `src/frontend/src/components/BranchRailStub.tsx`
- `src/frontend/src/hooks/useCanvas.ts`
- `src/frontend/src/canvas/KleosCanvas.tsx` (updated)

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 3–6: Core AI Integration" as complete
- `project-context/tasks.md` — Mark all Hours 3–6 tasks [x]
- If GPT-4o streaming proves unreliable in Phase 3: record in `progress.md` Architecture Changes

---

## Dependencies

- Phase 1 fully complete (DB tables exist, TypeScript types defined, FastAPI skeleton running)
- OpenAI API key with GPT-4o access provisioned
- A test PDF file available for drop testing
