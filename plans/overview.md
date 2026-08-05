# Kleos — Implementation Plans Overview

**Project:** Kleos — Post-Chat AI Interface for Structured Thinking Work
**Hackathon:** Human-Centred Design of LLM Interfaces | IIIT Pune x IIT Bombay ACM SIGCHI
**Build Window:** 48 hours | 4-person team (FE1, FE2, BE1, BE2)
**Generated from:** Fully audited project-context/ documentation

---

## Phase Breakdown Rationale

The 9 phases follow a strict dependency chain. Each phase ends with a **working, testable system** — no big-bang integration. The ordering is optimized for three goals:

1. **Fail early on high-risk integrations.** Voice channel (WebSocket proxy to OpenAI Realtime API) and SSE streaming are technically uncertain — they are placed in Phases 3–4, not the end.
2. **Deliver demo-critical paths first.** The three WOW moments (Impact Halo, Memory Negotiation Card, Session Memory Audit) are all live by Phase 5.
3. **Advance features only unlock after core stability.** Counterfactuals, Path Walk, Timeline (Phase 8) require Branch infrastructure (Phase 6) and Canvas AI (Phase 2) to be stable first.

---

## Dependency Graph

```
Phase 1: Foundation
  └── Phase 2: Canvas + AI Drop
        ├── Phase 3: Reasoning + Contradiction
        │     └── Phase 4: Voice Channel
        └── Phase 5: Memory System
              └── Phase 6: Branch + Compare + Governance
                    └── Phase 7: Export + Ingestion + Demo Prep
                          └── Phase 8: Advanced Features
                                └── Phase 9: Polish + QA
```

**Critical path for demo:** Phase 1 → 2 → 3 → 4 (voice smoke test) → 5 → 6 → 7 (fixtures + DEMO_MODE)

---

## Phase Mapping

| Phase | Name | Hours | Team | Unlocks |
|---|---|---|---|---|
| 1 | Foundation | 0–3 | All 4 | Everything |
| 2 | Canvas + AI Drop | 3–6 | FE1/2 + BE1/2 | Ribbon, Memory, Voice |
| 3 | Reasoning + Contradiction | 6–10 | FE1/2 + BE1/2 | Voice, Assumption Audit |
| 4 | Voice Channel | 10–14 | FE1 + BE1 | Impact Halo, all voice features |
| 5 | Memory System | 14–18 | FE2 + BE2 | Branch, Session Audit |
| 6 | Branch + Compare + Governance | 18–22 | All 4 | Counterfactuals, Compare |
| 7 | Export + Ingestion + Demo Prep | 22–32 | All 4 | Demo stability |
| 8 | Advanced Features | 32–42 | All 4 | Full feature parity |
| 9 | Polish + QA | 42–48 | All 4 | Demo-ready |

---

## Implementation Order (Strict)

### Phase 1 — Foundation (Hours 0–3)
`FastAPI skeleton` → `CORS middleware` → `Supabase schema migrations` → `Redis connection` → `Celery app` → `Environment loading` → `Health check endpoint` → `Vite + React + TypeScript scaffold` → `Tailwind design tokens (design.md)` → `react-flow canvas shell` → `TypeScript type definitions`

### Phase 2 — Canvas + AI Drop (Hours 3–6)
`OpenAI SDK integration (GPT-4o structured output)` → `POST /api/canvas/{id}/drop (PDF → text → compile)` → `Structured output schema validation` → `impact_nodes pre-computation` → `Node data model (8 types)` → `Node renderers (all 8, design.md styled)` → `Provenance badge component (6 types)` → `Cluster background rendering` → `Branch Rail stub (single "main" tab)`

### Phase 3 — Reasoning + Contradiction (Hours 6–10)
`SSE streaming endpoint (/api/canvas/{id}/stream)` → `GPT-4o streaming test (prototype in first 2 hours)` → `Fallback decision (2-call vs 1-call)` → `Reasoning Ribbon component (SSE consumer)` → `Status Pill (3-state: Working/Listening/Ready)` → `GPT-4o-mini contradiction detection` → `flag_contradiction tool call + red edge` → `Assumption Audit Panel (right drawer, no Impact Halo yet)`

