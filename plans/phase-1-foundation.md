# Phase 1 — Foundation

**Hours:** 0–3
**Team:** All 4 (FE1, FE2, BE1, BE2)
**Depends on:** Nothing — this is the root phase
**Unlocks:** All subsequent phases

---

## Objective

Establish the complete project scaffold so that all four developers can work in parallel from Hour 3 onwards. By the end of this phase: the backend is running with a verified database connection, the frontend renders an empty canvas, and both can communicate over HTTP.

---

## Scope

- FastAPI project skeleton with CORS, routing structure, and health check
- Supabase PostgreSQL schema (all 7 tables) via migration files
- Redis Cloud connection and verification
- Celery application initialization
- Environment variable loading
- Vite + React + TypeScript frontend scaffold
- Tailwind CSS v4 configured with design.md design tokens
- react-flow v11 canvas shell (pan, zoom, empty state)
- Complete TypeScript type definitions for all domain types
- `src/frontend/src/services/api.ts` and `ws.ts` stubs

---

## Design Decisions and Rationale

**Why Hexagonal Architecture from Day 0?**
The voice channel (WebSocket adapter) and the HTTP drop endpoint (REST adapter) must produce identical canvas mutations. Establishing the `canvas_service.py` as the core domain service now — before writing any adapters — ensures the constraint is enforced structurally, not by convention.

**Why Tailwind v4 with `@theme`?**
Tailwind v4's `@theme` block maps directly to CSS custom properties, which is exactly how design.md specifies its tokens. This eliminates a `tailwind.config.js` file and keeps token values co-located in one `theme.css` file. All colors, spacing, radius, and typography scale from design.md Section 11.2.

**Why react-flow v11 instead of JointJS+?**
JointJS+ is a paid premium library. react-flow v11 is open-source, has a rich node/edge data model, handles 300+ nodes at acceptable performance, and is specified in architecture.md. JointJS patterns (declarative node catalog, controlled state) are adapted to react-flow's API.

**Why all TypeScript types in Phase 1?**
Type definitions are the contract between frontend and backend. Defining them before any API calls are written eliminates mismatched field names and runtime surprises. FE and BE developers can independently implement against the same types.

---

## Sequential Implementation Tasks

### BE1: FastAPI Skeleton

**Task 1.1 — Create folder structure**
```
src/backend/
├── main.py
├── requirements.txt
├── .env.example
├── routers/
│   ├── __init__.py
│   ├── canvas.py        # stub
│   ├── memory.py        # stub
│   └── health.py
├── ws/
│   ├── __init__.py
│   └── voice.py         # stub
├── services/
│   ├── __init__.py
│   ├── canvas_service.py    # stub
│   ├── llm_service.py       # stub
│   ├── memory_service.py    # stub
│   ├── ingestion_service.py # stub
│   ├── export_service.py    # stub
│   └── voice_service.py     # stub
├── workers/
│   ├── __init__.py
│   ├── celery_app.py
│   ├── document_worker.py   # stub
│   └── pdf_export_worker.py # stub
├── db/
│   ├── __init__.py
│   └── supabase.py
├── cache/
│   ├── __init__.py
│   └── redis.py
└── fixtures/
    └── generate_fixtures.py # stub
```

**Task 1.2 — `main.py`**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import canvas, memory, health

app = FastAPI(title="Kleos API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(canvas.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
```

**Task 1.3 — `routers/health.py`**
```python
from fastapi import APIRouter
from db.supabase import get_client as get_supabase
from cache.redis import get_client as get_redis

router = APIRouter()

@router.get("/health")
async def health():
    sb_ok = False
    redis_ok = False
    try:
        get_supabase().table("canvases").select("id").limit(1).execute()
        sb_ok = True
    except Exception:
        pass
    try:
        get_redis().ping()
        redis_ok = True
    except Exception:
        pass
    status = "ok" if (sb_ok and redis_ok) else "degraded"
    return {"status": status, "supabase": sb_ok, "redis": redis_ok}
```

**Task 1.4 — `db/supabase.py`**
```python
import os
from supabase import create_client, Client
from functools import lru_cache

@lru_cache(maxsize=1)
def get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)
```

**Task 1.5 — `cache/redis.py`**
```python
import os, redis
from functools import lru_cache

