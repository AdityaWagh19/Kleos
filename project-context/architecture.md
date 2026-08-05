# Architecture

**Kleos** — Technical Architecture, AI System Design, and Data Schemas

---

## Scope Statement

Kleos does not build novel AI. It is an HCI layer on top of mature AI APIs.

All AI capability is achieved through: system prompt engineering, structured output (JSON mode), tool calling, streaming (SSE), and retrieval (ChromaDB semantic search). No custom ML models. No custom training pipelines. The innovation is entirely in the interaction design and the HCI layer built on top of standard AI outputs.

---

## System Architecture

```
FRONTEND (React + TypeScript)
├── Canvas Engine:          react-flow (nodes, edges, drag, zoom, pan)
├── Branch Rail:            custom tab strip component
├── Status Pill:            header component — 2 states: Working / Ready
├── Memory Panel:           React list with Tier tabs (left slide-out)
├── Assumption Audit Panel: React drawer (right side, collapsible)
├── Reasoning Ribbon:       SSE-driven status bar (bottom, transient)
├── Voice Layer (opt.):     Sarvam AI STT/TTS + Web Audio API
└── Export:                 marked.js (Markdown render) + puppeteer (PDF)

BACKEND (Python + FastAPI)
├── LLM Orchestration:      OpenAI Python SDK (tool-calling + streaming)
├── Memory Service:         SQLite — 4-tier partitioned tables
├── Vector Store:           ChromaDB local (node embeddings + memory embeddings)
├── Ingestion Pipeline:     PyMuPDF, python-docx, python-pptx, requests + BeautifulSoup
├── Event Log:              SQLite events table (for Rewind / Timeline)
├── SSE Streaming:          FastAPI StreamingResponse
└── JSON Export:            FastAPI endpoint — canvas data model serialization

AI SERVICES (External APIs only)
├── GPT-4o:                 Primary compilation, structured output, tool-calling
├── GPT-4o-mini:            Contradiction detection, memory classification, Session Audit
├── text-embedding-3-small: Semantic similarity (ChromaDB embeddings)
└── Sarvam AI (optional):   Multilingual STT + TTS
```

---

## Tech Stack Decisions

| Component | Choice | Rationale | Trade-off |
|---|---|---|---|
| Canvas rendering | react-flow | Battle-tested, rich node/edge data model, 300+ node performance | Less free-form than tldraw — correct trade-off for a structured graph product |
| Graph store | In-memory dict + SQLite | No Neo4j setup; relationships stored as JSON arrays in node records | Loses graph query power; O(N) Impact Halo traversals — acceptable at demo scale (<100 nodes) |
| Vector store | ChromaDB (local) | No external service; runs in-process; sufficient for <200 nodes | Limited to local disk; switch to managed vector DB post-hackathon |
| Primary LLM | GPT-4o | Best structured output + tool-calling; streaming support | Cost vs. GPT-4o-mini; mitigated by model routing |
| Classification LLM | GPT-4o-mini | 10x cheaper; suitable for binary/classification tasks | ~20% quality trade-off on nuanced tasks; acceptable for contradiction detection and memory classification |
| Memory storage | SQLite (4 partitioned tables) | Simple, queryable, transactional, hackathon-ready | Not real-time; memory reads <10ms at demo scale |
| Streaming | FastAPI SSE | Browser-native; no WebSocket handshake complexity | — |
| Voice | Sarvam AI | Best-in-class Indian language support (Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati) | 6–8 hour integration cost; moved to Differentiator |
| PDF export | puppeteer | Clean structured output | Requires Chromium on server. If unavailable: fall back to pdfkit |
| Embeddings | text-embedding-3-small | Cheapest embedding model; sufficient semantic similarity | — |

---

## Browser Compatibility

- **Primary (supported):** Chrome
- **Secondary (post-hackathon):** Firefox
- **Unsupported (hackathon):** Safari — due to WebRTC and SSE differences

---

## AI Tool-Calling Architecture

The AI operates as an agent with a defined tool vocabulary. It does not produce free-form text instructions — it invokes registered functions.

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
      "action": "extracted_from_pdf",
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

The Reasoning Ribbon requires intermediate output before the final compilation result.

**Primary approach:** GPT-4o with streaming enabled. The system prompt instructs the model to emit `{"event": "reasoning_step", "step": N, "text": "..."}` JSON objects as it processes, followed by the final compilation output.

**Fallback approach (if primary is unreliable):** Two sequential calls — a fast GPT-4o-mini call that generates and streams the reasoning steps list first, followed by the primary GPT-4o call for the full compilation. Adds approximately 500ms of latency but guarantees ribbon content.

**Engineering constraint:** Prototype the streaming approach in the first 4 hours of the hackathon. If the primary approach proves unreliable within the prototype, switch immediately to the fallback. Do not spend more than 2 hours debugging streaming reliability.

---

## Node Data Model

