# Architecture

**Kleos** — Technical Architecture, AI System Design, and Data Schemas

---

## Scope Statement

Kleos does not build novel AI. It is an HCI layer on top of mature AI APIs.

All AI capability is achieved through: system prompt engineering, structured output (JSON mode), tool calling, streaming (SSE + WebSocket), and retrieval (Redis vector search). No custom ML models. No custom training pipelines. The innovation is entirely in the interaction design and the HCI layer built on top of standard AI outputs.

---

## Software Architecture Pattern

Kleos backend follows **Hexagonal Architecture (Ports and Adapters)** to decouple core domain logic (graph manipulation, memory lifecycle) from external infrastructure.

- **Core Domain:** Canvas state management, Node/Edge data model, Memory quarantine logic.
- **Primary (Driving) Adapters:** FastAPI HTTP Routers (REST), FastAPI WebSocket Routers (Voice), Celery Task Consumers.
- **Secondary (Driven) Adapters:** Supabase Client (DB/Storage), Redis Client (Cache/Queue/Vector), OpenAI REST Client, OpenAI Realtime API Client.

This ensures that the core canvas service handles mutations identically, regardless of whether the trigger was a voice command (WebSocket adapter) or a text chat submission (HTTP adapter).

---

## System Architecture

```
FRONTEND (React + TypeScript + Vite)
├── Canvas Engine:          react-flow (nodes, edges, drag, zoom, pan)
├── Voice Layer:            Web Audio API mic capture → WebSocket → Realtime API
├── Branch Rail:            custom tab strip component
├── Status Pill:            header component — 2 states: Working / Ready
├── Memory Panel:           React list with Tier tabs (left slide-out)
├── Assumption Audit Panel: React drawer (right side, collapsible)
├── Reasoning Ribbon:       SSE-driven status bar (bottom, transient)
└── Export:                 marked.js (Markdown render) + pyppeteer (PDF via backend)

BACKEND (Python 3.11 + FastAPI + Uvicorn)
├── LLM Orchestration:      OpenAI Python SDK (GPT-4o structured output + GPT-4o-mini governance)
├── Voice Proxy:            FastAPI WebSocket (/ws/voice) ↔ OpenAI Realtime API WebSocket
├── Memory Service:         Supabase PostgreSQL — 4-tier partitioned tables
├── Vector Search:          Redis Cloud (RedisVSS) — node and memory embeddings (V1)
├── Ingestion Pipeline:     PyMuPDF, python-docx, python-pptx, requests + BeautifulSoup
├── File Storage:           Supabase Storage (presigned URLs for uploads and exports)
├── Background Jobs:        Celery + Redis — heavy document processing offloaded from HTTP threads
├── Event Log:              Supabase PostgreSQL events table (for Rewind / Timeline)
└── SSE Streaming:          FastAPI StreamingResponse (sse-starlette)

INFRASTRUCTURE (AWS EC2)
├── Reverse Proxy:          NGINX (TLS termination, request routing)
├── Application Server:     Uvicorn + FastAPI (HTTP + WebSocket)
└── Task Workers:           Celery workers (document ingestion, PDF export)

MANAGED CLOUD SERVICES
├── Supabase:               PostgreSQL (relational storage) + Supabase Storage (file storage)
└── Redis Cloud:            Redis Stack (vector search + Celery queue + SSE pub/sub + caching)

AI SERVICES (External APIs — no infrastructure cost)
├── GPT-4o:                 Primary compilation, structured output, tool-calling, Vision (images)
├── gpt-4o-realtime-preview: Voice-first input channel — real-time STT + tool calling over WebSocket
└── GPT-4o-mini:            Contradiction detection, memory classification, Session Audit, Ribbon fallback
```

---

## Tech Stack Decisions