@lru_cache(maxsize=1)
def get_client() -> redis.Redis:
    return redis.Redis(
        host=os.environ["REDIS_URL"].split("://")[1].split(":")[0],
        port=int(os.environ["REDIS_URL"].split(":")[-1]),
        password=os.environ["REDIS_PASSWORD"],
        ssl=True,
        decode_responses=True,
    )
```

**Task 1.6 — `workers/celery_app.py`**
```python
import os
from celery import Celery

celery_app = Celery(
    "kleos",
    broker=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
)
celery_app.conf.update(task_serializer="json", result_serializer="json")
```

**Task 1.7 — `.env.example`**
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=kleos-artifacts
REDIS_URL=redis://your-endpoint.redis.com:12345
REDIS_PASSWORD=...
DEMO_MODE=false
```

**Task 1.8 — `requirements.txt`**
```
fastapi
uvicorn[standard]
websockets
openai
supabase
redis[hiredis]
celery[redis]
pymupdf
python-docx
python-pptx
requests
beautifulsoup4
pandas
openpyxl
pydantic
python-multipart
sse-starlette
python-dotenv
pyppeteer
pdfkit
```

---

### BE2: Supabase Schema Migrations

**Task 1.9 — Initialize Supabase CLI (run from repo root)**
```bash
npm install -g supabase
supabase init
supabase link --project-ref <your-project-ref>
supabase migration new initial_schema
```
Write the following SQL into `supabase/migrations/<timestamp>_initial_schema.sql`:

```sql
-- Canvases
CREATE TABLE canvases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_mode TEXT NOT NULL DEFAULT 'analytical'
    CHECK (workspace_mode IN ('analytical', 'creative', 'critical', 'strategic')),
  incognito_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Branches
CREATE TABLE branches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'main',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'committed', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nodes
CREATE TABLE nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'idea','evidence','assumption','question',
    'constraint','insight','decision','source'
  )),
  text TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (confidence IN ('low','medium','high')),
  provenance_type TEXT NOT NULL
    CHECK (provenance_type IN (
      'document','core_memory','ai_inference',
      'parametric','user_created','voice_input'
    )),
  provenance_detail JSONB DEFAULT '{}',
  memory_scope TEXT CHECK (memory_scope IN ('session','workspace','global')),
  memory_tier INTEGER CHECK (memory_tier IN (0,1,2,3)),
  impact_nodes JSONB NOT NULL DEFAULT '[]',
  position JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  cluster_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('user','ai')),
  input_modality TEXT NOT NULL DEFAULT 'text'
    CHECK (input_modality IN ('text','voice','drop')),
  workspace_mode_at_creation TEXT DEFAULT 'analytical'
);

-- Edges
CREATE TABLE edges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('supports','contradicts','depends_on','derived_from')),
  confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (confidence IN ('low','medium','high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memories (Four-Tier Architecture)
CREATE TABLE memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tier INTEGER NOT NULL CHECK (tier IN (0,1,2,3)),
  scope TEXT NOT NULL DEFAULT 'session'
    CHECK (scope IN ('global','workspace','session','source')),
  text TEXT NOT NULL,
  provenance JSONB DEFAULT '{}',
  canvas_id TEXT REFERENCES canvases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  quarantined BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  rejected BOOLEAN NOT NULL DEFAULT FALSE
);

-- Events (Activity Log + Timeline + Rewind)
CREATE TABLE events (
  event_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'node_created','node_deleted','edge_created','merge',
    'branch_created','branch_committed','assumption_overridden',
    'memory_accepted','memory_rejected','mode_changed',
    'quick_override_set','voice_command_received'
  )),
  author TEXT NOT NULL DEFAULT 'ai' CHECK (author IN ('user','ai')),
  input_modality TEXT DEFAULT 'text'
    CHECK (input_modality IN ('text','voice','drop')),
  affected_node_ids JSONB DEFAULT '[]',
  delta JSONB DEFAULT '{}',
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  workspace_mode TEXT DEFAULT 'analytical'
);

-- Artifacts (Supabase Storage references)
CREATE TABLE artifacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_nodes_canvas_branch ON nodes(canvas_id, branch_id);
CREATE INDEX idx_edges_canvas_branch ON edges(canvas_id, branch_id);
CREATE INDEX idx_memories_canvas_tier ON memories(canvas_id, tier);
CREATE INDEX idx_memories_quarantined ON memories(quarantined) WHERE quarantined = TRUE;
CREATE INDEX idx_events_canvas ON events(canvas_id, timestamp DESC);
```

