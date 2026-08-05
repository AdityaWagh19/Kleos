# UX Blueprint

**Kleos** — Interaction Grammar, Spatial Canvas Design, and Visual Encoding System

---

## Interaction Grammar

Kleos has 12 named verbs. These are the only interaction primitives that require active documentation, voice-addressability, and AI tool invocation. Standard canvas interactions (zoom, pan, drag, scroll) are not named verbs — they are assumed as baseline canvas behavior.

| Verb | Trigger | What Happens |
|---|---|---|
| **Drop** | File / URL / text dragged or pasted onto canvas | AI compiles the artifact into typed, connected nodes |
| **Pin** | Right-click node → Pin, or keyboard `P` | Node position is locked; AI respects it in future auto-layouts. Spatial position becomes a user-asserted relationship. |
| **Merge** | Select 2+ nodes → Merge, or keyboard `M` | AI synthesizes selected nodes into a single node; source nodes become provenance references |
| **Split** | Right-click any node → Split | AI decomposes a complex node into sub-nodes representing its component claims |
| **Branch** | Toolbar button, right-click cluster, or keyboard `B` | Forks the current canvas state into a parallel Branch. Branch appears in the Branch Rail. |
| **Collapse** | Right-click cluster → Collapse | Folds cluster into a single summary node. Reduces context window size (dual benefit communicated to user). |
| **Commit** | Branch Rail → Commit Branch | Merges a Branch back into the main canvas. Creates a Decision node recording the commit. |
| **Rewind** | Thinking Timeline → select keyframe | Restores canvas to the state at the selected keyframe |
| **Compare** | Branch Rail → Compare, or keyboard `C` | Displays two branches side by side with auto-highlighted differences (amber = changed nodes) |
| **Trace** | Right-click node → Trace, or keyboard `T` | Activates Reasoning Path Walk: canvas dims; reasoning chain nodes remain visible; step-through narration |
| **Counterfactual** | Right-click Assumption node → "What changes if I remove this?" | Creates a Branch with the assumption deleted; AI recompiles affected subgraph only |
| **Anchor** | Right-click node → Anchor to cluster | Manually assigns a node to a cluster, overriding AI auto-clustering |

---

## Spatial Canvas Design

### Layout Principles

- **Semantic proximity:** AI-placed nodes that are near each other are thematically related. User drag overrides create implicit "user-asserted relationship" edges.
- **Cluster backgrounds:** Groups of related nodes share a colored translucent background with a text label naming the theme.
- **Branch Rail:** Branches are managed in the Rail (top edge strip), not as canvas objects. Only one branch is visible on the main canvas at a time. Compare mode shows two.
- **Canvas entropy signal:** When node density is high but cluster structure is low, a suggestion chip appears: "These nodes seem disconnected. Want me to try clustering them?"

### Canvas States

| State | Description |
|---|---|
| Exploration | AI auto-layouts continuously as new matter is dropped or spoken |
| Listening | Voice channel active; microphone icon animated; transcript visible below canvas |
| Pinned | One or more nodes are pinned; AI respects their positions |
| Compare | Two branches displayed side by side |
| Reasoning Walk | Canvas dims; only reasoning chain nodes fully visible |
| Trust Lens | Confidence topology overlay applied to all nodes and edges |

---

## Visual Encoding System

### Active by Default (Always Visible)

| Property | What It Encodes |
|---|---|
| Node border color | Epistemic source type (matches Provenance Badge color: blue/green/yellow/red/white) |
| Edge color | Relationship type: blue = supports, red = contradicts, gray = derived_from |
| Edge line style | Relationship confidence: solid = high, dashed = medium, dotted = low |
| Inline scope chip | Memory scope: Session / Workspace / Global |
| Provenance Badge | Epistemic source icon on every node (see badge table below) |

### Trust Lens Encoding (Toggle-Only)

Active only when Trust Lens is toggled on. Off by default — always-on visual complexity fatigues users during active work (P10).

| Property | What It Encodes |
|---|---|
| Node border sharpness | Confidence: crisp border = high, feathered/blurred border = low |
| Cluster fill opacity | Average confidence of member nodes; uncertain clusters appear translucent |

### Provenance Badge Reference

| Badge | Color | Meaning |
|---|---|---|
| Document | Blue | Sourced from a dropped artifact with page/line reference |
| Core Memory | Green | Drawn from Tier 0 Core Memory (user-ratified) |
| AI Inference | Yellow | Derived from current canvas context |
| Parametric | Red | AI parametric knowledge — no document source. Primary hallucination-risk signal. |
| User-Created | White/outline | Created directly by the user |
| Voice Input | Citrine/Lime (`#e5ff5d` stroke, dark fill) | Created via voice command through the Realtime API. The idea originated with the user, delivered by voice — distinct from AI Inference. |

The red Parametric badge is the most important trust signal in the system. Users who can immediately identify AI parametric claims can apply appropriate skepticism without any additional UI.

The lime Voice Input badge signals user-originated voice content at a glance, reinforcing voice as a first-class input channel (P7: provenance is permanent).

---

## Node Type Visual Treatments

Each of the 8 node types has a distinct visual treatment to be designed consistently across the canvas.

