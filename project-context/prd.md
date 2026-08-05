# Product Requirements Document

**Product:** Kleos
**Version:** 1.0 (Hackathon Build)
**Hackathon:** Human-Centred Design of LLM Interfaces | IIIT Pune x IIT Bombay ACM SIGCHI
**Problem Statements:** PS01 (Visualizing Explainable AI Reasoning) + PS06 (Negotiating AI Memory)

---

## Executive Summary

Kleos is a post-chat AI interface in which ideas are typed graph nodes on a spatial canvas, not paragraphs in a conversation thread. The product targets two hackathon problem statements simultaneously, treating them not as parallel tracks but as two views of the same underlying graph.

**PS01:** Making the AI's reasoning process visible, inspectable, and manipulable in real time.
**PS06:** Turning AI memory from a background capability into a first-class interaction where users actively negotiate what gets remembered, at what scope, and for how long.

All AI capability is orchestrated through standard tool-calling, structured output prompting, and streaming APIs (SSE + WebSocket) on top of GPT-4o, gpt-4o-realtime-preview, and GPT-4o-mini. The innovation is entirely in the HCI layer.

**Voice is the primary input channel.** The OpenAI Realtime API (gpt-4o-realtime-preview) connects via a persistent WebSocket. All 12 interaction verbs are voice-addressable. Text input and document drop are secondary input modes, not the default.

---

## Hackathon Problem Statement Alignment

### PS01 — Visualizing Explainable AI Reasoning

**What PS01 requires:** Make the AI reasoning process visible and legible in real time. Balance transparency and information overload. Help users calibrate trust appropriately.

| Feature | PS01 Contribution | Priority |
|---|---|---|
| B1. Reasoning Ribbon | Real-time narration of every compilation step via SSE | MVP |
| B2. Assumption Audit Panel | Interactive inspection and override of every AI assumption | MVP |
| B3. Provenance Badges | 5-type epistemic source classification on every node | MVP |
| B7. Contradiction Flag | Live detection and visual marking of logical contradictions | MVP |
| B4. Confidence Topology | Spatial encoding of confidence via Trust Lens toggle | Differentiator |
| B5. Counterfactual Branches | "What changes if I remove this assumption?" branch | Differentiator |
| B6. Reasoning Path Walk | Step-through causal chain from conclusion back to source | Differentiator |

### PS06 — Negotiating AI Memory

**What PS06 requires:** Memory must not happen in the background. Users actively negotiate what gets remembered, discarded, and scoped. Visibility and agency are the defining requirements.

| Feature | PS06 Contribution | Priority |
|---|---|---|
| A1. Four-Tier Memory Architecture | Tiered persistence with explicit lifecycle per tier | MVP |
| A2. Memory Negotiation Card | Pre-storage consent at natural pause points | MVP |
| A3. Memory Panel | Full CRUD on what the AI knows, with 4-tab view | MVP |
| A4. Memory CRUD Controls | Create, read, update, archive for all memory items | MVP |
| A6. Session Memory Audit | Explicit end-of-session per-item consent flow | MVP |
| A7. Inline Scope Chips | Lowest-friction in-canvas memory scope control | MVP |
| D1. Incognito Mode | Zero-storage session with visual indicator | MVP |
| A5. Memory Freshness Indicators | Age badges and staleness flags per memory item | Differentiator |

### Why Both Tracks Are Stronger Together

- Provenance Badges (PS01) make memory sources visible — nodes reveal which memory tier they came from.
- Counterfactual Branches (PS01) operate on memory-dependent assumptions — removing a memory shows exactly how the canvas changes.
- Workspace Modes configure both memory filtering and reasoning posture with one setting.

---

## Core Concepts

### Four-Tier Memory Architecture

| Tier | Name | Scope | Lifecycle | Visual |
|---|---|---|---|---|
| Tier 0 | Core Memory | `global` | Permanent, user-ratified | Solid gold border |
| Tier 1 | Workspace Memory | `workspace` | Persists across sessions for this project | Solid blue border |
| Tier 1 | Session Memory | `session` | Expires when canvas closes | Dashed blue border |
| Tier 2 | Inferred Memory | `session` | AI-proposed; awaiting ratification | Amber border, quarantine badge |
| Tier 3 | Source Memory | `source` | Tied to a dropped artifact | Paperclip icon |

**Scope ↔ Negotiation Card mapping:**

| Card Option | Inline Chip | Tier | Scope | Lifecycle |
|---|---|---|---|---|
| Remember Always | [Global] | 0 | `global` | Permanent |
| This Project Only | [Workspace] | 1 | `workspace` | Persists for this project across sessions |
| *(default session node)* | [Session] | 1 | `session` | Expires on canvas close |
| Don't Remember | — | — | — | Hard-deleted immediately |
| Not Now | — | 2 | `session` | Stays quarantined |