| Component | Choice | Rationale | Trade-off |
|---|---|---|---|
| Canvas rendering | react-flow v11 | Battle-tested, rich node/edge data model, 300+ node performance | Less free-form than tldraw — correct trade-off for a structured graph product |
| Primary database | Supabase (PostgreSQL) | Managed, production-grade, no infra management; built-in auth and real-time subscriptions | Supabase free tier has row limits — fine for hackathon and early V1 |
| File storage | Supabase Storage | Eliminates S3 entirely; integrated with the same Supabase project; presigned URL support | Storage bandwidth limits on free tier |
| Vector search | Redis Cloud (RedisVSS) | Redis Stack combines vector search + task queue + pub/sub + caching in one managed service; no separate vector DB needed at hackathon scale | Limited ANN index tuning vs. Pinecone — migrate post-V1 if needed |
| Task queue | Celery + Redis | Offloads heavy PDF/DOCX parsing from HTTP request threads; prevents API timeouts on large documents | Adds operational complexity; essential for production correctness |
| Voice channel | OpenAI Realtime API | Native real-time STT + tool calling in one WebSocket connection; all 12 verbs voice-addressable with no separate transcription step | WebSocket infrastructure vs. simple REST STT; justified by voice-first principle |
| Primary LLM | GPT-4o | Best structured output + tool-calling; streaming support; Vision for images | Cost vs. GPT-4o-mini; mitigated by model routing |
| Governance LLM | GPT-4o-mini | 10x cheaper; suitable for binary/classification tasks | ~20% quality trade-off on nuanced tasks; acceptable for contradiction detection and memory classification |
| PDF export | pyppeteer (headless Chromium) | Clean structured PDF output; Chromium on EC2 is controllable | Chromium on EC2 requires setup; pdfkit is the fallback |
| Embeddings | text-embedding-3-small | Deferred to V1 — at hackathon scale (< 100 nodes) full canvas state fits in GPT-4o context window | No semantic retrieval at hackathon scale; acceptable trade-off |
| Deployment | AWS EC2 | Single-instance deployment; NGINX + Uvicorn + Celery on one machine | Not horizontally scalable at hackathon scope — sufficient for demo |

---

## Browser Compatibility

- **Primary (supported):** Chrome
- **Secondary (post-hackathon):** Firefox
- **Unsupported (hackathon):** Safari — WebSocket and Web Audio API differences

---

## AI Model Specification

### Voice and Chat Input Channels — Simultaneous Primacy

Voice and Text Chat are **simultaneous, parallel input channels**. Neither is a fallback.

- **Voice Channel (`gpt-4o-realtime-preview`):** Connected via a persistent WebSocket between the frontend (Web Audio API) and the backend (`/ws/voice`), which proxies to the OpenAI Realtime API. Handles real-time speech-to-text and tool calling.
- **Text Channel (`gpt-4o`):** Standard HTTP POST to the backend, invoking the REST API.

Both channels invoke the identical 8-tool vocabulary (same schema). Canvas state mutations are handled by the same Core Domain service, meaning the interaction modality is completely invisible to the graph logic.

**WebSocket flow:**
```
Browser (Web Audio API mic capture)
  → WebSocket to FastAPI /ws/voice
  → FastAPI proxies to OpenAI Realtime API WebSocket
  → Realtime API streams back: transcript + tool calls + text response
  → FastAPI routes tool call results to canvas service → SSE to frontend
```

### Primary Compilation — gpt-4o

Invoked on document Drop and canvas mutation operations. Uses structured output (JSON mode) and the 8-tool vocabulary. Also handles Vision inputs (screenshot, slide image analysis).

### Governance — gpt-4o-mini

Invoked for high-frequency, low-stakes classification tasks:
- Contradiction detection between node pairs
- Memory Negotiation Card trigger evaluation
- Session Memory Audit inference generation
- Reasoning Ribbon narration (fallback if gpt-4o streaming is unreliable)

### Embeddings — text-embedding-3-small (Deferred to V1)

At hackathon demo scale (< 100 nodes), the entire canvas state serializes to approximately 6,000–10,000 tokens — well within GPT-4o's 128K context window. Full-canvas context injection is used instead of semantic retrieval. Vector embeddings are a V1 optimization for production-scale canvases.

