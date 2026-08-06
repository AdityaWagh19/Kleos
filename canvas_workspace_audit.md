# Canvas Workspace Audit
### Definitive Pre-Redesign Reference — Kleos v1

---

## Executive Summary

The Kleos canvas workspace is a thoughtful, technically capable AI reasoning environment that implements a genuinely novel concept: a spatially-organized, provenance-aware thought graph with tiered AI memory. The core idea is sound and differentiated. However, the workspace was built as an isolated product with its own visual language (dark mode, `#111111` background, `#e5ff5d` Lime Pulse accents) that is now **entirely disconnected from the new global design system** (warm linen, Switzer typography, graphite-ink CTAs).

Simultaneously, the workspace's layout contradicts the user's own articulated vision (`canvas_goal.txt`): the current implementation puts every feature on-screen at once in a dense top-bar, while the goal explicitly calls for a menu-first, canvas-light layout where features are hidden until needed.

**The three critical problems:**
1. **Wrong visual system.** Dark mode canvas vs. light-mode design.md. Two separate products.
2. **Wrong layout model.** Everything exposed at once vs. the user's menu-first, toggle-driven vision.
3. **Significant feature incompleteness.** Multiple subsystems are wired but not actually functional (Assumption Audit Panel, Activity Log, voice-to-canvas mutation, ReasoningPathWalk, node context menus, Merge, Pin).

**Production readiness: 6/10.** The core SSE compilation loop, memory system, and ReactFlow rendering are solid. The UX shell, visual design, and several features need a full overhaul before this is a product people will love to use.

---

## 1. Workspace Architecture

### 1.1 System Overview

```
User Input
  ├─ TextInputBar (Ctrl+Enter)    ─┐
  └─ VoiceInput (WebSocket)       ─┤→ SSE Stream → Backend compile → Supabase nodes
                                   │                                       │
                                   └── App.handleTextDrop()                │
                                          │                                 │
                           EventSource  ←─┘          kleos:reload-canvas ←─┘
                           (SSE events)
                                │
                     ┌──────────┼──────────┐
                  step     compilation     done
                  │              │           │
          setRibbonSteps    setPillState  loadCanvas()
          (ReasoningRibbon)  ('working')  (GET /api/canvas/:id)
                                              │
                                           ReactFlow
                                         (nodes + edges)
```

### 1.2 File System Architecture

```
src/frontend/src/
  App.tsx                     ← Monolithic 470-line state container
  main.tsx                    ← Router (4 layout paths)
  canvas/
    KleosCanvas.tsx           ← ReactFlow host + event listener
    KleosEdge.tsx             ← Bezier edge with type/confidence encoding
    ReasoningPathWalk.tsx     ← Step-through narration (EXISTS but NEVER MOUNTED)
    nodeRegistry.ts           ← Type→config mapping
    nodes/
      BaseNode.tsx            ← Universal node renderer
    clusters/
      ClusterBackground.tsx   ← Cluster node type
  components/
    BranchRail.tsx            ← Branch tabs (36px bar under header)
    TextInputBar.tsx          ← Primary AI input (bottom bar)
    StatusPill.tsx            ← Working/Listening/Ready state
    ReasoningRibbon.tsx       ← Step animation (shows during compile)
    SourceFilter.tsx          ← Provenance filter buttons
    ModeIndicator.tsx         ← Mode badge (clickable)
    PauseStopControls.tsx     ← Pause/Stop SSE stream
    VoiceTranscript.tsx       ← Live transcript overlay
    ProvenanceBadge.tsx       ← Source type badge on nodes
    ScopeChip.tsx             ← Memory scope chip on nodes
    ConfidenceBar.tsx         ← Used in AssumptionAuditPanel
  panels/
    MemoryPanel.tsx           ← Left drawer (288px), 4 tabs
    AssumptionAuditPanel.tsx  ← Right drawer (300px), stub data
    ActivityLog.tsx           ← Right overlay, stub data
    ThinkingTimeline.tsx      ← EXISTS, NEVER MOUNTED
  cards/
    MemoryNegotiationCard.tsx ← Bottom-right popup after compile
    ExportDialog.tsx          ← Modal (Markdown + PDF)
    SessionMemoryAuditCard.tsx← Session-end audit (never triggered)
  hooks/
    useCanvas.ts              ← ReactFlow state + API
    useVoice.ts               ← WebSocket voice session
    useMemory.ts              ← Memory API layer
    useKeyboardShortcuts.ts   ← B/M/C/T/P/Escape
  onboarding/
    ModeSelector.tsx          ← Full-screen mode picker (currently bypassed)
    SuggestionChips.tsx       ← Empty state suggestions
  layout/
    WorkspaceLayout.tsx       ← Thin wrapper (just <Outlet />)
```

### 1.3 State Management

All workspace state lives in `App.tsx` as 30+ `useState` hooks — no global store, no Context, no Zustand. This creates a monolithic 470-line component with significant prop-drilling risk as features grow.

**State buckets in App.tsx:**

| Bucket | Variables |
|---|---|
| Canvas lifecycle | `canvasId`, `branchId`, `loading`, `error` |
| Workspace mode | `mode`, `modeSelected` |
| Canvas state | `hasNodes` (never mutated!), `branches`, `activeBranchId`, `compareMode` |
| AI compilation | `ribbonSteps`, `isCompiling`, `pillState`, `dropError`, `sseRef` |
| Panel visibility | `memoryOpen`, `auditOpen`, `activityOpen`, `exportOpen`, `showAuditCard` |
| Incognito | `incognito`, `showIncognitoBorder` |
| Memory negotiation | `negCardOpen`, `negCardObs` |
| Voice | `transcript`, `sourceFilter` |
| Session audit | `auditItems` |