```json
{
  "id": "uuid",
  "type": "idea | evidence | assumption | question | constraint | insight | decision | source",
  "text": "string",
  "confidence": "low | medium | high",
  "provenance_type": "document | core_memory | ai_inference | parametric | user_created",
  "provenance_detail": {
    "source_id": "uuid | null",
    "artifact_name": "filename.pdf | null",
    "page": 3,
    "memory_tier": "0 | 1 | 3 | null"
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
  "event_type": "node_created | node_deleted | edge_created | merge | branch_created | branch_committed | assumption_overridden | memory_accepted | memory_rejected | mode_changed | quick_override_set",
  "author": "user | ai",
  "affected_node_ids": ["uuid"],
  "delta": {"before": {}, "after": {}},
  "canvas_id": "uuid",
  "branch_id": "uuid",
  "workspace_mode": "analytical | creative | critical | strategic"
}
```

---

## Memory Data Model

### SQLite Table Structure (4-tier partitioned)

```sql
CREATE TABLE memories (
  id          TEXT PRIMARY KEY,
  tier        INTEGER NOT NULL,   -- 0: Core, 1: Session, 2: Inferred, 3: Source
  text        TEXT NOT NULL,
  provenance  TEXT,               -- JSON: {session_id, artifact_id, trigger}
  canvas_id   TEXT,               -- NULL for Tier 0 (global)
  created_at  TEXT NOT NULL,
  last_used   TEXT,
  quarantined INTEGER DEFAULT 0,  -- 1 if Tier 2 and not yet ratified
  archived    INTEGER DEFAULT 0
);
```

### Context Assembly Priority Order

At prompt construction time, context is assembled in this order:

1. Workspace Mode system prompt (configures reasoning posture and memory weighting)
2. Tier 0 (Core) — all active core memories, filtered by domain relevance to current operation
3. Tier 1 (Session) — all session memories for the current canvas (truncated to most recent 10 if many)
4. Tier 3 (Source) — top-N by ChromaDB relevance to current operation
5. Tier 2 (Inferred) — **NEVER included until explicitly accepted by user**
6. Canvas state snapshot — current subgraph serialized as structured JSON

**Tier 2 quarantine is the foundational PS06 commitment.** Inferred memories exist in the database but are excluded from all LLM context assembly until ratified. This must be enforced at the database query layer, not assumed in application logic.

---

## LLM Cost and Token Architecture

### Technical Limits vs. Cost Thresholds

| Dimension | Technical Limit | Cost Threshold | Action When Exceeded |
|---|---|---|---|
| GPT-4o context window | 128,000 tokens | 20,000 tokens per call | Trigger context summarization |
| Per-session cumulative spend | No hard API limit | $2.00 per session (demo) | Show "Context getting large" chip |
| Single compilation call | 128K token window | 12,000 tokens per call | Chunk input; process in parts |

### Model Routing

| Task | Model | Typical Cost |
|---|---|---|
| Primary compilation (Drop → nodes) | GPT-4o | $0.005–0.040 per operation |
| Reasoning Ribbon steps (fallback) | GPT-4o-mini | $0.0003 per operation |
| Contradiction detection | GPT-4o-mini | $0.0002 per operation |
| Memory pattern detection | GPT-4o-mini | $0.0001 per operation |
| Session Memory Audit | GPT-4o-mini | $0.001 per operation |
| Counterfactual Branch recompile | GPT-4o | $0.005–0.020 per operation |
| Voice transcription | Sarvam AI STT | Per-second pricing |
| Semantic similarity | text-embedding-3-small | $0.00002 per 1K tokens |

### Per-Operation Token Budgets

| Operation | Context Budget | Output Budget | Notes |
|---|---|---|---|
| Drop: PDF (10 pages) | 6,000–10,000 tokens | 2,000–4,000 tokens | Chunked; top-N relevant chunks by ChromaDB |
| Drop: plain text | 500–2,000 tokens | 500–1,500 tokens | Direct extraction |
| Assumption Audit | 3,000–5,000 tokens | 500–1,000 tokens | Current canvas subgraph + memories |
| Contradiction detection | 500–1,000 tokens | 100–200 tokens | New node pairs only |
| Memory Negotiation Card | 200–400 tokens | 50–100 tokens | GPT-4o-mini; watches session events |
| Counterfactual Branch | 2,000–6,000 tokens | 1,000–3,000 tokens | Scoped to impact_nodes subgraph |
| Session Memory Audit | 500–1,500 tokens | 200–500 tokens | Session events summary |
| Export Reasoning Summary | 4,000–8,000 tokens | 500–1,000 tokens | Full canvas state → narrative |

### Context Window Management

**Subgraph scoping:** Only canvas nodes semantically related to the current operation are included (ChromaDB distance threshold).

**Cluster summarization:** A cluster of N nodes is represented as a 3-sentence summary + the 2 most-connected nodes in full, unless the operation directly concerns a node in that cluster. Typically compresses canvas context by 70–85%.

