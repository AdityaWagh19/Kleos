# MVP Scope

**Kleos** — Hackathon Build Plan
**Format:** 48 hours | 2-person team (one frontend, one backend)

---

## Team Assumption

**This build plan assumes a 2-person team:** one developer primarily on frontend (Canvas, panels, UI components, voice UI) and one on backend (FastAPI, LLM integration, memory service, voice proxy, ingestion pipeline).

**Solo developer scope:** Drop Compare Mode, Quick Override, and the Thinking Timeline. Voice implementation may be deferred to Hours 14–18 in a solo build.

---

## What Must Be Built for a Credible Demo

### Voice (Core — Primary Input Channel)

| Feature | Why It Is MVP |
|---|---|
| C5. Voice Input (Realtime API) | Voice is the primary input channel. Chat is the fallback. All 12 verbs must be voice-addressable. This is not a nice-to-have — it is the product's first principle. |
| WebSocket proxy (/ws/voice) | Backend infrastructure for the voice channel |
| Web Audio API mic capture | Frontend infrastructure for the voice channel |
| Voice transcript display | User must see what the AI heard before it acts |

### PS06 MVP — Memory Negotiation

| Feature | Why It Is MVP |
|---|---|
| A1. Four-Tier Memory Architecture | The backbone — without tiers there is nothing to negotiate |
| A2. Memory Negotiation Card | The core PS06 moment — consent before storage |
| A3. Memory Panel (flat list, 4 tabs) | Makes memory visible — the minimum for "negotiating" |
| A4. Memory CRUD (edit / archive) | Trust — users must be able to correct the AI |
| A6. Session Memory Audit | The closing PS06 moment — explicit per-item consent at session end |
| A7. Inline Scope Chips | Lowest-friction in-canvas memory control |
| D1. Incognito Mode | Simple, high-trust signal for PS06 |

### PS01 MVP — Explainable AI Reasoning

| Feature | Why It Is MVP |
|---|---|
| B1. Reasoning Ribbon | The most dramatic PS01 moment — watching the AI think |
| B2. Assumption Audit Panel (with Impact Halo) | The core PS01 interaction — override an assumption, watch the canvas change |
| B3. Provenance Badges (5 types + voice_input) | Minimum source attribution on every node |
| B7. Contradiction Flag (basic: red edge + hover text) | PS01 requires visible contradictions |

### Canvas and Workspace MVP

| Feature | Why It Is MVP |
|---|---|
| Workspace Modes (all 4, system prompt variants) | Configures reasoning posture and demo narrative |
| C1. Core Canvas (react-flow, node rendering, cluster backgrounds) | The product runs on this |
| C2. Status Pill + per-element micro-interactions | Ambient AI state communication |
| C4. Compare Mode (basic side-by-side) | The parallel exploration story must be demo-able |
| D2. Pause / Stop Controls | Basic human oversight |
| Multimodal Drop (PDF + text + DOCX) | Drop supplements voice for document-heavy workflows |
| Onboarding (Mode Selector + suggestion chips) | Without onboarding, judges cannot start |
| Export (Markdown + PDF) | Tangible output to end the demo |

---

## What Is Not MVP

| Feature | Moved To | Reason |
|---|---|---|
| B4. Trust Lens Toggle | Differentiator | Important XAI feature but not required for the 3 WOW moments |
| B5. Counterfactual Branches | Differentiator | Requires subgraph recompile; high engineering cost |
| B6. Reasoning Path Walk | Differentiator | Extends Trace verb; high value but post-MVP |
| C3. Thinking Timeline | Differentiator | Requires event logging from the start; defer if time constrained |
| C7. Quick Override | Differentiator | Adds polish; not required for basic mode demo |
| D3. Activity Log | Differentiator | Important for auditability; not required for demo |
| A5. Memory Freshness Indicators | Differentiator | Adds detail; not required for MVP |
| PPTX, CSV inputs | Should Have | Adds persona coverage; not in demo script |
| JSON export | Implemented but hidden | Available in Settings; not in primary export UI |
| text-embedding-3-small | V1 | Not needed at hackathon scale — full canvas fits in GPT-4o context window |

---

## 48-Hour Build Order

| Hours | Who | Focus |
|---|---|---|
| 0–3 | Both | Supabase project setup, schema migrations (4-tier memory + events tables), FastAPI skeleton, react-flow canvas shell, Redis Cloud connection |
| 3–6 | BE | GPT-4o integration: Drop PDF → structured output → typed node objects with provenance |
| 3–6 | FE | Node rendering (8 types), provenance badge icons, cluster backgrounds, Branch Rail stub |
| 6–10 | BE | Reasoning Ribbon SSE streaming; Contradiction detection (GPT-4o-mini) |
| 6–10 | FE | Reasoning Ribbon component, Status Pill, Assumption Audit Panel (list view) |
| 10–14 | BE | OpenAI Realtime API WebSocket proxy (/ws/voice); voice tool calling integration; test all 12 verbs via voice |
| 10–14 | FE | Web Audio API mic capture; WebSocket client for /ws/voice; voice transcript display; voice active indicator in Status Pill |
| 14–18 | BE | Memory tier tables (Supabase), Negotiation Card trigger (GPT-4o-mini), Scope chip data model, Session Audit flow |
| 14–18 | FE | Impact Halo (hover on pre-computed impact_nodes), Memory Panel (4 tabs), Memory Negotiation Card UI, Scope Chips |
| 18–22 | BE | Workspace Modes (4 system prompt variants), Mode storage, Celery worker setup for PDF ingestion |
| 18–22 | FE | Mode Selector onboarding, mode header indicator, Mode switching description |
| 22–26 | Both | Branch creation, Compare Mode (side-by-side split), Incognito Mode, Pause/Stop controls |
| 26–30 | BE | Export (Markdown + pyppeteer PDF), DOCX ingestion, Supabase Storage for file uploads |
| 26–30 | FE | Export dialog (format + type selector), onboarding suggestion chips, empty states |
| 30–36 | Both | Demo script rehearsal; pre-caching all LLM responses for scripted beats; error state hardening |
| 36–42 | Both | UI polish, animation smoothing, keyboard shortcuts (B/M/C/T/Esc/P), edge case hardening |
| 42–48 | Both | Buffer for breakage; final demo recording; Trust Lens if time remains |

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