### 1.4 Data Flow

```
Bootstrap:
  GET /api/canvas/:id → {canvas, nodes, edges, branches}
  → setMode, setBranchId, setBranches
  → ReactFlow render

Text compilation:
  TextInputBar.onSubmit
  → App.handleTextDrop(text)
  → EventSource(GET /api/canvas/:id/stream?text=&workspace_mode=&branch_id=)
  → SSE events: step | compilation | memory_card_trigger | done | error
  → done: window.dispatchEvent('kleos:reload-canvas')
  → KleosCanvas.handleReload → useCanvas.loadCanvas()
  → GET /api/canvas/:id → new ReactFlow nodes

Voice input:
  useVoice (WebSocket)
  → onToolCall(canvasMutatingTools)
  → setTimeout 600ms → window.dispatchEvent('kleos:reload-canvas')

Memory:
  GET /api/canvas/:id/memory
  POST /api/canvas/:id/memory/:id/ratify {scope}
  PUT /api/canvas/:id/node/:id/scope
  DELETE /api/canvas/:id/memory/:id/archive (via archiveMemory)
```

---

## 2. Complete UI Description

### 2.1 Layout Structure (Current)

The workspace uses a full-screen dark layout (`h-screen w-screen overflow-hidden`, `background: #111111`) with this vertical stack:

```
┌─────────────────────────────────────────────────────────┐
│ HEADER BAR (48px, #1a1a1a, border-bottom #2b2b2b)        │
│  [🧠] [mode] [src filter] ────── [pill] [⏸][⏹][🎙][👁][❓][📋][↓] │
├─────────────────────────────────────────────────────────┤
│ BRANCH RAIL (36px, #1a1a1a, border-bottom #2b2b2b)       │
│  [Branch1*] [Branch2 ⇄] [+fork]                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CANVAS AREA (flex-1, #111111, ReactFlow)                │
│  ┌─ LEFT PANEL (MemoryPanel, 288px, slides in) ─┐        │
│  │ absolute left-0 top-0 bottom-0               │        │
│  └──────────────────────────────────────────────┘        │
│                       ┌─ RIGHT PANEL (Audit, 300px) ─┐   │
│                       │ absolute right-0 top-0        │   │
│                       └──────────────────────────────┘   │
│                                                          │
│  [ReactFlow Controls]  bottom-left (RF default)          │
│  [SuggestionChips]     center (always visible — bug)     │
│  [ReasoningRibbon]     absolute bottom-0, 36px           │
│  [VoiceTranscript]     absolute (position not defined)   │
│  [MemoryNegotiationCard] absolute bottom-16 right-4      │
├─────────────────────────────────────────────────────────┤
│ ERROR BANNER (conditional, #3a1a1a, red border)          │
├─────────────────────────────────────────────────────────┤
│ TEXT INPUT BAR (shrink-0, #1a1a1a, border-top #2b2b2b)   │
│  [───────────── textarea ──────────────────] [Drop ↑]   │
└─────────────────────────────────────────────────────────┘

OVERLAYS (outside main):
  ActivityLog         — right side overlay
  SessionMemoryAuditCard — center modal
  ExportDialog        — center modal with backdrop
```

### 2.2 Header Bar (48px)

**Left cluster (left to right):**
- `memory` icon — toggles MemoryPanel (yellow `#e5ff5d` when open, `#9c9c9c` when closed)
- `ModeIndicator` — mode badge pill, clickable cycles Analytical→Creative→Critical→Strategic
- `SourceFilter` — three provenance filter toggle buttons

**Right cluster (right to left):**
- `download` icon — Export dialog
- `history` icon — Activity Log panel toggle
- `help` icon — Assumption Audit Panel toggle
- `visibility`/`visibility_off` — Incognito toggle + optional text badge
- `mic`/`mic_off` — Voice toggle
- `PauseStopControls` — pause/stop buttons, only visible when `isCompiling=true`
- `StatusPill` — animated state indicator (working/listening/ready)

**Problems:**
- 10+ interactive elements in a 48px bar with no grouping, labels, or hierarchy
- Icon-only interface: `help` for "Assumption Audit" is semantically incorrect
- No workspace name or title visible anywhere
- No back-to-dashboard or home navigation
- `ModeSelector` is permanently bypassed (`modeSelected` defaults to `true`)

### 2.3 Branch Rail (36px)

Horizontally scrollable tab strip beneath the header. Contains named branch pills, a `compare_arrows` icon for non-active branches, and a `fork_right` button to create a new branch.

**Critical bug:** Clicking a branch calls `onBranchSwitch(id)` which only updates `activeBranchId` state — `KleosCanvas` does not respond to this change because it listens for `'kleos:reload-canvas'` events, not prop changes.

### 2.4 Canvas Area

ReactFlow instance configured with:
- `BackgroundVariant.Dots` (gap: 24px, size: 1px, color: `#2b2b2b`)
- `Controls` component with hardcoded dark styles
- `fitView` on every `loadCanvas()` call
- `minZoom: 0.2`, `maxZoom: 2.0`
- `attributionPosition: "bottom-left"`

**Node types registered:** idea, evidence, assumption, question, constraint, insight, decision, source, cluster  
**Edge types registered:** kleos (custom Bezier)

### 2.5 Node Cards (BaseNode.tsx)