**Tiered memory truncation:** Tier 0 — all items. Tier 1 — most recent 10 items. Tier 3 — top-N by ChromaDB relevance.

**Context compression trigger:** When assembled context exceeds 15,000 tokens, show: "The workspace context is getting large. Would you like me to summarize older clusters to free up context?"

**Demo caching:** All LLM responses for scripted demo beats are pre-cached as JSON fixtures. Zero live API calls during critical demo moments.

---

## API Endpoints

To be filled in as routes are implemented during the build.

| Method | Route | Description | Status |
|---|---|---|---|
| POST | `/api/canvas` | Create a new canvas | |
| GET | `/api/canvas/{id}` | Get canvas state | |
| POST | `/api/canvas/{id}/drop` | Process a dropped artifact | |
| GET | `/api/canvas/{id}/stream` | SSE stream for Reasoning Ribbon | |
| POST | `/api/canvas/{id}/branch` | Create a new branch | |
| GET | `/api/canvas/{id}/memory` | Get all memory items | |
| POST | `/api/canvas/{id}/memory` | Create a memory item | |
| PUT | `/api/canvas/{id}/memory/{mem_id}` | Update a memory item | |
| DELETE | `/api/canvas/{id}/memory/{mem_id}` | Archive a memory item | |
| POST | `/api/canvas/{id}/memory/{mem_id}/ratify` | Accept a Tier 2 memory | |
| GET | `/api/canvas/{id}/export` | JSON export | |

---

## Engineering Constraints

### Performance Budgets (Non-Negotiable)

| Operation | Target | Implementation Requirement |
|---|---|---|
| Impact Halo query | < 100ms | Pre-compute `impact_nodes` at node creation; store in node record; do not compute on hover |
| Reasoning Ribbon first token | < 3s | Use SSE streaming; route to GPT-4o-mini if GPT-4o is too slow |
| Memory Panel load | < 300ms | Demo data must not exceed 20 items; paginate if > 50 |
| Branch comparison render | < 1s | Pre-render the second branch in background when Compare mode is activated |
| PDF export | < 8s | Show loading state; fall back to Markdown-only if > 10s |

### Demo Integrity Constraints (Non-Negotiable)

- All LLM responses for scripted demo beats are pre-cached as JSON fixtures. Zero live API calls during critical moments. Live calls used only for judge Q&A, with exponential backoff and a graceful "Let me think about that" placeholder.
- Canvas must never be blank mid-demo. Start with a pre-populated canvas. Compilation failure falls back to pre-cached nodes.
- No personal data in demo dataset. All content is synthetic and clearly fictional.
- All API failures show an inline error on the affected element with a [Retry] button. Canvas state must not be lost due to a failed API call.

### Principle-Based Constraints (Binding)

- No feature that cannot be explained to a judge in one sentence. If the affordance requires an explanation, the affordance is wrong.
- No AI action that cannot be undone or traced. Every canvas reorganization, memory inference, and cluster must be traceable via the Event Log.

### Error Handling Requirements

| Failure | Behavior |
|---|---|
| LLM API failure | Inline error on affected node/cluster: "Compilation failed — [Retry]." Canvas state preserved. |
| ChromaDB unavailable | Fall back to keyword search for memory retrieval. Log the fallback in the Activity Log. |
| PDF parse failure | Error on Source node: "Could not parse this file. Try a different format." Do not crash. |
| Sarvam AI unavailable | Fall back to Web Speech API with warning: "Multilingual voice unavailable — using system voice." |
| URL fetch failure | Show: "Could not reach this URL. Paste the content manually instead." Offer a text input fallback. |
| File too large | Show: "File too large. Maximum is [X]MB for [type]. Try splitting the document." |

### File Size Limits

| Format | Limit |
|---|---|
| PDF | 20MB |
| DOCX | 10MB |
| PPTX | 25MB |
| Image | 5MB |

Enforce server-side. Show a clear error if exceeded.

---

## Critical Open Questions (Must Resolve Early)

These are not design questions — they are implementation blockers that change the architecture if answered differently.

| Question | Must Resolve By | Impact If Wrong |
|---|---|---|
| Can GPT-4o reliably emit `reasoning_step` JSON objects mid-stream with a strict system prompt? | Hours 0–4 | Determines whether 1-call or 2-call streaming architecture is used |
| Does the demo environment support Chromium? | Environment setup | Determines PDF export library (puppeteer vs. pdfkit) |
| ChromaDB local latency at demo scale (< 50 nodes, < 20 memory items) — is it < 30ms? | Hours 0–6 | Determines whether ChromaDB needs to be replaced or pre-warmed |
| Can react-flow handle concurrent SSE updates and node creation events without render issues? | Hours 0–6 | Determines whether SSE events need to be buffered before flushing to the canvas |

---

*Reference: Kleos_Master_Document.md — Sections 13, 16, 17, 21, 29*
