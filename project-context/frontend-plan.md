# Kleos — Frontend Implementation Plan
**Marketing Website + Workspace Entry Point**
*Design source of truth: `project-context/design.md` | Stack: React + Vite + Tailwind v4 + shadcn/ui + Framer Motion*

---

## Design Foundation Synthesis

Before any code is written, the following constraints are absolute:

| Constraint | Value |
|---|---|
| Page background | `#edede8` (Linen Canvas) — no exceptions |
| Primary CTA | `#141414` fill, `#ffffff` text, `200px` border-radius |
| Secondary CTA | `#dbdbd2` fill, `#292929` text, `200px` border-radius |
| Card radius | 12px — never lower for content surfaces |
| Shadow usage | Zero decorative shadows. Only `--shadow-xl` on floating/glass panels |
| Chromatic budget | One color: `#4cc02b` Lime Pulse. Status dots and checkmarks only |
| Typography | Switzer 400 for everything; 500 only for 80px display and wordmark |
| Letter spacing | -0.01em at 64px and below; -0.02em at 80px display |
| Max content width | 1200px centered |
| Section vertical gap | 80px |
| Card padding | 18px |

**Gradients:** Only behind product screenshots as a decorative backdrop (lavender/teal/peach palette). Never on UI controls, text, or backgrounds.

**Motion philosophy:** Subdued, architectural. No bouncy springs. Color shifts on hover, not scale transforms. Sticky scroll for feature storytelling. Native CSS `position: sticky` preferred over JS-driven scroll libraries.

---

## Sitemap

```
kleos.app/
├── /                    → Landing
├── /workspace           → Workspace entry (routes to existing canvas)
├── /docs                → Documentation
├── /research            → Research / Lexicon
└── /contact             → Contact
```

Five pages total. All marketing pages share a persistent navigation bar and footer. The Workspace page is a thin shell that launches the canvas application.

---

## Navigation

### Top Navigation Bar

Spec matches `design.md §7.9` exactly.

| Property | Value |
|---|---|
| Background | Transparent; on scroll → `rgba(237,237,232,0.85)` + `backdrop-filter: blur(12px)` |
| Height | 60px |
| Max-width | 1200px centered |
| Logo | "Kleos" in Switzer 500, 16px, `#292929` |
| Nav links | Switzer 400, 14px, `#353535`, 24px horizontal gap |
| Right cluster | Ghost "Log in" + Dark Pill "Open Workspace" |
| Active link | `#141414` with 1px `#141414` bottom underline |
| Sticky | `position: sticky; top: 0; z-index: 50` |

**Links:** Kleos (/) · Docs (/docs) · Research (/research) · Contact (/contact) · Log in (placeholder) · **Open Workspace** (/workspace)

**Mobile (< 768px):** Hamburger (`menu` Material Symbol) opens slide-in overlay. Background: `rgba(237,237,232,0.97)` + `backdrop-filter: blur(20px)`. Framer Motion: `AnimatePresence`, `x: -100% → 0`, 200ms `easeOut`.

---

## Routing

React Router v6 (`BrowserRouter`).

```
/          → LandingPage
/workspace → WorkspacePage
/docs      → DocsPage
/research  → ResearchPage
/contact   → ContactPage
*          → NotFoundPage
```

All routes wrapped in `<Layout>` (NavBar + Footer). WorkspacePage uses `<WorkspaceLayout>` which suppresses the footer.

---

## Page Hierarchy

| Priority | Page | Purpose |
|---|---|---|
| 1 | Landing | Sell the concept; 3 WOW moments; funnel to Workspace |
| 2 | Workspace | Entry shell — launches the existing canvas |
| 3 | Docs | Self-directed learning; reduce friction to first use |
| 4 | Research | Academic credibility; contextualize design decisions |
| 5 | Contact | Judges, press, collaborators |

Every page ends with a CTA pointing to `/workspace`. Funnel: Read → Understand → Try.

---

## Page 1: Landing (`/`)

**Scroll narrative:** Hero → Problem → WOW Moments → Workspace Modes → Research → Final CTA

---

### Section 1.1 — Hero

**Layout:** Centered text stack (max-width 720px). Below: full-width product screenshot with gradient backdrop.

**Content:**