Each node is a `motion.div`:
- **Size:** `min-w-[200px] max-w-[280px]`
- **Padding:** `10px 12px`
- **Border-radius:** `12px`
- **Border:** 1px solid (type color), insight nodes get 2px
- **Background:** type-specific (all dark: `#2b2b2b` or `#1a1a1a`)
- **Entrance:** `opacity: 0, scale: 0.88 → 1.0`, 0.18s easeOut, staggered by `entranceDelay`

**Header row:** 14px type icon (type color) + 10px uppercase label (`#9c9c9c`) + ProvenanceBadge (right-aligned)  
**Body:** 13px text (`#f9f9f9`), italic for questions, medium weight for decisions  
**Footer (optional):** ScopeChip (memory scope), inline error state  
**Handles:** 8×8px circles at left (target) and right (source) positions

**Node type visual system:**

| Type | Border Color | Background | Special |
|---|---|---|---|
| idea | `#565656` | `#2b2b2b` | — |
| evidence | `#4a90d9` | `#2b2b2b` | 4px left accent stripe |
| assumption | `#e5ff5d` dashed | `#2b2b2b` | Impact Halo amber glow |
| question | `#9c9c9c` | `#2b2b2b` | italic text |
| constraint | `#d97b4a` | `#3a2a1a` | warm bg |
| insight | `#7dcfb6` | `#2b2b2b` | 2px border |
| decision | `#f9f9f9` | `#1a1a1a` | bold text |
| source | `#565656` | `#1f2329` | bluish bg |

### 2.6 Edge System (KleosEdge.tsx)

Custom Bezier edges with semantic encoding on two dimensions:

**Color by relation type:**

| Relation | Color |
|---|---|
| supports | `#4a90d9` (blue) |
| contradicts | `#e84040` (red) |
| depends_on | `#f5c842` (amber) |
| derived_from | `#9c9c9c` (gray) |

**Dash pattern by confidence:**

| Confidence | Pattern |
|---|---|
| high | solid `0` |
| medium | `6,3` dash |
| low | `3,3` short dash |

Wide 16px transparent hit area ensures clickability. No edge labels. No edge context menu.

### 2.7 Panels

**MemoryPanel (left, 288px):**
- Spring slide from `x: -100%`, positioned `absolute left-0 top-0 bottom-0 z-30`
- Header: "Memory" title + close button
- Search input
- 4 tabs: Core / Session / Pending / Source (each maps to a memory tier)
- Per-item: tier label, freshness badge, text, Edit/Archive actions
- Pending tab: Ratify buttons (Remember Always / This Project / This Session / Reject)
- Pending banner (amber): "Review before accepting"
- **Critical layout bug:** `top-0` ignores the 84px of header+branch rail above

**AssumptionAuditPanel (right, 300px):**
- Spring slide from `x: 100%`, positioned `absolute right-0 top-0 bottom-0 z-30`
- Per-assumption: ProvenanceBadge, impact count, text, ConfidenceBar, Accept/Override/Ask AI/Delete
- Hover triggers Impact Halo on canvas via `onHoverAssumption`
- **Data bug:** Always receives `assumptions=[]` — panel is permanently empty
- **Same layout bug:** `top-0`

**ActivityLog:** Overlay component, receives `activityEvents=[]` (always empty).

**ThinkingTimeline:** Complete file exists (`ThinkingTimeline.tsx`) but is never imported or mounted anywhere.

### 2.8 Text Input Bar

Anchored to the bottom of the workspace (`shrink-0`):
- Textarea: 2 rows, 13px, `#f9f9f9` on `#111111`, border changes `#565656→#9c9c9c` on focus
- Submit button: `#e5ff5d` background, `#111111` text, 8px border-radius, label: **"Drop"**
- During compile: spinning `autorenew` icon + "Working..." text

**Submit trigger:** `Ctrl+Enter` only (plain `Enter` creates new line)

### 2.9 Reasoning Ribbon

Temporarily overlays the bottom of the canvas during AI compilation:
- `absolute bottom-0 left-0 right-0 z-20`, 36px tall
- Shows numbered step badges (step number circle + action label + chevron separator)
- Fades out 2 seconds after compile completes
- **Z-index conflict:** z-20 on ribbon vs. TextInputBar being `shrink-0` in normal flow — ribbon renders over the gap between canvas and input bar but the visual layering is undefined

### 2.10 Memory Negotiation Card

`absolute bottom-16 right-4 z-40`, 288px wide, amber `#f5c842` border:
- Amber glow keyframe animation on entrance
- AI's observation text
- 2×2 grid: Remember Always (green) / This Project (blue) / Don't Remember (red) / Not Now (gray)
- Dismiss button below grid

**Best-designed component in the workspace.** Interaction model and visual feedback are excellent.

### 2.11 Export Dialog

Center modal, 384px wide, `rgba(17,17,17,0.8)` backdrop:
- Format selector: Markdown | PDF
- Content type: Full Canvas / Decision Summary / Research Notes
- PDF shows progress bar during generation
- Markdown: opens new browser tab via `window.open`
- PDF: streams binary download

### 2.12 ReasoningPathWalk (Unmounted)

A step-through narration component exists with:
- Canvas dimming overlay (75% opacity)
- Floating card at bottom center
- Previous/Next navigation
- Progress bar
- Feedback (thumbs up/down) at final step

**Currently never mounted anywhere in the application.**

---

## 3. Interaction Documentation