**Critical constraint:** Tier 2 (Inferred) memories are never included in LLM prompt construction until the user explicitly accepts them. They exist in the database but are quarantined from context assembly. This is the foundational PS06 commitment.

### Workspace Modes

A single mode selection configures three things simultaneously: memory priority, reasoning posture, and explanation style. Four modes:

| Mode | Memory Priority | Reasoning Style | Ideal For |
|---|---|---|---|
| Analytical | Source memories (Tier 3) weighted highest | Evidence-first; every claim requires a source | Literature review, competitive intelligence |
| Creative | Core memories (Tier 0) weighted highest | Narrative; uncertainty visible but non-blocking | Ideation, early-stage exploration |
| Critical | Session memories and contradiction flags | Adversarial; counter-argument node for every accepted claim | Pre-decision audit, risk review |
| Strategic | Balanced across all tiers | Structured synthesis; convergence-focused | Final synthesis, investor presentations |

**Quick Override:** Any cluster can be placed in a different reasoning mode without changing the global mode. Right-click any cluster to set a per-cluster temporary override (session-scoped only).

### Interaction Grammar (12 Verbs)

`Drop` `Pin` `Merge` `Split` `Branch` `Collapse` `Commit` `Rewind` `Compare` `Trace` `Counterfactual` `Anchor`

Keyboard shortcuts: `B` = Branch, `M` = Merge, `C` = Compare, `T` = Trace, `P` = Pin, `Esc` = dismiss any panel.

### Node Types (8)

`idea` `evidence` `assumption` `question` `constraint` `insight` `decision` `source`

### Epistemic Source Types (6 Provenance Badges)

| Badge | Color | Meaning |
|---|---|---|
| Document | Blue | Sourced from a dropped artifact with page/line reference |
| Core Memory | Green | Drawn from Tier 0 (user-ratified permanent memory) |
| AI Inference | Yellow | Derived from current canvas context |
| Parametric | Red | AI parametric knowledge — no document source; hallucination-risk signal |
| User-Created | White/outline | Created directly by the user |
| Voice Input | Citrine/Lime | Created via voice command through the Realtime API — distinct from AI inference; the idea originated with the user, delivered by voice |

---

## Feature Specification

### Memory System Features

**A1. Four-Tier Memory Architecture** | PS06 (primary), PS01 (secondary) | MVP
Four named memory tiers mapped to distinct SQLite partitions with explicit lifecycle enforcement. Tier 2 items are quarantined from all LLM context until accepted by the user.

**A2. Memory Negotiation Card** | PS06 | MVP
A dismissible card appearing at natural pause points (after Branch creation, Decision node commit, complex Merge). Shows what the AI observed before proposing storage. Four scope options: Remember Always / This Project Only / Don't Remember / Not Now. Trigger: same preference referenced 2+ times in a session, or explicit user statement.

**A3. Memory Panel** | PS06 (primary), PS01 (secondary) | MVP
Left-side slide-out panel. Four-tab view: Core | Session | Pending (Tier 2) | Source. Inline Edit / Archive / Promote / Demote actions. Search bar. Conflict indicator when two items in the same tier contradict. Pending tab has an explicit banner: "These have not influenced any response yet."

**A4. Memory CRUD Controls** | PS06, PS01 | MVP
Create, Read, Update, Archive on all memory items. Editing a memory shows a one-second Impact Pulse on canvas nodes influenced by it. Archive is soft-delete (retained for audit). Permanent delete requires secondary confirmation.

