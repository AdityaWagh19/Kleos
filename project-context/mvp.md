# MVP Scope

**Kleos** — Hackathon Build Plan
**Format:** 48 hours | 2-person team (one frontend, one backend)

---

## Team Assumption

**This build plan assumes a 2-person team:** one developer primarily on frontend (Canvas, panels, UI components) and one on backend (FastAPI, LLM integration, memory service, ingestion pipeline).

**Solo developer scope:** Drop Compare Mode, Quick Override, and the Thinking Timeline from the hackathon scope. The PS01/PS06 demonstration remains complete without these three features.

---

## What Must Be Built for a Credible Demo

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
| B3. Provenance Badges (5 types) | Minimum source attribution on every node |
| B7. Contradiction Flag (basic: red edge + hover text) | PS01 requires visible contradictions |

### Canvas and Workspace MVP

| Feature | Why It Is MVP |
|---|---|
| Workspace Modes (all 4, system prompt variants) | Configures reasoning posture and demo narrative |
| C1. Core Canvas (react-flow, node rendering, cluster backgrounds) | The product runs on this |
| C2. Status Pill + per-element micro-interactions | Ambient AI state communication |
| C4. Compare Mode (basic side-by-side) | The parallel exploration story must be demo-able |
| D2. Pause / Stop Controls | Basic human oversight |
| Multimodal Drop (PDF + text + DOCX) | Without Drop, the canvas cannot be populated |
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
| C5. Voice Input | Nice to Have | 6–8 hour integration risk vs. marginal demo benefit |
| C7. Quick Override | Differentiator | Adds polish; not required for basic mode demo |
| D3. Activity Log | Differentiator | Important for auditability; not required for demo |
| A5. Memory Freshness Indicators | Differentiator | Adds detail; not required for MVP |
| PPTX, CSV inputs | Should Have | Adds persona coverage; not in demo script |
| JSON export | Implemented but hidden | Available in Settings; not in primary export UI |

---

## 48-Hour Build Order

| Hours | Who | Focus |
|---|---|---|
| 0–3 | Both | Data model design, SQLite schema (4-tier memory + events tables), FastAPI skeleton, react-flow canvas shell |
| 3–6 | BE | GPT-4o integration: Drop PDF → structured output → typed node objects with provenance |
| 3–6 | FE | Node rendering (8 types), provenance badge icons, cluster backgrounds, Branch Rail stub |
| 6–10 | BE | Reasoning Ribbon SSE streaming; Contradiction detection (GPT-4o-mini) |
| 6–10 | FE | Reasoning Ribbon component, Status Pill, Assumption Audit Panel (list view) |
| 10–14 | BE | Memory tier tables (SQLite), Negotiation Card trigger (GPT-4o-mini), Scope chip data model |
| 10–14 | FE | Impact Halo (hover query on pre-computed impact_nodes), Memory Panel (flat list, 4 tabs) |
| 14–18 | BE | Session Memory Audit flow, Workspace Modes (4 system prompt variants) |
| 14–18 | FE | Memory Negotiation Card UI, Scope Chip inline component, Mode Selector onboarding |
| 18–22 | Both | Branch creation, Compare Mode (side-by-side split), Incognito Mode, Pause/Stop controls |
| 22–26 | BE | Export (Markdown template render + puppeteer PDF); DOCX ingestion (python-docx) |
| 22–26 | FE | Export UI (dialog + format selector), onboarding suggestion chips, empty states |
| 26–32 | Both | Demo script rehearsal; pre-caching all LLM responses for scripted beats; error state handling |
| 32–40 | Both | UI polish, animation smoothing, keyboard shortcuts (B/M/C/T/Esc/P), edge case hardening |
| 40–48 | Both | Buffer for breakage; final demo recording; Trust Lens if time remains |

---

## Dependency Order

The following must exist before the listed features can be built:

| Dependency | Unlocks |
|---|---|
| SQLite schema + FastAPI skeleton | All backend features |
| react-flow canvas shell + node rendering | All frontend features |
| GPT-4o Drop integration | Reasoning Ribbon, Assumption Audit, Provenance Badges, Contradiction Flag |
| Node data model with `impact_nodes` field | Impact Halo |
| Memory tier tables | Memory Panel, Negotiation Card, Session Audit, Scope Chips |
| Branch creation | Compare Mode, Counterfactual Branches |
| Event Log table | Thinking Timeline, Activity Log, Rewind |
| Export (Markdown) | Export (PDF) |

---

## Demo Data Setup

**Pre-populated canvas:** 4 nodes from a previous session on "AI startup product strategy for the Indian market."

**Memory Panel:** 3 Core Memories pre-loaded, 1 Inferred (pending) memory pre-loaded.

**Queued PDF:** One competitor analysis PDF (synthetic/fictional content) ready to drop.

**Pre-caching:** All LLM responses for scripted demo beats stored as JSON fixtures in `/demo/fixtures/`. Zero live API calls during scripted beats. Live calls used only for judge Q&A, with exponential backoff.

**Demo dataset:** All content is synthetic and clearly fictional. Client in demo: "Prism AI — fictional SaaS startup."

---

*Reference: Kleos_Master_Document.md — Section 25*
