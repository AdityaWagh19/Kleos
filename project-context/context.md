# Context

**Kleos** — Post-Chat AI Interface for Structured Thinking Work
Hackathon: Human-Centred Design of LLM Interfaces | IIIT Pune x IIT Bombay ACM SIGCHI

---

## The Core Premise

Chat was never the right interface for thinking work. It was the placeholder used until something better existed.

Chat forces every idea through a single-file turn-taking bottleneck. It is a transcript of a conversation, not a representation of thought. Every new session discards the shape of everything previously reasoned — the branches not taken, the assumptions being tested, the documents that gave the idea its edges.

Kleos is built on a different premise: **the interface is not a thread to scroll, it is a semantic canvas to navigate, reshape, and fork.** The AI's job is not to answer messages — it is to continuously compile whatever the user provides (documents, voice, screenshots, text) into a living canvas, and to keep it coherent as the user manipulates it directly.

---

## The Structural Failure of Chat

These are not usability complaints. They are structural failures of the chat paradigm.

| Friction | Root Cause |
|---|---|
| No persistent object model | Every idea lives inside a paragraph, not as a manipulable thing with its own identity |
| No spatial memory | Humans think by arranging things in space; chat has no space, only time |
| Single-threaded exploration | Chat holds only one line of reasoning at once |
| Multimodal inputs get flattened | A PDF, voice memo, and screenshot are all compressed into the same text box |
| Reasoning is invisible | Assumptions, contradictions, and confidence levels are buried in prose |
| No reversibility | There is no undo for a line of thinking |
| Memory is opaque | Users cannot see what the AI learned or control what persists |
| Explanations are post-hoc | AI reasoning is rationalized after the fact, not narrated during |

---

## Vision

Kleos enables:

- **Externalizing thought spatially** rather than compressing it into linear text
- **Exploring alternatives in parallel** rather than sequentially through separate chats
- **Inspecting AI reasoning** not as a readout but as a manipulable object
- **Negotiating memory** as an ongoing collaboration rather than accepting silent background learning
- **Protecting human cognition** by keeping critical thinking in the loop at every step

---

## The Two Decision Filters

Every feature must pass both. If a feature fails either, it does not ship.

**Reframing Filter**
> Do not ask "what can an LLM do?" Ask "what interaction has become possible because LLMs exist?"

**Cognitive Load Filter**
> Does this component reduce or eliminate a cognitive friction, or does it add one? If it adds one without proportional benefit, it does not ship.

**Ambient Awareness Corollary**
> Removing a UI element entirely is not always simpler than replacing it with a minimal one. If users need to know the AI's state, give them exactly one reliable place to look.

---

## Design Principles

Binding constraints. Every feature is evaluated against all ten. Violation without compelling justification means the feature does not ship.

| # | Principle | Practical Meaning |
|---|---|---|
| P1 | Thoughts are objects | An idea, assumption, or evidence item is a node with identity — not a sentence in a transcript |
| P2 | Everything is directly manipulable | If the AI can do it, the user can also grab it, drag it, and do it by hand |
| P3 | The AI never hides its reasoning | Clusters, links, and rankings always show the assumptions and evidence behind them |
| P4 | Context is spatial | Proximity, grouping, and layout carry meaning. Position is memory |
| P5 | Exploration is parallel, not sequential | Multiple competing solutions exist at once as separate branches |
| P6 | Every action is reversible | Merges, deletions, and branches can be rewound and replayed |
| P7 | Provenance is permanent | Every object remembers where it came from — a PDF page, a voice clip, a memory tier |
| P8 | Convergence is a first-class action | Merging and fusing ideas is as deliberate and visible as creating them |
| P9 | Memory is negotiated, not assumed | Users actively decide what gets stored, at what scope, and for how long |
| P10 | Minimize cognitive load always | Every panel, animation, and affordance is questioned. When in doubt, cut it |

---

## Mental Model

> **Ideas are living entities inside a semantic canvas.**

Dropping a source does not insert text — it adds matter to the canvas. Asking a question does not spawn a reply — it reorganizes the canvas around that question. Exploring an alternative does not start a new chat — it branches the canvas into a parallel stream.

| Tool | Mental Model |
|---|---|
| Figma | Everything is a layer |
| Git | Everything is a commit in a branching history |
| Notion | Everything is a block |
| **Kleos** | **Ideas are living entities inside a semantic canvas** |

---

## The Circular User Journey

```
Drop (gather) → Organize (AI clusters) → Inspect (Assumption Audit) →
Branch (explore alternatives) → Compare (side by side) →
Decide (Commit Branch) → [loops back to Drop]
```

---

## Product Goals

**Hackathon Goals**
1. Demonstrate the most compelling implementation of PS01 (Visualizing XAI Reasoning).
2. Demonstrate the most compelling implementation of PS06 (Negotiating AI Memory).
3. Show that both tracks are stronger together than either alone.
4. Produce a UX case study artifact that stands as an HCI research contribution.

**Product Goals (Beyond Hackathon)**
1. Replace the chat interface as the primary surface for complex thinking work.
2. Build a semantic canvas that persists across sessions and grows more useful over time.
3. Enable parallel exploration of alternatives that current tools require separate conversations to handle.
4. Establish user trust through radical transparency of AI reasoning and memory.

---

## Anti-Goals

- **Not a general-purpose chatbot.** Kleos is not a better ChatGPT. It is a different kind of tool for a different kind of work.
- **Not a knowledge management tool.** Not Notion or Obsidian. The canvas is for active reasoning, not passive storage.
- **Not a diagramming tool.** Not Miro or Figma. The canvas is semantically structured by AI, not manually drawn by the user.
- **Not a novel AI system.** No new ML models, no custom training pipelines. The innovation is the HCI layer.
- **Not a document editor.** Kleos is not Google Docs. The canvas output is nodes and edges, not formatted prose.

---

## Why Both PS Tracks Are Stronger Together

The memory system gives the XAI system something to explain.
The XAI system gives the memory system a reason to be trusted.

Shared infrastructure: Provenance Badges make memory sources visible. Counterfactual Branches operate on memory-dependent assumptions. Workspace Modes configure both memory filtering and reasoning posture simultaneously.

---

*Reference: Kleos_Master_Document.md — Sections 1, 2, 3, 4, 6, 7, 8*