**A6. Session Memory Audit** | PS06 | MVP
At canvas close, a Session Summary Card lists everything the AI inferred during the session with per-item Accept / Reject / Edit controls. Accepted items promoted to Tier 0 or Tier 1 (scope determined by the user's choice). Rejected items are **soft-deleted** (`rejected=TRUE`): they are excluded from all future LLM context permanently but are retained in the database for PS06 export auditability — the export includes a full consent ledger showing which inferences were accepted and which were rejected.

**A7. Inline Scope Chips** | PS06, PS01 | MVP
Nodes carrying user-relevant content carry an inline chip: [Session] | [Workspace] | [Global]. Clicking cycles through options. Scope change to Global pulses all open branches in the Branch Rail.

**A5. Memory Freshness Indicators** | PS06 | Differentiator
Age badge (relative timestamp) and Staleness flag when a memory appears to contradict current canvas content. Computed once at canvas load, not continuously.

### Explainable AI Features

**B1. Reasoning Ribbon** | PS01 | MVP
A thin horizontal strip at the canvas bottom narrating AI compilation steps in real time via SSE. Each step is clickable and expands to show specific evidence. Fades 2 seconds after compilation completes. Uncertainty surfaced in plain language: "Could not determine if this is a constraint or assumption — treating as assumption. Click to change."

**B2. Assumption Audit Panel** | PS01 | MVP
Right-side collapsible drawer listing every assumption the AI made. Per assumption: statement in plain language, confidence bar (Low/Medium/High), source badge, Impact Halo on hover, and actions: Accept / Override / Ask AI to reconsider / Delete. When overridden: only the affected subgraph recomputes.

**B3. Provenance Badges** | PS01 (primary), PS06 (secondary) | MVP
Color-coded badge on every node. Hover shows full provenance chain. Source Filter in toolbar dims everything except selected source type.

**B7. Contradiction Flag** | PS01 | MVP (flag), Differentiator (resolution panel)
On contradiction detection: both nodes pulse red for 1 second, a red edge with lightning symbol persists between them. Hover shows explanation. MVP scope: detection and visual flag only. Resolution Panel is Differentiator.

**B4. Confidence Topology** | PS01 | Differentiator
Node border sharpness, edge line style, and cluster fill opacity encode confidence. Active only when Trust Lens toggle is on (off by default). Always-on would violate P10.

**B5. Counterfactual Branches** | PS01 (primary), PS06 (secondary) | Differentiator
Right-click any Assumption node → "What changes if I remove this?" Creates a new Branch with the assumption deleted; AI recompiles the affected subgraph only; changed nodes highlighted in amber; plain-language summary of impact.

**B6. Reasoning Path Walk** | PS01 | Differentiator
Activating Trace on any node dims the canvas to show only the reasoning chain. Bottom card narrates each step. After the walk: "Did this reasoning make sense?" — feedback stored and used to adjust future prompt weighting.

### Canvas and Workspace Features

**C1. Core Canvas** | Both | MVP
react-flow spatial canvas with infinite pan/zoom, momentum physics, multi-level zoom (branch overview → cluster → node detail), direct manipulation, AI-driven auto-layout with user override, Branch Rail (persistent strip showing active branches as tabs).

**C2. Status Pill** | PS01 (secondary) | MVP
Three-state indicator in the canvas header:
- `Working...` — animated blue dot; active AI compilation (text path).
- `Listening` — animated microphone icon; voice channel active and capturing.
- `Ready` — static green dot; idle.

Clicking "Working..." shows the last 3 Reasoning Ribbon steps as a compact tooltip. Does not pause compilation — that is handled by dedicated Pause/Stop controls (D2). The `Listening` state is independent of compilation: voice can be active while the canvas is `Ready` (listening, not yet processing) or while `Working...` (voice command being compiled).

**C3. Thinking Timeline** | PS01, PS06 | Differentiator
Toggle-only horizontal scrubber. Keyframe thumbnails at major milestones. Never permanently visible (consumes 15–20% of canvas vertical space with minimal benefit during active work).

**C4. Compare Mode** | PS01 | MVP (basic), Differentiator (with diff overlay)
Two branches displayed side by side with auto-highlighted differences. Branch Rail → "Compare" action pins two branches. Delta nodes highlighted in amber.

**C5. Voice Input — OpenAI Realtime API** | Both | **MVP** (elevated from Differentiator)
The primary input channel. gpt-4o-realtime-preview connects via a persistent WebSocket (FastAPI /ws/voice ↔ OpenAI Realtime API). Real-time speech-to-text transcription and tool calling in one streaming connection — no separate STT step. All 12 grammar verbs are voice-addressable. Canvas mutations from voice and text are identical — input modality is invisible to the canvas service. Voice transcript displayed in real time below the canvas.

**C7. Quick Override** | Both | Differentiator
Right-click any cluster → "Override mode for this cluster" → temporary per-cluster reasoning mode. Cluster shows a small colored badge indicating the override. Override expires at session end. Does not affect memory behavior.

### Governance Features

**D1. Incognito Mode** | PS06 | MVP
Nothing saved to any memory tier. Visual indicator: dark chrome border + "Incognito" badge in canvas header. Session Memory Audit is skipped.

**D2. Pause / Stop Controls** | Both | MVP
Pause: halt AI compilation mid-stream; canvas shows partial nodes. Stop: cancel entirely; affected nodes revert to pre-operation state. Strategic Mode adds Action Plan Preview before complex multi-step mutations.

**D3. Activity Log** | Both | Differentiator
Read-only overlay listing all canvas operations with timestamps. Every action logged by the Event Log (see architecture).

### Export System

**User-facing exports:** Markdown and PDF only.
**Machine-readable export:** JSON via Settings or `GET /api/canvas/{id}/export` — not in primary export UI.

| Export Type | Sections Included | Use Case |
|---|---|---|
| Full Canvas Export | All sections | Hackathon submission, documentation |
| Decision Summary | Problem Statement, Assumptions, Evidence, Decisions | Stakeholder sharing |
| Research Notes | Evidence, Open Questions, Reasoning Summary, Memory Context | Academic / synthesis |

PDF generation: marked.js (render) + pyppeteer (Python headless Chromium, run as a Celery task). Fallback: pdfkit if Chromium is unavailable on the EC2 instance. Generation time: 2–6 seconds. Show a loading state.

### Supported Inputs

| Format | Priority | Method | Output Node Types |
|---|---|---|---|
| PDF | MVP | PyMuPDF → GPT-4o | Idea, Evidence, Assumption, Constraint |
| Plain text | MVP | GPT-4o direct | Any type |
| DOCX | Should Have | python-docx → GPT-4o | Idea, Evidence, Assumption |
| URL (static) | Should Have | requests + BeautifulSoup → GPT-4o | Evidence, Competitive Intel |
| PPTX | Should Have | python-pptx → GPT-4o | Idea, Constraint, Evidence |
| Image / Screenshot | Should Have | GPT-4o Vision | Concept, Evidence |
| GitHub repo URL | Should Have | GitHub API → GPT-4o | Constraint, Architecture Idea |
| CSV / XLSX | Nice to Have | pandas → GPT-4o | Evidence, Constraint |
| Voice | MVP | OpenAI Realtime API WebSocket — real-time STT + tool calling | Idea, Question, all node types via verb grammar |
| Video transcript | Future | Whisper-compatible STT → GPT-4o | Idea, Evidence |

File size limits: PDF 20MB, DOCX 10MB, PPTX 25MB, Image 5MB. Enforce server-side with a clear error message.

Note: URL ingestion must be handled server-side (FastAPI makes the request). CORS prevents browser-side fetching of external URLs.

---

## Research Foundation

### Memory Architecture Research

| Work | Venue | Key Finding | Applied In |
|---|---|---|---|
| PersonaTree / "Inside Out" (Zhao et al.) | ACL 2026 | Hierarchical user-centric memory tree outperforms flat vector stores | A1 Four-Tier Architecture |
| Hindsight | Emergent Mind 2026 | Four-network memory with Retain/Recall/Reflect lifecycle | A1, Memory Retrieval Order |
| A-MEM | arXiv 2025 | Zettelkasten-style dynamic linking of memories | A7 Scope Chips |
| "Relational Gains, Privacy Strains" | CHI 2026 | Users prefer agency before information is stored, not after | A2 Negotiation Card, A6 Session Audit |
| "Ghost of the Past" | CHI 2025 | Proactive framing lands better than retroactive disclosure | A2 Negotiation Card |
| "Controllable Memory Usage" | Jan 2026 | Users want different persistence for different information types | A1, A2 |
| MindTrellis | DIS 2026 | Co-created knowledge structures through interactive visual exploration | A3 Memory Panel |
| Agentic Memory survey | 2026 | Three-tier: episodic, semantic, procedural | A1 Tier design |

### Explainable AI Research

| Work | Venue | Key Finding | Applied In |
|---|---|---|---|
| Armstrong et al. MAVS | Visible Language 2025 | Visual weight communicates uncertainty more effectively than numerics | B4 Confidence Topology, B3 Badges |
| "Seeing the Reasoning" | CHI 2026 | Correct rationales and certainty cues increase trust | B1 Reasoning Ribbon |
| Hippo (Pang et al.) | CHI 2025 | Interactive reasoning tree significantly increased assumption awareness | B2 Assumption Audit |
| IXAII | arXiv 2025 | Five user groups need different explanation types | Workspace Modes |
| Counterfactual XAI | VISIGRAPP 2025, CHI 2026 | Counterfactual + feature-importance combination preferred | B5 Counterfactual Branches |
| CHI 2026 HCXAI workshop | CHI 2026 | Explanation should be narrative; users need to know which layer produced info | B6 Reasoning Walk, B3 |

### Spatial Interface Research

| Work | Venue | Key Finding | Applied In |
|---|---|---|---|
| Orality (Li et al.) | CHI 2026 | Speech-first canvas outperforms ChatGPT STT for complex thought | C5 Voice Input |
| ImaginationVellum | UIST 2025 | Spatial canvas as prompt space; temporal replay of ideation | C3 Thinking Timeline |
| MindTrellis | DIS 2026 | Graph representations enhance critical thinking | C1 Core Canvas |

### Design Pattern Libraries

| Library | Patterns Applied |
|---|---|
| Shape of AI (Amir Elion) | Wayfinders, Trust Builders, Memory patterns, Stream of Thought, Governors |
| IF Design Patterns Catalogue | Forget Learning, Epistemic Disclosure, Stop and Takeover, Minimal Sharing |
| AI UX Playground | Activity Log, Footprints, Autonomy Budget |

---

*Reference: Kleos_Master_Document.md — Sections 1, 8, 9, 10, 18, 19, 22*
