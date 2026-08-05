# Kleos

**A post-chat AI interface for structured thinking work.**

Ideas are typed graph nodes on a spatial canvas — not paragraphs in a conversation thread. The AI reasons out loud in real time. Memory is negotiated explicitly. Voice is the primary input.

Built for the **Human-Centred Design of LLM Interfaces** hackathon — IIIT Pune x IIT Bombay ACM SIGCHI — targeting PS01 (Visualizing Explainable AI Reasoning) and PS06 (Negotiating AI Memory).

---

## The Core Problem

Chat was the placeholder. It was never the right interface for thinking work.

Every new session discards the shape of everything previously reasoned. Assumptions are buried in prose. Contradictions go undetected. Memory happens silently in the background. Reasoning is post-hoc rationalization, not live narration.

Kleos is built around a different premise: **a semantic canvas that the AI actively maintains, where every object has provenance, every decision is traceable, and every memory item requires your consent before it influences a single response.**

---

## What Kleos Does

| Interaction | What Happens |
|---|---|
| Speak or type an idea | AI creates a typed graph node. Voice is the default input channel. |
| Drop a document, URL, or screenshot | AI compiles it into semantically typed, connected nodes with source attribution on every one |
| Hover an assumption | Every canvas node that depends on it pulses simultaneously — blast radius, visible instantly |
| Ask the AI to branch | Forks the entire canvas into a parallel reasoning stream; explore alternatives side by side |
| Session ends | AI shows exactly what it inferred during the session; you accept, reject, or edit each item |

---

## Three Core Principles

**1. Voice and Chat are simultaneous parallel channels.**
The OpenAI Realtime API handles voice input, while GPT-4o handles text chat. Both are primary channels. Neither is a fallback. All 12 interaction verbs are addressable via both channels at any time.

**2. Reasoning is always visible.**
Every AI compilation step is narrated in real time via the Reasoning Ribbon. Every assumption is listed and inspectable. Every node carries a provenance badge identifying its epistemic source.

**3. Memory is a negotiation, not a background process.**
Nothing is stored without explicit user consent. Inferred memories are quarantined from all LLM context until the user accepts them. The session closes with a per-item audit ledger.

---

## Hackathon Problem Statement Alignment

| Track | How Kleos Addresses It |
|---|---|
| PS01 — Visualizing Explainable AI Reasoning | Reasoning Ribbon narrates every step. Assumption Audit Panel shows blast radius of every belief. Provenance badges classify the epistemic source of every node. Contradictions are flagged with red edges in real time. |
| PS06 — Negotiating AI Memory | Four-tier memory with explicit lifecycle. Memory Negotiation Card requires consent before any storage. Inferred memories are quarantined until accepted. Session Memory Audit gives per-item control at close. |

The two tracks are not parallel features. The memory system gives the XAI system something to explain. The XAI system gives the memory system a reason to be trusted.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, react-flow |
| Backend | Python 3.11, FastAPI, Uvicorn, Celery |
| Reverse Proxy | NGINX (AWS EC2) |
| Relational Database | Supabase (PostgreSQL) |
| Vector Search | Redis Cloud (Redis Stack — RedisVSS) |
| File Storage | Supabase Storage |
| Task Queue + Cache | Redis Cloud |
| Primary LLM | OpenAI GPT-4o |
| Voice (Realtime) | OpenAI gpt-4o-realtime-preview |
| Governance LLM | OpenAI GPT-4o-mini |
| Deployment | AWS EC2 |

---

## Key Interactions (12 Verbs)

`Drop` `Pin` `Merge` `Split` `Branch` `Collapse` `Commit` `Rewind` `Compare` `Trace` `Counterfactual` `Anchor`

All 12 are voice-addressable via the OpenAI Realtime API.

---

## Repository Structure

```
Kleos/
├── README.md
├── Kleos_Master_Document.md        # V3.0 specification — authoritative design reference
├── project-context/                # Working documentation for active development
│   ├── context.md                  # Vision, philosophy, design principles
│   ├── prd.md                      # Product requirements and feature specification
│   ├── users.md                    # Personas, use cases, user workflows
│   ├── ux-blueprint.md             # Interaction grammar, canvas design, visual encoding
│   ├── architecture.md             # Technical architecture, AI design, data schemas
│   ├── mvp.md                      # MVP scope and 48-hour build plan
│   ├── instructions.md             # Environment setup and local development
│   ├── tasks.md                    # Active task checklist (updated during build)
│   ├── demo.md                     # Hackathon demo script and pre-caching plan
│   ├── test.md                     # Feature verification checklist
│   ├── future-plans.md             # Post-hackathon roadmap and research agenda
│   └── progress.md                 # Build record and post-mortem
└── src/
    ├── frontend/                   # React + TypeScript canvas application
    └── backend/                    # FastAPI + Celery services
```

---

## Documentation Reading Order

**Before building:** `context.md` → `prd.md` → `users.md` → `architecture.md` → `mvp.md` → `instructions.md`

**During the build:** `tasks.md` → `ux-blueprint.md` → `architecture.md` (schema reference)

**Demo preparation:** `demo.md` → `test.md`

**Post-hackathon:** `progress.md` → `future-plans.md`

---

## Hackathon

| | |
|---|---|
| Event | Human-Centred Design of LLM Interfaces |
| Organizers | IIIT Pune x IIT Bombay ACM SIGCHI |
| Problem Statements | PS01 — Visualizing Explainable AI Reasoning |
| | PS06 — Negotiating AI Memory |
| Format | 48-hour build, live demo |
| Team | 4 members |

---

> `Kleos_Master_Document.md` (V3.0) is the authoritative specification for all design decisions.
> `project-context/` is the working reference during active development.
> When the two disagree, `project-context/` reflects the current implementation intent.