### 3.1 Node Creation
| Dimension | Detail |
|---|---|
| Current | Text input → SSE compilation → backend creates nodes → `kleos:reload-canvas` → ReactFlow re-renders |
| Expected | Same + loading skeleton, plus manual node creation by user |
| Missing | Manual drag-to-create, node type picker, AI streaming into canvas without full reload |
| UX impact | User has zero agency over the graph structure; entirely AI-driven |

### 3.2 Node Selection
| Dimension | Detail |
|---|---|
| Current | Click to select (ReactFlow default), selected node gets `#e5ff5d` border |
| Expected | Selection opens a contextual action panel (per canvas_goal.txt sketch) |
| Missing | Context panel, right-click menu, selection count badge |
| UX impact | Selection is visually acknowledged but triggers no further action |

### 3.3 Multi-Selection
| Dimension | Detail |
|---|---|
| Current | ReactFlow default: shift-click or drag-select box |
| Missing | All multi-select actions: merge, group, delete, bulk export |
| UX impact | Multi-selection does nothing meaningful |

### 3.4 Drag & Drop
| Dimension | Detail |
|---|---|
| Current | Nodes are draggable (ReactFlow default). No `onNodeDragStop` handler. |
| Missing | Position persistence (`PATCH /api/canvas/:id/node/:id/position`), file drop to canvas for ingestion |
| UX impact | Every canvas reload resets node positions — user arrangement is lost |

### 3.5 Zoom / Pan
| Dimension | Detail |
|---|---|
| Current | Scroll to zoom, drag to pan, Controls component (zoom in/out/fit) |
| Missing | Minimap, keyboard shortcuts (Ctrl+0 fit, Ctrl+= zoom), zoom level display |
| UX impact | Navigating large canvases is disorienting |

### 3.6 Connections (Edge Creation)
| Dimension | Detail |
|---|---|
| Current | Handles render on nodes but dragging does nothing — `onConnect` not implemented |
| Expected | Drag source handle → drop on target → dialog: choose relation type + confidence |
| Missing | Entire user-initiated connection system |
| UX impact | User cannot express their own reasoning relationships — only AI can |

### 3.7 Node Editing
| Dimension | Detail |
|---|---|
| Current | Nodes are entirely read-only on canvas |
| Expected | Double-click → inline textarea edit → save → `PATCH /api/canvas/:id/node/:id/text` |
| Missing | Inline edit, text update API, undo support |

### 3.8 Branching
| Dimension | Detail |
|---|---|
| Current | BranchRail shows branches, "+" creates branch (API call works), switching sets state only |
| Bug | `activeBranchId` change does NOT trigger canvas reload — branch switch is cosmetic |
| Missing | Branch switch reload, merge, deletion, committed branch visual differentiation |
| UX impact | Core intellectual feature (parallel reasoning paths) is broken |

### 3.9 Deletion
| Dimension | Detail |
|---|---|
| Current | No mechanism exists to delete any node, edge, or branch |
| Missing | Delete key handler, context menu delete, confirmation dialog, API `DELETE` calls |

### 3.10 Undo/Redo
| Dimension | Detail |
|---|---|
| Current | Not implemented |
| Missing | Ctrl+Z/Y for position, text edit, connection, deletion operations |

### 3.11 Keyboard Shortcuts

| Key | Handler | Status |
|---|---|---|
| `B` | `onBranch` | ⚠️ Empty callback: `/* Branch Rail handles UI */` |
| `M` | `onMerge` | ❌ Empty: `/* TODO Phase post-9 */` |
| `C` | `onCompare` | ✅ Toggles `compareMode` state |
| `T` | `onTrace` | ❌ Empty: `/* Reasoning Path Walk launched from node context menu */` |
| `P` | `onPin` | ❌ Empty: `/* TODO */` |
| `Escape` | `onDismiss` | ✅ Closes all panels |
| `Ctrl+Enter` | TextInputBar | ✅ Submits text |

4 of 7 shortcuts are non-functional. No shortcut legend or help overlay exists.

### 3.12 AI / Voice Interactions
**Text:** Works end-to-end via SSE.  
**Voice:** `useVoice` opens WebSocket. `VoiceTranscript` displays live text. Canvas-mutating tool calls trigger a 600ms delayed reload. Voice and text are visually separate with no connection between them.

### 3.13 Memory Interactions
**Negotiation card:** Works — appears after compile when `memory_card_trigger` event fires. Scope selection calls ratify API.  
**Memory panel tabs:** Load on panel open. Edit/Archive work. Ratify works.  
**Impact Halo:** Pre-computed `impact_nodes` on each assumption node — hover on assumption in panel should activate amber glow on affected canvas nodes. **Bug:** `onHoverAssumption` prop passed to AssumptionAuditPanel always calls an empty function `() => {}` — halo never activates.

---

## 4. UX / HCI Audit

### 4.1 Cognitive Load — **High (Failing)**
The header bar presents 10+ icon-only interactive controls simultaneously with no visual hierarchy, grouping, or labels. A new user cannot determine what the primary action is or where to focus attention. The canvas is filled with a dot grid, the suggestion chips overlay the empty canvas, and the branch rail adds a third zone of chrome above the canvas before any content exists.

**Principle violated:** Miller's Law (7±2 chunks), Fitts's Law (tiny 18px icon touch targets)

### 4.2 Progressive Disclosure — **Failing**
The entire application feature set is present on screen from the first moment. Memory panel, assumption audit, activity log, incognito mode, source filter — none of this is contextually revealed as the user progresses through a session. All of it is always present, always demanding attention.

