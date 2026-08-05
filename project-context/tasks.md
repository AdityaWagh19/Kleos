# Tasks

**Kleos** — Active Build Checklist
**Format:** Mark [ ] → [/] (in progress) → [x] (complete). Never delete tasks — mark deferred ones as [deferred: reason].

---

## Hours 0–3: Foundation

### Backend
- [ ] FastAPI project skeleton: folder structure, main.py, routers/, ws/, services/, workers/, db/, cache/, fixtures/
- [ ] Supabase client setup (db/supabase.py): connect using SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
- [ ] Supabase schema migrations: canvases, nodes (with impact_nodes JSONB), edges, memories (quarantined bool), events, branches tables
- [ ] Redis Cloud client setup (cache/client.py): connect using REDIS_URL + REDIS_PASSWORD + SSL
- [ ] Celery app initialization (workers/celery_app.py): broker=Redis, backend=Redis
- [ ] Environment variable loading via python-dotenv (.env): OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REDIS_URL, REDIS_PASSWORD, DEMO_MODE, SUPABASE_STORAGE_BUCKET
- [ ] FastAPI health check endpoint: GET /health (verifies Supabase + Redis connections)

### Frontend
- [ ] Vite + React + TypeScript project scaffold
- [ ] react-flow canvas shell: pan, zoom, empty state
- [ ] Basic node rendering: idea, evidence, assumption node types with placeholder styles
- [ ] TypeScript type definitions: Node, Edge, Memory, Event, Branch, WorkspaceMode, InputModality
- [ ] API client service (services/api.ts): base URL from VITE_API_BASE_URL, error handling wrapper
- [ ] WebSocket client service (services/ws.ts): base URL from VITE_WS_BASE_URL, reconnect logic

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
- [ ] Status Pill component: 3-state (Working... / Listening / Ready). Working=animated blue dot; Listening=animated lime mic icon; Ready=static green dot. Clicking Working... shows last 3 ribbon steps as tooltip.
- [ ] Contradiction Flag: red edge with lightning symbol, hover text showing explanation
- [ ] Per-element micro-interactions: node glow on "awaiting decision," red border on error
- [ ] Assumption Audit Panel: right-side drawer, list of assumptions with confidence bar (Low/Medium/High), source badge per assumption, Accept / Override / Ask AI to reconsider / Delete actions

---

## Hours 10–14: Voice Channel

### Backend
- [ ] FastAPI WebSocket endpoint: /ws/voice — accepts client WebSocket connection
- [ ] OpenAI Realtime API proxy: backend connects to wss://api.openai.com/v1/realtime as a client, relays audio chunks bidirectionally
- [ ] Realtime API session configuration: model=gpt-4o-realtime-preview, tools=8-verb vocabulary (same schema as text compilation path)
- [ ] Tool call routing: when Realtime API emits a tool call (e.g., create_node), route result to canvas service → write to Supabase → push update via SSE
- [ ] Voice-originated events logged in events table with input_modality='voice'
- [ ] Test: say "create a node called test" → verify create_node tool call fires → verify node appears in canvas
- [ ] Test all 12 verbs via voice — each must produce the correct tool call
- [ ] Realtime API session timeout handling: re-establish connection on disconnect; restore session context

### Frontend
- [ ] Web Audio API mic capture: getUserMedia({ audio: true }), AudioContext, MediaStreamSource
- [ ] WebSocket connection to /ws/voice using VITE_WS_BASE_URL
- [ ] Audio streaming: ScriptProcessor or AudioWorklet → encode → ws.send(audioChunk)
- [ ] Voice transcript display: real-time transcript of what the AI heard, shown below the canvas
- [ ] Voice active indicator: microphone icon in Status Pill area; animates while listening
- [ ] Voice reconnect handling: auto-reconnect on WebSocket close with status update
- [ ] Impact Halo: on assumption hover, pulse all nodes in impact_nodes array amber simultaneously (target: < 100ms)

---

## Hours 14–18: Memory System

### Backend
- [ ] Memory CRUD endpoints: GET, POST, PUT, DELETE /api/canvas/{id}/memory (Supabase queries)
- [ ] Tier 2 quarantine enforcement: quarantined=TRUE items excluded from all LLM context assembly until ratified
- [ ] POST /api/canvas/{id}/memory/{id}/ratify: set quarantined=FALSE, update tier
- [ ] Memory Negotiation Card trigger: GPT-4o-mini watches session events, fires when same preference appears 2+ times
- [ ] propose_memory tool call: inserts Tier 2 memory with quarantined=TRUE into Supabase
- [ ] Context assembly service: assembles LLM context in priority order (Mode prompt → Tier 0 → Tier 1 → Tier 3 → canvas state; Tier 2 NEVER included regardless of quarantine status)
- [ ] Session Memory Audit: GPT-4o-mini summarizes session events → returns inference list
- [ ] POST /api/canvas/{id}/audit: processes {memory_id, action: accept|reject|edit} array
- [ ] Workspace Modes: 4 system prompt variants; mode stored in canvases table; restored on canvas open

