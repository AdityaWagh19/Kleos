# Kleos

A post-chat AI interface for structured thinking work. Ideas are typed graph nodes on a spatial canvas — not paragraphs in a conversation thread.

Built for the **Human-Centred Design of LLM Interfaces** hackathon at IIIT Pune x IIT Bombay ACM SIGCHI, targeting PS01 (Visualizing Explainable AI Reasoning) and PS06 (Negotiating AI Memory).

---

## What It Does

Kleos compiles documents, voice, text, and screenshots into a live semantic canvas of typed, connected nodes. The AI's reasoning is visible and inspectable in real time. Memory is negotiated explicitly — nothing is stored without user consent at a chosen scope.

The two tracks are not parallel features. The memory system gives the XAI system something to explain. The XAI system gives the memory system a reason to be trusted.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, react-flow |
| Backend | Python, FastAPI |
| Primary LLM | GPT-4o (structured output, tool-calling, streaming) |
| Classification LLM | GPT-4o-mini |
| Memory Store | SQLite (4-tier partitioned tables) |
| Vector Store | ChromaDB (local) |
| Embeddings | text-embedding-3-small |
| Voice (optional) | Sarvam AI STT |
| PDF Export | puppeteer / pdfkit fallback |

---

## Repository Structure

```
Kleos/
├── README.md
├── Kleos_Master_Document.md      # V3.0 specification — authoritative reference
├── project-context/              # Working documentation for active development
│   ├── context.md                # Vision, philosophy, design principles
│   ├── prd.md                    # Product requirements
│   ├── users.md                  # Personas, use cases, workflows
│   ├── ux-blueprint.md           # Interaction grammar, canvas design, visual encoding
│   ├── architecture.md           # Technical architecture, AI design, data schemas
│   ├── mvp.md                    # MVP scope and 48-hour build plan
│   ├── instructions.md           # Environment setup and local development
│   ├── tasks.md                  # Active task checklist
│   ├── demo.md                   # Hackathon demo script
│   ├── test.md                   # Feature verification checklist
│   ├── future-plans.md           # Post-hackathon roadmap
│   └── progress.md               # Build record
└── src/                          # Source code (frontend + backend)
```

---

## Documentation Reading Order

**Before coding:** `context.md` — `prd.md` — `users.md` — `architecture.md` — `mvp.md` — `instructions.md`

**During coding:** `tasks.md` — `ux-blueprint.md` — `architecture.md`

**Demo prep:** `demo.md` — `test.md`

**Post-hackathon:** `progress.md` — `future-plans.md`

---

## Hackathon

| | |
|---|---|
| Event | Human-Centred Design of LLM Interfaces |
| Organizers | IIIT Pune x IIT Bombay ACM SIGCHI |
| Problem Statements | PS01 — Visualizing Explainable AI Reasoning |
| | PS06 — Negotiating AI Memory |
| Format | 48-hour build, live demo |
| Team | 2 members |

---

> The authoritative specification for all design decisions is `Kleos_Master_Document.md` (V3.0).
> `project-context/` documents are the working references during active development.
