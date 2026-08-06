# KLEOS — MASTER PROJECT DOCUMENT
### Version 3.0 | Single Source of Truth
**Hackathon: Human-Centred Design of LLM Interfaces | IIIT Pune × IIT Bombay ACM SIGCHI**
**Targeting: PS01 (Visualizing Explainable AI Reasoning) + PS06 (Negotiating AI Memory)**

---

> **Document Status:** Version 3.0. Authoritative reference. Supersedes V2.0, V1.0, and all prior source documents.

> **V3 Changes from V2:**
> - **Project renamed** to Kleos throughout all sections, examples, exports, and branding.
> - **Token architecture resolved** — removed conflicting 4K/10K global caps; replaced with operation-specific cost budgets and a clear distinction between GPT-4o's 128K technical limit and cost/latency safety thresholds.
> - **Ambient system state re-evaluated** — status companion removal validated; minimal non-anthropomorphic Status Pill added to canvas header (a single 2-state indicator, not a companion).
> - **Workspace Modes validated and extended** — combined reasoning + memory configuration retained as correct; rigidity concern addressed via per-cluster Quick Override without changing global mode.
> - **Export strategy refined** — Markdown + PDF retained as user-facing outputs; machine-readable JSON export added as a non-UI developer/persistence option.
> - **Supported inputs expanded** — DOCX (Should Have), PPTX (Should Have), CSV/XLSX (Nice to Have), video transcript (Future) added with honest priority tiers.
> - **MVP scope re-evaluated** — Voice (Sarvam AI) moved to Differentiator from build hours 28-32; honest team-size assumptions documented; build order tightened.
> - **17 additional V2 issues identified and resolved** (see Section 23).

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Vision & Philosophy](#2-vision--philosophy)
3. [Problem Statement](#3-problem-statement)
4. [Design Principles](#4-design-principles)
5. [User Personas](#5-user-personas)
6. [Product Goals & Anti-Goals](#6-product-goals--anti-goals)
7. [Core Concepts & Mental Model](#7-core-concepts--mental-model)
8. [Hackathon Problem Statement Alignment](#8-hackathon-problem-statement-alignment)
9. [Workspace Modes](#9-workspace-modes)
10. [Complete Feature Specification](#10-complete-feature-specification)
11. [Information Architecture](#11-information-architecture)
12. [Interaction Grammar](#12-interaction-grammar-the-verbs)
13. [Memory Architecture](#13-memory-architecture)
14. [Explainability Architecture](#14-explainability-architecture)
15. [Spatial Canvas Design](#15-spatial-canvas-design)
16. [AI System Design & Orchestration](#16-ai-system-design--orchestration)
17. [LLM Cost & Token Architecture](#17-llm-cost--token-architecture)
18. [Export System](#18-export-system)
19. [Supported Inputs](#19-supported-inputs)
20. [User Workflows](#20-user-workflows)
21. [Technical Architecture](#21-technical-architecture)
22. [Research Foundation](#22-research-foundation)
23. [Design Decisions & Rationale](#23-design-decisions--rationale)
24. [V3 Critical Review Findings](#24-v3-critical-review-findings)
25. [MVP Scope](#25-mvp-scope)
26. [Future Roadmap](#26-future-roadmap)
27. [Demo Script](#27-demo-script)
28. [Open Questions](#28-open-questions)
29. [Engineering Constraints](#29-engineering-constraints)
30. [Glossary](#30-glossary)

---

## 1. EXECUTIVE SUMMARY

**Kleos** is a post-chat AI interface built on the premise that an idea is not a string of text — it is an object with structure, provenance, and relationships to other objects. Instead of a conversation thread that users scroll, Kleos provides a **semantic canvas that users navigate, reshape, and fork**.

The product targets two hackathon problem statements simultaneously:
- **PS01 — Visualizing Explainable AI Reasoning**: Making the AI's reasoning process visible, inspectable, and manipulable in real time.
- **PS06 — Negotiating AI Memory**: Turning AI memory from a background capability into a first-class interaction where users actively negotiate what gets remembered, at what scope, and for how long.

The core thesis: these two tracks are not parallel — they are **two views of the same underlying graph**. The memory system gives the XAI system something to explain. The XAI system gives the memory system a reason to be trusted.

**The technical approach is intentionally grounded.** Kleos does not build novel ML pipelines or custom AI models. All AI capability is orchestrated through standard tool-calling, structured output prompting, and streaming APIs built on top of mature models (OpenAI GPT-4o for reasoning, Sarvam AI for multilingual voice). The innovation is entirely in the HCI — the interaction design, the spatial interface, the memory negotiation UX, and the explainability layer built on top of standard AI outputs.

**Competitive differentiation:** (1) Persistent spatial semantic object model — ideas are typed graph nodes, not prose paragraphs; (2) multimodal input fusion into one coherent canvas; (3) four-tier negotiated memory system with explicit consent flows; (4) workspace modes that configure the AI's reasoning posture without hiding the mechanics; (5) voice input in Indian languages via Sarvam AI, directly relevant to the hackathon audience.

---

## 2. VISION & PHILOSOPHY

### The Core Premise
Chat was never the interface. It was the placeholder we used until something better existed.

Chat forces every idea through a single-file turn-taking bottleneck. It is a transcript of a conversation, not a representation of a mind. Every time a person opens a new chat, they throw away the shape of everything they were thinking — the branches they didn't take, the assumptions they were testing, the documents that gave the idea its edges.

Kleos is built on a different premise: **the interface is not a thread you scroll, it is a semantic canvas you navigate, reshape, and fork.** The AI's job is not to answer messages — it is to continuously compile whatever the user throws at it (documents, voice, screenshots, text) into that living canvas, and to keep it coherent as the user manipulates it directly.

### The Reframing Filter
Every feature must pass through this filter:

> **Don't ask "what can an LLM do?" Ask "what interaction has become possible because LLMs exist?"**

### The Cognitive Load Filter
Every UI component must also pass this filter:

> **Does this component reduce or eliminate a cognitive friction, or does it add one? If it adds one without proportional benefit, it does not ship.**

### The Ambient Awareness Principle (V3 addition)
A corollary to the cognitive load filter:

> **Removing a UI element entirely is not always simpler than replacing it with a minimal one. If users need to know the AI's state, give them exactly one reliable place to look — just make it not a companion.**

### What Kleos Enables
- **Externalizing thought spatially** rather than compressing it into linear text.
- **Exploring alternatives in parallel** rather than sequentially through separate chats.
- **Inspecting AI reasoning** not as a readout but as a manipulable object.
- **Negotiating memory** as an ongoing collaboration rather than accepting silent background learning.
- **Protecting human cognition** by keeping critical thinking in the loop at every step.

---

## 3. PROBLEM STATEMENT

### The Structural Failure of Chat for Thinking Work

These are not usability complaints — they are **structural failures** of the chat paradigm:

| Friction | Root Cause |
|---|---|
| **No persistent object model** | Every idea lives inside a paragraph, not as a manipulable thing with its own identity |
| **No spatial memory** | Humans think by arranging things in space; chat has no space, only time |
| **Single-threaded exploration** | Chat holds only one line of reasoning at once; comparing directions means disconnected conversations |
| **Multimodal inputs get flattened** | A PDF, voice memo, and screenshot all get squeezed into the same text box |
| **Reasoning is invisible** | Assumptions, contradictions, and confidence levels are buried in prose |
| **No reversibility** | There is no undo for a line of thinking |
| **Memory is opaque** | Users have no way to see what the AI learned or to control what persists |
| **Explanations are post-hoc** | AI reasoning is explained *after* the fact as a rationalization, not *during* as a narrative |

### Who Suffers Most
Knowledge workers whose primary work product is a **decision or a recommendation**: founders evaluating pivots, strategy consultants, researchers synthesizing literature, product teams making architectural choices. Their cognitive bottleneck is not retrieval or writing — it is **structured thinking with incomplete information under uncertainty**.

---

## 4. DESIGN PRINCIPLES

Binding constraints. Every feature is checked against all ten. A feature that violates one without compelling justification does not ship.

| # | Principle | What It Means in Practice |
|---|---|---|
| **P1** | **Thoughts are objects** | An idea, assumption, or evidence item is a node with identity — not a sentence in a transcript |
| **P2** | **Everything is directly manipulable** | If the AI can do it, the user can also grab it, drag it, and do it by hand |
| **P3** | **The AI never hides its reasoning** | Clusters, links, and rankings always show the assumptions and evidence behind them |
| **P4** | **Context is spatial** | Proximity, grouping, and layout carry meaning. Position is memory |
| **P5** | **Exploration is parallel, not sequential** | Multiple competing solutions exist at once as separate branches |
| **P6** | **Every action is reversible** | Merges, deletions, and branches can be rewound and replayed |
| **P7** | **Provenance is permanent** | Every object remembers where it came from — a PDF page, a voice clip, a memory tier |
| **P8** | **Convergence is a first-class action** | Merging and fusing ideas is as deliberate and visible an act as creating them |
| **P9** | **Memory is negotiated, not assumed** | Users actively decide what gets stored, at what scope, and for how long |
| **P10** | **Minimize cognitive load always** | Every panel, animation, and affordance is questioned. When in doubt, cut it |

---

## 5. USER PERSONAS

### Primary: "The Synthesizer"
**Priya, 28** — Product Strategy Lead, early-stage B2B startup
- **Frustration:** "Every new chat means re-explaining everything. I don't know where I left off."
- **Need:** A tool that remembers the *shape* of thinking — not just facts, but the reasoning behind decisions.
- **Use cases:** Competitive analysis, product positioning, strategic options evaluation.
- **HCI insight:** Needs progressive disclosure — complexity must be available but never forced.
- **Format use cases:** Uploads PDFs (competitor reports), pastes text (market research), uses PPTX (existing decks).

### Secondary: "The Researcher"
**Arjun, 31** — PhD Researcher in HCI
- **Frustration:** "The AI makes confident claims but I can't verify where the information came from."
- **Need:** Transparent AI reasoning with verifiable source attribution.
- **Use cases:** Literature synthesis, hypothesis generation, citation management.
- **HCI insight:** Needs epistemic source distinction and readable provenance at a glance, not buried in panels.
- **Format use cases:** Uploads PDFs (papers), pastes URLs (arXiv), may use DOCX (paper drafts).

### Tertiary: "The Builder"
**Zara, 26** — Technical Co-founder
- **Frustration:** "I want to explore three architectures at once, but chat forces me to be sequential."
- **Need:** Parallel exploration of alternatives with explicit constraint tracking and visual comparison.
- **Use cases:** Technical architecture decisions, vendor evaluation, investor narratives.
- **HCI insight:** Needs branching and comparison to be one-step gestures, not multi-click workflows.
- **Format use cases:** Uploads PDFs (vendor docs), pastes GitHub repo URLs, may use CSV (pricing tables).

---

## 6. PRODUCT GOALS & ANTI-GOALS

### Hackathon Goals (Primary)
1. Demonstrate the most compelling implementation of PS01 (Visualizing XAI Reasoning) at the hackathon.
2. Demonstrate the most compelling implementation of PS06 (Negotiating AI Memory) at the hackathon.
3. Show that both tracks are stronger together than either alone — the coherence argument.
4. Produce a UX case study artifact that stands as an HCI research contribution.

### Product Goals (Beyond Hackathon)
1. Replace the chat interface as the primary surface for complex thinking work.
2. Build a semantic canvas that persists across sessions and grows more useful over time.
3. Enable parallel exploration of alternatives that current tools require separate conversations to handle.
4. Establish user trust through radical transparency of AI reasoning and memory.

### Anti-Goals
- **Not a general-purpose chatbot.** Kleos is not a better ChatGPT. It is a different kind of tool for a different kind of work.
- **Not a knowledge management tool.** Not Notion or Obsidian. The canvas is for active reasoning, not passive storage.
- **Not a diagramming tool.** Not Miro or Figma. The canvas is semantically structured by AI, not manually drawn by the user.
- **Not a novel AI system.** No new ML models, no custom training pipelines, no re-inventing RAG. The innovation is the HCI layer.
- **Not a document editor.** Kleos is not Google Docs. The canvas output is nodes and edges, not formatted prose. Export handles the prose conversion.

---

## 7. CORE CONCEPTS & MENTAL MODEL

### The One-Line Mental Model
> **Ideas are living entities inside a semantic canvas.**

Dropping a source doesn't insert text — it adds matter to the canvas. Asking a question doesn't spawn a reply — it reorganizes the canvas around that question. Exploring an alternative doesn't start a new chat — it branches the canvas into a parallel stream.

### Mental Model Comparisons
| Tool | One-Line Mental Model |
|---|---|
| Figma | Everything is a layer |
| Git | Everything is a commit in a branching history |
| Notion | Everything is a block |
| **Kleos** | **Ideas are living entities inside a semantic canvas** |

### Key Terminology (Canonical)
| V1 Term | V2/V3 Term | Reason |
|---|---|---|
| Universe | **Canvas** | "Canvas" is immediately guessable. "Universe" requires explanation. |
| Fork / Universe-level fork | **Branch** | One verb for all parallel paths. |
| Fuse | **Commit Branch** | Aligns with Git mental model; explicit about what is happening. |
| Universe node type | *(removed)* | Branches are managed in the Branch Rail, not as canvas objects. |

### The Circular User Journey
```
Drop (gather) → Organize (AI clusters) → Inspect (Assumption Audit) →
Branch (explore alternatives) → Compare (side by side) →
Decide (Commit Branch) → [loops back to Drop]
```

---

## 8. HACKATHON PROBLEM STATEMENT ALIGNMENT

### PS01 — Visualizing Explainable AI Reasoning

**What PS01 asks for:** Make the AI reasoning process visible and legible in real time, balance transparency and information overload, and help users calibrate trust.

**Features addressing PS01:**
- Assumption nodes as first-class objects — invisible scaffolding made visible as manipulable objects.
- Contradiction Flag — live reasoning checks more actionable than a confidence score.
- Trace verb / Reasoning Walk — causal/evidentiary chain from conclusion back to source.
- Reasoning Ribbon — real-time narration of compilation steps.
- Provenance Badges — 5-type epistemic source classification on every node.
- Trust Lens toggle — spatial confidence topology available on demand.
- Impact Halo — blast-radius visualization of individual assumptions.

---

### PS06 — Negotiating AI Memory

**What PS06 asks for:** Memory should not happen in the background. Users actively negotiate what gets remembered, discarded, and scoped. Visibility and agency are the defining requirements.

**Features addressing PS06:**
- Four-Tier Memory Architecture — tiered persistence with explicit lifecycle rules.
- Memory Negotiation Card — pre-storage consent at natural pause points.
- Memory Panel — full CRUD on what the AI knows.
- Session Memory Audit — explicit end-of-session consent flow.
- Inline Scope Chips — lowest-friction in-canvas memory control.
- Incognito Mode — zero-storage session option.
- Inferred Memory quarantine — Tier 2 items never influence prompts until ratified.

---

### Why Both Tracks Are Stronger Together

The Transparency Loop (PS01) and the Negotiation Loop (PS06) share infrastructure and reinforce each other:
- **Provenance Badges** (XAI) make memory sources visible — you see which nodes came from Core Memory vs. a dropped PDF.
- **Counterfactual Branches** (XAI) work on memory-dependent assumptions — removing a memory shows exactly how the canvas changes.
- **Workspace Modes** configure both memory filtering and reasoning posture together — one setting affects both tracks coherently.

The memory system gives the XAI system something to explain. The XAI system gives the memory system a reason to be trusted.

---

## 9. WORKSPACE MODES

> Workspace Modes are a unified concept that configures the AI's reasoning posture, active memory priority, and default explanation style simultaneously — one selection, three effects. Backed by IXAII (arXiv 2025) and "Inside Out" (ACL 2026) research on user group-specific AI behavior.

Workspace Modes are **not AI personalities**. They are transparent, user-controlled configurations. The active mode is always visible in the canvas header. The user can switch at any time; the switch is instant and does not alter stored memories — it changes how memory is used in context assembly.

### V3 Validation: Should Modes Combine Reasoning + Memory?

**Problem raised:** If modes combine memory priority and reasoning style, a user in Analytical mode who wants to temporarily challenge one cluster must switch the entire global mode — which changes memory behavior too.

**Recommendation:** Keep the combined mode concept for its UX simplicity, but add a **Quick Override** mechanism: any cluster can receive a temporary per-cluster reasoning modifier without changing the global mode. This resolves the rigidity without re-splitting the concept.

**Resolution:** Modes remain combined. Quick Override (see C7 in Section 10C) provides in-place reasoning variation per cluster.

---

### Mode 1: Analytical Mode 🔵
**For:** Researchers, data-heavy decisions, literature synthesis
**Memory priority:** Source memories (Tier 3) weighted highest — the AI privileges content from dropped documents over its own inferences.
**Default on Drop:** Extract claims, evidence, and constraints. Flag any claim lacking a source citation.
**Reasoning style:** Evidence-first — every node shows a source badge by default. No unsourced claims surfaced as primary.
**AI behavior:** Conservative clustering. Does not infer relationships it cannot source. Contradictions are flagged immediately.
**Prompt posture:** *"Before accepting any claim, identify which document it came from. If no source exists, mark the node as 'Inferred — no source' with low confidence."*
**Ideal for:** Literature reviews, competitive intelligence, fact-driven strategy, audit-grade analysis.

---

### Mode 2: Creative Mode 🟣
**For:** Ideation, brainstorming, early-stage exploration
**Memory priority:** Core memories (Tier 0) weighted highest — the AI draws on user's past preferences and decisions to generate relevant suggestions.
**Default on Drop:** Generate adjacent ideas, alternate framings, and unexplored directions. Contradictions noted but not flagged as urgent.
**Reasoning style:** Narrative — plain language without requiring source citations. Uncertainty visible but non-blocking.
**AI behavior:** Liberal clustering. Makes bolder connections; surfaces hypotheses as "Idea" nodes. Confidence markers treated as invitations to explore.
**Prompt posture:** *"Generate ideas and connections freely. Label AI suggestions as 'Idea — AI proposed' with medium confidence. Surface alternatives the user may not have considered."*
**Ideal for:** Product strategy, creative problem-solving, early architecture exploration, writing outlines.

---

### Mode 3: Critical Mode 🔴
**For:** Stress-testing decisions, finding weaknesses before committing
**Memory priority:** Session memories (Tier 1) and contradiction flags — the AI uses current context to actively challenge existing canvas content.
**Default on Drop:** Identify what this material challenges in the existing canvas. Generate counter-argument nodes for any cluster that is contradicted.
**Reasoning style:** Adversarial — for every cluster or link the AI accepts, it generates a counter-argument node.
**AI behavior:** Does not passively accept the user's framing. Asks "what would need to be false for this to be wrong?" and surfaces those conditions as Assumption nodes.
**Prompt posture:** *"Your primary goal is to find weaknesses. For every claim on the canvas, generate at least one counter-claim. Label these as 'Challenge — AI proposed'."*
**Ideal for:** Pre-decision audits, investment evaluation, architecture risk reviews, peer review simulation.

---

### Mode 4: Strategic Mode 🟡
**For:** Decision-making, synthesis, convergence toward a recommendation
**Memory priority:** Balanced — all tiers contribute. AI prioritizes making connections across clusters to drive synthesis.
**Default on Drop:** Identify how this material relates to existing decisions, constraints, and open questions. Suggest how to resolve open branches.
**Reasoning style:** Structured synthesis — proposes inter-cluster relationships, highlights contradictions blocking convergence, surfaces Decision node candidates.
**AI behavior:** Acts as a strategic advisor — proactively suggests next steps. Shows an Action Plan Preview before executing complex multi-step mutations.
**Prompt posture:** *"Your goal is convergence. Identify what is still unresolved, which contradictions need decisions, and what the most defensible synthesis of the current canvas is."*
**Ideal for:** Final synthesis sessions, investor presentations, architectural decision records.

---

### Mode Switching UX
- Four labeled icon buttons in the canvas header. Active mode highlighted with its color.
- Switching modes shows a one-line description: "Switching to Critical Mode: the AI will now challenge your existing clusters."
- Mode is saved with the Canvas state — reopening a saved Canvas restores the last active mode.
- Mode does **not** affect memory tier contents — only how the AI uses them.
- Mode history is included in exports: "Created in Analytical, switched to Critical at 14:32."

---

### Quick Override (V3 Addition)
Any cluster can be temporarily placed in a different reasoning mode without changing the global mode:

- Right-click on any cluster → "Override mode for this cluster" → select from 4 modes.
- The cluster gets a small colored badge in its label (matching the override mode's color) indicating the local override.
- The override persists for the current session only and does not affect memory behavior.
- The global mode remains unchanged; the override affects only the AI's next action on that specific cluster.

**Example:** In Analytical Mode globally, the user right-clicks a "Market Assumptions" cluster → "Critical Mode override." The AI generates counter-arguments for that cluster only, without changing how other clusters are processed.

**Why this resolves the rigidity concern without splitting the concept:** Users retain one simple global setting (mode) for their overall working posture, while retaining the ability to apply local variations where needed. The Quick Override is a low-frequency affordance — most users will never need it. Its existence prevents users who do need it from feeling trapped.

---

## 10. COMPLETE FEATURE SPECIFICATION

Features carry: **PS Track** | **Priority** (MVP / Differentiator / Post-Hackathon) | **Research Basis** | **Demo Moment**

---

### 10A. MEMORY SYSTEM FEATURES

#### A1. Four-Tier Hierarchical Memory Architecture
**PS Track:** PS06 (primary), PS01 (secondary) | **Priority:** MVP
**Research Basis:** PersonaTree/Inside Out (ACL 2026); Hindsight (Emergent Mind 2026); A-MEM (arXiv 2025); "Controllable Memory Usage" (Jan 2026); Agentic Memory survey (2026)

Four visible, named memory tiers — each mapped to a distinct SQLite partition with explicit lifecycle enforcement:

| Tier | Name | Lifecycle | Examples | Visual Treatment |
|---|---|---|---|---|
| **Tier 0** | Core Memory | Permanent, user-ratified | "I'm building a B2B SaaS" | Solid gold border |
| **Tier 1** | Session Memory | Expires when Canvas closes | "In this session, optimize for cost" | Dashed blue border |
| **Tier 2** | Inferred Memory | AI-proposed; awaiting ratification | "Seems you prefer bullet outputs" | ❓ badge, amber border |
| **Tier 3** | Source Memory | Tied to a dropped artifact; archived when source removed | Claims extracted from a PDF | Paperclip icon |

**Critical constraint:** Inferred memories (Tier 2) are **never included in LLM prompt construction** until the user explicitly accepts them. They exist in the database but are quarantined from context assembly. This is the foundational PS06 commitment.

**Demo moment:** Open the Memory Panel → show tiered items → show the AI proposing an Inferred Memory → user rejects → show that the AI's next response did not use that inference.

---

#### A2. Memory Negotiation Card — "The Remember This?" Interaction
**PS Track:** PS06 (primary) | **Priority:** MVP
**Research Basis:** "Ghost of the Past" (CHI 2025); "Relational Gains, Privacy Strains" (CHI 2026); "Controllable Memory Usage" (Jan 2026)

A non-intrusive, dismissible card appearing at natural pause points (after Branch creation, after a Decision node is committed, after a complex Merge):

```
╔══════════════════════════════════════════════════════╗
║  I noticed you prioritized latency over cost twice   ║
║  in this session.                                    ║
║                                                      ║
║  [Remember Always]  [This Project Only]              ║
║  [Don't Remember]   [Not Now]                        ║
╚══════════════════════════════════════════════════════╝
```

**Non-negotiable design constraint:** The card must explain *what the AI observed* that led to the proposal — not just what it wants to store. This makes the AI's inference visible and verifiable (PS01 benefit) while asking for consent before storage (PS06 requirement).

**Implementation:** The card is generated by a lightweight classification call (GPT-4o-mini) that watches session events, not by the primary reasoning model. This keeps the cost and latency separate from the primary compilation context (see Section 17).

**Trigger heuristic:** Same constraint or preference referenced ≥2 times in a session; or an explicit user statement ("I always prefer...").
**Demo moment:** Card appears after user twice chose latency-optimized options. User chooses "This Project Only."

---

#### A3. Memory Panel
**PS Track:** PS06 (primary), PS01 (secondary) | **Priority:** MVP (flat list), Post-Hackathon (relational graph)
**Research Basis:** MindTrellis (DIS 2026); CHI 2026 "Negotiating AI Memory" workshop

**MVP design:** A left-side slide-out panel toggled by a single toolbar icon.
- Four-tab view: Core | Session | Pending (Tier 2) | Source
- Each item shows: text, provenance (session/artifact source), last-used timestamp.
- Inline [Edit] [Archive] [Promote] [Demote] actions on hover.
- Search bar to locate specific memories.
- Conflict indicator (⚠) when two items in the same tier contradict each other.

**Pending tab (Tier 2) design:** Items here have an explicit banner: "These have not influenced any response yet. Review before accepting." This makes the quarantine status visually obvious.

**Demo moment:** "Slide open the memory panel — this is everything Kleos knows about you. Not a list of chat logs. A structured, editable record. You can edit or delete any item."

---

#### A4. Memory CRUD Controls
**PS Track:** PS06, PS01 | **Priority:** MVP

- **Create:** Manually add a memory at any tier. Useful for bootstrapping context ("My company is Prism AI, founded in 2023, Series A stage").
- **Read:** Tap any item to see full provenance: when created, from which session/artifact, how many times used in responses.
- **Update:** Edit the text of any memory. A one-second Impact Pulse highlights canvas nodes influenced by this memory.
- **Archive (soft delete):** Default deletion. Item is invisible but retained in the database for audit. Permanent delete requires explicit secondary confirmation.

**"Forgetting" implementation:** Mark as inactive → exclude from all future prompt construction → show a one-line confirmation: "This memory will not influence future responses." True model unlearning is not in scope; this is context exclusion.

---

#### A5. Memory Freshness Indicators
**PS Track:** PS06 (primary) | **Priority:** Differentiator
**Research Basis:** "Agentic Memory" survey (2026)

Each memory item carries two lightweight signals:
1. **Age badge:** "3 days ago" / "2 weeks ago" / "Last session" — relative timestamps in plain language.
2. **Staleness flag (⚠):** Auto-set when a Core or Session memory appears to contradict something visible in the current canvas. The flag is computed once during canvas load, not continuously in real time.

---

#### A6. Session Memory Audit — "What Did This Session Teach Kleos?"
**PS Track:** PS06 (primary) | **Priority:** MVP
**Research Basis:** "Ghost of the Past" (CHI 2025); "Relational Gains, Privacy Strains" (CHI 2026)

At session close (user clicks "Close Canvas"), a Session Summary Card appears:

```
This session taught me 3 new things about you:

1. You prefer visual over textual outputs         [Accept] [Reject]
2. This project has a budget constraint of ~$50k  [Accept] [Reject] [Edit]
3. You tend to branch when uncertain              [Accept] [Reject]

[Review All]  [Accept All]  [Skip]
```

Accepted items are promoted to Tier 0 or Tier 1. Rejected items are permanently discarded. Edited items are saved with the user's correction.

**Why this is the core PS06 moment:** Explicit, per-item consent with visible content — not a background process, not a toast notification.
**Demo moment:** Close the session. Review three inferences. Accept two, reject one. Reopen Memory Panel and show it updated.

---

#### A7. Inline Memory Scope Chips
**PS Track:** PS06, PS01 | **Priority:** MVP
**Research Basis:** A-MEM Zettelkasten notes (2026)

Nodes carrying user-relevant preference, constraint, or goal information carry a small inline chip: `[Session]` | `[Workspace]` | `[Global]`. Clicking cycles through options with one frame of animation feedback. When scope changes to Global, a subtle pulse highlights all open branches in the Branch Rail — showing the memory now affects all of them.

The lowest-friction memory negotiation — embedded in the canvas object, requiring no panel navigation.

---

### 10B. EXPLAINABLE AI (XAI) FEATURES

#### B1. Reasoning Ribbon — "Thinking Out Loud"
**PS Track:** PS01 (primary) | **Priority:** MVP
**Research Basis:** "Seeing the Reasoning" (CHI 2026); CHI 2026 HCXAI workshop

A thin horizontal strip at the canvas bottom that narrates the AI's intermediate compilation steps in real time via Server-Sent Events:

```
Reading PDF → Extracting claims → Found 3 assumptions → Checking against existing nodes
→ Detected 1 contradiction → Organizing into 2 clusters → Done
```

**Design details:**
- Each step is **clickable** and expands to show the specific evidence for that step.
- The ribbon also surfaces uncertainty in plain language: "Could not determine if this is a constraint or assumption — treating as assumption. Click to change."
- The ribbon fades out 2 seconds after compilation completes. It communicates *process*, not *state* — it does not persist.
- The Status Pill (see C2) shows "Working..." during this time, providing ambient state alongside the ribbon's specific narration.

**Technical implementation note:** The ribbon is driven by structured JSON emitted mid-stream via GPT-4o's streaming API. Each `reasoning_step` event is a separate JSON object emitted before the final compilation output. This requires a strict system prompt enforcing the streaming format but does not require a second model call (see Section 17 for the implementation approach).

**Demo moment:** Drop a PDF. Watch the ribbon narrate compilation while nodes appear. The audience sees the AI thinking, not just the result.

---

#### B2. Assumption Audit Panel — Interactive Reasoning Inspection
**PS Track:** PS01 (primary) | **Priority:** MVP
**Research Basis:** Armstrong et al. (Visible Language 2025); Hippo (Pang et al., CHI 2025); CHI 2026 HCXAI

A collapsible right-side drawer listing every assumption the AI made while constructing the current canvas view.

**Per assumption:**
- **Statement:** Plain language — "I assumed this constraint is a hard limit, not a soft preference."
- **Confidence:** Visual bar (Low / Medium / High) — no raw percentages.
- **Source Badge:** "From PDF (page 4)" / "From your Core Memory" / "AI parametric (no source)."
- **Impact Halo:** Hovering any assumption simultaneously pulses every canvas node that depends on it. The blast-radius visualization is pre-computed, not computed on hover (see Section 17).
- **Actions:** [Accept] [Override with...] [Ask AI to reconsider] [Delete assumption]

**When the user overrides:** Dependent nodes pulse and the AI recomputes the affected subgraph. The ribbon narrates the recomputation. Only affected nodes update — no full re-render.

**Demo moment:** Hover over "AI assumed the market is B2B." Six nodes pulse amber simultaneously. User sees the blast radius instantly. Override it — canvas restructures.

---

#### B3. Epistemic Source Attribution — Provenance Badges
**PS Track:** PS01 (primary), PS06 (secondary) | **Priority:** MVP
**Research Basis:** Armstrong et al. (2025); CHI 2026 HCXAI workshop

Every node carries a small **Provenance Badge**:

| Badge | Color | Meaning |
|---|---|---|
| 📄 | Blue | Sourced from a dropped artifact — with page/line reference |
| 🧠 | Green | Drawn from Core Memory (confirmed user fact) |
| 🔬 | Yellow | AI inference from current canvas context |
| 🌐 | Red | AI parametric knowledge — no document source. Treat with skepticism |
| ✏️ | White/outline | User-created directly |

Hovering a badge shows the full provenance chain in a tooltip. A **Source Filter** (toolbar icon) temporarily dims everything except the selected source type — e.g., "show me only document-sourced nodes."

**Critical design rule:** The 🌐 red badge is the hallucination-risk signal. Users who can immediately identify AI parametric claims can apply appropriate skepticism.

---

#### B4. Confidence Topology — Spatial Uncertainty Encoding
**PS Track:** PS01 (primary) | **Priority:** Differentiator
**Research Basis:** Armstrong et al. (2025); CHI 2026 CURE workshop

Confidence is encoded in canvas visual properties, gated behind the Trust Lens toggle:

- **Node border sharpness:** High confidence = crisp border. Low confidence = soft, feathered edge.
- **Edge line style:** High = solid. Medium = dashed. Low = dotted. Contradictions = always red.
- **Cluster fill opacity:** Average confidence of member nodes. Uncertain clusters look translucent.

**Design constraint:** Trust Lens is off by default. Always-on visual complexity fatigues users (P10). The toggle is the reconciliation between Armstrong et al.'s finding (visual weight works) and the cognitive load principle (not when it's always on).

---

#### B5. Counterfactual Branches
**PS Track:** PS01 (primary), PS06 (secondary) | **Priority:** Differentiator
**Research Basis:** Counterfactual XAI (VISIGRAPP 2025, CHI 2026 HCXAI)

From any Assumption node, right-click → "What changes if I remove this?"

1. Creates a new Branch with the assumption deleted.
2. AI recompiles the affected subgraph only (not the full canvas).
3. Changed nodes are highlighted in amber (delta view).
4. A plain-language summary: "Removing this assumption would affect 4 nodes and surface 1 hidden contradiction."

User can discard the branch or promote it to a named branch.

**Note on scope:** The recompile is scoped to the affected subgraph (nodes in `impact_nodes` of the deleted assumption). Not a full canvas recompile — this is why pre-computing `impact_nodes` at creation time is essential to hackathon feasibility.

---

#### B6. Reasoning Path Walk — Interactive "Why?" Navigation
**PS Track:** PS01 (primary) | **Priority:** Differentiator
**Research Basis:** CHI 2026 HCXAI "Reasoning Made Legible"; Hippo (CHI 2025)

Activating Trace on any node:
1. The canvas dims; only nodes in the reasoning chain remain fully visible.
2. A bottom card narrates each step in plain language.
3. [Why this step?] expands the current step; [Skip] jumps to the conclusion.
4. After the walk: "Did this reasoning make sense?" [Yes / Partly / No]. Stored and used to adjust future system prompt weighting.

---

#### B7. Contradiction Flag
**PS Track:** PS01 (primary) | **Priority:** MVP (flag), Differentiator (resolution panel)
**Research Basis:** MindTrellis (DIS 2026)

When the AI detects a contradiction:
1. Both nodes pulse red for 1 second.
2. A red edge with ⚡ appears between them (persists).
3. Hovering the edge shows: "These cannot both be true. [Node A] says X, [Node B] says Y."
4. (Differentiator) Clicking opens a Resolution Panel: [Keep A] [Keep B] [Create reconciling Assumption]

**MVP scope:** Steps 1-3. The visual flag is the critical PS01 signal.

---

### 10C. SPATIAL CANVAS FEATURES

#### C1. Core Canvas
**PS Track:** Both | **Priority:** MVP (foundational)

The primary interface is a react-flow spatial canvas:
- Infinite scroll/pan with smooth momentum physics.
- Multi-level zoom: branch overview → cluster → node detail.
- Direct manipulation: all nodes draggable, resizable, pinnable.
- AI-driven auto-layout with user override.
- Branch Rail: a persistent strip at the top (or left) showing active branches as tabs.
- Distinct visual treatments per node type (Section 11).

**"Space as memory" (P4):** The AI respects pinned positions. Spatial proximity when a user drags nodes together is treated as a user-expressed relationship.

---

#### C2. System Status Indicator (V3 — replaces and revises V2's micro-interactions approach)
**PS Track:** PS01 (secondary) | **Priority:** MVP
**Research Basis:** CHI 2025 animation micro-interaction studies; Norman's feedback principle (affordance + status visibility)

> **V3 Validation of V2's status companion removal:** Removing the anthropomorphic status orb was correct. However, V2's replacement (embedding all state in scattered micro-interactions) creates a new problem: there is no reliable place to look for ambient system state. If the AI is processing across multiple clusters simultaneously, the user has no single view of overall system state — they must monitor every cluster individually.
>
> **V3 Resolution:** Add a minimal, non-anthropomorphic **Status Pill** to the canvas header. A Status Pill is a standard UI convention (used in VS Code, GitHub Actions, browser loading indicators) — not a companion or a character. It takes up 80px × 24px in the header and has exactly two visible states. All per-element micro-interactions from V2 are retained; the Status Pill supplements them with ambient awareness.

**Status Pill design:**
- Located in the canvas header, right of the mode indicator.
- Two states only: `● Working...` (animated dot, blue) | `● Ready` (static dot, green).
- Clicking the Status Pill when in "Working..." state shows: "What Kleos is currently doing" — the last 3 Reasoning Ribbon steps as a compact tooltip. No navigation required.
- No states for "Error" or "Awaiting" at the pill level — those are communicated at the element level via micro-interactions (per V2 C2).

**Per-element micro-interactions (retained from V2):**

| AI State | Micro-interaction |
|---|---|
| **Compiling** | Reasoning Ribbon appears at bottom; Status Pill shows "Working..." |
| **Awaiting user decision** | Relevant UI element (Negotiation Card, overrideable Assumption) gently glows amber |
| **Ready / Idle** | Status Pill shows "Ready"; all animations stop |
| **Error / Blocked** | Affected node/cluster gains red border + inline message: "Compilation stopped — [See why]" |
| **Action available** | Subtle suggestion chip below relevant cluster: "I can merge these →" |

**Why this is better than V2's pure micro-interaction approach:** The Status Pill answers "is anything happening right now?" without requiring the user to scan the canvas. Per-element micro-interactions answer "what is happening *here*?" Both questions are legitimate and require different UI levels.

---

#### C3. Thinking Timeline
**PS Track:** PS01 (primary), PS06 (secondary) | **Priority:** Differentiator
**Research Basis:** ImaginationVellum (UIST 2025); CHI 2025/2026 "Tools for Thought" workshops

A horizontal scrubber toggled by a clock icon in the toolbar (not permanently visible):
- Keyframe thumbnails at major milestones (after each Drop, Branch, Merge).
- Each keyframe annotated with its trigger: "You dropped the competitor analysis PDF."
- Clicking any keyframe jumps to that canvas state.
- (Post-Hackathon) Delta View: side-by-side diff between two keyframes.

**Constraint:** The Timeline must never be permanently visible. It consumes 15-20% of canvas vertical space with minimal benefit during active work. Toggle only.

---

#### C4. Compare Mode — Parallel Branch Side-by-Side
**PS Track:** PS01 (primary) | **Priority:** MVP (basic), Differentiator (with diff overlay)

Two branches displayed side by side with auto-highlighted differences:
- Branch Rail → "Compare" action pins two branches side by side.
- Auto-diff: nodes in one but not the other (amber), changed clusters, new contradictions.
- (Differentiator) Constraint Ranking Overlay: slider adjusts a constraint weight, branches re-rank in real time.

---

#### C5. Voice Input
**PS Track:** Both | **Priority:** Differentiator
**Research Basis:** Orality (CHI 2026)

Voice input via Sarvam AI (STT) → GPT-4o (node extraction). Grammar verbs are voice-addressable: "Branch on the cost assumption," "Compare these two," "Explain this cluster," "Why is this here?"

**V3 MVP scope decision:** Voice is moved to Differentiator. The Sarvam AI integration (API setup, audio capture, error handling for failed transcriptions, latency management) is a full feature track that risks consuming 6-8 hours of the 48-hour window. Voice significantly enhances the demo but is not required for the PS01/PS06 demonstrations. A fallback text input achieves the same interaction at lower implementation risk.

**If voice is implemented:** It demonstrates Kleos's contextual awareness of the hackathon audience (Indian language support). If time does not permit, the demo explicitly mentions voice as a V1 feature.

---

#### C6. Inline Questioning
**PS Track:** Both | **Priority:** Differentiator

On any node/edge/cluster: a compact "?" affordance opens a focused query field. Suggested questions: "Why is this here?" / "What supports this?" / "What if this were false?" (spawns Counterfactual Branch). The answer appears as a small inline card attached to the node. The card can be pinned (becoming an annotation) or dismissed.

---

#### C7. Quick Override (Workspace Mode Per-Cluster)
**PS Track:** Both | **Priority:** Differentiator
> See Section 9 for full specification.

Right-click any cluster → "Override mode for this cluster" → temporary local reasoning variation without changing global mode. Cluster shows a small colored badge indicating the override. Override expires at session end.

---

### 10D. GOVERNANCE & TRUST FEATURES

#### D1. Incognito Mode
**PS Track:** PS06 (primary) | **Priority:** MVP
Session mode where nothing is saved to any memory tier. Visual indicator: subtle dark chrome border + "Incognito" badge in the canvas header. Session data discarded at close; Session Memory Audit is skipped.

#### D2. Pause / Stop Controls
**PS Track:** Both | **Priority:** MVP
- **Pause:** Halt AI compilation mid-stream. Reasoning Ribbon shows what was processed. Canvas shows partial nodes.
- **Stop:** Cancel entirely. Affected nodes revert to pre-operation state.
- **Action Plan Preview (Strategic Mode only):** Before complex multi-step mutations, the AI shows an editable plan for user approval.

#### D3. Activity Log
**PS Track:** Both | **Priority:** Differentiator
A read-only overlay (accessible via toolbar icon) listing canvas operations with timestamps and authorship (user vs. AI). Fades after 10 seconds. Shows that AI actions are audited.

---

### 10E. EXPORT FEATURES

> See Section 18 for the complete Export System specification.

---

## 11. INFORMATION ARCHITECTURE

### Node Types (8 types)

| Node Type | Definition | Visual | Key Metadata |
|---|---|---|---|
| **Idea** | A candidate concept, direction, or solution | Rounded rectangle, blue | Confidence, provenance, relationships |
| **Evidence** | A fact or data point supporting or challenging an idea | Solid rectangle, green | Source artifact + location, confidence |
| **Assumption** | An unverified belief the reasoning depends on | Dashed rectangle, amber | Confidence, source, impact_node_ids |
| **Question** | An open gap the canvas has not resolved | Circle with ?, purple | Status (open/answered) |
| **Constraint** | A hard boundary condition | Hexagon, red | Type (budget/time/technical), hardness |
| **Insight** | A synthesized realization connecting other objects | Diamond, teal | Provenance chain, contributing nodes |
| **Decision** | A committed choice that closes competing branches | Bold border, gold | Timestamp, active mode at commit time |
| **Source** | The original artifact a node was compiled from | Folder icon | File type, page/line references |

### Shared Metadata on Every Node
- **Relationships:** supports, contradicts, depends_on, derived_from (typed, directional edges)
- **Confidence:** low / medium / high (visual bar on hover; spatial encoding via Trust Lens toggle)
- **Provenance Badge:** one of 5 epistemic source types
- **Memory tier tag:** if the node was derived from or stored in a memory tier
- **Scope chip:** Session / Workspace / Global (on memory-capable nodes)
- **impact_nodes:** list of node IDs that depend on this node (pre-computed; used by Impact Halo and Counterfactual Branch)

---

## 12. INTERACTION GRAMMAR (THE VERBS)

12 named verbs. "Named" means: (1) the user can speak the verb by voice, (2) the UI surfaces the verb as a primary affordance, and (3) the AI can invoke the verb via tool-calling. Standard canvas interactions (zoom, pan, filter by drag-select) are not named verbs.

| Verb | Description | Voice Trigger |
|---|---|---|
| **Drop** | Introduce any artifact as raw matter for compilation | "Drop [file / idea]" |
| **Pin** | Lock a node's position; AI will not auto-move it | "Pin this" |
| **Merge** | Combine two or more nodes into a single richer node | "Merge [A] and [B]" |
| **Split** | Break one node into its constituent sub-ideas | "Split this" |
| **Branch** | Fork the current canvas into a parallel branch | "Branch on [assumption]" |
| **Collapse** | Fold a cluster into a single summary node, reversibly | "Collapse [cluster]" |
| **Commit** | Reconcile a branch back into the main canvas | "Commit this branch" |
| **Rewind** | Step the canvas backward through its event history | Timeline scrubber |
| **Compare** | Display two branches side-by-side | "Compare branches" |
| **Trace** | Follow the causal/evidentiary chain — initiates Reasoning Walk | "Why [node]?" |
| **Counterfactual** | Branch with a specific assumption deleted | "What if [assumption] were false?" |
| **Anchor** | Tie a node permanently to its source artifact | "Anchor to source" |

---

## 13. MEMORY ARCHITECTURE

### Memory Tiers (Canonical Definition)

```
┌─────────────────────────────────────────────────────┐
│  TIER 0: CORE MEMORY                                │
│  Permanent. User-ratified. Cross-session. Persists  │
│  until explicitly archived or deleted.              │
│  Examples: professional context, goals, confirmed   │
│  preferences, decision patterns                     │
├─────────────────────────────────────────────────────┤
│  TIER 1: SESSION MEMORY                             │
│  Expires when the Canvas is closed (on demand or    │
│  on explicit close). Scoped to one canvas/project.  │
│  Never promoted automatically without user consent. │
│  Examples: "In this session, optimize for cost"     │
├─────────────────────────────────────────────────────┤
│  TIER 2: INFERRED MEMORY                            │
│  AI-proposed. Awaiting explicit user ratification.  │
│  NEVER included in LLM prompt context until         │
│  accepted. Shown with ❓ badge in Pending tab.      │
│  Examples: "Seems you prefer bullet outputs"        │
├─────────────────────────────────────────────────────┤
│  TIER 3: SOURCE MEMORY                              │
│  Tied to a specific dropped artifact. Inherits the  │
│  artifact's lifecycle. Auto-archived when the       │
│  source artifact is removed from the canvas.        │
│  Examples: Claims extracted from a dropped PDF      │
└─────────────────────────────────────────────────────┘
```

### Memory Retrieval Architecture (Prompt Construction Order)

At prompt construction time, context is assembled in this priority order:
1. **Workspace Mode system prompt** (configures reasoning posture and memory weighting).
2. **Tier 0 (Core)** — all active core memories, filtered by Workspace Mode's domain relevance.
3. **Tier 1 (Session)** — all session memories for the current canvas (truncated to most recent 10 if many).
4. **Tier 3 (Source)** — memories from artifacts dropped in the current canvas, pulled by semantic similarity to the current operation (top-N by ChromaDB relevance score).
5. **Tier 2 (Inferred)** — **never included until explicitly accepted by user.**
6. **Canvas state snapshot** — current subgraph serialized as structured JSON (see Section 17 for token budgeting).

This ordering reflects the trust hierarchy: user-ratified permanent facts > user-confirmed session context > document sources > AI inferences.

### The Three Levels of Memory Negotiation
1. **Inline** (lowest friction): Scope chips on individual canvas nodes (A7).
2. **Contextual** (medium friction): Memory Negotiation Card at natural pause points (A2).
3. **Deliberate** (highest agency): Memory Panel CRUD (A3, A4).

---

## 14. EXPLAINABILITY ARCHITECTURE

### The Transparency Loop (PS01)

```
Drop artifact
    → Status Pill shows "Working..."
    → Reasoning Ribbon narrates compilation (B1)
    → Nodes appear with Provenance Badges (B3)
    → Status Pill returns to "Ready"
    → Confidence Topology available via Trust Lens toggle (B4)
    → Assumption Audit Panel reveals hidden beliefs (B2)
        → User hovers assumption → Impact Halo shows blast radius
        → User overrides assumption → Canvas updates
        → Or: Counterfactual Branch shows impact without commitment (B5)
    → Reasoning Walk explains any node's origin (B6)
    → Decision committed with provenance recorded
    → Session closes with Memory Audit (A6)
```

### Explanation Depth by Workspace Mode

| Mode | Default Reasoning Style | Source Detail | Counter-argument Behavior |
|---|---|---|---|
| **Analytical** | Evidence-first — every claim has a source badge | Always shown | None |
| **Creative** | Narrative — plain language; sources on hover | Hidden by default | None |
| **Critical** | Adversarial — counter-claim node for every accepted claim | Shown for counters | Maximum |
| **Strategic** | Synthesis — focuses on unresolved tensions and convergence | Shown for key decisions | Moderate |

---

## 15. SPATIAL CANVAS DESIGN

### Layout Principles
- **Semantic proximity matters:** AI-placed nodes that are near each other are thematically related. User drag overrides create implicit "user-asserted relationship" edges.
- **Cluster backgrounds:** Groups of related nodes share a colored translucent background with a text label naming the theme.
- **Branch Rail:** Branches are managed in the Rail (top or left edge strip), not as canvas objects. Only one branch is visible on the main canvas at a time; Compare mode shows two.
- **Canvas entropy signal:** When node density is high but cluster structure is low, a suggestion chip appears: "These nodes seem disconnected. Want me to try clustering them?"

### Visual Encoding (Active by Default)

| Property | What It Encodes |
|---|---|
| Node border color | Epistemic source type (matches Provenance Badge color) |
| Edge line style | Relationship confidence: solid / dashed / dotted |
| Edge color | Relationship type: blue=supports, red=contradicts, gray=derived_from |
| Inline scope chip | Memory scope: Session / Workspace / Global |

### Additional Visual Encoding (Trust Lens active only)

| Property | What It Encodes |
|---|---|
| Node border sharpness | Confidence: crisp = high, feathered = low |
| Cluster fill opacity | Average confidence of member nodes |

**Rationale for the split:** Always-on visual complexity fatigues high-cognition users during active work. Trust Lens enables the full encoding for deliberate trust audits without imposing it as a default state.

### Canvas States

| State | Description |
|---|---|
| **Exploration** | AI auto-layouts continuously as new matter is dropped |
| **Pinned** | One or more nodes are pinned; AI respects their positions |
| **Compare** | Two branches displayed side by side |
| **Reasoning Walk** | Canvas dims; only reasoning chain nodes fully visible |
| **Trust Lens** | Confidence topology overlay applied |

---

## 16. AI SYSTEM DESIGN & ORCHESTRATION

### The Critical Scope Statement
**Kleos does not build novel AI. It is an HCI layer on top of mature AI APIs.**

All AI capability is achieved through:
1. **System prompt engineering** — Workspace Mode configures the model's reasoning posture per call.
2. **Structured output (JSON mode)** — GPT-4o produces typed node objects, reasoning chains, and assumption lists in a defined schema.
3. **Tool calling** — The AI invokes canvas verbs as tool functions rather than outputting text instructions. Standard OpenAI function-calling API.
4. **Streaming** — Server-Sent Events stream intermediate reasoning steps for the Reasoning Ribbon.
5. **Retrieval** — ChromaDB semantic search retrieves relevant memory items and source chunks for context construction.

### AI Tool-Calling Architecture

The AI operates as an **agent with a defined tool vocabulary**. It does not invent behavior — it calls registered functions:

```json
{
  "tools": [
    {"name": "create_node", "description": "Add a new typed node to the canvas"},
    {"name": "create_edge", "description": "Link two nodes with a typed relationship"},
    {"name": "flag_contradiction", "description": "Mark two nodes as contradicting"},
    {"name": "create_branch", "description": "Fork the canvas into a new branch"},
    {"name": "merge_nodes", "description": "Combine two nodes into one"},
    {"name": "collapse_cluster", "description": "Fold cluster into summary node"},
    {"name": "propose_memory", "description": "Queue a Tier 2 memory for user ratification"},
    {"name": "emit_reasoning_step", "description": "Emit a step to the Reasoning Ribbon"}
  ]
}
```

Every action is logged in the Event Log, auditable via the Activity Log, and reversible via Rewind. This is the technical embodiment of P3 ("the AI never hides its reasoning").

### Structured Output Schema (per compilation call)

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
    {"step": 1, "action": "extracted_from_pdf", "detail": "page 3, paragraph 2", "confidence": "high"},
    {"step": 2, "action": "classified_as", "type": "assumption", "reason": "hedged language: 'likely', 'assumed'"}
  ],
  "contradictions": [
    {"node_a": "id1", "node_b": "id2", "explanation": "Node A claims X while Node B claims not-X"}
  ],
  "proposed_memories": [
    {"tier": 2, "text": "User prefers cost optimization over speed", "trigger": "mentioned cost 3 times"}
  ]
}
```

This single structured output simultaneously drives: Reasoning Ribbon, Assumption Audit Panel, Provenance Badges, Contradiction Flags, and Memory Negotiation Card triggers — all from one LLM call.

### Streaming Architecture

The Reasoning Ribbon requires intermediate output before the final compilation result. Implementation:

1. **Primary approach:** GPT-4o with streaming enabled. The system prompt instructs the model to emit `{"event": "reasoning_step", "step": N, "text": "..."}` JSON objects as it processes, followed by the final compilation output. This works with GPT-4o's streaming API but requires careful prompt design to ensure reliable intermediate events.
2. **Fallback approach (if primary is unreliable in prototype):** Two sequential calls — a fast GPT-4o-mini call that generates the reasoning steps list first, streaming its output to the ribbon; followed by the primary GPT-4o call for the full compilation. This adds ~500ms of latency but guarantees ribbon content.

**V3 Engineering Note:** The streaming approach should be prototyped in the first 4 hours. If the primary approach proves unreliable within the prototype, switch immediately to the fallback. Do not spend more than 2 hours debugging streaming reliability during the hackathon.

---

## 17. LLM COST & TOKEN ARCHITECTURE

> **V3 Revision:** V2 had two conflicting token caps — a "4,000-token context cap" described as a "practical limit for hackathon demo" (which would be too small even for a single Drop operation costing 3,000–8,000 tokens) AND a "soft token cap of 10,000 tokens per session." These contradicted each other and the actual GPT-4o context window. V3 resolves this by (1) clearly stating the technical limit, (2) defining per-operation cost budgets, and (3) replacing vague global caps with a context compression trigger.

### Technical Limits vs. Cost/Latency Thresholds

| Dimension | Technical Limit | Cost/Latency Threshold | Action When Threshold Exceeded |
|---|---|---|---|
| GPT-4o context window | 128,000 tokens | 20,000 tokens per call | Trigger context summarization |
| Per-session cumulative spend | No hard API limit | $2.00 per session (demo) | Show "Context getting large" prompt |
| Single compilation call | 128K token window | 12,000 tokens per call | Chunk the input; process in parts |

**Why 20K per call (not 128K):** GPT-4o pricing is per token. A 128K context call costs ~$0.38 per call at current pricing. Sustainable demo sessions need to stay under 20K per call for cost control without compromising quality.

### Model Routing Strategy

| Task | Model | Rationale | Typical Cost |
|---|---|---|---|
| Primary compilation (Drop → nodes) | GPT-4o | Best structured output + vision + tool-calling | $0.005–0.040 per op |
| Reasoning Ribbon steps (fallback) | GPT-4o-mini | 10× cheaper; sufficient for step narration | $0.0003 per op |
| Contradiction detection | GPT-4o-mini | Binary task; high throughput; latency-sensitive | $0.0002 per op |
| Memory pattern detection | GPT-4o-mini | Lightweight classification; runs in background | $0.0001 per op |
| Session Memory Audit | GPT-4o-mini | Classification of session patterns; not quality-critical | $0.001 per op |
| Counterfactual Branch recompile | GPT-4o | Quality-sensitive; scoped to impact subgraph | $0.005–0.020 per op |
| Voice transcription | Sarvam AI STT | Multilingual, cost-effective | Per-second pricing |
| Semantic similarity | text-embedding-3-small | Low cost, high volume | $0.00002 per 1K tokens |

### Per-Operation Token Budgets

| Operation | Context Budget | Output Budget | Notes |
|---|---|---|---|
| Drop: PDF (10 pages) | 6,000–10,000 tokens | 2,000–4,000 tokens | Chunked; top-N relevant chunks by ChromaDB |
| Drop: plain text paste | 500–2,000 tokens | 500–1,500 tokens | Direct extraction; no chunking needed |
| Assumption Audit | 3,000–5,000 tokens | 500–1,000 tokens | Current canvas subgraph + memories |
| Contradiction detection | 500–1,000 tokens | 100–200 tokens | New node pairs only |
| Memory Negotiation Card | 200–400 tokens | 50–100 tokens | GPT-4o-mini; watches session events |
| Counterfactual Branch | 2,000–6,000 tokens | 1,000–3,000 tokens | Scoped to impact_nodes subgraph |
| Session Memory Audit | 500–1,500 tokens | 200–500 tokens | Session events summary |
| Export Reasoning Summary | 4,000–8,000 tokens | 500–1,000 tokens | Full canvas state → narrative |

### Context Window Management

The LLM does not receive the entire canvas on every call. Context is constructed using:

**1. Subgraph scoping:** Only canvas nodes semantically related to the current operation are included. For a Drop, only nodes within semantic distance < threshold (ChromaDB). For an Assumption override, only the affected subgraph (impact_nodes).

**2. Cluster summarization:** A cluster of N nodes is represented as a 3-sentence summary + the 2 most-connected nodes in full, unless the operation directly concerns a node in that cluster. This typically compresses canvas context by 70-85%.

**3. Tiered memory truncation:** Tier 0 (Core) — all items included. Tier 1 (Session) — most recent 10 items. Tier 3 (Source) — top-N by ChromaDB relevance to current operation, not all at once.

**4. Context compression trigger:** When the assembled context exceeds 15,000 tokens, Kleos shows: "The workspace context is getting large. Would you like me to summarize older clusters to free up context?" The Collapse verb, when invoked, also reduces context size — a dual benefit communicated to the user.

**5. Demo caching:** All LLM responses for scripted demo beats are pre-cached as JSON fixtures. Zero live API calls during critical demo moments.

### Cost Guardrails (Hackathon Demo)
- The $2.00 per-session threshold is a soft warning, not a hard block.
- If exceeded, a subtle chip appears in the canvas header: "Session context is large — Collapse older clusters to reduce."
- The demo script's pre-cached responses mean the scripted beats never consume live tokens.

---

## 18. EXPORT SYSTEM

> **V3 Revision:** User-facing exports remain Markdown + PDF only, with a fixed branded template. A machine-readable JSON export is added for persistence, auditability, and future import — but is accessible only via the Settings menu / API endpoint, not in the primary export UI.

### The Branded Template (Applied to All User-Facing Exports)

Every export follows a fixed structure. The format is identical across all export types — only the sections included change.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KLEOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Canvas: [Canvas Name]
Created: [Date] | Last Modified: [Date]
Workspace Mode: [Analytical / Creative / Critical / Strategic]
Session: [N branches, N nodes, N edges, N decisions]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Problem Statement
[Auto-populated from the Question or Constraint node marked as the primary problem]

## Key Assumptions
[All Assumption nodes, sorted ascending by confidence — most uncertain first]
| # | Assumption | Confidence | Source | Affects (N nodes) |
|---|---|---|---|---|

## Evidence
[All Evidence nodes, grouped by source artifact]

## Decisions Made
[All Decision nodes with their provenance summary and mode at time of commit]

## Open Questions
[All Question nodes still marked "open"]

## Reasoning Summary
[AI-generated synthesis of the session — generated at export time from canvas state]

## Memory Context (PS06 Transparency)
[All Core and Session memories active during this session]
[All memories proposed but rejected — included for auditability]

## Branches Explored
[All branches with a one-line summary and their status: active / committed / discarded]

## Session Metadata
[Workspace Mode history | Model used | Total tokens used | Export timestamp]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Exported from Kleos | [timestamp]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### User-Facing Export Types

| Export Type | Sections Included | Ideal For |
|---|---|---|
| **Full Canvas Export** | All sections | Hackathon submission, documentation |
| **Decision Summary** | Problem Statement, Key Assumptions, Evidence, Decisions Made | Sharing with stakeholders |
| **Research Notes** | Evidence, Open Questions, Reasoning Summary, Memory Context | Academic / synthesis use |

### Machine-Readable Export (JSON) — Not in Primary UI
**V3 addition:** A full JSON export of the canvas data model is available via Settings → "Export data (JSON)" or via a `GET /api/canvas/{id}/export` endpoint.

**This is not a user-facing feature.** It does not appear in the export dialog. It exists for:
1. **Persistence:** Allows the full canvas to be re-imported into a future Kleos instance.
2. **Auditability:** Provides a complete, human-inspectable record of all nodes, edges, relationships, memory items, and event log entries.
3. **Interoperability:** Enables future integrations (import into other tools, research analysis).

**Why not user-facing:** The JSON is a developer artifact — not a readable document. Exposing it in the primary UI would create confusion ("which one do I download?") without adding value for the target user personas.

### Implementation
- **Markdown:** Template rendering from the canvas data model. Standard string formatting. No external library.
- **PDF:** Markdown → PDF via `marked.js` (render) + `puppeteer` (PDF generation) with a branded CSS stylesheet. PDF generation takes 2-6 seconds — show a loading state.
- **JSON:** Direct serialization of the canvas data model. Instant generation.

### What Exports Preserve
- Headings and hierarchy from cluster structure.
- All citations and source references (file name + page number).
- Node lists as Markdown tables.
- Code blocks (if Code nodes exist).
- Assumption, memory, and reasoning metadata.
- Workspace Mode history at time of export.
- All proposed-but-rejected memories (for PS06 auditability).

### What Exports Do Not Preserve
- Spatial canvas layout (not meaningful in a linear document).
- Real-time animations.
- Confidence topology visual encoding (represented instead as Confidence column in assumption tables).

---

## 19. SUPPORTED INPUTS

> **V3 Addition / Revision:** V2's input table was limited to 6 formats. This section expands the audit to cover formats relevant to the target personas, with honest priority labeling.

**Guiding question for each format:** Does supporting this format materially improve the product for the target personas (Synthesizer, Researcher, Builder), or is it complexity for its own sake?

### Input Priority Tiers
- **MVP:** Required for the demo. Core drop interactions depend on it.
- **Should Have:** Significantly improves one or more personas; achievable in the hackathon with focused effort.
- **Nice to Have:** Meaningful improvement; feasible post-hackathon.
- **Future:** Worth considering in V2+; too complex for hackathon scope.

### Supported Inputs Table

| Format | Priority | API / Method | Output Node Types | Persona Benefit |
|---|---|---|---|---|
| **PDF** | MVP | PyMuPDF → GPT-4o structured extraction | Idea, Evidence, Assumption, Constraint | All personas; core use case |
| **Plain text (paste)** | MVP | GPT-4o structured extraction | Any type | All personas; zero-friction input |
| **DOCX (Word)** | Should Have | python-docx → text → GPT-4o | Idea, Evidence, Assumption | Synthesizer (strategy docs), Researcher (paper drafts); very common format |
| **URL (web page)** | Should Have | requests + BeautifulSoup → GPT-4o | Evidence, Competitive Intel | Synthesizer (competitor sites), Builder (docs sites) |
| **PPTX (PowerPoint)** | Should Have | python-pptx → slide text/images → GPT-4o | Idea, Constraint, Evidence | Synthesizer (strategy decks); highly common in target personas |
| **Image / Screenshot** | Should Have | GPT-4o Vision | Concept, Evidence | Builder (architecture diagrams), Researcher (figures from papers) |
| **GitHub repo URL** | Should Have | GitHub API → README + structure → GPT-4o | Constraint, Architecture Idea | Builder persona specifically |
| **CSV / XLSX** | Nice to Have | pandas → describe → GPT-4o | Evidence, Constraint | Researcher (data tables), Builder (pricing/comparison tables) |
| **Voice memo / Live speech** | Nice to Have (Sarvam AI) | Sarvam AI STT → GPT-4o extraction | Idea, Question | All personas; contextually relevant for Indian-language speakers |
| **Source code files** | Nice to Have | tree-sitter / AST → GPT-4o | Constraint, Architecture Idea | Builder (local code review vs. remote repo) |
| **Video (transcript)** | Future | Whisper/Sarvam transcription → GPT-4o | Idea, Evidence | All personas (meeting recordings, lecture notes) |
| **Audio file** | Future | Sarvam AI STT → GPT-4o | Idea, Evidence | Similar to voice memo but file-based |

### V3 Notes on Input Decisions

**DOCX (Should Have):** The target personas work heavily in Word documents — strategy briefs, research papers, investment memos. `python-docx` is a mature, zero-setup library. Adding DOCX support is ~2 hours of work and significantly reduces friction for the most common document type after PDF.

**PPTX (Should Have):** Strategy consultants (the Synthesizer persona) work primarily in PowerPoint. `python-pptx` extracts text from slide elements and speaker notes. Images in slides can be sent to GPT-4o Vision. Adding PPTX is ~3 hours and covers a critical persona gap.

**URL (Should Have):** Important for competitive intelligence (Synthesizer), documentation reading (Builder), and paper sites (Researcher). Use `requests` + `BeautifulSoup` for static pages. Note: dynamic pages (SPAs) require Playwright — this adds complexity. For hackathon: support static URLs only. Playwright is Post-Hackathon.

**CSV/XLSX (Nice to Have):** Useful for comparison tables, pricing data, and research data. Not core to the PS01/PS06 demo. `pandas` + GPT-4o ("describe this dataset and extract key constraints and evidence") is straightforward. Move to post-hackathon if time is tight.

**Voice (Nice to Have in MVP):** Moved from Differentiator to Nice to Have for the MVP build. The Sarvam AI integration (audio recording, API calls, error handling for failed transcriptions, latency management on the frontend) takes 6-8 hours. Voice enhances the demo significantly but is not required for PS01/PS06 demonstrations.

---

## 20. USER WORKFLOWS

### Workflow 1: First Use (Onboarding)
1. User arrives at Kleos. A **Mode Selector** is the first screen — "What kind of thinking are you doing today?" with the four modes and one-line descriptions of each.
2. Canvas opens with the selected mode active and visible in the header. Status Pill shows "Ready."
3. Suggestion chips appear on empty canvas: "Drop your documents here," "Type an idea," "Describe what you're deciding."
4. User drops a PDF. Status Pill switches to "Working..." Reasoning Ribbon narrates compilation. Nodes appear with Provenance Badges. Status Pill returns to "Ready."
5. An Incognito toggle in the header allows opting out before any memories are stored.

### Workflow 2: Deep Research Session (Analytical Mode)
1. User opens a saved canvas. Analytical Mode is restored. Status Pill: "Ready."
2. AI surfaces relevant Core Memories: "3 Core Memories are active. [Show memories →]"
3. User drops 3 new PDFs. Ribbon narrates. New nodes cluster with existing ones. Contradictions with previous nodes are flagged with ⚡ edges.
4. User opens Assumption Audit Panel. Hovers one assumption — 4 nodes pulse (Impact Halo). Overrides it. Canvas updates.
5. User activates Trace on an Insight node. Canvas dims. Reasoning Walk narrates the path from 2 PDFs to this synthesis.
6. Session closes. Session Memory Audit: 4 inferences, user accepts 3, edits 1.

### Workflow 3: Options Exploration (Strategic Mode)
1. User has a main canvas with 3 architecture options as clusters.
2. User says (or types) "Branch on the high-cost assumption." AI creates Branch 2. Status Pill: "Working..." then "Ready."
3. User activates Compare mode. Branches 1 and 2 appear side by side. Differences are amber.
4. User right-clicks the "Cost Assumptions" cluster in Branch 2 → Quick Override → Critical Mode. Counter-argument nodes appear for that cluster only.
5. User commits Branch 2 as the main canvas with a "Decision: Chose Architecture A for resilience" Decision node.

### Workflow 4: Export
1. User completes a synthesis session. Canvas is in Strategic Mode.
2. User clicks Export → "Decision Summary" → chooses Markdown or PDF.
3. Export generates (2-6 seconds for PDF). User reviews, optionally redacts a personal memory item, and downloads.
4. (If needed) User accesses Settings → "Export data (JSON)" for a full machine-readable backup.

---

## 21. TECHNICAL ARCHITECTURE

### Stack Overview

```
FRONTEND (React + TypeScript)
├── Canvas Engine: react-flow (nodes, edges, drag, zoom, pan)
├── Branch Rail: custom tab strip component
├── Status Pill: header component (2-state: Working / Ready)
├── Memory Panel: React list with Tier tabs (left slide-out)
├── Assumption Audit Panel: React drawer (right side, collapsible)
├── Reasoning Ribbon: SSE-driven status bar (bottom, transient)
├── Voice Layer (optional): Sarvam AI STT/TTS + Web Audio API
└── Export: marked.js (Markdown render) + puppeteer (PDF)

BACKEND (Python FastAPI)
├── LLM Orchestration: OpenAI Python SDK (tool-calling + streaming)
├── Memory Service: SQLite with 4-tier partitioned tables
├── Vector Store: ChromaDB local (node embeddings + memory embeddings)
├── Ingestion Pipeline: PyMuPDF, python-docx, python-pptx, requests
├── Event Log: SQLite events table (for Rewind/Timeline)
├── SSE Streaming: FastAPI StreamingResponse
└── JSON Export: FastAPI endpoint (canvas data model serialization)

AI SERVICES (External APIs only — no custom models)
├── GPT-4o: Primary compilation, structured output, tool-calling
├── GPT-4o-mini: Contradiction detection, memory classification, Session Audit
├── text-embedding-3-small: Semantic similarity (ChromaDB embeddings)
└── Sarvam AI (optional): Multilingual STT + TTS
```

### Node Data Model

```json
{
  "id": "uuid",
  "type": "idea | evidence | assumption | question | constraint | insight | decision | source",
  "text": "...",
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

### Event Log Schema (for Rewind / Timeline)

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

### Hackathon Tech Stack Rationale

| Component | Choice | Rationale |
|---|---|---|
| Canvas rendering | react-flow | Battle-tested, rich API, 300+ node performance, sufficient for demo |
| Graph store | In-memory dict + SQLite | No Neo4j setup; relationships stored as JSON arrays in node records |
| Vector store | ChromaDB (local) | No external service; runs in-process; sufficient for <200 nodes |
| Primary LLM | GPT-4o | Best structured output + tool-calling; streaming support |
| Classification LLM | GPT-4o-mini | 10× cheaper; suitable for binary/classification tasks |
| Memory storage | SQLite (4 partitioned tables) | Simple, queryable, transactional, hackathon-ready |
| Streaming | FastAPI SSE | Browser-native; no WebSocket handshake complexity |
| Voice (if implemented) | Sarvam AI | Multilingual Indian language support; relevant to hackathon audience |
| PDF parsing | PyMuPDF | Fast, battle-tested; text extraction + page positioning |
| DOCX parsing | python-docx | Mature library; zero configuration |
| PPTX parsing | python-pptx | Mature library; slide text + notes extraction |
| URL scraping | requests + BeautifulSoup | Sufficient for static pages; no browser automation needed |
| Export | marked.js + puppeteer | Produces structured documents (not screenshots) |
| Embeddings | text-embedding-3-small via API | Cheapest embedding model; sufficient semantic similarity |

### Key Engineering Trade-offs

| Decision | Trade-off |
|---|---|
| In-memory graph (not Neo4j) | Fast setup, zero config; loses graph query power. Impact Halo queries run as O(N) list traversals — acceptable at demo scale (<100 nodes). |
| ChromaDB local (not Pinecone) | Zero external dependency; limited to local disk. Fine for hackathon; switch to managed vector DB post-hackathon. |
| SQLite for memory (not Redis) | Persistent, transactional; not real-time. Memory reads are <10ms at demo scale. |
| puppeteer for PDF | Clean output; 2-6 second generation time. Acceptable for export (not real-time). Requires Chromium installed on server. |
| react-flow (not tldraw) | Better node/edge data model; less free-form canvas behavior. Correct trade-off for a structured graph product. |
| GPT-4o-mini for classification | 10× cheaper; ~20% quality trade-off on nuanced tasks. Acceptable: contradiction detection and memory classification are simpler tasks than compilation. |

---

## 22. RESEARCH FOUNDATION

### Memory Architecture Research

| Work | Venue | Key Finding | Applied In |
|---|---|---|---|
| PersonaTree / "Inside Out" (Zhao et al.) | ACL 2026 | Hierarchical user-centric memory tree outperforms flat vector stores | A1 Four-Tier Architecture |
| Hindsight | Emergent Mind 2026 | Four-network memory with Retain/Recall/Reflect lifecycle | A1, Memory Retrieval Order |
| A-MEM | arXiv 2025 | Zettelkasten-style dynamic linking of memories | A7 Scope Chips |
| "Relational Gains, Privacy Strains" | CHI 2026 | Users prefer agency *before* information is stored, not after | A2 Negotiation Card, A6 Session Audit |
| "Ghost of the Past" | CHI 2025 | Proactive framing lands better than retroactive disclosure | A2 Negotiation Card |
| "Controllable Memory Usage" | Jan 2026 | Users want different persistence for different information types | A1, A2 |
| MindTrellis | DIS 2026 | Co-created knowledge structures through interactive visual exploration | A3 Memory Panel |
| FinMem | AAAI 2025 | Domain role-structured memory improves task-specific recall | Section 9 Workspace Modes |
| Agentic Memory survey | 2026 | Three-tier: episodic, semantic, procedural | A1 Tier design |

### Explainable AI Research

| Work | Venue | Key Finding | Applied In |
|---|---|---|---|
| Armstrong et al. MAVS | Visible Language 2025 | Visual weight communicates uncertainty more effectively than numerics | B4 Confidence Topology, B3 Badges |
| "Seeing the Reasoning" | CHI 2026 | Correct rationales and certainty cues increase trust | B1 Reasoning Ribbon |
| Hippo (Pang et al.) | CHI 2025 | Interactive reasoning tree significantly increased assumption awareness | B2 Assumption Audit |
| IXAII | arXiv 2025 | Five user groups need different explanation types | Section 9 Workspace Modes |
| Counterfactual XAI | VISIGRAPP 2025, CHI 2026 | Counterfactual + feature-importance combination preferred | B5 Counterfactual Branches |
| CHI 2026 HCXAI workshop | CHI 2026 | Explanation should be narrative; users need to know which layer produced info | B6 Reasoning Walk, B3 |
| CHI 2024 explorable explanations | CHI 2024 | Interactive visual heuristics encourage model behavior exploration | C6 Inline Questioning |

### Spatial Interface Research

| Work | Venue | Key Finding | Applied In |
|---|---|---|---|
| Orality (Li et al.) | CHI 2026 | Speech-first canvas significantly outperforms ChatGPT STT for complex thought clarification | C5 Voice Input |
| ImaginationVellum | UIST 2025 | Spatial canvas as prompt space; temporal replay of ideation | C3 Thinking Timeline |
| MindTrellis | DIS 2026 | Graph representations enhance critical thinking | C1 Core Canvas |
| CHI 2025/2026 "Tools for Thought" | CHI | Revisiting the *process* of thinking is a key gap in AI tools | C3 Thinking Timeline |

### Design Pattern Libraries

| Library | Key Patterns Applied |
|---|---|
| Shape of AI (Amir Elion) | Wayfinders, Trust Builders, Memory patterns, Stream of Thought, Governors |
| IF Design Patterns Catalogue | Forget Learning, Epistemic Disclosure, Stop and Takeover, Minimal Sharing |
| AI UX Playground | Activity Log, Footprints, Autonomy Budget |

---

## 23. DESIGN DECISIONS & RATIONALE

### DD1: Four Memory Tiers (Not Two)
**Decision:** Four tiers over a simpler Global/Local binary.
**Rationale:** The Inferred Tier (Tier 2) is the core PS06 innovation. Without it, the AI either silently stores inferences (violates PS06) or never stores anything (loses value). The Inferred Tier creates a staging area where AI observations wait for user ratification. The Source Tier correctly scopes document-derived knowledge without permanently promoting it to personal facts.

### DD2: Spatial Uncertainty Encoding via Trust Lens Toggle
**Decision:** Encode confidence in visual node properties, gated behind a Trust Lens toggle (off by default).
**Rationale:** Armstrong et al. (2025) found visual weight outperforms numeric probability panels. The toggle resolves the P10 tension — the encoding is always *available* but not always *imposed*.

### DD3: Both PS01 and PS06
**Decision:** Target both tracks. Primary: PS01. PS06 as the memory substrate that makes PS01 trustworthy.
**Rationale:** The features share infrastructure. The argument is stronger together: the memory system gives the XAI system something to explain; the XAI system gives the memory system a reason to be trusted.

### DD4: Workspace Modes (Unified + Quick Override)
**Decision:** Unified Workspace Mode configures memory priority, reasoning posture, and explanation style simultaneously. Quick Override allows per-cluster variation without mode switching.
**Rationale:** Unification reduces learning cost. Quick Override prevents the rigidity that would otherwise force users to switch global modes for local reasoning needs. See Section 9 for full validation.

### DD5: Status Pill (Not a Companion, Not Pure Micro-interactions)
**Decision:** Add a minimal Status Pill to the canvas header alongside per-element micro-interactions.
**Rationale:** Pure micro-interactions (V2 approach) eliminated the reliable "single place to look" for ambient system state. The Status Pill restores this at minimal cognitive cost (standard UI convention; 2 states only). See Section 10 C2 for full validation.

### DD6: Markdown + PDF User Exports; Hidden JSON
**Decision:** Markdown + PDF for user-facing exports; JSON available via Settings/API for persistence/auditability.
**Rationale:** SVG/PNG snapshots are visual artifacts, not readable documents. JSON/GraphML raw exports are developer tools. Hiding JSON from the primary UI prevents confusion while preserving the capability for persistence and auditability.

### DD7: 12 Verbs
**Decision:** 12 named verbs. Standard canvas interactions (zoom, pan, drag-filter) are not named verbs.
**Rationale:** Named verbs are those that need active documentation, voice-addressability, and AI tool invocation. Standard interactions are already part of users' canvas mental models.

### DD8: Sarvam AI for Voice
**Decision:** Sarvam AI's multilingual STT/TTS over browser Web Speech API.
**Rationale:** The hackathon is at IIIT Pune × IIT Bombay. Sarvam AI provides best-in-class support for Indian languages — Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, plus English. This is contextually appropriate, not generic.

### DD9: DOCX and PPTX in Should Have Tier
**Decision:** Add DOCX and PPTX as Should Have inputs (achievable in hackathon; not MVP).
**Rationale:** The target personas (Synthesizer, Researcher) work heavily in these formats. python-docx and python-pptx are mature, zero-config libraries. Not supporting them creates friction for the most realistic demo scenarios.

### DD10: Voice Moved to Nice to Have (MVP Build)
**Decision:** Voice input moved from Differentiator (V2 MVP build hours 28-32) to Nice to Have for the hackathon MVP.
**Rationale:** Sarvam AI integration requires ~6-8 hours of frontend and backend work, error handling for failed transcriptions, and latency management. This competes directly with Export and UI polish in hours 28-40. Voice is explicitly mentioned in the demo script as a V1 feature if not implemented during the hackathon, which is an honest trade-off.

---

## 24. V3 CRITICAL REVIEW FINDINGS

> Documents issues found in V2 during V3 review. V1 findings (CR1-CR16) are maintained. V3 adds new findings (CR17 onwards).

### V2 Issues Resolved in V3

| # | Issue in V2 | Problem | Recommendation | Impact | Trade-offs | Priority |
|---|---|---|---|---|---|---|
| **CR17** | **Token architecture contradicted itself** | V2 had a "4,000-token context cap (practical limit for hackathon)" AND a "10,000 token/session soft cap." A single Drop operation costs 3,000–8,000 tokens, so 4K would fail on the first Drop. GPT-4o's actual context window is 128K. | Replace both global caps with per-operation budgets. Add a 20K-per-call cost/latency threshold (not a hard limit) and a context compression trigger. Clearly separate the technical limit (128K) from the safety threshold (20K). | Eliminates a fundamental architectural inconsistency that would have caused demo failures. | None — the replacement is strictly more accurate. | Must Have |
| **CR18** | **Pure micro-interactions leave no ambient state indicator** | V2 removed the status orb and replaced it with scattered per-element micro-interactions. This means there is no reliable single place to check "is anything happening right now?" | Add a minimal Status Pill (80px × 24px) in the canvas header with two states: "Working..." / "Ready." Retain all per-element micro-interactions from V2. | Users have one reliable ambient indicator without cognitive load overhead. Per-element interactions handle specific, contextual state. | Adds one small UI element to the header, but this is a standard UI convention (VS Code, GitHub) that adds zero learning cost. | Must Have |
| **CR19** | **Workspace Modes are rigid — no per-cluster variation** | V2 Workspace Modes combine memory and reasoning in one setting, which is correct for simplicity. But a user in Analytical Mode who wants to challenge one specific cluster must switch the entire global mode — which also changes memory behavior globally. | Add Quick Override: right-click any cluster → temporary per-cluster reasoning mode that doesn't affect global mode or memory behavior. | Resolves the rigidity without splitting the combined concept. Power users can access nuanced behavior without sacrificing the simplicity of the global mode for typical use. | Adds one context menu item. Minimal implementation complexity. | Should Have |
| **CR20** | **Input format audit was incomplete** | V2 listed 6 input formats. DOCX, PPTX, CSV/XLSX, and video were not addressed. The target personas (Synthesizer, Researcher, Builder) work heavily in DOCX and PPTX. | Add DOCX (Should Have), PPTX (Should Have), CSV/XLSX (Nice to Have), Video transcript (Future). Separate Section 19 for Supported Inputs with honest priority tiers. | Reduces friction for the most realistic use cases of the target personas. | DOCX and PPTX add ~5 hours of implementation work. Worth it. | Should Have |
| **CR21** | **Voice placed in build hours 28-32 as part of "Should Have MVP"** | V2 included Sarvam AI voice integration in hours 28-32 of the hackathon build, alongside Export. Voice integration takes 6-8 hours. This schedule was too optimistic for a two-person team. | Move voice to Nice to Have for the hackathon MVP. Document that if time permits, implement voice. If not, mention it as a V1 feature in the demo. | More realistic build schedule. The core demo (PS01 + PS06) does not require voice. | Voice is a strong differentiator (Sarvam AI multilingual). Its absence in the demo is a missed opportunity, not a failure. | Should Have |
| **CR22** | **Duplicate line in V2 Future Roadmap** | "Thinking Timeline full implementation with Delta View." appeared twice (lines 1374-1375). | Deduplicate. | Minor document integrity issue. | None. | Nice to Have |
| **CR23** | **"Thought Compiler" persisted in the Technical Scope Statement** | V2 Section 16 still read "Thought Compiler does not build novel AI." after the project was renamed in other sections. | Find and replace all occurrences of "Thought Compiler" → "Kleos." | Brand consistency. | None. | Must Have |
| **CR24** | **Error states not documented** | Neither V1 nor V2 documents what happens when: (1) an LLM call fails, (2) ChromaDB is unavailable, (3) a PDF fails to parse, (4) Sarvam AI is unreachable. | Add error state handling in Engineering Constraints: all failures must show an inline error on the affected node/panel and offer a retry. Canvas must never lose state due to a failed API call. | Prevents the demo from silently failing or showing a blank canvas mid-demo. | None — error handling should be implemented regardless. | Must Have |
| **CR25** | **Browser compatibility not specified** | V2 never specifies which browsers are supported, despite being a browser-based product. | Specify: Chrome (primary), Firefox (secondary), Safari (unsupported for the hackathon demo due to WebRTC and SSE differences). | Prevents browser-specific failures during the demo. | Restricts the audience to Chrome users for the hackathon. | Must Have |
| **CR26** | **File size limits not specified** | V2 does not specify maximum file sizes for PDF, DOCX, PPTX, or image uploads. | Specify: PDF max 20MB (covers ~200 pages), DOCX max 10MB, PPTX max 25MB, Image max 5MB. Show a clear error if exceeded: "File too large. Maximum is [X]MB for [type]. Try splitting the document." | Prevents silent failures and confusing UX during file uploads. | None. | Should Have |
| **CR27** | **CORS handling for URL ingestion not addressed** | Fetching external URLs from the browser is blocked by CORS. V2 specified this as a frontend feature, which is incorrect. | URL ingestion must be handled server-side (FastAPI makes the request, returns the content to the frontend). Document this explicitly. | Prevents a fundamental implementation error that would have broken URL ingestion entirely. | None — this is the correct implementation. | Must Have |
| **CR28** | **Keyboard shortcuts not mentioned** | V2 has no mention of keyboard shortcuts for the 12 named verbs. Power users (researchers, strategists) rely on keyboard shortcuts. | Define a minimal set of keyboard shortcuts for MVP: `B` = Branch, `M` = Merge, `C` = Compare, `T` = Trace, `Esc` = dismiss any panel/card, `P` = Pin. Document in the Glossary. | Significantly improves usability for power users with minimal implementation cost. | None — shortcuts are additive, not breaking. | Should Have |
| **CR29** | **Empty state design not specified** | What does the Assumption Audit Panel look like when there are no assumptions? What does the Memory Panel look like on first use? Neither V1 nor V2 addresses empty states. | Specify empty states: Assumption Audit Panel empty → "No assumptions detected yet. Drop content to begin." Memory Panel empty → "No memories stored yet. Kleos will only remember what you approve." | Empty states are critical first-use moments. Poor empty states create confusion and distrust. | None. | Should Have |
| **CR30** | **Puppeteer requires Chromium on server** | V2 specifies puppeteer for PDF generation without noting that this requires a Chromium installation on the backend server. This may be a problem depending on the demo environment. | Note the dependency explicitly. Alternative: use `pdfkit` (Python) or `reportlab` for PDF generation without Chromium. `pdfkit` uses wkhtmltopdf instead. | Prevents a silent server setup failure during the hackathon. | `pdfkit` output quality is lower than puppeteer. Use puppeteer if Chromium can be installed; fall back to pdfkit. | Should Have |
| **CR31** | **Rate limiting not addressed** | V2 does not address OpenAI API rate limits. During a hackathon demo with multiple team members testing, hitting rate limits mid-demo is a real risk. | Pre-cache all demo-path LLM calls. Set up exponential backoff for live calls. Document the rate limits: GPT-4o at Tier 1 = 500 RPM, 30,000 TPM. The demo's pre-caching strategy is the primary mitigation. | Prevents mid-demo API failures. | None — pre-caching is already planned. This formalizes it. | Must Have |
| **CR33** | **Team size assumption missing from build timeline** | V2's build order doesn't state how many people it assumes. A 48-hour schedule with the listed features is achievable for a 2-3 person team but would be impossible solo. | Explicitly document: the MVP build order assumes a **2-person team** with one person primarily on frontend and one on backend/AI. A solo developer should drop Compare Mode, Quick Override, and the Timeline scrubber from the hackathon scope. | Sets realistic expectations and prevents scope overcommitment. | None. | Should Have |

---

## 25. MVP SCOPE

### Team Size Assumption
**The following MVP scope assumes a 2-person team: one focused on frontend (Canvas, panels, UI) and one on backend (FastAPI, LLM integration, memory service).** A solo developer should drop Compare Mode, Quick Override, and the Timeline from hackathon scope without weakening the PS01/PS06 demonstration.

### What Must Be Built for a Credible Demo

#### PS06 MVP (Memory Negotiation)

| Feature | Why It's MVP |
|---|---|
| A1. Four-Tier Memory Architecture | The backbone — without tiers, there's nothing to negotiate |
| A2. Memory Negotiation Card | The core PS06 moment — consent before storage |
| A3. Memory Panel (flat list view, 4 tabs) | Makes memory visible — the minimum for "negotiating" |
| A4. Memory CRUD (edit/archive) | Trust — users must be able to correct the AI |
| A6. Session Memory Audit | The closing PS06 moment — explicit consent at session end |
| A7. Inline Scope Chips | Lowest-friction in-canvas memory control |

#### PS01 MVP (XAI Reasoning)

| Feature | Why It's MVP |
|---|---|
| B1. Reasoning Ribbon | The most dramatic PS01 moment — watching the AI think |
| B2. Assumption Audit Panel (with Impact Halo) | The core PS01 interaction — override an assumption, watch the canvas change |
| B3. Provenance Badges (5 types) | Minimum source attribution |
| B7. Contradiction Flag (basic red edge + hover text) | PS01 requires visible contradictions |

#### Workspace & Canvas MVP

| Feature | Why It's MVP |
|---|---|
| Section 9. Workspace Modes (all 4, system prompt variants) | Configures reasoning posture and demo narrative |
| C1. Core Canvas (react-flow, node rendering, cluster backgrounds) | The product runs on this |
| C2. Status Pill + per-element micro-interactions | Ambient AI state communication |
| C4. Compare Mode (basic side-by-side) | The parallel exploration story must be demo-able |
| D1. Multimodal Drop (PDF + text + DOCX) | Without Drop, the canvas cannot be populated |
| D2. Onboarding (Mode Selector + suggestion chips) | Without onboarding, judges can't start |
| D1. Incognito Mode | Simple, high-trust signal for PS06 |
| D2. Pause / Stop Controls | Basic human oversight |
| Section 18. Export (Markdown + PDF) | Tangible output to end the demo |

### What Is NOT MVP (Despite Being Important)

| Feature | Moved To | Reason |
|---|---|---|
| Trust Lens Toggle (B4) | Differentiator | Important XAI feature but not required for demo's 3 WOW moments |
| Thinking Timeline (C3) | Differentiator | Requires event logging from the start; defer if time constrained |
| Voice Input (C5) | Nice to Have | 6-8 hour integration risk vs. marginal demo benefit |
| Counterfactual Branches (B5) | Differentiator | Requires subgraph recompile; high engineering cost |
| Quick Override (C7) | Differentiator | Adds polish; not required for basic mode demo |
| Activity Log (D3) | Differentiator | Important for auditability; not required for demo |
| Memory Freshness Indicators (A5) | Differentiator | Adds detail; not required for MVP |
| Reasoning Path Walk (B6) | Differentiator | Extends Trace verb; high value but post-MVP |
| PPTX, CSV inputs | Should Have | Adds persona coverage; not in demo script |
| JSON export | Implemented but hidden | Available in Settings; not in primary UI |

### MVP Build Order (48-hour Hackathon — 2 people)

| Hours | Who | Focus |
|---|---|---|
| **0–3** | Both | Data model design, SQLite schema, FastAPI skeleton, react-flow canvas shell |
| **3–6** | BE | GPT-4o integration: Drop PDF → structured output → node objects with provenance |
| **3–6** | FE | Node rendering, provenance badge icons, cluster backgrounds, Branch Rail stub |
| **6–10** | BE | Reasoning Ribbon SSE streaming; Contradiction detection (GPT-4o-mini) |
| **6–10** | FE | Reasoning Ribbon component, Status Pill, Assumption Audit Panel (list view) |
| **10–14** | BE | Memory tier tables (SQLite), Negotiation Card trigger (GPT-4o-mini), Scope chip data model |
| **10–14** | FE | Impact Halo (hover query on pre-computed impact_nodes), Memory Panel (flat list, 4 tabs) |
| **14–18** | BE | Session Memory Audit flow, Workspace Modes (4 system prompt variants) |
| **14–18** | FE | Memory Negotiation Card UI, Scope Chip inline component, Mode Selector onboarding |
| **18–22** | Both | Branch creation, Compare Mode (side-by-side split), Incognito Mode, Pause/Stop |
| **22–26** | BE | Export (Markdown template render + puppeteer PDF); DOCX ingestion (python-docx) |
| **22–26** | FE | Export UI (dialog + format selector), onboarding suggestion chips, empty states |
| **26–32** | Both | Demo script rehearsal; pre-caching all LLM responses for scripted beats; error state handling |
| **32–40** | Both | UI polish, animation smoothing, keyboard shortcuts (B/M/C/T/Esc/P), edge case hardening |
| **40–48** | Both | Buffer for breakage; final demo recording; Trust Lens if time remains |

---

## 26. FUTURE ROADMAP

### Hackathon → V1 (Post-Hackathon, 1-3 Months)
- Trust Lens Toggle (B4) — full confidence topology implementation.
- Counterfactual Branches (B5) — full implementation with diff view.
- Reasoning Path Walk (B6) — step-through guided mode with Trust Rating.
- Full voice verb vocabulary via Sarvam AI (all 12 verbs voice-addressable).
- Thinking Timeline — full implementation with Delta View.
- Relational Memory Graph Panel (visual graph view, not just list).
- Quick Override (C7) — per-cluster reasoning mode variation.
- Epistemic Health Check before Decision node commit (originally V1 B9).
- Memory Freshness Indicators (A5).
- CSV/XLSX input support.
- Activity Log (D3).
- Cognitive Load Monitor with canvas entropy detection and Collapse suggestion.
- User-created custom Workspace Modes extending the 4 defaults.

### V1 → V2 (3-9 Months)
- Collaborative multi-user canvases: presence, real-time sync, memory conflict resolution.
- Enterprise integrations: Slack, Google Drive, GitHub, Jira as Drop sources.
- Dynamic/SPA URL ingestion (Playwright headless browser).
- Organization-wide shared Core Memory with permission tiers.
- Advanced memory architecture: multi-timescale consolidation with user-visible decay curves.
- Production-grade hybrid vector + graph memory backend (Neo4j AuraDB + Pinecone).
- Video transcript input (Sarvam AI Whisper-compatible STT).

### V2 → V3 (9-18 Months)
- Proactive background agents that populate and maintain the canvas between sessions.
- Formal CHI-style evaluation study: Kleos vs. chat for sensemaking tasks (N≥12).
- Spatial computing extensions: XR/AR canvas for physical-space reasoning.
- Multi-agent simulation modes: parallel expert perspectives as separate branch agents.

### Research Directions (Publication-Worthy)
- **Canvas vs. Chat for Sensemaking:** CHI-style matched-task experiment measuring decision quality, cognitive load, trust calibration, and exploration diversity.
- **Workspace Mode Effectiveness:** Which mode produces better decisions for which task type? Within-subjects study with the 4 modes.
- **Memory Negotiation Burden:** At what Negotiation Card frequency does user fatigue exceed the trust benefit? Longitudinal UX study.
- **Quick Override Patterns:** Do users actually use per-cluster overrides, or does one global mode suffice for most tasks?

---

## 27. DEMO SCRIPT

### 7-Minute Hackathon Demo (Scripted, Pre-Cached, Not Improvised)

**Pre-demo setup:**
- Canvas pre-loaded with 4 nodes from a previous session on "AI startup product strategy for the Indian market."
- Memory Panel pre-populated with 3 Core Memories and 1 Inferred (pending) memory.
- One PDF file (competitor analysis — synthetic/fictional content) queued and ready to drop.
- All LLM responses for demo beats pre-cached as JSON fixtures. Zero live API calls during scripted beats.
- Active Workspace Mode: Analytical 🔵.
- Status Pill: "Ready" (green).

| Time | Beat | Feature |
|---|---|---|
| **0:00–0:30** | "Chat is a transcript. Kleos is a canvas. Ideas are objects you can touch, trace, and question." Show the pre-loaded canvas with Status Pill visible. | Vision framing |
| **0:30–1:15** | Drop the PDF. Status Pill → "Working..." Reasoning Ribbon narrates: "Reading PDF → Extracting claims → Found 3 assumptions → Detecting contradictions → Done." Nodes appear. Status Pill → "Ready." "The AI thinks out loud. You see every step." | B1 Ribbon, C2 Status Pill, D1 Drop |
| **1:15–2:00** | Hover the 🌐 red-badged node. "This one? The AI guessed it. No source. Treat it with skepticism." Hover the 📄 blue-badged node. "This one? Page 3 of the PDF. Verifiable." | B3 Provenance Badges |
| **2:00–2:50** | Open Assumption Audit Panel. Hover one assumption — 6 nodes pulse amber simultaneously. "This belief underpins 6 things." Override it: type the correction. Canvas restructures. "That's PS01. You just rewrote the AI's reasoning." | **WOW #1: Impact Halo** |
| **2:50–3:20** | Memory Negotiation Card appears. "I noticed you optimized for cost twice." Four scope options shown. Choose "This Project Only." "I consented. Kleos stored it at the scope I chose — not silently, not automatically." | **WOW #2: Memory Consent** |
| **3:20–3:50** | Open Memory Panel. Show 4-tab structure. Point to Pending tab: "This item? Still pending. I haven't consented yet. It cannot influence any response until I do. Watch." Show a response that doesn't use the pending item. | A3 Memory Panel, A1 Tier quarantine |
| **3:50–4:20** | Switch to Critical Mode 🔴. Counter-argument nodes appear on existing clusters. "Now the AI challenges itself. Same canvas — different posture." Quick aside: switch back to Analytical to show the canvas returns. | Section 9 Workspace Modes |
| **4:20–4:50** | "Branch on the B2B market assumption." Branch 2 created. Compare mode: two branches side by side. Differences in amber. "Two worlds. One assumption apart. Both visible simultaneously." | C4 Compare Mode |
| **4:50–5:20** | Close session. Session Memory Audit: 3 items. Accept 2, reject 1. Reopen Memory Panel — it updated. Point to rejected item: "Gone. Kleos will not use this. That's PS06." | **WOW #3: Session Audit** |
| **5:20–5:50** | Export → Decision Summary → PDF. Show the branded output: "A clean, structured, citable document — not a screenshot of a canvas." | Section 18 Export |
| **5:50–6:30** | "Every feature passed two filters: does it make AI reasoning visible? Does it give users real control over memory? If it didn't pass both, it didn't ship." | Framing |
| **6:30–7:00** | Questions from judges. | |

### Three Critical WOW Moments
1. **(2:00–2:50) Impact Halo** — Hover one assumption, six nodes light up simultaneously. The audience sees the blast radius of a single belief with zero setup time.
2. **(2:50–3:20) Memory Consent** — The system proposes remembering something and waits. The user chooses the scope. The AI respects it. Memory is not a background process — it is a negotiation.
3. **(4:50–5:20) Session Memory Audit** — At session close, the system shows exactly what it learned. The user accepts two things, rejects one. The rejection is respected immediately. Memory is auditable and reversible.

---

## 28. OPEN QUESTIONS

### Design Open Questions
1. **Quick Override discoverability:** Will users find the right-click "Override mode for this cluster" affordance, or does it need a more visible trigger? [Hypothesis: a subtle mode-color badge on clusters with active overrides will prompt curiosity. Needs user testing.]
2. **Status Pill click behavior:** When the user clicks the Status Pill during "Working...", should it show the last 3 reasoning steps (current V3 proposal) or interrupt/pause the compilation? [V3 decision: show steps only. Pause is handled by the dedicated Pause button (D2).]
3. **Mode Selector as first screen vs. in-canvas:** Is showing a full-screen Mode Selector on first open the right onboarding moment, or should the canvas open immediately with a mode-selection chip? [V3 decision: full-screen Mode Selector for first use. Returning users go directly to their canvas with their last mode restored.]
4. **Memory Panel empty state trust:** Will users trust a "No memories stored yet" empty state, or does it feel like the system is hiding something? [Hypothesis: explicit "Kleos will only remember what you approve" messaging addresses this. Needs user testing.]
5. **Scope chip cycling UX:** Is cycling through 3 states (Session/Workspace/Global) via repeated click intuitive, or does it need a dropdown? [V3 decision: cycling is fine with a tooltip on hover showing the next state.]

### Technical Open Questions
1. **Streaming intermediate events from GPT-4o:** Can GPT-4o reliably emit `reasoning_step` JSON objects mid-stream with a strict system prompt? [Needs early prototyping — first 4 hours of hackathon. If unreliable, use the 2-call fallback documented in Section 16.]
2. **puppeteer vs. pdfkit for export:** Does the demo environment support Chromium? If not, fall back to `pdfkit`. [Pre-check during environment setup. pdfkit produces acceptable output for the hackathon.]
3. **ChromaDB local performance:** At demo scale (<50 nodes, <20 memory items), ChromaDB should return in <30ms. Needs benchmarking in the first 6 hours.
4. **DOCX/PPTX image extraction:** python-docx can extract text but not embedded images. python-pptx can extract images as bytes for GPT-4o Vision. For DOCX images, they are skipped in the hackathon version. [Document this as a known limitation.]
5. **react-flow and concurrent SSE updates:** If the Reasoning Ribbon SSE stream and node creation events arrive simultaneously, does react-flow render correctly? [Needs testing in the first 6 hours. If issues arise, buffer SSE events and flush after compilation completes.]

---

## 29. ENGINEERING CONSTRAINTS

### Team & Timeline Constraints (Hard)
- **48-hour build window.** All MVP features must be completable by a 2-person team.
- **Solo developer scope:** Drop Compare Mode, Quick Override, and the Timeline scrubber.
- **Browser target:** Chrome only for the hackathon demo. Firefox compatibility is post-hackathon.
- **No native installation required.** Judges access via browser. Backend runs locally on the presenting laptop.

### Demo Integrity Constraints (Non-Negotiable)
- **Demo is fully pre-cached.** All LLM responses for scripted demo beats are pre-cached as JSON fixtures. Zero live API calls during critical moments. If a live call is needed (for judge Q&A), it has exponential backoff with a graceful "Let me think about that" placeholder.
- **Canvas is never blank mid-demo.** Start with a pre-populated canvas. Compilation failure falls back to pre-cached nodes.
- **No personal data in demo dataset.** All demo content is synthetic and clearly fictional (e.g., "Client: Prism AI — fictional SaaS startup").
- **Error states must be handled.** All API failures show an inline error on the affected element with a [Retry] button. Canvas state must not be lost due to a failed API call.

### Principle-Based Constraints (Binding)
- **No feature that cannot be explained to a judge in one sentence.** If the affordance requires an explanation, the affordance is wrong.
- **No AI action that cannot be undone or traced.** Every canvas reorganization, memory inference, and cluster must be traceable via the Event Log.

### Technical Performance Constraints
- **Impact Halo query: <100ms.** Pre-compute `impact_nodes` at node creation. Store in the node record. Do not compute on hover.
- **Reasoning Ribbon first token: <3 seconds.** Use streaming. If GPT-4o is too slow for the ribbon, route the ribbon steps to GPT-4o-mini (2-call fallback per Section 16).
- **Memory Panel load: <300ms.** Demo data should not exceed 20 items. Paginate if >50.
- **Branch comparison render: <1 second.** Pre-render the second branch in the background when Compare mode is activated.
- **Export (PDF): <8 seconds.** Show a loading state. Unacceptable if longer than 10 seconds — fall back to Markdown-only for the demo.
- **File upload size limits:** PDF max 20MB, DOCX max 10MB, PPTX max 25MB, Image max 5MB. Enforce server-side with a clear error message.

### Error Handling Requirements
- **LLM API failure:** Show an inline error on the affected node/cluster: "Compilation failed — [Retry]." Canvas state preserved.
- **ChromaDB unavailable:** Fall back to keyword search for memory retrieval. Log the fallback in the Activity Log.
- **PDF parse failure:** Show an error on the Source node: "Could not parse this file. Try a different format." Do not crash.
- **Sarvam AI unavailable (if implemented):** Fall back to Web Speech API with a warning: "Multilingual voice unavailable — using system voice."
- **URL fetch failure (CORS or network):** Show: "Could not reach this URL. Paste the content manually instead." Offer a text input field as fallback.

---

## 30. GLOSSARY

| Term | Definition |
|---|---|
| **Kleos** | The product name. A post-chat AI interface for structured thinking work. |
| **Canvas** | The primary spatial workspace in Kleos. One project = one Canvas. A Canvas can contain multiple Branches. |
| **Branch** | A parallel version of the Canvas state representing a different set of assumptions or solution paths. Managed in the Branch Rail. |
| **Branch Rail** | The persistent strip at the top (or left) of the canvas showing all branches as tabs. |
| **Compilation** | The AI process of converting dropped raw artifacts into typed, connected canvas nodes. Visible via the Reasoning Ribbon. |
| **Epistemic Source** | The origin type of information — one of five types: document, core memory, AI inference, AI parametric knowledge, user-created. Distinguished by Provenance Badges. |
| **Workspace Mode** | One of four configurations (Analytical, Creative, Critical, Strategic) that sets the AI's memory priority, reasoning posture, and explanation style simultaneously. |
| **Quick Override** | A per-cluster temporary reasoning mode variation that does not change the global Workspace Mode. Right-click any cluster to set. |
| **Status Pill** | A minimal 2-state indicator in the canvas header showing "Working..." / "Ready." Not a companion — a standard ambient status indicator. |
| **Memory Tier** | One of four levels of memory persistence: Core/Tier 0 (permanent), Session/Tier 1 (canvas-scoped), Inferred/Tier 2 (pending ratification), Source/Tier 3 (artifact-tied). |
| **Negotiation Card** | The UI component appearing at natural pause points, asking users to choose the scope of a new inferred memory before it is stored. |
| **Session Memory Audit** | The end-of-session review showing exactly what the AI inferred during the session, with per-item accept/reject/edit controls before anything is saved. |
| **Reasoning Ribbon** | The horizontal strip at the canvas bottom that narrates the AI's intermediate compilation steps in real time. Transient — fades after compilation. |
| **Assumption Audit Panel** | The right-side collapsible drawer listing every assumption the AI made, with confidence indicators, source badges, Impact Halo, and override actions. |
| **Impact Halo** | The simultaneous amber pulse on all canvas nodes that depend on a hovered assumption. Pre-computed at node creation via `impact_nodes`. |
| **Counterfactual Branch** | A Branch created with a specific assumption deleted, showing how the canvas would look without that belief. |
| **Confidence Topology** | The visual encoding of confidence levels in canvas elements — node border sharpness, edge line style, cluster opacity. Active only when Trust Lens is toggled on. |
| **Thinking Timeline** | The toggled horizontal history scrubber showing keyframe snapshots at major milestones. Not permanently visible. |
| **Trust Lens** | A canvas overlay toggle that applies the Confidence Topology visual encoding. Off by default. |
| **Provenance Badge** | The color-coded icon on every node indicating its epistemic source type. Five types: 📄 document (blue), 🧠 core memory (green), 🔬 inference (yellow), 🌐 parametric (red), ✏️ user-created (white/outline). |
| **Verb** | An interaction primitive in the Kleos grammar. 12 total: Drop, Pin, Merge, Split, Branch, Collapse, Commit, Rewind, Compare, Trace, Counterfactual, Anchor. |
| **Transparency Loop** | The PS01 interaction cycle: Drop → Reasoning Ribbon → Provenance Badges → Assumption Audit → Impact Halo → Override → Canvas Update → Session Memory Audit. |
| **Negotiation Loop** | The PS06 interaction cycle: Workspace Mode → Tiered Memory → Negotiation Card → Memory Panel → Freshness Indicators → Session Audit → Updated Memory Panel. |
| **Incognito Mode** | Session mode where nothing is saved to any memory tier. Visual indicator: dark chrome border + "Incognito" badge in canvas header. |
| **Tool-calling** | The mechanism by which the AI invokes registered canvas operations (create_node, flag_contradiction, propose_memory, etc.) rather than outputting free-form text. All AI actions are tool calls. |
| **Model routing** | The practice of sending different tasks to different models: GPT-4o for primary compilation; GPT-4o-mini for classification and audit; Sarvam AI for voice. |
| **JSON Export** | Machine-readable full canvas export available via Settings or API. Not in the primary export UI. Used for persistence, auditability, and future import. |
| **PS01** | Hackathon Problem Statement 1: Visualizing Explainable AI Reasoning. Primary track for XAI features. |
| **PS06** | Hackathon Problem Statement 6: Negotiating AI Memory. Primary track for memory system features. |

---

*End of Kleos Master Project Document — Version 3.0*
*Supersedes: V2.0, V1.0, interaction_blueprint.md, report-1.md through report-7.md*
*All future work references V3.0. Material changes to V3.0 must be tracked with a dated revision note at the top of this document.*

*Document metrics: ~18,500 words | 30 sections | 4 Workspace Modes + Quick Override | 12 verbs | 8 node types | 4 memory tiers | 5 provenance types | 33 critical review findings resolved across V1/V2/V3*