### Frontend
- [ ] Memory Panel: left-side slide-out, 4-tab view (Core / Session / Pending / Source), search bar, inline actions
- [ ] Pending tab banner: "These have not influenced any response yet. Review before accepting."
- [ ] Memory Negotiation Card UI: dismissible card with 4 scope options, explains what the AI observed
- [ ] Session Memory Audit card: per-item Accept / Reject / Edit at canvas close
- [ ] Inline Scope Chip component: cycles Session / Workspace / Global on click with animation
- [ ] Mode Selector onboarding: full-screen on first use, 4 modes with one-line descriptions
- [ ] Mode indicator in canvas header: active mode name always visible
- [ ] Mode switching: show one-line description on switch

---

## Hours 18–22: Branch, Compare, Incognito, Controls

### Backend
- [ ] POST /api/canvas/{id}/branch: fork canvas state in Supabase (duplicate all node rows with new branch_id)
- [ ] GET /api/canvas/{id}/branches: list all branches with status
- [ ] Incognito Mode flag: stored in canvases table, prevents any memory writes during session
- [ ] Workspace Modes: mode stored on canvas row; 4 system prompt variants loaded at context assembly time

### Frontend
- [ ] Branch creation: verb triggers branch in backend, adds tab to Branch Rail
- [ ] Compare Mode: side-by-side split view, two branches simultaneously, delta nodes in amber
- [ ] Incognito Mode: dark chrome border, "Incognito" badge in header, Session Audit skipped on close
- [ ] Pause / Stop controls: halt SSE stream mid-compilation; canvas shows partial nodes on Pause; revert on Stop
- [ ] Keyboard shortcuts: B=Branch, M=Merge, C=Compare, T=Trace, P=Pin, Esc=dismiss any panel

---

## Hours 22–26: Export and Ingestion

### Backend
- [ ] Celery task: heavy PDF ingestion (> 5 pages) offloaded to worker; progress sent via SSE
- [ ] Supabase Storage: upload dropped files to kleos-artifacts bucket; retrieve with presigned URLs
- [ ] Markdown export: template rendering from canvas data model
- [ ] PDF export: pyppeteer Celery task (primary); pdfkit fallback if Chromium unavailable; upload generated PDF to Supabase Storage
- [ ] GET /api/canvas/{id}/export: JSON export of full canvas data model
- [ ] DOCX ingestion: python-docx text extraction → GPT-4o structured extraction

### Frontend
- [ ] Export dialog: format selector (Markdown / PDF), export type selector (Full / Decision Summary / Research Notes)
- [ ] Loading state for PDF export (show progress bar; poll for Celery task completion)
- [ ] Onboarding suggestion chips: appear on empty canvas; disappear when first node is added; include "Say something" voice chip
- [ ] Empty state designs: Assumption Audit Panel ("No assumptions detected yet. Speak or drop content to begin."), Memory Panel ("No memories stored yet. Kleos will only remember what you approve.")

---

## Hours 26–32: Demo Preparation

- [ ] Write fixture generation script: src/backend/fixtures/generate_fixtures.py
- [ ] Pre-cache all scripted demo beat LLM responses as JSON fixtures
- [ ] Verify DEMO_MODE=true routes all scripted beats to fixtures
- [ ] Populate pre-demo canvas state: 4 nodes on "AI startup product strategy for Indian market" (set as if from a prior voice session)
- [ ] Populate Memory Panel: 3 Core Memories (voice-origin), 1 Inferred (pending) memory
- [ ] Stage PDF: synthetic competitor analysis, ready to drop
- [ ] Voice channel smoke test: say "branch on the cost assumption" → verify Branch 2 appears in Branch Rail
- [ ] Full demo rehearsal: run the 7-minute script end-to-end
- [ ] Error state testing: verify all API failure states show correct inline errors
- [ ] Verify Impact Halo response time: target < 100ms
- [ ] Verify voice-to-canvas latency: target < 5s

---

## Hours 32–42: Polish and Hardening

- [ ] UI animation smoothing: Status Pill transitions, scope chip cycles, card appearances, voice active indicator
- [ ] Reasoning Ribbon step click: expand to show specific evidence
- [ ] Contradiction flag hover text: "These cannot both be true. [Node A] says X, [Node B] says Y."
- [ ] Source Filter toolbar: dims all nodes except selected source type
- [ ] Voice transcript styling: clean, readable, ephemeral — not cluttering the canvas
- [ ] Voice error state: microphone permission denied → clear guidance; WebSocket disconnect → "Voice reconnecting..."
- [ ] Edge case: canvas never blank mid-demo (verify fallback to pre-cached nodes on compilation failure)
- [ ] Browser-specific testing: Chrome primary
- [ ] Export time verification: PDF < 8s; Markdown < 1s
- [ ] Memory Panel load verification: < 300ms
- [ ] Branch comparison render verification: < 1s
- [ ] Voice-to-canvas latency verification: < 5s end-to-end

---

## Hours 42–48: Buffer and Final Recording

- [ ] Final full-run demo rehearsal (voice-first run: no keyboard/mouse input for first 60 seconds)
- [ ] Demo recording (for submission artifact)
- [ ] Trust Lens Toggle (B4) implementation — only if time permits
- [ ] README and documentation final review
- [ ] Git: clean commit history, tag release

---

*Instructions: Mark tasks [/] when starting, [x] when complete. For deferred tasks, add [deferred: reason and hour]. This file is the primary coordination tool during the build — keep it open alongside the code editor.*