Run: `supabase db push`

**Task 1.10 — Create Supabase Storage bucket**
In the Supabase dashboard (or via CLI): create bucket named `kleos-artifacts` with public read disabled.

---

### FE1: Vite + React + TypeScript Scaffold

**Task 1.11 — Initialize frontend**
```bash
cd src
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install reactflow @reactflow/background @reactflow/controls
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install framer-motion
npm install tailwindcss @tailwindcss/vite
```

**Task 1.12 — `src/frontend/src/styles/theme.css`**
Full Tailwind v4 `@theme` block from design.md Section 11.2. This file is the single source of truth for all design tokens:

```css
@import "tailwindcss";

@theme {
  /* Colors — from design.md Section 1.1 */
  --color-citrine-signal: #e5ff5d;
  --color-carbon-black: #111111;
  --color-bone-white: #f9f9f9;
  --color-graphite: #2b2b2b;
  --color-ash: #6e6e6e;
  --color-stone: #9c9c9c;
  --color-smoke: #565656;
  --color-chalk: #d6d6d6;
  --color-cream-paper: #eeeeee;
  --color-pure-black: #000000;
  --color-sand: #b7b3a2;

  /* Surfaces — from design.md Section 1.2 */
  --color-surface-canvas: #111111;
  --color-surface-panel: #2b2b2b;
  --color-surface-muted: #6e6e6e;
  --color-surface-light: #eeeeee;

  /* Typography — font family */
  --font-sans: 'Neue Haas Grotesk Text', ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — scale (from design.md Section 2.2) */
  --text-utility: 10px;
  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-subhead: 20px;
  --text-heading-sm: 24px;
  --text-heading: 48px;
  --text-display: 80px;

  /* Spacing — base 8px (from design.md Section 3.1) */
  --spacing-1: 8px;
  --spacing-2: 16px;
  --spacing-3: 24px;
  --spacing-4: 32px;
  --spacing-5: 40px;
  --spacing-6: 48px;
  --spacing-8: 64px;
  --spacing-10: 80px;
  --spacing-12: 96px;
  --spacing-16: 128px;
  --spacing-18: 144px;
  --spacing-24: 192px;

  /* Border Radius — from design.md Section 4.1 */
  --radius-button: 4px;    /* All interactive elements */
  --radius-nav: 8px;
  --radius-card: 12px;
  --radius-decorative: 20px;
  --radius-full: 9999px;   /* Pills — only for scope chips, never buttons */

  /* Layout */
  --max-width-page: 1280px;
}
```

**Task 1.13 — `src/frontend/src/styles/variables.css`**
Full CSS custom properties block from design.md Section 11.1. Import this in `index.css`.

**Task 1.14 — Google Material Symbols font**
Add to `src/frontend/index.html`:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
```

**Task 1.15 — `vite.config.ts`**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
})
```

---

### FE2: TypeScript Types + Services + Canvas Shell