---

## AI Tool-Calling Architecture

The AI operates as an agent with a defined tool vocabulary. Both the text compilation path (GPT-4o structured output) and the voice path (Realtime API tool calling) invoke the same 8 registered functions. Canvas state mutations are identical regardless of input modality.

```json
{
  "tools": [
    {"name": "create_node",          "description": "Add a new typed node to the canvas"},
    {"name": "create_edge",          "description": "Link two nodes with a typed relationship"},
    {"name": "flag_contradiction",   "description": "Mark two nodes as logically contradicting"},
    {"name": "create_branch",        "description": "Fork the canvas into a new branch"},
    {"name": "merge_nodes",          "description": "Combine two nodes into one synthesized node"},
    {"name": "collapse_cluster",     "description": "Fold a cluster into a single summary node"},
    {"name": "propose_memory",       "description": "Queue a Tier 2 memory for user ratification"},
    {"name": "emit_reasoning_step",  "description": "Emit an intermediate step to the Reasoning Ribbon"}
  ]
}
```

Every tool call is logged in the Event Log, auditable via the Activity Log, and reversible via Rewind.

---

## Structured Output Schema

A single compilation call returns this structure. It simultaneously drives: Reasoning Ribbon, Assumption Audit Panel, Provenance Badges, Contradiction Flags, and Memory Negotiation Card triggers.

```json
{
  "nodes": [
    {
      "id": "uuid",
      "type": "assumption",
      "text": "The market is primarily B2B",
      "confidence": "medium",
      "provenance_type": "parametric",
      "impact_nodes": ["node_id_1", "node_id_2"]
    }
  ],
  "reasoning_steps": [
    {
      "step": 1,
      "action": "extracted_from_source",
      "detail": "page 3, paragraph 2",
      "confidence": "high"
    },
    {
      "step": 2,
      "action": "classified_as",
      "type": "assumption",
      "reason": "hedged language: 'likely', 'assumed'"
    }
  ],
  "contradictions": [
    {
      "node_a": "id1",
      "node_b": "id2",
      "explanation": "Node A claims X while Node B claims not-X"
    }
  ],
  "proposed_memories": [
    {
      "tier": 2,
      "text": "User prefers cost optimization over speed",
      "trigger": "mentioned cost 3 times"
    }
  ]
}
```

---

## Streaming Architecture

### Text Path (HTTP SSE)

The Reasoning Ribbon requires intermediate output before the final compilation result.

**Primary approach:** GPT-4o with streaming enabled. The system prompt instructs the model to emit `{"event": "reasoning_step", "step": N, "text": "..."}` JSON objects as it processes, followed by the final compilation output.

**Fallback approach:** Two sequential calls — a fast GPT-4o-mini call that generates and streams the reasoning steps list first, followed by the primary GPT-4o call for the full compilation. Adds approximately 500ms but guarantees Ribbon content.

**Engineering constraint:** Prototype the streaming approach in the first 4 hours. If the primary approach proves unreliable, switch immediately to the fallback. Do not spend more than 2 hours debugging streaming reliability.

### Voice Path (WebSocket)

The OpenAI Realtime API connection is a persistent bidirectional WebSocket. Audio chunks are streamed from the browser microphone. Transcription and AI responses stream back. Tool call results from the Realtime API are routed through the canvas service and delivered to the frontend via the existing SSE channel — so the Reasoning Ribbon receives voice-triggered compilation steps identically to text-triggered ones.

---

## Node Data Model