### 4.3 Learnability — **Poor**
No onboarding flow (ModeSelector bypassed). No tooltips that reliably appear. No contextual help. No empty state narrative. No "what do I do first?" guidance. The Suggestion Chips component exists precisely for this purpose but is always rendered (because `hasNodes` never becomes `true`) meaning it appears over actual content too.

### 4.4 Discoverability — **Poor**
Key features are invisible:
- StatusPill is clickable when "Working" (shows last 3 reasoning steps) — not discoverable
- Nodes are selectable — selection does nothing visible beyond border color
- Ctrl+Enter submits the textarea — hint is in placeholder text but buried
- Keyboard shortcuts B/C exist — no legend

### 4.5 Feedback — **Good**
The compilation pipeline provides genuine real-time feedback. Ribbon steps animate in sequentially. StatusPill pulses. Memory negotiation card has a satisfying amber entrance animation. PauseStopControls appear during compilation. These represent the best UX in the workspace — **preserve these patterns**.

### 4.6 Consistency — **Failing**
The workspace is visually a different application from the marketing site, dashboard, settings page, and every other page. Dark mode vs. warm light. Lime Pulse as primary accent vs. restricted binary signal. Uppercase labels vs. Switzer body text. `4px` border-radius buttons vs. `200px` pill buttons.

### 4.7 Error Prevention — **Moderate**
- TextInputBar disables submit during compilation ✅
- SSE error events close stream and show banner ✅
- PDF export errors use `alert()` ❌ (not a designed error state)
- No undo for any action ❌
- No confirmation dialogs ❌

### 4.8 Affordances — **Poor**
Node handles exist as visual affordances for connecting nodes — but dragging them does nothing. This is a **false affordance**: it implies a capability that doesn't exist, which is worse than no affordance at all.

### 4.9 User Control — **Below average**
AI creates all nodes and edges. Users can: type a prompt, toggle voice, toggle panels, switch branches (sort of), export. Users cannot: create nodes, delete nodes, edit node text, create edges, rearrange persistently, undo anything. The AI has far more control over the workspace state than the user does.

### 4.10 Accessibility — **Poor**
- Icon buttons have `title` only — not `aria-label`, not reliably accessible
- Color is the sole differentiator for edge types and confidence
- ReactFlow canvas is not keyboard navigable
- `#9c9c9c` on `#1a1a1a` contrast ratio ≈ 3.1:1 (fails WCAG AA 4.5:1 for normal text)
- No `aria-live` regions for SSE-driven content updates
- No focus trap or focus management when panels open/close

---

## 5. Technical Audit

### 5.1 State Management Bugs

| Bug | Root Cause | Impact |
|---|---|---|
| `hasNodes` never set true | `useState(false)`, no setter call | Suggestion chips always render over canvas |
| `assumptions` always `[]` | `useState([])`, no API call | AssumptionAuditPanel permanently empty |
| `activityEvents` always `[]` | `useState([])`, no API call | ActivityLog permanently empty |
| Branch switch breaks canvas | No `useEffect` on `activeBranchId` | Branch switching is cosmetic only |
| Node positions not persisted | No `onNodeDragStop` | Positions reset every reload |
| `modeSelected` defaults true | `useState(true)` | ModeSelector never shown |
| `triggerSessionAudit` never called | No event binding | Session audit impossible |
| `assumptions` prop always `[]` | `const [assumptions] = useState([])` | Impact Halo never activates |

### 5.2 Dead Code

| File/Feature | Status |
|---|---|
| `ReasoningPathWalk.tsx` | Complete component, never mounted |
| `ThinkingTimeline.tsx` | Complete component, never mounted |
| Keyboard shortcut B | Empty callback |
| Keyboard shortcut M | Empty callback |
| Keyboard shortcut T | Empty callback |
| Keyboard shortcut P | Empty callback |
| `triggerSessionAudit` | Defined, `void`-marked, never called |
| `addNodes` / `addEdges` from useCanvas | Defined, not used (canvas uses full reload) |

### 5.3 API Coupling Issues

| Location | Issue |
|---|---|
| `App.handleTextDrop` | Directly reads `import.meta.env.VITE_API_BASE_URL` — bypasses `api.ts` credentials handling |
| `ExportDialog.handleExport` | Same `import.meta.env` direct usage — no credential forwarding |
| Both above | No standardized error handling, no `ApiError` class usage |

### 5.4 Performance Issues

| Issue | Impact |
|---|---|
| `fitView` on every `loadCanvas()` | Disrupts user's zoom/pan position on every compilation |
| `displayNodes` creates new object references | All nodes re-render on every `impactedNodeIds` change |
| No canvas virtualization | Performance degrades with >100 nodes |
| `loadCanvas` fetches full canvas state | Includes branches on every node reload — wasteful |

### 5.5 Missing Backend APIs (Required for Complete Feature Set)

| API | Purpose |
|---|---|
| `PATCH /api/canvas/:id/node/:id/position` | Persist drag positions |
| `PATCH /api/canvas/:id/node/:id/text` | Inline text editing |
| `DELETE /api/canvas/:id/node/:id` | Node deletion |
| `POST /api/canvas/:id/edge` | User-created connections |
| `DELETE /api/canvas/:id/edge/:id` | Edge deletion |
| `GET /api/canvas/:id/activity` | Activity log data |

---

## 6. ThoughtDAG Comparison

**ThoughtDAG core philosophy:** *"Wires are the context. What the model sees is exactly what wires into the node. Editing the graph edits the model's memory."*

**Kleos core philosophy:** AI-mediated reasoning environment with transparent provenance, tiered human-governed memory, and branched parallel thought exploration.