**Task 1.16 — `src/frontend/src/types/index.ts`**
```typescript
// Core domain types — source of truth for all FE/BE communication

export type NodeType =
  | 'idea' | 'evidence' | 'assumption' | 'question'
  | 'constraint' | 'insight' | 'decision' | 'source';

export type ProvenanceType =
  | 'document' | 'core_memory' | 'ai_inference'
  | 'parametric' | 'user_created' | 'voice_input';

export type Confidence = 'low' | 'medium' | 'high';
export type RelationType = 'supports' | 'contradicts' | 'depends_on' | 'derived_from';
export type InputModality = 'text' | 'voice' | 'drop';
export type WorkspaceMode = 'analytical' | 'creative' | 'critical' | 'strategic';
export type MemoryTier = 0 | 1 | 2 | 3;
export type MemoryScope = 'global' | 'workspace' | 'session' | 'source';
export type BranchStatus = 'active' | 'committed' | 'discarded';

export interface ProvenanceDetail {
  source_id?: string;
  artifact_name?: string;
  page?: number;
  memory_tier?: MemoryTier;
  voice_transcript_segment?: string;
}

export interface KleosNode {
  id: string;
  type: NodeType;
  text: string;
  confidence: Confidence;
  provenance_type: ProvenanceType;
  provenance_detail: ProvenanceDetail;
  memory_scope?: MemoryScope;
  memory_tier?: MemoryTier;
  impact_nodes: string[];   // Pre-computed at creation. Never recompute on hover.
  position: { x: number; y: number };
  pinned: boolean;
  cluster_id?: string;
  branch_id: string;
  created_at: string;
  created_by: 'user' | 'ai';
  input_modality: InputModality;
  workspace_mode_at_creation: WorkspaceMode;
}

export interface KleosEdge {
  id: string;
  source: string;
  target: string;
  type: RelationType;
  confidence: Confidence;
}

export interface Memory {
  id: string;
  tier: MemoryTier;
  scope: MemoryScope;
  text: string;
  provenance: Record<string, unknown>;
  canvas_id?: string;
  created_at: string;
  last_used?: string;
  quarantined: boolean;
  archived: boolean;
  rejected: boolean;
}

export interface Branch {
  id: string;
  canvas_id: string;
  name: string;
  created_at: string;
  status: BranchStatus;
}

export interface CanvasState {
  id: string;
  workspace_mode: WorkspaceMode;
  incognito_mode: boolean;
  nodes: KleosNode[];
  edges: KleosEdge[];
  branches: Branch[];
}

export interface ReasoningStep {
  step: number;
  action: string;
  detail: string;
  confidence: Confidence;
}

export interface CompilationOutput {
  nodes: Array<Omit<KleosNode, 'position' | 'pinned' | 'cluster_id' | 'branch_id' | 'created_at' | 'created_by' | 'workspace_mode_at_creation'>>;
  reasoning_steps: ReasoningStep[];
  contradictions: Array<{ node_a: string; node_b: string; explanation: string }>;
  proposed_memories: Array<{ tier: 2; text: string; trigger: string }>;
}

export interface Assumption {
  node_id: string;
  statement: string;
  confidence: Confidence;
  provenance_type: ProvenanceType;
  impact_nodes: string[];
}

// Status Pill states — 3 states, mutually exclusive
export type StatusPillState = 'working' | 'listening' | 'ready';
```

**Task 1.17 — `src/frontend/src/services/api.ts`**
```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
```

**Task 1.18 — `src/frontend/src/services/ws.ts`**
```typescript
const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000';

export function createVoiceSocket(
  onMessage: (data: unknown) => void,
  onClose: () => void,
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/voice`);
  ws.onmessage = (e) => onMessage(JSON.parse(e.data));
  ws.onclose = onClose;
  return ws;
}
```

**Task 1.19 — `src/frontend/src/canvas/KleosCanvas.tsx`**
```typescript
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

export function KleosCanvas() {
  return (
    <div className="w-full h-full bg-[#111111]">
      <ReactFlow
        nodes={[]}
        edges={[]}
        fitView
        style={{ background: '#111111' }}
      >
        <Background
          color="#2b2b2b"
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
        />
        <Controls style={{ background: '#2b2b2b', border: '1px solid #565656' }} />
      </ReactFlow>
    </div>
  );
}
```

**Task 1.20 — `src/frontend/src/App.tsx`**
```typescript
import { KleosCanvas } from './canvas/KleosCanvas';