| Node Type | Purpose | Visual Distinction |
|---|---|---|
| Idea | A concept or possibility the AI or user introduces | Standard rounded card |
| Evidence | A sourced claim from a dropped artifact | Left border stripe matching source badge color |
| Assumption | A belief the AI made that is not directly sourced | Dashed border |
| Question | An open question on the canvas | Italicized label, question mark indicator |
| Constraint | A hard limit or requirement | Filled background (accent) |
| Insight | A synthesized conclusion across multiple nodes | Thicker border, slightly larger card |
| Decision | A committed choice, result of Commit Branch | Bold border, checkmark indicator |
| Source | A dropped artifact itself, parent of extracted nodes | Folder/document icon, wider card |

---

## Key UI Components

### Status Pill

Located in the canvas header, right of the mode indicator. **Three states:**

| State | Visual | Trigger |
|---|---|---|
| `Working...` | Animated blue dot | AI compilation active (text or voice command being processed) |
| `Listening` | Animated microphone icon (`#e5ff5d`) | Voice channel connected; mic is capturing audio; no compilation in flight |
| `Ready` | Static green dot | Idle — no compilation, voice not capturing |

State transitions: `Ready` → `Listening` (mic activated) → `Working...` (voice command received and being compiled) → `Ready`. Text path: `Ready` → `Working...` → `Ready`.

Clicking `Working...` shows the last 3 Reasoning Ribbon steps as a compact tooltip. Does not pause or interrupt compilation.

These are **mutually exclusive display states** — the pill shows exactly one state at all times. When a voice command triggers compilation, the pill transitions from `Listening` to `Working...`.

### Reasoning Ribbon

A thin horizontal strip at the canvas bottom. Appears only during AI compilation. Narrates each intermediate step in plain language via Server-Sent Events. Steps are clickable (expand to show specific evidence). Uncertainty is surfaced inline: "Could not determine if this is a constraint or assumption — treating as assumption. Click to change." Fades 2 seconds after compilation completes.

### Memory Negotiation Card

Appears at natural pause points (after Branch creation, Decision node commit, complex Merge). Non-intrusive, dismissible. Structure:

```
I noticed you prioritized latency over cost twice in this session.

[Remember Always]  [This Project Only]
[Don't Remember]   [Not Now]
```

The card must explain what the AI observed that led to the proposal — not just what it wants to store. This makes the AI's inference visible (PS01) while requesting consent before storage (PS06).

### Memory Panel

Left-side slide-out panel toggled by a single toolbar icon. Four-tab view: Core | Session | Pending (Tier 2) | Source. Each item shows: text, provenance, last-used timestamp. Inline Edit / Archive / Promote / Demote actions on hover. Pending tab banner: "These have not influenced any response yet. Review before accepting."

### Assumption Audit Panel

Right-side collapsible drawer. Lists every assumption the AI made in constructing the current canvas view. Per assumption: statement, confidence bar (Low/Medium/High — no raw percentages), source badge, Impact Halo on hover, and actions (Accept / Override / Ask AI to reconsider / Delete).

Impact Halo behavior: hovering an assumption simultaneously pulses every canvas node that depends on it in amber. Pre-computed at node creation; not computed on hover. Must complete in under 100ms.

### Session Memory Audit Card

Appears at canvas close. Per-item consent:

```
This session taught me 3 new things about you:

1. You prefer visual over textual outputs         [Accept] [Reject]
2. This project has a budget constraint of ~$50k  [Accept] [Reject] [Edit]
3. You tend to branch when uncertain              [Accept] [Reject]

[Review All]  [Accept All]  [Skip]
```

### Branch Rail

Persistent strip at the top of the canvas showing all branches as tabs. Contains: branch name, creation timestamp, status (active / committed / discarded), Compare action, Commit action.

---

## Workspace Mode Visual Indicators

| Mode | Header Color | Badge Color | Canvas Behavior |
|---|---|---|---|
| Analytical | — | Blue | Conservative clustering; unsourced claims marked immediately |
| Creative | — | Purple | Liberal clustering; Idea nodes appear freely |
| Critical | — | Red | Counter-argument nodes appear for every accepted claim |
| Strategic | — | Yellow | Inter-cluster connections highlighted; convergence suggestions appear |

Mode name is always visible in the canvas header. Switching shows a one-line description: "Switching to Critical Mode: the AI will now challenge your existing clusters."

**Quick Override badge:** Any cluster with an active mode override shows a small colored badge in its label indicating the local override mode.

---

## Onboarding Design

**First use:** Full-screen Mode Selector before the canvas opens. "What kind of thinking are you doing today?" — four modes with one-line descriptions.

**Returning user:** Canvas opens directly with the last active mode restored. Mode Selector is not shown again.

**Empty canvas suggestion chips (4 chips):**
- "Drop your documents here" → activates the drop zone; user drags a file onto the canvas
- "Say something" → pulses the microphone icon and activates the voice channel
- "Type an idea" → focuses the text input bar below the canvas for direct text entry
- "Describe what you're deciding" → focuses the text input bar with placeholder: "What decision are you working through?"

All four chips disappear as soon as the first node is added. The "Say something" chip is the primary onboarding nudge for voice — judges and first-time users should see it immediately.

---

## Incognito Mode

Visual indicator: subtle dark chrome border around the entire canvas + "Incognito" badge in the canvas header. Session Memory Audit is skipped at close. Nothing is saved to any memory tier. The indicator must be visible at all times during an Incognito session — users should never be uncertain whether memory is active.

---

*Reference: Kleos_Master_Document.md — Sections 10 (C1–C7, D1–D3), 11, 12, 15*
