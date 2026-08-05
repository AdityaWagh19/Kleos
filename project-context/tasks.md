# Tasks

**Kleos** — Active Build Checklist
**Format:** Mark [ ] → [/] (in progress) → [x] (complete). Never delete tasks — mark deferred ones as [deferred: reason].

---

## Hours 0–3: Foundation

### Backend
- [ ] Design SQLite schema: 4-tier memory tables (tier, text, provenance, canvas_id, quarantined, archived)
- [ ] Design SQLite schema: events table (event_id, event_type, author, affected_node_ids, delta, branch_id)
- [ ] FastAPI project skeleton: folder structure, main.py, routers/, services/, models/, db/
- [ ] Database initialization script: db/init.py
- [ ] Environment variable loading (OPENAI_API_KEY, DEMO_MODE, DATABASE_URL, CHROMA_PERSIST_DIR)
- [ ] ChromaDB initialization and persistence configuration
- [ ] Benchmark ChromaDB latency at demo scale (target: < 30ms per query)

### Frontend
- [ ] Vite + React + TypeScript project scaffold
- [ ] react-flow canvas shell: pan, zoom, empty state
- [ ] Basic node rendering: idea, evidence, assumption node types with placeholder styles
- [ ] TypeScript type definitions: Node, Edge, Memory, Event, Branch, WorkspaceMode
- [ ] API client service: base URL configuration, error handling wrapper

---

## Hours 3–6: Core AI Integration

### Backend
- [ ] OpenAI SDK integration: GPT-4o call with structured output (JSON mode)
- [ ] POST /api/canvas/{id}/drop endpoint: accept PDF, extract text via PyMuPDF, call GPT-4o
- [ ] Validate structured output schema: nodes[], reasoning_steps[], contradictions[], proposed_memories[]
- [ ] `impact_nodes` pre-computation: identify and store affected node IDs at creation time
- [ ] FastAPI endpoint to return created nodes to frontend

### Frontend
- [ ] All 8 node type renderers with distinct visual treatments
- [ ] Provenance badge icons: document (blue), core memory (green), AI inference (yellow), parametric (red), user-created (white)
- [ ] Cluster background rendering: translucent colored grouping with text label
- [ ] Branch Rail component: stub with single "main" tab

---

## Hours 6–10: Reasoning Ribbon and Contradiction

### Backend
- [ ] SSE streaming endpoint: GET /api/canvas/{id}/stream
- [ ] Primary streaming approach: GPT-4o emits reasoning_step JSON objects mid-stream
- [ ] Test primary streaming reliability. If unreliable within 2 hours: switch to 2-call fallback (GPT-4o-mini for steps + GPT-4o for compilation)
- [ ] Contradiction detection: GPT-4o-mini call on new node pairs, returns contradicting pairs
- [ ] flag_contradiction tool call: creates red edge between contradicting nodes, logs to Event Log

### Frontend
- [ ] Reasoning Ribbon component: bottom strip, SSE consumer, step-by-step display, fade after 2s
- [ ] Status Pill component: 2-state (Working... / Ready), tooltip on click showing last 3 ribbon steps
- [ ] Contradiction Flag: red edge with lightning symbol, hover text showing explanation
- [ ] Per-element micro-interactions: node glow on "awaiting decision," red border on error

---

## Hours 10–14: Memory System

### Backend
- [ ] Memory CRUD endpoints: GET, POST, PUT, DELETE /api/canvas/{id}/memory
- [ ] Tier 2 quarantine enforcement: excluded from all LLM context assembly until ratification
- [ ] POST /api/canvas/{id}/memory/{id}/ratify: promote Tier 2 to Tier 0 or Tier 1
- [ ] Memory Negotiation Card trigger: GPT-4o-mini watches session events, fires when same preference appears 2+ times
- [ ] propose_memory tool call: creates Tier 2 memory item with quarantined=1
- [ ] Context assembly service: assembles LLM context in correct priority order (Mode prompt → Tier 0 → Tier 1 → Tier 3 → canvas state; Tier 2 NEVER included)
- [ ] Scope chip data model: memory_scope field on nodes (session / workspace / global)

### Frontend
- [ ] Impact Halo: on assumption hover, pulse all nodes in impact_nodes array amber simultaneously (target: < 100ms)
- [ ] Assumption Audit Panel: right-side drawer, list of assumptions with confidence bar, source badge, actions
- [ ] Memory Panel: left-side slide-out, 4-tab view (Core / Session / Pending / Source), search bar, inline actions
- [ ] Pending tab banner: "These have not influenced any response yet. Review before accepting."

---

## Hours 14–18: Session Audit and Workspace Modes

