# MVP Scope

**Kleos** — Hackathon Build Plan
**Format:** 48 hours
---

## Team Assumption

**This build plan assumes a 4-person team:** two developers primarily on frontend (Canvas, panels, UI components, voice UI, animations) and two on backend (FastAPI, LLM orchestration, memory service, voice proxy, ingestion pipelines).

**Solo or 2-person scope:** Drop Compare Mode, Quick Override, Thinking Timeline, Counterfactual Branches, and Reasoning Path Walk to ensure core stability.

---

## What Must Be Built for a Credible Demo

### Core Input Modalities

| Feature | Why It Is MVP |
|---|---|
| C5. Voice Input (Realtime API) & Text Chat | Voice and text chat are **simultaneous, parallel primary input channels**. Neither is a fallback. All 12 verbs are addressable via both channels at any time. |
| WebSocket proxy (/ws/voice) | Backend infrastructure for the real-time voice channel |
| Web Audio API mic capture | Frontend infrastructure for the voice channel |
| Input multiplexing | Canvas service handles voice tool calls and text tool calls identically |

### PS06 MVP — Memory Negotiation

| Feature | Why It Is MVP |
|---|---|
| A1. Four-Tier Memory Architecture | The backbone — without tiers there is nothing to negotiate |
| A2. Memory Negotiation Card | The core PS06 moment — consent before storage |
| A3. Memory Panel (flat list, 4 tabs) | Makes memory visible — the minimum for "negotiating" |
| A4. Memory CRUD (edit / archive) | Trust — users must be able to correct the AI |
| A5. Memory Freshness Indicators | Age badges and staleness flags (restored for 4-person team) |
| A6. Session Memory Audit | The closing PS06 moment — explicit per-item consent at session end |
| A7. Inline Scope Chips | Lowest-friction in-canvas memory control |
| D1. Incognito Mode | Simple, high-trust signal for PS06 |
| D3. Activity Log | Important for governance and auditability (restored for 4-person team) |

### PS01 MVP — Explainable AI Reasoning

| Feature | Why It Is MVP |
|---|---|
| B1. Reasoning Ribbon | The most dramatic PS01 moment — watching the AI think |
| B2. Assumption Audit Panel (with Impact Halo) | The core PS01 interaction — override an assumption, watch the canvas change |
| B3. Provenance Badges (5 types + voice_input) | Minimum source attribution on every node |
| B4. Trust Lens Toggle | Confidence topology overlay (restored for 4-person team) |
| B5. Counterfactual Branches | "What if I remove this?" subgraph recompilation (restored for 4-person team) |
| B6. Reasoning Path Walk | Step-through guided mode (restored for 4-person team) |
| B7. Contradiction Flag (basic: red edge + hover text) | PS01 requires visible contradictions |

### Canvas and Workspace MVP

| Feature | Why It Is MVP |
|---|---|
| Workspace Modes (all 4, system prompt variants) | Configures reasoning posture and demo narrative |
| C1. Core Canvas (react-flow, node rendering, cluster backgrounds) | The product runs on this |
| C2. Status Pill + per-element micro-interactions | Ambient AI state communication |
| C3. Thinking Timeline | Rewind/forward interaction (restored for 4-person team) |
| C4. Compare Mode (basic side-by-side) | The parallel exploration story must be demo-able |
| C7. Quick Override | Per-cluster reasoning mode override (restored for 4-person team) |
| D2. Pause / Stop Controls | Basic human oversight |
| Multimodal Drop (PDF + text + DOCX) | Drop supplements voice for document-heavy workflows |
| Onboarding (Mode Selector + suggestion chips) | Without onboarding, judges cannot start |
| Export (Markdown + PDF) | Tangible output to end the demo |

---

## What Is Not MVP

| Feature | Moved To | Reason |
|---|---|---|
| PPTX, CSV inputs | Should Have | Adds persona coverage; not in demo script |
| JSON export | Implemented but hidden | Available in Settings; not in primary export UI |
| text-embedding-3-small | V1 | Not needed at hackathon scale — full canvas fits in GPT-4o context window |

---

## 48-Hour Build Order

| Hours | Who | Focus |
|---|---|---|
| 0–3 | All 4 | Project split: FE1/FE2 (Canvas/State), BE1/BE2 (DB/AI). Supabase/Redis setup, FastAPI skeleton, react-flow shell. |
| 3–6 | BE1/2 | GPT-4o integration, DB schemas (events, memory), WebSocket proxy skeleton. |
| 3–6 | FE1/2 | Node rendering, Trust Lens overlay stub, Reasoning Ribbon UI. |
| 6–10 | BE1/2 | Reasoning Ribbon SSE; Contradiction detection; Activity Log and Timeline API. |
| 6–10 | FE1/2 | Activity Log overlay, Thinking Timeline UI, Assumption Audit panel. |
| 10–14 | BE1/2 | Realtime API WebSocket integration; Voice/Chat multiplexing; Counterfactual subgraph recompile. |
| 10–14 | FE1/2 | Mic capture + text chat input bar; Status Pill (Listening/Working/Ready); Impact Halo. |
| 14–18 | BE1/2 | Memory tiers, Session Audit flow, Freshness calculations, Quick Override data model. |
| 14–18 | FE1/2 | Memory Panel, Negotiation Card UI, Scope Chips, Quick Override UI. |
| 18–22 | BE1/2 | Workspace Modes, Reasoning Path Walk logic, Celery for PDF. |
| 18–22 | FE1/2 | Mode Selector, Path Walk UI (dimming/stepping), Branch creation UI. |
| 22–26 | All 4 | Branch creation backend, Compare Mode, Incognito Mode, Pause/Stop. |
| 26–30 | All 4 | Export (Markdown+PDF), DOCX ingest, Empty states, Error state hardening. |
| 30–36 | All 4 | Demo script rehearsal; pre-caching fixtures; end-to-end integration testing. |
| 36–42 | FE1/2 | UI polish, animations, keyboard shortcuts, edge case hardening. |
| 42–48 | All 4 | Final demo recording, documentation updates. |

---

## Dependency Order

| Dependency | Unlocks |
|---|---|
| Supabase schema + FastAPI skeleton + Redis Cloud connection | All backend features |
| react-flow canvas shell + node rendering | All frontend features |
| GPT-4o Drop integration | Reasoning Ribbon, Assumption Audit, Provenance Badges, Contradiction Flag |
| Node data model with `impact_nodes` field | Impact Halo |
| Realtime API WebSocket proxy | All voice-input features |
| Web Audio API mic capture | Voice frontend features |
| Memory tier tables (Supabase) | Memory Panel, Negotiation Card, Session Audit, Scope Chips |
| Branch creation | Compare Mode, Counterfactual Branches |
| Event Log table | Thinking Timeline, Activity Log, Rewind |
| Export (Markdown) | Export (PDF) |
| Celery worker setup | Reliable large-document ingestion |

---

## Demo Data Setup

**Pre-populated canvas:** 4 nodes from a previous voice session on "AI startup product strategy for the Indian market."

**Memory Panel:** 3 Core Memories pre-loaded (set by voice in a prior session), 1 Inferred (pending) memory pre-loaded.

**Queued PDF:** One competitor analysis PDF (synthetic/fictional content) ready to drop.

**Pre-caching:** All LLM responses for scripted demo beats stored as JSON fixtures in `src/backend/fixtures/`. Zero live API calls during scripted beats. Live calls used only for judge Q&A.

**Demo dataset:** All content is synthetic and clearly fictional. Client in demo: "Prism AI — fictional SaaS startup."

---

*Reference: Kleos_Master_Document.md — Section 25*
