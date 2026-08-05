# Users

**Kleos** — User Personas, Use Cases, and Workflows

---

## Target User Profile

Knowledge workers whose primary work product is a **decision or a recommendation**. Their cognitive bottleneck is not retrieval or writing — it is structured thinking with incomplete information under uncertainty.

---

## Personas

### Primary — The Synthesizer

**Priya, 28** | Product Strategy Lead, early-stage B2B startup

| | |
|---|---|
| Core frustration | "Every new chat means re-explaining everything. I don't know where I left off." |
| Primary need | A tool that remembers the shape of thinking — not just facts, but the reasoning behind decisions |
| HCI insight | Needs progressive disclosure — complexity must be available but never forced |

**Use cases:** Competitive analysis, product positioning, strategic options evaluation

**Typical inputs:** PDFs (competitor reports), pasted text (market research), PPTX (existing decks)

**Kleos value:** Persistent canvas across sessions. Workspace Modes that configure the AI's reasoning posture to match the task. Parallel branches for options exploration without losing prior work.

---

### Secondary — The Researcher

**Arjun, 31** | PhD Researcher in HCI

| | |
|---|---|
| Core frustration | "The AI makes confident claims but I can't verify where the information came from." |
| Primary need | Transparent AI reasoning with verifiable source attribution |
| HCI insight | Needs epistemic source distinction and readable provenance at a glance, not buried in panels |

**Use cases:** Literature synthesis, hypothesis generation, citation management

**Typical inputs:** PDFs (papers), pasted URLs (arXiv), DOCX (paper drafts)

**Kleos value:** Provenance Badges on every node. Analytical Mode that weights source memories highest and flags all unsourced claims. Assumption Audit Panel for tracking the AI's reasoning on literature claims.

---

### Tertiary — The Builder

**Zara, 26** | Technical Co-founder

| | |
|---|---|
| Core frustration | "I want to explore three architectures at once, but chat forces me to be sequential." |
| Primary need | Parallel exploration of alternatives with explicit constraint tracking and visual comparison |
| HCI insight | Branching and comparison must be one-step gestures, not multi-click workflows |

**Use cases:** Technical architecture decisions, vendor evaluation, investor narratives

**Typical inputs:** PDFs (vendor docs), GitHub repo URLs, CSV (pricing tables)

**Kleos value:** Branch verb for parallel alternatives. Compare Mode for side-by-side diff. Critical Mode to stress-test any architecture decision before committing.

---

## Persona x Feature Priority

| Feature | Synthesizer | Researcher | Builder |
|---|---|---|---|
| Workspace Modes | High — Strategic/Creative | High — Analytical | High — Critical |
| Reasoning Ribbon | Medium | High | Low |
| Assumption Audit Panel | High | High | Medium |
| Provenance Badges | Medium | High | Low |
| Branch + Compare Mode | High | Medium | High |
| Memory Negotiation Card | High | Medium | Medium |
| Voice Input | Low | Low | Low |
| PPTX input | High | Low | Low |
| GitHub URL input | Low | Low | High |
| Counterfactual Branches | High | Medium | High |

---

## User Workflows

### Workflow 1: First Use (Onboarding)

1. User arrives at Kleos. Mode Selector is the first screen: "What kind of thinking are you doing today?" — four modes with one-line descriptions.
2. Canvas opens with selected mode active and visible in the header. Status Pill shows "Ready."
3. Suggestion chips appear on empty canvas: "Drop your documents here," "Type an idea," "Describe what you're deciding."
4. User drops a PDF. Status Pill switches to "Working..." Reasoning Ribbon narrates compilation. Nodes appear with Provenance Badges. Status Pill returns to "Ready."
5. An Incognito toggle in the header allows opting out before any memories are stored.

**Empty state design:** Assumption Audit Panel empty → "No assumptions detected yet. Drop content to begin." Memory Panel empty → "No memories stored yet. Kleos will only remember what you approve."

---

### Workflow 2: Deep Research Session (Analytical Mode)

1. User opens a saved canvas. Analytical Mode is restored. Status Pill: "Ready."
2. AI surfaces relevant Core Memories: "3 Core Memories are active. [Show memories]"
3. User drops 3 new PDFs. Ribbon narrates. New nodes cluster with existing ones. Contradictions with previous nodes are flagged with red edges.
4. User opens Assumption Audit Panel. Hovers one assumption — 4 nodes pulse amber (Impact Halo). Overrides it. Canvas subgraph recomputes.
5. User activates Trace on an Insight node. Canvas dims. Reasoning Walk narrates the path from 2 PDFs to this synthesis.
6. Session closes. Session Memory Audit: 4 inferences, user accepts 3, edits 1.

---

### Workflow 3: Options Exploration (Strategic Mode)

1. User has a main canvas with 3 architecture options as clusters.
2. User types "Branch on the high-cost assumption." AI creates Branch 2. Status Pill: "Working..." then "Ready."
3. User activates Compare mode. Branches 1 and 2 appear side by side. Differences highlighted in amber.
4. User right-clicks the "Cost Assumptions" cluster in Branch 2 → Quick Override → Critical Mode. Counter-argument nodes appear for that cluster only.
5. User commits Branch 2 as the main canvas with a Decision node: "Chose Architecture A for resilience."

---

### Workflow 4: Export

1. User completes a synthesis session. Canvas is in Strategic Mode.
2. User clicks Export → "Decision Summary" → chooses Markdown or PDF.
3. Export generates (2–6 seconds for PDF). User reviews, optionally redacts a personal memory item, and downloads.
4. If needed: Settings → "Export data (JSON)" for a full machine-readable backup.

---

*Reference: Kleos_Master_Document.md — Sections 5, 20*