```json
{
  "id": "uuid",
  "type": "idea | evidence | assumption | question | constraint | insight | decision | source",
  "text": "string",
  "confidence": "low | medium | high",
  "provenance_type": "document | core_memory | ai_inference | parametric | user_created | voice_input",
  "provenance_detail": {
    "source_id": "uuid | null",
    "artifact_name": "filename.pdf | null",
    "page": 3,
    "memory_tier": "0 | 1 | 3 | null",
    "voice_transcript_segment": "string | null"
  },
  "memory_scope": "session | workspace | global | null",
  "memory_tier": "0 | 1 | 2 | 3 | null",
  "impact_nodes": ["uuid", "uuid"],
  "position": {"x": 0, "y": 0},
  "pinned": false,
  "cluster_id": "uuid | null",
  "branch_id": "uuid",
  "created_at": "ISO8601",
  "created_by": "user | ai",
  "input_modality": "text | voice | drop",
  "workspace_mode_at_creation": "analytical | creative | critical | strategic",
  "relationships": [
    {
      "target_id": "uuid",
      "type": "supports | contradicts | depends_on | derived_from",
      "confidence": "high | medium | low"
    }
  ]
}
```

**Critical implementation note:** `impact_nodes` must be pre-computed at node creation time and stored in the node record. Impact Halo hover queries must complete in under 100ms. Do not compute on hover.

---

## Event Log Schema

Used by: Rewind verb, Thinking Timeline, Activity Log overlay.

```json
{
  "event_id": "uuid",
  "timestamp": "ISO8601",
  "event_type": "node_created | node_deleted | edge_created | merge | branch_created | branch_committed | assumption_overridden | memory_accepted | memory_rejected | mode_changed | quick_override_set | voice_command_received",
  "author": "user | ai",
  "input_modality": "text | voice | drop",
  "affected_node_ids": ["uuid"],
  "delta": {"before": {}, "after": {}},
  "canvas_id": "uuid",
  "branch_id": "uuid",
  "workspace_mode": "analytical | creative | critical | strategic"
}
```

---

## Memory Data Model

### Supabase PostgreSQL Table Structure (4-tier partitioned)

```sql
CREATE TABLE memories (
  id          TEXT PRIMARY KEY,
  tier        INTEGER NOT NULL,   -- 0: Core, 1: Session/Workspace, 2: Inferred, 3: Source
  scope       TEXT NOT NULL DEFAULT 'session',
                                  -- 'global'    → Tier 0 (Core, permanent, all sessions)
                                  -- 'workspace' → Tier 1 (persists across sessions for this canvas/project)
                                  -- 'session'   → Tier 1 (expires when canvas closes)
                                  -- 'source'    → Tier 3 (tied to a dropped artifact)
  text        TEXT NOT NULL,
  provenance  JSONB,              -- {session_id, artifact_id, trigger, input_modality}
  canvas_id   TEXT,               -- NULL for Tier 0 (global scope)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used   TIMESTAMPTZ,
  quarantined BOOLEAN DEFAULT FALSE,  -- TRUE if Tier 2 and not yet ratified; excluded from all LLM context
  archived    BOOLEAN DEFAULT FALSE,  -- Soft-delete for manually archived items
  rejected    BOOLEAN DEFAULT FALSE   -- Soft-delete for items rejected during Memory Negotiation Card
                                      -- or Session Memory Audit. Excluded from LLM context forever
                                      -- but retained in DB for PS06 export auditability.
);
```

### Scope → Tier Mapping

The `scope` field and the Memory Negotiation Card options map to tiers as follows:

| Negotiation Card Option | Inline Scope Chip | Tier | scope value | Lifecycle |
|---|---|---|---|---|
| Remember Always | [Global] | Tier 0 | `'global'` | Permanent; survives all sessions |
| This Project Only | [Workspace] | Tier 1 | `'workspace'` | Persists across sessions for this canvas/project; survives canvas close |
| (Session default) | [Session] | Tier 1 | `'session'` | Expires when canvas closes |
| Don't Remember | — | — | (deleted) | Immediately hard-deleted |
| Not Now | — | Tier 2 | `'session'` | Stays quarantined pending future ratification |

### Context Assembly Priority Order

At prompt construction time, context is assembled in this order:

1. Workspace Mode system prompt (configures reasoning posture and memory weighting)
2. Tier 0 (Core, `scope='global'`) — all active core memories, filtered by domain relevance
3. Tier 1 (Workspace, `scope='workspace'`) — all workspace-scoped memories for this canvas/project
4. Tier 1 (Session, `scope='session'`) — session memories for the current canvas (truncated to most recent 10 if many)
5. Tier 3 (Source, `scope='source'`) — relevant source memories (at demo scale: all; at V1 scale: top-N by Redis vector search)
6. Tier 2 (Inferred) — **NEVER included until explicitly accepted by user, regardless of quarantine status**
7. Canvas state snapshot — current subgraph serialized as structured JSON

**Tier 2 quarantine is the foundational PS06 commitment.** Inferred memories exist in the database but are excluded from all LLM context assembly until ratified. This must be enforced at the database query layer, not assumed in application logic.

**Rejected memories are excluded forever.** Items rejected during the Memory Negotiation Card or Session Memory Audit are soft-deleted (`rejected=TRUE`). They are never included in LLM context but are retained in the database for PS06 export auditability (the export shows the full consent ledger including rejections).

---

## LLM Cost and Token Architecture

### Model Routing

| Task | Model | Protocol | Typical Cost |
|---|---|---|---|
| Voice input — real-time STT + tool calling | gpt-4o-realtime-preview | WebSocket | ~$0.06/min audio in, $0.024/min audio out |
| Primary compilation (Drop → nodes) | GPT-4o | REST + SSE | $0.005–0.040 per operation |
| Reasoning Ribbon steps (fallback) | GPT-4o-mini | REST + SSE | $0.0003 per operation |
| Contradiction detection | GPT-4o-mini | REST | $0.0002 per operation |
| Memory Negotiation Card trigger | GPT-4o-mini | REST | $0.0001 per operation |
| Session Memory Audit | GPT-4o-mini | REST | $0.001 per operation |
| Counterfactual Branch recompile | GPT-4o | REST + SSE | $0.005–0.020 per operation |
| Vision (screenshot / slide image) | GPT-4o | REST | ~$0.005 per image |

### Per-Operation Token Budgets

| Operation | Context Budget | Output Budget | Notes |
|---|---|---|---|
| Voice command compilation | Streaming; token budget managed by Realtime API session | — | Session-level token usage tracked |
| Drop: PDF (10 pages) | 6,000–10,000 tokens | 2,000–4,000 tokens | Chunked if needed |
| Drop: plain text | 500–2,000 tokens | 500–1,500 tokens | Direct extraction |
| Assumption Audit | 3,000–5,000 tokens | 500–1,000 tokens | Current subgraph + memories |
| Contradiction detection | 500–1,000 tokens | 100–200 tokens | New node pairs only |
| Session Memory Audit | 500–1,500 tokens | 200–500 tokens | Session events summary |

### Technical Limits vs. Cost Thresholds

| Dimension | Technical Limit | Cost Threshold | Action When Exceeded |
|---|---|---|---|
| GPT-4o context window | 128,000 tokens | 20,000 tokens per call | Trigger context summarization |
| Per-session cumulative spend | No hard API limit | $2.00 per session (demo) | Show "Context getting large" chip |
| Realtime API session | 15-minute default | — | Re-establish connection with session summary as context |

---

## API Endpoints

To be filled in as routes are implemented during the build.

| Method | Route | Protocol | Description | Status |
|---|---|---|---|---|
| POST | `/api/canvas` | HTTP | Create a new canvas | |
| GET | `/api/canvas/{id}` | HTTP | Get canvas state | |
| POST | `/api/canvas/{id}/drop` | HTTP | Process a dropped artifact (queued to Celery) | |
| GET | `/api/canvas/{id}/stream` | SSE | Reasoning Ribbon step stream | |
| WS | `/ws/voice` | WebSocket | Voice channel — proxies to OpenAI Realtime API | |
| POST | `/api/canvas/{id}/branch` | HTTP | Create a new branch | |
| GET | `/api/canvas/{id}/memory` | HTTP | Get all memory items | |
| POST | `/api/canvas/{id}/memory` | HTTP | Create a memory item | |
| PUT | `/api/canvas/{id}/memory/{mem_id}` | HTTP | Update a memory item | |
| DELETE | `/api/canvas/{id}/memory/{mem_id}` | HTTP | Archive a memory item | |
| POST | `/api/canvas/{id}/memory/{mem_id}/ratify` | HTTP | Accept a Tier 2 memory | |
| GET | `/api/canvas/{id}/export` | HTTP | JSON export | |