```
[Badge pill — warm-stone bg, 12px radius, 9px horizontal padding]
IIIT Pune × IIT Bombay ACM SIGCHI
← Switzer 400, 12px, #6f6f6e

[H1 — display]
Ideas are objects.
Not messages.
← Switzer 500, 80px, #292929, line-height 1.0, letter-spacing -1.6px
← Two lines, intentional break — copy-fit carefully

[Subhead]
A spatial canvas for complex thinking work.
Voice-first. AI-transparent. Memory you control.
← Switzer 400, 27px, #6f6f6e, line-height 1.3, letter-spacing -0.27px

[CTA Row — 24px gap]
[Open Workspace →]    [Watch the demo ↓]
← Dark pill           ← Stone pill, scrolls to #features

[Trust bar — 9px above]
Built on research from  ACM SIGCHI · CHI 2026 · UIST 2025 · DIS 2026
← Switzer 400, 12px, #8f8f8e, centered

[Product Screenshot]
Full-width canvas screenshot in decorative gradient backdrop
← Lavender/teal/peach gradient behind screenshot (design.md §8)
← 12px radius on screenshot frame; no shadow on container
← Max-height 600px
```

**Framer Motion (mount-triggered, no whileInView on hero):**

| Element | Animation | Duration | Delay |
|---|---|---|---|
| Badge pill | `opacity 0→1, y 8→0` | 400ms | 0ms |
| H1 | `opacity 0→1, y 16→0` | 500ms | 100ms |
| Subhead | `opacity 0→1, y 12→0` | 500ms | 200ms |
| CTAs | `opacity 0→1, y 8→0` | 400ms | 300ms |
| Trust bar | `opacity 0→1` | 400ms | 400ms |
| Screenshot | `opacity 0→1, y 24→0` | 600ms | 500ms |

All easing: `easeOut`.

---

### Section 1.2 — The Problem: Why Chat Fails

**Layout:** Two-column. Left sticky (`position: sticky; top: 80px`). Right scrolls.

**Left — sticky:**
```
Chat was the placeholder.
Not the destination.
← 45px Switzer 400, #292929 / 19px Switzer 400, #6f6f6e
```

**Right — 8 friction cards:**

| # | Icon (Material Symbol) | Title | Description |
|---|---|---|---|
| 1 | `data_object` | No persistent object model | Every idea lives inside a paragraph, not as a manipulable thing with identity |
| 2 | `map` | No spatial memory | Humans think by arranging things in space; chat has no space, only time |
| 3 | `linear_scale` | Single-threaded exploration | Chat holds only one line of reasoning at once |
| 4 | `compress` | Multimodal inputs get flattened | A PDF, voice memo, and screenshot all compress into the same text box |
| 5 | `visibility_off` | Reasoning is invisible | Assumptions and contradictions are buried in prose |
| 6 | `undo` | No reversibility | There is no undo for a line of thinking |
| 7 | `lock` | Memory is opaque | Users cannot see what the AI learned or control what persists |
| 8 | `psychology` | Explanations are post-hoc | AI reasoning is rationalized after the fact |

**Card spec:** White `#ffffff`, 12px radius, 18px padding, `1px solid #0000001f` border. Icon tile: 36px circular Pebble (`#c0c0c0`) with Material Symbol at 18px `#353535`.

**Framer Motion:** `whileInView`, stagger 80ms, `opacity 0→1, y 12→0`, 400ms `easeOut`, `once: true, margin: "-100px"`.

---

### Section 1.3 — Three WOW Moments {#features}

Three alternating full-width blocks. Each: sticky text column + visual column.

**Background alternation:**
- Block 1 → Linen Canvas (default)
- Block 2 → Warm Stone section background (`#dbdbd2`)
- Block 3 → Linen Canvas (default)

---