### 6.1 What ThoughtDAG Does Better

| Pattern | ThoughtDAG | Kleos Current |
|---|---|---|
| **User graph agency** | Full creation, wiring, pruning, merging | AI-only creation; user is passive reviewer |
| **Context = wires** | Removing an edge changes AI context instantly | No equivalent; model reads full canvas |
| **In-canvas reading** | PDF reader with page-anchored nodes | No document ingestion |
| **Node condensing** | Human-initiated merge → higher conclusion | Merge is a TODO with empty callback |
| **Semantic zoom** | Multiple LOD tiers as you zoom out | No minimap, no zoom-aware labels |
| **Simplicity** | Very few UI elements, canvas-first | Header bar with 10+ controls |

### 6.2 What Kleos Does Better

| Feature | Kleos | ThoughtDAG |
|---|---|---|
| **Provenance tracking** | Every node: source type, memory tier, confidence | None |
| **Memory negotiation** | User explicitly governs what AI remembers | No memory system |
| **Workspace modes** | Analytical/Creative/Critical/Strategic | Single mode |
| **Branching** | Parallel thought branches with compare | None |
| **Voice input** | WebSocket with canvas-mutating tool calls | None |
| **Assumption audit** | Dedicated panel with Impact Halo | None |
| **SSE narration** | Real-time reasoning steps during compile | None |
| **Incognito mode** | Session without memory writes | None |

### 6.3 Patterns Worth Adopting from ThoughtDAG

**Adopt:**

1. **User-initiated edge creation** — Allow drag from handle → drop on target → pick relation type. Single most impactful missing feature. Gives users spatial reasoning agency.

2. **Node merge** — Select multiple nodes → AI synthesizes into one higher-order insight. ThoughtDAG's "thinking condenses in your hands" is a powerful HCI primitive.

3. **Selection-targeted AI query** — Select specific nodes → ask AI a question about *only those nodes*. More precise than whole-canvas compilation.

4. **Minimap** — Essential for navigation as canvases grow. ReactFlow ships `<MiniMap />` — low-effort, high-value addition.

5. **Semantic zoom** — At low zoom (overview), show only node type and a one-word label. At medium zoom, show full text. This manages information density at scale.

**Do not adopt:**

1. **No persistent memory** — ThoughtDAG's session-scoped model directly conflicts with Kleos's tiered memory governance, which is the core differentiator.

2. **Uniform node type** — ThoughtDAG uses generic nodes; Kleos's type system (idea/evidence/assumption/etc.) is a fundamental reasoning scaffold.

3. **Document-centric workflow** — ThoughtDAG centers on reading papers; Kleos centers on reasoning processes with any input type.

---

## 7. Cross-Application Integration Audit

### 7.1 Navigation Into Workspace

| Source | Route | Status |
|---|---|---|
| `DashboardPage` — new canvas | `POST /api/canvas` → `/workspace/:id` | ✅ Works |
| `DashboardPage` — existing canvas | `navigate('/workspace/:id')` | ✅ Works |
| Landing hero CTA | `/dashboard` (auth-aware after fix) | ✅ Fixed |
| NavBar authenticated | `/dashboard` | ✅ Works |
| DocsPage | No workspace entry point | ⚠️ Missing |
| ResearchPage | No workspace entry point | ⚠️ Missing |
| Footer | No workspace link | ✅ Correct (not a public destination) |

### 7.2 Navigation OUT of Workspace

| Destination | Mechanism | Status |
|---|---|---|
| Dashboard | **None** | 🔴 CRITICAL — user is trapped |
| Settings | None | 🔴 MISSING |
| Home/Landing | None | 🔴 MISSING |
| Different canvas | None (must go to dashboard first) | ⚠️ No quick switching |

Once a user enters `/workspace/:canvasId`, there is **no designed exit**. `WorkspaceLayout.tsx` is literally just `<Outlet />` — no navigation chrome. Browser back button is the only escape.

### 7.3 URL Routing

| Route | Resolves to | Notes |
|---|---|---|
| `/workspace/:canvasId` | `App.tsx` | Works |
| `/workspace` (no ID) | Blank `WorkspaceLayout` + nothing | Broken — should redirect to `/dashboard` |
| Direct link | Supported | `canvasId` from URL params |

### 7.4 Terminology Inconsistency Across Application

| Concept | Landing Site | Dashboard | Workspace | Docs | Status |
|---|---|---|---|---|---|
| The tool | "workspace" | "workspace" | "canvas" | — | Inconsistent |
| Thinking modes | Not mentioned | Shown on canvas cards | Analytical/Creative/Critical/Strategic | Not described | Gap |
| Memory | Not described | Not shown | 4-tier panel | Not described | Gap |
| Branching | Not mentioned | Not shown | Branch rail | Not described | Gap |
| Provenance | Not mentioned | Not shown | Color-coded | Not described | Gap |

**Result:** Users arrive at a feature-rich workspace with no mental model of its concepts. The marketing site and the product describe different realities.

### 7.5 Severity Summary for Integration Issues

| Issue | Severity | Fix |
|---|---|---|
| No exit navigation from workspace | 🔴 Critical | Add top-left logo/back button in WorkspaceLayout |
| `/workspace` with no ID shows blank | 🟠 High | Redirect to `/dashboard` |
| DocsPage/ResearchPage missing "Try it" CTA | 🟡 Medium | Add workspace launch CTA |
| Terminology inconsistency (canvas vs workspace) | 🟡 Medium | Standardize: "canvas" for the tool, "workspace" for the app |
| Marketing site doesn't explain modes/memory | 🟡 Medium | Update landing/docs |