### Backend
- [ ] Session Memory Audit: GPT-4o-mini summarizes session events → returns list of inferences for review
- [ ] POST /api/canvas/{id}/audit: accept array of {memory_id, action: accept|reject|edit} decisions
- [ ] Workspace Modes: 4 distinct system prompt variants (Analytical, Creative, Critical, Strategic)
- [ ] Mode storage: save active mode with canvas state; restore on canvas open
- [ ] Mode switching: instant, does not alter stored memories — changes context assembly priority only

### Frontend
- [ ] Memory Negotiation Card UI: dismissible card with 4 scope options
- [ ] Session Memory Audit card: per-item Accept / Reject / Edit at canvas close
- [ ] Inline Scope Chip component: cycles Session / Workspace / Global on click with animation
- [ ] Mode Selector onboarding: full-screen on first use, 4 modes with one-line descriptions
- [ ] Mode indicator in canvas header: active mode name always visible
- [ ] Mode switching: show one-line description on switch

---

## Hours 18–22: Branch, Compare, Incognito, Controls

### Backend
- [ ] POST /api/canvas/{id}/branch: fork canvas state, assign new branch_id to all nodes
- [ ] GET /api/canvas/{id}/branches: list all branches with status
- [ ] Branch Rail data: name, creation time, status (active / committed / discarded)
- [ ] Incognito Mode flag: session-scoped, prevents any memory writes

### Frontend
- [ ] Branch creation: verb triggers branch in backend, adds tab to Branch Rail
- [ ] Compare Mode: side-by-side split view, two branches simultaneously, delta nodes in amber
- [ ] Incognito Mode: dark chrome border, "Incognito" badge in header, Session Audit skipped on close
- [ ] Pause / Stop controls: halt SSE stream mid-compilation; canvas shows partial nodes on Pause; revert on Stop
- [ ] Keyboard shortcuts: B=Branch, M=Merge, C=Compare, T=Trace, P=Pin, Esc=dismiss any panel

---

## Hours 22–26: Export and Ingestion

### Backend
- [ ] Markdown export: template rendering from canvas data model
- [ ] PDF export: puppeteer (primary) — verify Chromium availability first; pdfkit (fallback)
- [ ] GET /api/canvas/{id}/export: JSON export of full canvas data model
- [ ] DOCX ingestion: python-docx text extraction → GPT-4o structured extraction
- [ ] Ingestion pipeline: PDF (PyMuPDF), plain text (direct), DOCX (python-docx)

### Frontend
- [ ] Export dialog: format selector (Markdown / PDF), export type selector (Full / Decision Summary / Research Notes)
- [ ] Loading state for PDF export (2–6 seconds)
- [ ] Onboarding suggestion chips: appear on empty canvas, disappear when first node is added
- [ ] Empty state designs: Assumption Audit Panel ("No assumptions detected yet. Drop content to begin."), Memory Panel ("No memories stored yet. Kleos will only remember what you approve.")

---

## Hours 26–32: Demo Preparation

- [ ] Write fixture generation script: src/backend/fixtures/generate_fixtures.py
- [ ] Pre-cache all scripted demo beat LLM responses as JSON fixtures
- [ ] Verify DEMO_MODE=true routes all scripted beats to fixtures
- [ ] Populate pre-demo canvas state: 4 nodes on "AI startup product strategy for Indian market"
- [ ] Populate Memory Panel: 3 Core Memories, 1 Inferred (pending) memory
- [ ] Stage PDF: synthetic competitor analysis, ready to drop
- [ ] Full demo rehearsal: run the 7-minute script end-to-end
- [ ] Error state testing: verify all API failure states show correct inline errors
- [ ] Verify Impact Halo response time: target < 100ms

---

## Hours 32–40: Polish and Hardening

- [ ] UI animation smoothing: Status Pill transitions, scope chip cycles, card appearances
- [ ] Reasoning Ribbon step click: expand to show specific evidence
- [ ] Contradiction flag hover text: "These cannot both be true. [Node A] says X, [Node B] says Y."
- [ ] Source Filter toolbar: dims all nodes except selected source type
- [ ] Edge case: canvas never blank mid-demo (verify fallback to pre-cached nodes on compilation failure)
- [ ] Browser-specific testing: Chrome primary
- [ ] Export time verification: PDF < 8s; Markdown < 1s
- [ ] Memory Panel load verification: < 300ms
- [ ] Branch comparison render verification: < 1s

---

## Hours 40–48: Buffer and Final Recording

- [ ] Final full-run demo rehearsal
- [ ] Demo recording (for submission artifact)
- [ ] Trust Lens Toggle (B4) implementation — only if time permits
- [ ] README and documentation final review
- [ ] Git: clean commit history, tag release

---

*Instructions: Mark tasks [/] when starting, [x] when complete. For deferred tasks, add [deferred: reason and hour]. This file is the primary coordination tool during the build — keep it open alongside the code editor.*