export default function App() {
  return (
    <div className="flex h-screen w-screen bg-[#111111] overflow-hidden">
      <main className="flex-1 relative">
        <KleosCanvas />
      </main>
    </div>
  );
}
```

**Task 1.21 — `.env.example` (frontend)**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

---

## Validation Strategy

1. Run `supabase db push` → verify zero errors, all 7 tables created in Supabase dashboard.
2. Run backend: `uvicorn main:app --reload --port 8000`. Verify no import errors.
3. Run Celery: `celery -A workers.celery_app worker --loglevel=info`. Verify it connects to Redis.
4. `GET http://localhost:8000/health` → `{ "status": "ok", "supabase": true, "redis": true }`
5. Run frontend: `npm run dev`. Verify it loads at `localhost:5173`.
6. Open browser DevTools → Network tab → verify no CORS errors on a manual `GET http://localhost:8000/health` from the browser console.
7. Canvas renders: dark background (#111111), dot grid visible, Controls displayed.
8. `GET http://localhost:5173` — no console errors, no TypeScript compilation errors.

---

## Acceptance Criteria

All of the following must be true before Phase 2 begins:

- [ ] `GET /health` returns `{ "status": "ok", "supabase": true, "redis": true }` in < 500ms
- [ ] All 7 Supabase tables (`canvases`, `branches`, `nodes`, `edges`, `memories`, `events`, `artifacts`) exist with correct schemas (verify via Supabase table editor)
- [ ] `memories` table has `scope`, `quarantined`, `archived`, `rejected` columns
- [ ] `nodes` table has `impact_nodes JSONB NOT NULL DEFAULT '[]'` column
- [ ] Redis connection established: `redis_ok: true` in health check
- [ ] Celery worker starts without errors and connects to Redis broker
- [ ] Frontend loads at `localhost:5173` with zero console errors
- [ ] Canvas renders dark background (`#111111`), dot grid, Controls
- [ ] No CORS errors when frontend fetches `/health`
- [ ] Tailwind CSS is working: apply `class="bg-[#111111]"` on a test element; verify it renders
- [ ] TypeScript compilation: `npm run build` in frontend completes with zero errors
- [ ] Backend `uvicorn main:app --reload` starts with zero import errors

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| Supabase free tier row limits during development | Low | Max 500k rows on free tier — fine for hackathon scale |
| Redis Cloud SSL connection fails | Low | Verify SSL flag; check Redis Cloud "TLS mode" setting |
| Chromium download for pyppeteer blocks setup | Medium | Add to `requirements.txt` but don't run pyppeteer until Phase 7 |
| react-flow CSS conflicts with Tailwind | Low | Scope react-flow CSS resets; test canvas background color |
| Neue Haas Grotesk not loading (paid font) | Medium | Verify font source; fallback to Inter (defined in theme.css already) |

---

## Deliverables

- `src/backend/` — complete skeleton with CORS, all service stubs, working DB/Redis connections
- `supabase/migrations/<timestamp>_initial_schema.sql` — all 7 tables with correct schemas
- `src/frontend/` — working Vite+React app with Tailwind design tokens + react-flow canvas
- `src/frontend/src/types/index.ts` — complete TypeScript domain types
- `src/frontend/src/styles/theme.css` — design.md tokens as Tailwind v4 `@theme`
- `src/backend/.env.example` + `src/frontend/.env.example` — all required variables documented

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 0–3: Foundation" as complete
- `project-context/tasks.md` — Mark all Hours 0–3 tasks [x]
- `project-context/progress.md` → Architecture Changes: record actual PDF export path (pyppeteer vs pdfkit) once Chromium availability is confirmed on EC2

---

## Dependencies

**None** — this is the root phase. All other phases depend on Phase 1 being complete.