### Phase 4 — Voice Channel (Hours 10–14)
`FastAPI WebSocket /ws/voice` → `OpenAI Realtime API bidirectional proxy` → `Realtime API session config (8-tool vocab)` → `Tool call routing → canvas service → SSE` → `voice_command_received Event Log entries` → `Web Audio API mic capture (frontend)` → `Voice transcript display (below canvas)` → `Status Pill Listening state (lime mic icon)` → `Impact Halo (now that impact_nodes are proven)` → `Voice reconnect handling` → `Test all 12 verbs`

### Phase 5 — Memory System (Hours 14–18)
`Memory CRUD endpoints (GET/POST/PUT/DELETE/ratify)` → `Tier 2 quarantine enforcement (DB query layer)` → `Context assembly service (priority order)` → `GPT-4o-mini Memory Negotiation Card trigger` → `propose_memory tool call → Tier 2 insert` → `Session Memory Audit endpoint (POST /audit)` → `Workspace Modes (4 system prompts)` → `Memory Panel (left slide-out, 4 tabs)` → `Memory Negotiation Card UI` → `Session Memory Audit card UI` → `Inline Scope Chips` → `Mode Selector (full-screen onboarding)` → `Mode indicator (header)` → `Incognito Mode flag`

### Phase 6 — Branch + Compare + Governance (Hours 18–22)
`POST /api/canvas/{id}/branch (fork node rows)` → `GET /api/canvas/{id}/branches` → `Branch Rail (tabs, Compare action, Commit action)` → `Branch creation verb UI` → `Compare Mode (side-by-side, delta amber highlights)` → `Pause/Stop controls (SSE stream control)` → `Keyboard shortcuts (B/M/C/T/P/Esc)` → `Incognito Mode UI (dark chrome border + badge)`

### Phase 7 — Export + Ingestion + Demo Prep (Hours 22–32)
`Celery task (heavy PDF ingestion >5 pages)` → `Supabase Storage (kleos-artifacts bucket)` → `DOCX ingestion (python-docx)` → `Markdown export (3 types)` → `pyppeteer PDF export Celery task` → `pdfkit fallback check` → `GET /api/canvas/{id}/export (JSON)` → `Export dialog UI (format + type selector)` → `Fixture generation script (generate_fixtures.py)` → `DEMO_MODE routing` → `Pre-populated demo canvas (4 nodes)` → `Pre-populated Memory Panel (3 Core + 1 Inferred)` → `Full demo rehearsal`

### Phase 8 — Advanced Features (Hours 32–42)
`Memory Freshness Indicators (age badges, staleness flags)` → `Counterfactual Branches (subgraph recompile, amber diff)` → `Reasoning Path Walk (canvas dim, step-through narration, feedback prompt)` → `Thinking Timeline (hidden toggle, scrubber, Rewind verb)` → `Quick Override (per-cluster mode, badge)` → `Activity Log (read-only overlay)` → `Trust Lens Toggle (only if all other features stable — buffer)`

### Phase 9 — Polish + QA (Hours 42–48)
`Framer Motion animations (Status Pill, Scope Chip, card appearances)` → `Empty state designs (Assumption Audit, Memory Panel)` → `Error state hardening (inline errors + [Retry])` → `Suggestion chips (4 chips including "Say something")` → `Onboarding returning-user flow` → `Source Filter toolbar` → `Voice transcript styling` → `Performance verification (all 6 targets)` → `All 24 test sections` → `Chrome browser testing` → `Final demo rehearsal (voice-first 60 seconds)` → `Git clean commit + tag release`

---

## Frontend Architecture Decisions

### Canvas Library: react-flow v11

**Rationale:** react-flow v11 is open-source, battle-tested, and specified in architecture.md. JointJS+ (used in the reference demo) is a premium paid library. JointJS patterns are adapted, not copied:

| JointJS+ Pattern | Kleos Adaptation |
|---|---|
| Declarative node catalog (`node-catalog.ts`) | Node type registry (`src/frontend/src/canvas/node-registry.ts`) |
| Controlled `cells` state | react-flow `nodes` + `edges` state arrays |
| Port system | react-flow built-in handles for edge connections |
| Stencil drag-and-drop | `dnd-kit` for sidebar→canvas drag interactions |
| Inspector panel | Assumption Audit Panel + Memory Panel (same side-panel pattern) |
| History/undo | Event Log table + Rewind verb |