---

## Engineering Constraints

### Performance Budgets (Non-Negotiable)

| Operation | Target | Implementation Requirement |
|---|---|---|
| Impact Halo query | < 100ms | Pre-compute `impact_nodes` at node creation; store in node record; do not compute on hover |
| Reasoning Ribbon first token | < 3s | Use SSE streaming; route to GPT-4o-mini if GPT-4o is too slow |
| Voice command to first canvas change | < 5s | Realtime API WebSocket latency + tool call processing |
| Memory Panel load | < 300ms | Demo data must not exceed 20 items |
| Branch comparison render | < 1s | Pre-render second branch in background when Compare mode is activated |
| PDF export | < 8s | Show loading state; fall back to Markdown-only if > 10s |

### Demo Integrity Constraints (Non-Negotiable)

- All LLM responses for scripted demo beats are pre-cached as JSON fixtures. Zero live API calls during scripted beats.
- Canvas must never be blank mid-demo. Compilation failure falls back to pre-cached nodes.
- No personal data in the demo dataset. All content is synthetic and clearly fictional.
- All API failures show an inline error on the affected element with a [Retry] button. Canvas state must not be lost.
- Voice must be functional for the demo — it is the primary input channel, not a peripheral feature.

### Principle-Based Constraints (Binding)

- No feature that cannot be explained to a judge in one sentence.
- No AI action that cannot be undone or traced.
- Voice and text paths must produce identical canvas mutations. Input modality is invisible to the canvas service.

### CORS Configuration (Required — Day 0)

The FastAPI backend runs at `localhost:8000` (production: your EC2 domain); the frontend runs at `localhost:5173` (production: your domain). CORS middleware is **required** for all HTTP requests. Configure in `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add production URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, replace `"http://localhost:5173"` with the deployed frontend URL. WebSocket (`/ws/voice`) is not subject to CORS — it uses the WebSocket handshake protocol which has its own origin enforcement.

---

### Error Handling Requirements

| Failure | Behavior |
|---|---|
| LLM API failure (text path) | Inline error on affected node/cluster: "Compilation failed — [Retry]." Canvas state preserved. |
| Realtime API WebSocket disconnect | Auto-reconnect with exponential backoff. Show "Voice reconnecting..." in the Status Pill. |
| Redis unavailable | Fall back to in-memory keyword search for memory retrieval. Log the fallback. Show degraded-mode banner. |
| PDF parse failure | Error on Source node: "Could not parse this file. Try a different format." |
| URL fetch failure | "Could not reach this URL. Paste the content manually instead." Text input fallback offered. |
| File too large | "File too large. Maximum is [X]MB for [type]. Try splitting the document." |
| Supabase unavailable | Serve from Redis cache if available. Show degraded-mode banner. |

### File Size Limits

| Format | Limit |
|---|---|
| PDF | 20MB |
| DOCX | 10MB |
| PPTX | 25MB |
| Image | 5MB |

---

## Critical Open Questions (Must Resolve Early)

| Question | Must Resolve By | Impact If Wrong |
|---|---|---|
| Can GPT-4o reliably emit `reasoning_step` JSON objects mid-stream? | Hours 0–4 | Determines 1-call vs. 2-call streaming architecture |
| Does the EC2 instance support Chromium for pyppeteer? | Environment setup | Determines PDF export library |
| OpenAI Realtime API WebSocket — can FastAPI proxy it without latency issues? | Hours 0–4 | Determines voice channel architecture |
| Redis Cloud (RedisVSS) write/read latency on demo dataset | Hours 0–6 | Determines caching and retrieval strategy |

---

*Reference: Kleos_Master_Document.md — Sections 13, 16, 17, 21, 29*