---

## 8. Design System Compatibility Audit

### 8.1 Color — Completely Incompatible

| Element | Current Value | design.md Spec | Priority |
|---|---|---|---|
| Page/canvas background | `#111111` | `#edede8` Linen Canvas | 🔴 Critical |
| Panel backgrounds | `#1a1a1a` | `#ffffff` Frosted White | 🔴 Critical |
| Primary accent / active state | `#e5ff5d` Lime Pulse (as fill) | Binary signal only — small dot/check | 🔴 Critical |
| Node background | `#2b2b2b` | `#ffffff` or `#dbdbd2` | 🔴 Critical |
| Primary text | `#f9f9f9` | `#292929` Charcoal Body | 🔴 Critical |
| Secondary text | `#9c9c9c` | `#6f6f6e` Slate Caption | 🟠 High |
| Borders | `#2b2b2b` / `#565656` | `#d0d0c8` Quartz | 🟠 High |
| Error | `#e84040` | Conventional red, not specified | ✅ Acceptable |

**Design decision on canvas surface:** The inspiration images (Agently, Latern) both use light-mode canvases with subtle dot grids. This aligns with design.md's warm paper philosophy. **Recommendation: light canvas with `#edede8` background, Frosted White node cards, type-color borders preserved.**

### 8.2 Typography — Incompatible

| Element | Current | design.md | Priority |
|---|---|---|---|
| Font family | Unspecified (system fallback) | Switzer, weight 400 dominant | 🔴 Critical |
| Node text | 13px | 16px body-sm or 14px caption | 🟠 High |
| Panel headers | 13px | 16px+ | 🟠 High |
| Labels | 10px uppercase 0.04em | 12px, not uppercase | 🟠 High |
| Button text | 12-13px | 14px caption | 🟡 Medium |

### 8.3 Shape & Spacing

| Element | Current | design.md | Priority |
|---|---|---|---|
| CTA button radius | `4px` or `8px` | `200px` pill | 🔴 Critical |
| Card/panel radius | `12px` | `12px` | ✅ Correct |
| Node card radius | `12px` | `12px` | ✅ Correct |
| StatusPill radius | `4px` | `200px` pill | 🟠 High |

### 8.4 Component Token Mapping

| Component | Current | Should be |
|---|---|---|
| Primary CTA (submit) | `#e5ff5d` bg, `#111111` text, 4px radius | `#141414` bg, `#ffffff` text, 200px radius |
| Secondary buttons | transparent, `#565656` border | `#dbdbd2` bg, `#292929` text |
| Active/selected state | `#e5ff5d` highlight | Graphite/charcoal, NOT Lime Pulse |
| Tab active indicator | `#e5ff5d` underline | Charcoal underline or fill |
| Input borders | `#565656` → `#9c9c9c` on focus | `#d0d0c8` → `#141414` on focus |

### 8.5 Motion Compatibility

The workspace's animation choices are not in conflict with design.md (which doesn't prescribe canvas-specific animations). Spring slide panels, staggered node entrance, amber glow on negotiation card — all of these are appropriate and should be preserved.

---

## 9. Prioritized Issues

### 🔴 Critical

| # | Issue | Root Cause | Fix | Complexity |
|---|---|---|---|---|
| C1 | No exit navigation from workspace | WorkspaceLayout is just `<Outlet />` | Add back button / logo link | Low |
| C2 | Branch switch doesn't reload canvas | No `useEffect` on `activeBranchId` | Add effect → `loadCanvas()` | Low |
| C3 | `assumptions` never populated | `useState([])` with no setter call | Load from canvas nodes where type='assumption' | Medium |
| C4 | `activityEvents` never populated | Same pattern | Load from activity API endpoint | Medium |
| C5 | Node positions not persisted | No `onNodeDragStop` handler | Add handler → `PATCH /api/node/:id/position` | Medium |
| C6 | `hasNodes` never updated | `useState(false)`, no mutation | Derive from `nodes.length > 0` | Low |
| C7 | No node deletion mechanism | Not implemented | Add Delete key + context menu + API | Medium |
| C8 | Entire visual system contradicts design.md | Built before design.md was defined | Phase 1 migration: colors, typography, buttons | High |

### 🟠 High

| # | Issue | Fix | Complexity |
|---|---|---|---|
| H1 | No user-initiated edge creation | ReactFlow `onConnect` → POST edge API | High |
| H2 | Node text not editable | Double-click inline edit → PATCH API | Medium |
| H3 | `fitView` on every reload disrupts view | Only call on initial load | Low |
| H4 | MemoryPanel/AssumptionPanel positioned `top-0` | Change to `top-[84px]` | Low |
| H5 | `handleTextDrop` / `ExportDialog` bypass `api.ts` | Refactor to use `api.ts` | Low |
| H6 | No minimap for large canvases | Add ReactFlow `<MiniMap>` | Low |
| H7 | Layout contradicts canvas_goal.txt vision | Full layout redesign | High |
| H8 | Impact Halo never activates | `onHoverAssumption` always `() => {}` | Wire to `activateImpactHalo` | Low |
| H9 | No workspace name/title in chrome | No title field displayed | Add to workspace chrome | Low |
| H10 | ModeSelector permanently bypassed | `modeSelected=true` default | Show on first session, persist to localStorage | Low |

### 🟡 Medium