### UI Libraries
- **Tailwind CSS v4** — styled from design.md `@theme` block (`src/frontend/src/styles/theme.css`)
- **Framer Motion** — Status Pill transitions, Scope Chip cycles, card entrances, Impact Halo pulse
- **dnd-kit** — Drag files/text from a side panel onto the canvas (Drop verb)
- **Google Material Symbols** — All icons (not Material Design 2 — use the variable font version)

### Design System Source of Truth
`project-context/design.md` is the single source of truth for all visual decisions. Key constraints:
- **Only one lime (`#e5ff5d`) element per viewport** — never more
- **4px radius on all buttons** — never pill-shaped
- **Carbon Black (`#111111`) canvas** — the canvas background is always #111111
- **Neue Haas Grotesk Text** as sole typeface (fallback: Inter, Soehne)
- **No shadows** except the Citrine Cube glow (`rgba(229,255,93,0.15) 0 0 40px`)
- **No photography, gradients (on non-cube elements), or second chromatic accent**

---

## Progress Tracking Guidelines

1. **Use `project-context/progress.md`** — update phase status as each phase completes.
2. **Use `project-context/tasks.md`** — mark `[ ]` → `[/]` (in progress) → `[x]` (complete).
3. **Never delete tasks** — mark deferred ones as `[deferred: reason and hour]`.
4. **Update `project-context/progress.md` Architecture Changes** table if any implementation deviates from plans.
5. **Update `project-context/progress.md` Performance Measurements** table with actual measured values.

A phase is complete **only when all acceptance criteria in its plan file are satisfied.** Partial completion does not count.

---

## File Index

### Plans
| File | Phase | Hours | Primary Focus |
|---|---|---|---|
| `plans/overview.md` | — | — | This file |
| `plans/phase-1-foundation.md` | 1 | 0–3 | Scaffold, DB, Redis, Canvas shell |
| `plans/phase-2-canvas-and-ai-drop.md` | 2 | 3–6 | GPT-4o, node types, badges |
| `plans/phase-3-reasoning-and-contradiction.md` | 3 | 6–10 | SSE, Ribbon, Contradiction, Audit Panel |
| `plans/phase-4-voice-channel.md` | 4 | 10–14 | Realtime API proxy, Web Audio, Impact Halo |
| `plans/phase-5-memory-system.md` | 5 | 14–18 | Memory CRUD, Panel, Negotiation, Audit |
| `plans/phase-6-branch-compare-governance.md` | 6 | 18–22 | Branches, Compare Mode, Pause/Stop |
| `plans/phase-7-export-ingestion-demo.md` | 7 | 22–32 | Export, Celery, Fixtures, Demo Prep |
| `plans/phase-8-advanced-features.md` | 8 | 32–42 | Freshness, Counterfactuals, Path Walk, Timeline |
| `plans/phase-9-polish-and-qa.md` | 9 | 42–48 | Animations, QA, Performance, Demo rehearsal |

### Source Files (Created During Implementation)

**Frontend (`src/frontend/src/`)**
```
canvas/
  node-registry.ts          # Declarative node type catalog
  KleosCanvas.tsx           # react-flow wrapper
  nodes/
    IdeaNode.tsx
    EvidenceNode.tsx
    AssumptionNode.tsx
    QuestionNode.tsx
    ConstraintNode.tsx
    InsightNode.tsx
    DecisionNode.tsx
    SourceNode.tsx
  edges/
    KleosEdge.tsx           # Typed relationship edge
  clusters/
    ClusterBackground.tsx
components/
  ProvenanceBadge.tsx       # 6 types
  ConfidenceBar.tsx
  ScopeChip.tsx
  StatusPill.tsx            # 3-state
  ReasoningRibbon.tsx       # SSE consumer
  BranchRail.tsx
  VoiceTranscript.tsx
panels/
  MemoryPanel.tsx           # Left slide-out, 4 tabs
  AssumptionAuditPanel.tsx  # Right drawer
  ActivityLog.tsx
  ThinkingTimeline.tsx
cards/
  MemoryNegotiationCard.tsx
  SessionMemoryAuditCard.tsx
  ExportDialog.tsx
onboarding/
  ModeSelector.tsx
  SuggestionChips.tsx
hooks/
  useSSE.ts                 # SSE consumer
  useVoice.ts               # Web Audio + WebSocket
  useCanvas.ts              # Canvas state management
  useMemory.ts              # Memory CRUD
services/
  api.ts                    # HTTP client
  ws.ts                     # WebSocket client
types/
  index.ts                  # All TypeScript types
styles/
  theme.css                 # Tailwind @theme block (design.md tokens)
  variables.css             # CSS custom properties
```