**Block 1: Assumption Audit + Impact Halo (WOW #1)**

```
[Tag pill]  PS01 — Explainable AI Reasoning

[Heading — 45px Switzer 400, #292929]
See the blast radius
of a single belief.

[Body — 19px Switzer 400, #6f6f6e, line-height 1.4]
Hover any assumption. Watch every node that depends on it
pulse amber simultaneously. The AI's reasoning isn't buried
in prose — it's drawn on the canvas, touchable and overridable
in real time.

[Feature list — 14px Switzer 400, #292929]
✓ Assumption Audit Panel — every AI assumption in plain language
✓ Impact Halo — hover to reveal the dependency graph instantly
✓ Override any assumption — only the affected subgraph recomputes
✓ Confidence bars — Low / Medium / High, no raw percentages

[CTA]  [Try it in Workspace →]  ← Stone pill
```

**Visual:** Mockup of Assumption Audit Panel; 6 nodes pulsing amber. Static screenshot or animated WebP loop.

---

**Block 2: Memory Negotiation (WOW #2)**

```
[Tag pill]  PS06 — Negotiated AI Memory

[Heading]
Memory is a negotiation,
not a background process.

[Body]
Before anything is stored, Kleos asks. You choose the scope —
this session, this project, or always. The AI waits for
your consent. Nothing is silently learned.

[Feature list]
✓ Memory Negotiation Card — consent before every storage event
✓ Four memory tiers — each with a distinct lifecycle
✓ Tier 2 quarantine — inferred memories never influence responses until accepted
✓ Session Memory Audit — explicit per-item consent ledger at session close

[CTA]  [Open Workspace →]  ← Stone pill
```

**Visual:** Memory Negotiation Card mockup (4 scope buttons). Below: Memory Panel tabs (Core | Session | Pending | Source).

---

**Block 3: Voice + Canvas (WOW #3)**

```
[Tag pill]  Voice-First Interaction

[Heading]
Speak the canvas
into existence.

[Body]
Every interaction verb — Branch, Merge, Compare, Trace — is
voice-addressable via the OpenAI Realtime API. Voice and text
are simultaneous primary channels. Neither is a fallback.

[Feature list]
✓ All 12 interaction verbs voice-addressable
✓ Real-time transcript below the canvas
✓ Voice Input provenance badge on every voice-created node
✓ Status Pill: Listening → Working → Ready

[CTA]  [Open Workspace →]  ← Stone pill
```

**Visual:** Canvas mockup showing Status Pill in Listening state (animated mic icon in `#4cc02b`), transcript line at bottom.

---

### Section 1.4 — Workspace Modes

**Layout:** Centered heading + 4-column card grid.

```
[Heading — 45px]
One mode. Three systems configured.

[Subhead — 19px, #6f6f6e]
Selecting a Workspace Mode simultaneously configures memory priority,
reasoning posture, and explanation style.
```

| Mode | Card Heading | Description |
|---|---|---|
| Analytical | Evidence first. Always. | Weights source memories highest. Every unsourced claim is flagged immediately. For literature review and competitive intelligence. |
| Creative | Explore without constraint. | Core memories take priority. Uncertainty is visible but non-blocking. For ideation and early-stage exploration. |
| Critical | Challenge every claim. | Counter-argument nodes appear for every accepted claim. The AI argues against itself. For pre-decision audits and risk reviews. |
| Strategic | Synthesize toward a decision. | Balanced across all memory tiers. Inter-cluster connections highlighted. For final synthesis and investor presentations. |

**Card:** White `#ffffff`, 12px radius, 18px padding, hairline border. Mode pill (warm-stone) at top. Heading 19px Switzer 400 `#292929`. Body 14px Switzer 400 `#6f6f6e`.

---

### Section 1.5 — Research Foundation

**Background:** Warm Stone (`#dbdbd2`) section.

```
[Heading — 45px]
Every design decision
cites its source.

[Subhead]
Kleos is built on peer-reviewed HCI research from CHI, UIST, DIS, and ACM SIGCHI.
```

**6 citations from `prd.md`:**

| Paper | Venue | Applied In |
|---|---|---|
| "Relational Gains, Privacy Strains" | CHI 2026 | Memory Negotiation Card |
| "Seeing the Reasoning" | CHI 2026 | Reasoning Ribbon |
| Hippo (Pang et al.) | CHI 2025 | Assumption Audit Panel |
| PersonaTree / "Inside Out" | ACL 2026 | Four-Tier Memory Architecture |
| Orality (Li et al.) | CHI 2026 | Voice as primary input channel |
| Armstrong et al. MAVS | Visible Language 2025 | Confidence Topology |

Row spec: Paper name (Switzer 600, 14px, `#292929`) · Venue pill (warm-stone bg, 12px Switzer 400) · "Applied in" text (14px `#6f6f6e`).

---

### Section 1.6 — Final CTA

**Background:** Graphite inverse (`#141414`). 80px vertical padding.

```
[Heading — 45px Switzer 400, #ffffff]
The interface for thinking work
starts here.

[Subhead — 19px Switzer 400, rgba(255,255,255,0.6)]
Voice-first. Spatially organized. Memory you control.

[CTAs]
[Open Workspace →]   ← White pill: #ffffff bg, #141414 text, 200px radius
[Read the docs]      ← Ghost pill: 1px #ffffff border, #ffffff text
```

---

## Page 2: Workspace (`/workspace`)

**Purpose:** Thin entry shell. Launch the existing canvas. Do not redesign the canvas.

**Structure:**
```
WorkspaceLayout
  NavBar (no footer)
  ModeSelector (if first visit) → CanvasApp
```

**Mode Selector logic:**
- Check `localStorage.getItem('kleos_mode')`
- If absent → show full-screen Mode Selector overlay
- If present → skip, render canvas in last-used mode

**Mode Selector content:**
```
[Heading — 45px Switzer 400, #292929, centered]
What kind of thinking
are you doing today?

[4 Mode Cards — horizontal row desktop, vertical stack mobile]
Each: warm-stone bg, 12px radius, 24px padding
  Mode name: 19px Switzer 400, #292929
  Description: 14px Switzer 400, #6f6f6e
  Hover: bg shifts to #d0d0c8 (Quartz)
  Selected: 1px solid #141414 border

[Start →]  ← Dark pill, disabled until mode selected
```

On Start: `localStorage.setItem('kleos_mode', mode)` → `opacity 1→0` (200ms) → render CanvasApp.

```tsx
const [modeSelected, setModeSelected] = useState(
  !!localStorage.getItem('kleos_mode')
);
```

**Acceptance criteria:**
- Mode Selector on first visit; skipped on return visits
- Existing canvas renders correctly; zero canvas files modified

---

## Page 3: Documentation (`/docs`)

**Purpose:** Self-directed learning. Reduce time-to-first-node.

**Layout:** Two-column — sticky sidebar (240px) + scrolling content (max-width 720px).

**Sidebar spec:** Warm Stone `#dbdbd2` bg, 12px radius, 18px padding. Section headers: 12px `#8f8f8e` uppercase 0.08em tracking. Links: 14px `#353535`. Active: `#141414` + 2px solid `#141414` left border.

**Content structure:**
```
GETTING STARTED
  What is Kleos? · Opening the Workspace · Choosing a Workspace Mode

CANVAS BASICS
  Interaction Grammar (12 verbs) · Node Types · Dropping Content
  Using Voice Input · Keyboard Shortcuts

UNDERSTANDING AI REASONING
  Reasoning Ribbon · Assumption Audit Panel · Provenance Badges
  Contradiction Flags · Trust Lens

MEMORY SYSTEM
  How Memory Works · The Four Tiers · Memory Negotiation Card
  Memory Panel · Session Memory Audit

WORKSPACE MODES
  Analytical · Creative · Critical · Strategic

EXPORTING
  Markdown Export · PDF Export
```

**Content format per section:**
- H1: 32px Switzer 400, `#292929`, letter-spacing -0.32px
- Lead: 19px Switzer 400, `#6f6f6e`, line-height 1.4, max-width 560px
- Body: 16px Switzer 400, `#292929`, line-height 1.5
- Code blocks: warm-stone bg, monospace, 12px radius, 18px padding
- Tables: hairline borders, 14px Switzer 400, alternating rows `#ffffff` / `#edede8`
- Callout boxes: white surface, `1px solid #4cc02b` left border, 18px padding

**Components:**
- `shadcn/ui Accordion` — for 12 interaction verbs section
- `shadcn/ui Separator` — sidebar section dividers
- `shadcn/ui ScrollArea` — sidebar overflow on short viewports

**Responsive (< 768px):** Sidebar collapses to sticky horizontal tab strip, `overflow-x: auto`. Content fills full width below.

---

## Page 4: Research (`/research`)

**Rename proposal:** "Lexicon" — positions Kleos as a conceptual system with its own vocabulary. Confirm with team. Alternatives: "Theory" / "Foundation."

**Purpose:** Academic credibility. Every feature traces to a peer-reviewed citation.

**Layout:** Single column, centered, max-width 800px.

**Sections:**

```
[H1 — 64px Switzer 400]
The research behind
every decision.

[Lead — 23px Switzer 400, #6f6f6e]
Kleos addresses two ACM SIGCHI problem statements.
Every major feature traces to a peer-reviewed finding.

---

## The Two Problem Statements

[PS01 card — white surface]
PS01: Visualizing Explainable AI Reasoning
What it requires. What we built. Why.

[PS06 card — white surface]
PS06: Negotiating AI Memory
What it requires. What we built. Why.

---

## Memory Architecture Research
[8-row table: Title | Venue | Key Finding | Applied In]

## Explainable AI Research
[6-row table: Title | Venue | Key Finding | Applied In]

## Spatial Interface Research
[3-row table: Title | Venue | Key Finding | Applied In]

---

## Design Pattern Libraries
[3 cards: Shape of AI · IF Design Patterns · AI UX Playground]

---

## The Two Decision Filters

[Two cards — white surface]
Reframing Filter:
"Do not ask what can an LLM do — ask what interaction
has become possible because LLMs exist."

Cognitive Load Filter:
"Does this component reduce or eliminate a cognitive
friction, or does it add one? If it adds one without
proportional benefit, it does not ship."

---

[Final CTA]
[Open Workspace →]
```

All research tables sourced from `prd.md §Research Foundation`.

---

## Page 5: Contact (`/contact`)

**Purpose:** Point of contact for hackathon judges, press, collaborators.

**Layout:** Two-column — left: contact info + team; right: contact form.

**Left column:**
```
[H1 — 45px]
Get in touch.

[Body — 19px #6f6f6e]
Built for the Human-Centred Design of LLM Interfaces
hackathon at IIIT Pune × IIT Bombay ACM SIGCHI.
Questions from judges, researchers, and collaborators welcome.

[Team — "A four-person team"]
[4 role cards in 2×2 grid — warm-stone bg, 12px radius, 18px padding]
  Name: 16px Switzer 400, #292929
  Role: 14px Switzer 400, #6f6f6e
```

**Right column — Contact Form:**
```
Name *      ← text input
Email *     ← email input
Message *   ← textarea, 4 rows

[Send message →]  ← Dark pill
```

**Input spec:**
- Border: `1px solid #dbdbd2`; radius: 6px (`--radius-innertiles`)
- Background: `#ffffff`; focus: `1px solid #141414`
- Label: 12px Switzer 400, `#6f6f6e`, margin-bottom 6px
- Padding: `12px 18px`; font: Switzer 400, 16px, `#292929`
- Placeholder: `#8f8f8e`

**Behavior:** POST to `/api/contact` or Formspree. On success: replace form with success card ("Message sent. We'll reply within 24 hours."). On failure: "Couldn't send message. Email us directly at [address]." Warm-stone card, no red.

**Components:** `shadcn/ui Form` + `react-hook-form` + `zod`.

---

## Component Hierarchy

```
src/components/
├── layout/
│   ├── NavBar.tsx
│   ├── Footer.tsx
│   ├── Layout.tsx           ← NavBar + children + Footer
│   └── WorkspaceLayout.tsx  ← NavBar only
│
├── ui/                      ← shadcn/ui auto-generated
│   ├── button.tsx
│   ├── accordion.tsx
│   ├── separator.tsx
│   ├── scroll-area.tsx
│   ├── toast.tsx
│   ├── tooltip.tsx
│   └── form.tsx
│
├── primitives/              ← custom design-system atoms
│   ├── Button.tsx           ← variant: primary | stone | ghost | white-on-dark
│   ├── Card.tsx             ← variant: white | stone | glass
│   ├── IconTile.tsx         ← 36px circular pebble + Material Symbol
│   ├── StatusDot.tsx        ← 8px Lime Pulse circle
│   ├── BadgePill.tsx        ← small warm-stone pill tag
│   └── SectionGap.tsx       ← 80px spacer
│
├── landing/
│   ├── Hero.tsx
│   ├── ProductHero.tsx      ← screenshot in gradient backdrop
│   ├── ProblemSection.tsx
│   ├── FrictionCard.tsx
│   ├── WowBlock.tsx         ← reusable alternating text+visual block
│   ├── ModeCards.tsx
│   ├── ResearchRow.tsx
│   └── FinalCTA.tsx
│
├── workspace/
│   └── ModeSelector.tsx
│
├── docs/
│   ├── DocsSidebar.tsx
│   └── DocsContent.tsx
│
├── research/
│   └── ResearchTable.tsx
│
└── contact/
    └── ContactForm.tsx
```

---

## shadcn/ui, Aceternity, and Componentry Component Selection

### shadcn/ui

| Component | Page | Justification |
|---|---|---|
| `Accordion` | Docs (12 verbs) | Keyboard-accessible progressive disclosure |
| `Form` + react-hook-form + zod | Contact | Validated, accessible form handling |
| `Separator` | Docs sidebar | Clean section dividers |
| `ScrollArea` | Docs sidebar | Overflow without native scrollbar flash |
| `Toast` | Contact success/error | Auto-dismissing, non-intrusive |
| `Tooltip` | Nav, icon tiles | Supplementary labels |

**Customization:** Override shadcn's `--radius` to `0.75rem` (12px). Override all color variables to match design tokens in `globals.css`.

### Aceternity UI

| Component | Where | Condition |
|---|---|---|
| `Background Beams` or `Aurora` | Hero screenshot backdrop only | Only if it stays within the lavender/teal/peach palette; never on page sections |
| `Text Generate Effect` | Landing H1 (optional) | Only if timing is calibrated to near-0ms per character — no bounce |
| `Wavy Background` | Final CTA section (optional) | Only if strictly monochrome — no color saturation |

**Hard rule:** Reject any Aceternity component introducing neon, glow, gradients on UI controls, or particle effects. Design.md overrides all library defaults.

### Componentry

Evaluate registry during implementation for any missing primitives. Prefer custom `primitives/` components for simple atoms.

---

## Motion and Animation Plan

### Principles

1. **Subdued.** No bouncing, no scale-on-hover. Hover = color shift only.
2. **One motion at a time.** No simultaneous animations on same element.
3. **Native CSS first.** `position: sticky`, `scroll-snap-type` — no JS scroll listeners.
4. **Framer Motion** for enter/exit and page route transitions only.
5. **Respect `prefers-reduced-motion`.** All animations check `useReducedMotion()`.

### Animation Spec Table

| Element | Animation | Duration | Easing | Trigger |
|---|---|---|---|---|
| Hero H1 | `opacity 0→1, y 16→0` | 500ms | easeOut | mount |
| Hero subhead | `opacity 0→1, y 12→0` | 500ms, +100ms | easeOut | mount |
| Hero CTAs | `opacity 0→1, y 8→0` | 400ms, +200ms | easeOut | mount |
| Hero screenshot | `opacity 0→1, y 24→0` | 600ms, +400ms | easeOut | mount |
| Friction cards | `opacity 0→1, y 12→0` | 400ms, stagger 80ms | easeOut | whileInView |
| WOW blocks | `opacity 0→1` | 400ms | easeOut | whileInView |
| Mode cards | `opacity 0→1, y 12→0` | 400ms, stagger 80ms | easeOut | whileInView |
| Research rows | `opacity 0→1` | 300ms, stagger 50ms | easeOut | whileInView |
| Mobile nav overlay | `x -100%→0` | 200ms | easeOut | click |
| Mode selector exit | `opacity 1→0` | 200ms | easeIn | mode selected |
| Page route transition | `opacity 0→1` | 200ms | easeOut | route change |
| Pill button hover | bg color shift | 150ms | easeOut | hover (CSS) |
| Card hover | border darken to `#d0d0c8` | 150ms | easeOut | hover (CSS) |
| Nav link hover | `#353535 → #141414` | 150ms | easeOut | hover (CSS) |

**`whileInView` settings:** `{ once: true, margin: "-100px" }`.

**Stagger pattern:**
```tsx
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};
```

**Reduced motion:**
```tsx
import { useReducedMotion } from 'framer-motion';
const shouldReduce = useReducedMotion();
const variants = shouldReduce
  ? { hidden: {}, visible: {} }
  : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };
```

---

## Sticky Scroll — CSS Implementation

```css
.sticky-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-48);
}
.sticky-left {
  position: sticky;
  top: 80px;   /* nav height */
  height: fit-content;
  align-self: start;
}
.scrolling-right {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-18);
}

/* Mobile: disable sticky */
@media (max-width: 768px) {
  .sticky-section { grid-template-columns: 1fr; }
  .sticky-left { position: static; }
}
```

---

## Typography Implementation

### Font Loading

Self-host Switzer (fontshare.com). Place in `public/fonts/`. Three weights: 400, 500, 600.

```css
@font-face {
  font-family: 'Switzer';
  src: url('/fonts/Switzer-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Switzer';
  src: url('/fonts/Switzer-Medium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'Switzer';
  src: url('/fonts/Switzer-Semibold.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}
```

### Tailwind v4 Config

```css
/* src/index.css */
@import './theme.css';   /* Tailwind @theme block from design.md §12.2 */
@import 'tailwindcss';
```

### Material Symbols Usage

Already in `index.html`. Usage pattern:
```tsx
<span className="material-symbols-outlined" style={{ fontSize: 18, color: '#353535' }}>
  data_object
</span>
```
Rules: 18px inline, 20px feature, 24px nav. Outlined style. Always inside Pebble tile for decorative use. `aria-hidden="true"` on all decorative icon tiles.

---

## Grid and Layout

### Container

```css
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
@media (max-width: 768px) {
  .page-container { padding: 0 18px; }
}
```

### Section Rhythm

```css
.section {
  padding-top: var(--section-gap);    /* 80px */
  padding-bottom: var(--section-gap);
}
```

### Grid Patterns

| Pattern | CSS |
|---|---|
| Two-column equal | `grid-template-columns: 1fr 1fr; gap: 48px` |
| Two-column text+feature | `grid-template-columns: 5fr 7fr; gap: 60px` |
| Four-column cards | `grid-template-columns: repeat(4, 1fr); gap: 18px` |
| Docs layout | `grid-template-columns: 240px 1fr; gap: 48px` |

### Breakpoints

| Viewport | Behavior |
|---|---|
| < 480px | Single column; H1 → 40px; all grids stack |
| 480–768px | Single column; H1 → 56px; sidebar → tab strip |
| 768–1024px | Two-column active; 4-col cards → 2×2 |
| > 1024px | Full desktop; sticky scrolls active |

---

## Illustration Strategy

**No custom illustrations.** All visuals are product UI screenshots or panel mockups.

- Screenshots sourced from the running canvas
- Crop tightly to relevant panel or feature
- Place behind decorative lavender/teal/peach gradient for hero context
- Frame in `#dbdbd2` rounded container (12px radius)
- Animated mockups: short WebP loop < 300KB if static insufficient
- All animated colors stay within design system palette
- Per `design.md §8`: no stock photography, no abstract vector art, no 3D renders

---

## Accessibility

### Color Contrast

| Pair | Ratio | Status |
|---|---|---|
| `#292929` on `#edede8` | 11.5:1 | AAA |
| `#292929` on `#ffffff` | 14.7:1 | AAA |
| `#6f6f6e` on `#ffffff` | 4.8:1 | AA |
| `#6f6f6e` on `#edede8` | ~4.5:1 | AA (verify at implementation — darken to `#5a5a5a` if fails) |
| `#ffffff` on `#141414` | 17.7:1 | AAA |
| `#353535` on `#dbdbd2` | 5.9:1 | AA |

### Keyboard Navigation

- All interactive elements reachable via `Tab`, operable via `Enter`/`Space`
- Pill buttons: native `<button>` element (not div)
- Mobile nav overlay: trap focus while open; release on close
- Focus ring: `outline: 1px solid #141414; outline-offset: 2px` on `:focus-visible`
- Accordion: use `shadcn/ui Accordion` — ARIA-compliant by default

### Semantic HTML

- One `<h1>` per page — always the hero headline
- Feature block headings: `<h2>`; card headings: `<h3>`
- Main nav: `<nav aria-label="Primary navigation">`
- Footer nav: `<nav aria-label="Footer navigation">`
- Product screenshots: `<img alt="[descriptive text]">`
- Decorative icon tiles: `aria-hidden="true"`
- External links: `target="_blank" rel="noopener noreferrer"` with aria-label

---

## API Requirements

### Contact Form

```
POST /api/contact
Body: { name: string, email: string, message: string }
Response: { success: boolean, error?: string }
```

Fallback if API unavailable: show Formspree/Resend direct form.

### Workspace Entry

`/workspace` renders existing `<CanvasApp />` — no new API calls from the marketing shell. Canvas manages its own backend communication.

### Mode Selector State

`localStorage` key: `kleos_mode`. Values: `"analytical" | "creative" | "critical" | "strategic"`. No API call.

---

## Footer

**Background:** Warm Stone `#dbdbd2`. 60px vertical padding. Three-column.

```
[Col 1 — Logo + tagline]
Kleos
Post-chat AI for structured thinking.

[Col 2 — Site]
Landing · Workspace · Docs · Research · Contact

[Col 3 — Project]
GitHub · Hackathon brief · ACM SIGCHI

[Bottom bar — hairline divider above]
Built for IIIT Pune × IIT Bombay ACM SIGCHI · 2026
```

Section headers: 12px Switzer 400 `#8f8f8e` uppercase. Links: 14px Switzer 400 `#353535`, hover `#141414`.

---

## Acceptance Criteria

### Landing

- [ ] Hero H1 renders at 80px Switzer 500, correct letter-spacing
- [ ] All design.md colors exact (spot-check 5 elements vs tokens)
- [ ] Product screenshot in gradient backdrop — no bare image
- [ ] Sticky scroll works in §1.2 and §1.3 on desktop; stacks on mobile
- [ ] All four Mode cards render with correct `prd.md` descriptions
- [ ] Research table shows ≥ 6 papers with correct names and venues
- [ ] Final CTA section uses `#141414` background
- [ ] All animations respect `prefers-reduced-motion`
- [ ] All CTA buttons pill-shaped (200px radius)
- [ ] Zero decorative drop shadows anywhere
- [ ] `#4cc02b` appears nowhere except canvas status mockup screenshot
- [ ] Page load < 3s on simulated 4G

### Workspace

- [ ] Mode Selector appears on first visit
- [ ] Mode Selector skipped on return visit
- [ ] Existing canvas renders after mode selection
- [ ] Zero canvas source files modified

### Docs

- [ ] Sidebar sections all link correctly to anchors
- [ ] Active link shows 2px left border + `#141414` text
- [ ] Accordion works (keyboard accessible)
- [ ] Sidebar collapses to tab strip on mobile

### Research

- [ ] Three research tables present (Memory, XAI, Spatial)
- [ ] PS01 and PS06 cards present with correct descriptions
- [ ] CTA at page bottom

### Contact

- [ ] All three fields validate before submit
- [ ] Success state replaces form without page reload
- [ ] Error state shows fallback contact address
- [ ] Form keyboard accessible

### Global

- [ ] NavBar visible and functional on all five pages
- [ ] Mobile hamburger works on all five pages
- [ ] Footer present on all pages except Workspace
- [ ] All internal links use React Router `<Link>` — no `<a href>` for internal routes
- [ ] External links: `target="_blank" rel="noopener noreferrer"`
- [ ] Zero console errors on any page in Chrome
- [ ] All images have descriptive `alt` attributes

---

## Implementation Notes for Executing Agent

1. **Read `.agents/skills/frontend-design/SKILL.md`** before writing any component.
2. **`design.md` overrides all library defaults.** If shadcn, Aceternity, or Tailwind defaults conflict with design tokens, override them.
3. **Import `variables.css` `:root` block in `src/index.css`.** This is the authoritative token source.
4. **Use `var(--token-name)` for values not in Tailwind.** Do not hardcode hex values in JSX.
5. **Zero drop shadows on cards.** Use background color shifts for depth.
6. **Canvas is out of scope.** `/workspace` is a shell only. Do not modify any canvas component files.
7. **Switzer must be self-hosted.** Download from fontshare.com; place in `public/fonts/`.
8. **shadcn `--radius` must be overridden** to `0.75rem` (12px). Default is `8px`.
9. **`#4cc02b` appears at most once** on the marketing site: inside a canvas mockup screenshot. Nowhere as a UI color.
10. **All text is Switzer.** Verify fallback stack renders at comparable weight and tracking. Test via DevTools network block.

---

*Sources: `design.md` · `frontend-inspo-analysis.md` · `context.md` · `mvp.md` · `prd.md` · `ux-blueprint.md` · `users.md` · `demo.md` · `architecture.md` · `future-plans.md` · `instructions.md`*