| # | Issue | Fix | Complexity |
|---|---|---|---|
| M1 | 4/7 keyboard shortcuts are no-ops | Implement B, M, T, P | Medium |
| M2 | No node context menu | Right-click → ReactFlow context menu | Medium |
| M3 | Submit button label "Drop" is confusing | Rename to "Think" or "Analyze" | Trivial |
| M4 | No file ingestion in chat bar | Add attachment button → file picker | Medium |
| M5 | PDF export uses `alert()` for errors | In-dialog error state | Low |
| M6 | ReactFlow attribution visible | `proOptions={{ hideAttribution: true }}` | Trivial |
| M7 | `/workspace` with no ID shows blank | Redirect to `/dashboard` | Low |
| M8 | `triggerSessionAudit` never called | Wire to navigation-away event | Medium |
| M9 | ThinkingTimeline, ReasoningPathWalk unmounted | Mount or delete | Low |
| M10 | Branch compare mode sets state but no visual diff | Build side-by-side view | High |
| M11 | Node merge is completely unimplemented | Build merge dialog + API | High |

### 🟢 Low

| # | Issue | Fix |
|---|---|---|
| L1 | No keyboard navigation for canvas nodes | ReactFlow keyboard focus plugin |
| L2 | `#9c9c9c` on `#1a1a1a` fails WCAG AA (3.1:1) | Lighten text or darken bg |
| L3 | No edge labels | Optional hover-reveal label |
| L4 | Incognito border clips outer nodes | Adjust inset calculation |
| L5 | StatusPill tooltip doesn't close on Escape | Add Escape handler |
| L6 | VoiceTranscript has no `aria-live` | Add `aria-live="polite"` |
| L7 | MemoryNegotiationCard has duplicate dismiss paths | Remove extra "Dismiss" button |
| L8 | ReactFlow Controls use hardcoded dark colors | Style to match design system |
| L9 | No Ctrl+Z/Y undo/redo | ReactFlow history plugin |
| L10 | `#e5ff5d` assumption node border too visually dominant | Tone down post-theme migration |

---

## 10. Strengths

1. **SSE compilation pipeline** — Real-time step narration with ribbon animation is the standout UX moment. Preserve this pattern.
2. **Memory Negotiation Card** — Amber glow, 2×2 scope grid, and clear outcome paths. Most polished component in the workspace.
3. **Semantic edge system** — Color by relation type + dash by confidence is sophisticated and information-rich.
4. **Type system** — `types/index.ts` is clean, comprehensive, and well-documented.
5. **Node registry pattern** — Central config makes node types extensible without touching render code.
6. **`useCanvas` hook** — Clean abstraction of ReactFlow state from App.tsx.
7. **Incognito mode** — Unique privacy primitive for AI workspaces; no competitor has this.
8. **Branching concept** — Parallel thought branches are a differentiated HCI feature.
9. **Impact Halo architecture** — Pre-computed `impact_nodes` for O(1) hover highlight is architecturally sound.
10. **Memory tier UI** — Core/Session/Pending/Source with user ratification is novel and principled.

---

## 11. Production Readiness Assessment

| Dimension | Score | Notes |
|---|---|---|
| Visual Design | 3/10 | Completely disconnected from design.md |
| Layout / Information Architecture | 4/10 | Contradicts canvas_goal.txt vision |
| Core Feature Completeness | 5/10 | Compilation, memory, voice work; node CRUD entirely missing |
| Feature Stability | 4/10 | hasNodes, assumptions, branch switch, Impact Halo all broken |
| Technical Architecture | 7/10 | Good hook pattern, type system, SSE pipeline |
| Cross-App Integration | 4/10 | No exit navigation, marketing/product disconnect |
| Accessibility | 3/10 | Icon-only nav, contrast failures, no ARIA live regions |
| **Overall** | **6/10** | Strong foundation, not production-ready as a complete product |

---

## 12. Recommended Scope for Next Iteration

Based on this audit, the `canvas_goal.txt` vision, and the inspiration images:

### Priority 1 — Critical Bugs (before any redesign)
- Fix `hasNodes`, branch switch, Impact Halo wiring, `fitView` on reload
- Add back-to-dashboard link in workspace chrome
- Fix panel `top-0` positioning to `top-[84px]`
- Populate `assumptions` and `activityEvents`

### Priority 2 — Layout Redesign (per canvas_goal.txt)
- **Top bar:** Hamburger drawer (left), persona dropdown, workspace name (center), export (right)
- **Canvas:** Clean light-mode dot grid surface
- **Left rail:** Node chip list, expands when node clicked (canvas_goal.txt sketch)
- **Bottom-left toggle:** Memory + Assumptions panel
- **Bottom center:** Chat bar with mic icon and ingestion (file attach)
- **Bottom-right toggle:** Sources panel
- **Right panel:** Menu overflow — all features accessible from hamburger

### Priority 3 — Theme Migration
- Light canvas: `#edede8` background
- Frosted White node cards with type-color borders
- Switzer font
- Graphite-ink CTAs (200px radius)
- Remove `#e5ff5d` as primary accent; reserve for binary signals only

### Priority 4 — User Agency
- User-initiated edge creation (drag handle → connect)
- Node deletion (Delete key + context menu)
- Inline node text editing (double-click)
- Position persistence (drag stop → API)
- Minimap

---

*Generated: 2026-08-06 | Codebase snapshot: commit `c2888f6`*
*Reference: canvas_goal.txt, design.md, ThoughtDAG (github.com/chenxiachan/thoughtdag), Agently canvas reference (828f1ca..webp), Latern workflow reference (original-e013...webp)*