**Backend (`src/backend/`)**
```
main.py                     # FastAPI entry + CORS + routers
routers/
  canvas.py                 # Canvas CRUD, drop, export
  memory.py                 # Memory CRUD, ratify, audit
  health.py                 # Health check
ws/
  voice.py                  # /ws/voice WebSocket handler
services/
  canvas_service.py         # Core domain: node/edge mutations
  llm_service.py            # GPT-4o orchestration
  memory_service.py         # Memory lifecycle, context assembly
  ingestion_service.py      # PDF, DOCX, URL extraction
  export_service.py         # Markdown + JSON templates
  voice_service.py          # Realtime API proxy logic
workers/
  celery_app.py             # Celery initialization
  document_worker.py        # Heavy document processing
  pdf_export_worker.py      # pyppeteer PDF generation
db/
  supabase.py               # Supabase client wrapper
  queries.py                # Typed query helpers
cache/
  redis.py                  # Redis connection + helpers
fixtures/
  generate_fixtures.py      # Pre-cache demo LLM responses
  drop_pdf_result.json
  assumption_impact.json
  assumption_override.json
  memory_card_trigger.json
  tier2_quarantine_demo.json
  critical_mode_switch.json
  branch_creation.json
  compare_mode_diff.json
  session_audit.json
  export_decision_summary.md
```

---

## Overall Deliverables

At the end of all 9 phases, the following must exist and be verified:

### Functional Deliverables
- [ ] Working spatial canvas (react-flow, 8 node types, 6 provenance badges, cluster backgrounds)
- [ ] AI compilation of dropped documents (PDF, text, DOCX) → structured nodes via GPT-4o
- [ ] Real-time Reasoning Ribbon (SSE) narrating AI compilation steps
- [ ] Assumption Audit Panel with Impact Halo (< 100ms)
- [ ] Voice channel: Web Audio API → FastAPI WS → OpenAI Realtime API (all 12 verbs addressable)
- [ ] Four-tier memory architecture with Tier 2 quarantine enforcement
- [ ] Memory Negotiation Card (pre-storage consent)
- [ ] Session Memory Audit (per-item consent at canvas close)
- [ ] Memory Panel (4 tabs: Core/Session/Pending/Source)
- [ ] Inline Scope Chips ([Session]/[Workspace]/[Global])
- [ ] Workspace Modes (4 system prompt variants)
- [ ] Branch creation + Branch Rail
- [ ] Compare Mode (side-by-side diff)
- [ ] Incognito Mode (dark chrome border, no memory writes)
- [ ] Pause/Stop controls
- [ ] Markdown + PDF export (3 export types)
- [ ] DEMO_MODE fixture routing (zero live API calls during scripted beats)
- [ ] Pre-populated demo canvas + Memory Panel

### QA Deliverables
- [ ] All 24 test sections pass (project-context/test.md)
- [ ] Impact Halo response time < 100ms (measured)
- [ ] Reasoning Ribbon first token < 3s (measured)
- [ ] Voice-to-canvas latency < 5s (measured)
- [ ] Memory Panel load < 300ms (measured)
- [ ] Branch comparison render < 1s (measured)
- [ ] PDF export < 8s (measured)
- [ ] Redis query latency < 30ms (measured)

### Design Deliverables
- [ ] All components use design.md color tokens (Carbon Black canvas, Citrine Signal accent)
- [ ] Neue Haas Grotesk (or Inter fallback) applied system-wide
- [ ] 4px button radius everywhere; no pill-shaped buttons
- [ ] No shadow except Citrine Cube glow
- [ ] No second chromatic accent
- [ ] One lime element per viewport enforced
- [ ] Framer Motion animations on Status Pill, Scope Chip, card entrance, Impact Halo pulse

### Documentation Deliverables
- [ ] `project-context/progress.md` — all phases marked complete
- [ ] `project-context/progress.md` — performance measurements table filled
- [ ] `project-context/progress.md` — architecture changes recorded
- [ ] `project-context/tasks.md` — all tasks marked [x]
- [ ] Git: clean commit history, tagged release
