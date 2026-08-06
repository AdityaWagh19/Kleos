# Canvas Workspace Audit
## Definitive Reference for Workspace v2 Planning

---

## Executive Summary

Kleos implements a fully functional, architecturally sophisticated AI reasoning workspace. The implementation is technically sound: the node system, edge system, SSE streaming pipeline, memory tier system, branching model, voice interface, and export flow all exist and are wired together correctly. The design language is coherent and intentional — dark canvas, citrine accent, Material Symbols, framer-motion choreography.

However, there is a profound gap between what the marketing website promises and what the workspace currently delivers as a user experience. The marketing site describes a spatial AI canvas where ideas are objects you can hover, override, and trace — yet most of these interactions are not wired to the UI. The components exist (AssumptionAuditPanel, MemoryNegotiationCard, Impact Halo, ReasoningPathWalk) but they are either disconnected, unpopulated, or unreachable through normal user flow.

The workspace also exists in a separate visual world from the rest of the application. The marketing site uses warm stone tones (`#edede8`, `#292929`), light mode, large airy typography at 64–80px. The workspace uses a pure dark carbon interface (`#111111`) with compact 11–13px text and dense controls. This is not inherently wrong — the canvas needs its own visual register — but the transition between them has no bridge: one moment you are on a warm beige landing page, the next you are inside a dark terminal.

**Production readiness: 3/10 for interaction depth. 8/10 for technical architecture. 5/10 for overall product coherence.**

---

## 1. Workspace Architecture

### 1.1 Overall System Architecture

```
Browser URL: /workspace
  └── WorkspaceLayout (layout/WorkspaceLayout.tsx)
        ├── NavBar (absolute positioned, z-50, overlays canvas)
        └── main (pt-[60px], flex-1)
              └── App.tsx (workspace entry point, handles all state)
                    ├── Bootstrap: POST /api/canvas → canvasId, branchId
                    ├── ModeSelector (fullscreen modal, shown once per session)
                    └── Main Canvas Layout
                          ├── MemoryPanel (left, absolute, 288px, z-30)
                          ├── main (flex-1, flex-col)
                          │     ├── Header Bar (48px height, z-index implicit)
                          │     │     ├── Memory toggle icon
                          │     │     ├── ModeIndicator (clickable)
                          │     │     ├── SourceFilter
                          │     │     ├── [spacer flex-1]
                          │     │     ├── StatusPill
                          │     │     ├── PauseStopControls
                          │     │     ├── Voice toggle icon
                          │     │     ├── Incognito toggle icon
                          │     │     ├── Assumption Audit toggle icon
                          │     │     └── Activity Log toggle + Export icon
                          │     ├── BranchRail (36px, horizontal tab bar)
                          │     ├── Canvas area (flex-1, relative)
                          │     │     ├── KleosCanvas (ReactFlow)
                          │     │     │     ├── Background (dots)
                          │     │     │     ├── Controls (zoom +/-)
                          │     │     │     ├── BaseNode (8 types)
                          │     │     │     └── KleosEdgeComponent
                          │     │     ├── SuggestionChips (absolute center, empty state)
                          │     │     ├── Incognito border overlay
                          │     │     ├── AssumptionAuditPanel (right, absolute, 300px, z-30)
                          │     │     ├── MemoryNegotiationCard (bottom-right, absolute, z-40)
                          │     │     ├── VoiceTranscript
                          │     │     └── ReasoningRibbon (absolute bottom, 36px)
                          │     ├── Drop error banner (conditional)
                          │     └── TextInputBar (shrink-0, 48+px)
                          └── Overlays (fixed, z-50)
                                ├── ActivityLog
                                ├── SessionMemoryAuditCard
                                └── ExportDialog
```

### 1.2 Data Flow

```
User input (text/voice)
  → TextInputBar.onSubmit / useVoice.onToolCall
  → App.handleTextDrop
  → SSE EventSource: GET /api/canvas/{id}/stream?text=...&workspace_mode=...&branch_id=...
  → Backend stream.py:
      1. Emit 3 immediate step events (ribbon animation)
      2. llm_service.compile_document(text, mode) → GPT-4o
      3. Emit compilation event
      4. canvas_service.apply_compilation() → write to Supabase
      5. Check memory card trigger
      6. Emit done
  → Frontend on 'done': window.dispatchEvent('kleos:reload-canvas')
  → useCanvas.loadCanvas() → GET /api/canvas/{id} → ReactFlow state update
```

### 1.3 State Management

All state lives in `App.tsx` as `useState` hooks — there is no global state manager (no Zustand, no Context API, no Redux). This is architecturally simple but creates a massive component with 30+ state variables, 10+ callbacks, and complex render logic all in one file (455 lines). The canvas state is managed separately in `useCanvas.ts`, which is the cleanest hook in the codebase.

**Key state buckets in App.tsx:**
- Canvas lifecycle: `canvasId`, `branchId`, `loading`, `error`
- Mode: `mode`, `modeSelected`
- AI compilation: `ribbonSteps`, `isCompiling`, `pillState`, `dropError`, SSE ref
- Panel visibility: `memoryOpen`, `auditOpen`, `activityOpen`, `exportOpen`, `showAuditCard`
- Incognito: `incognito`, `showIncognitoBorder`
- Memory negotiation: `negCardOpen`, `negCardObs`
- Voice: `transcript`, `sourceFilter`

### 1.4 Backend API Surface

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/canvas | Create canvas + main branch |
| GET | /api/canvas/{id} | Load full canvas state |
| GET | /api/canvas/{id}/stream | SSE compilation stream |
| PUT | /api/canvas/{id}/mode | Update workspace mode |
| PUT | /api/canvas/{id}/incognito | Toggle incognito |
| POST | /api/canvas/{id}/branch | Create new branch |
| POST | /api/canvas/{id}/drop | File/text drop (legacy, non-SSE) |
| GET | /api/canvas/{id}/memory | List memories |
| POST | /api/canvas/{id}/memory/{id}/ratify | Ratify pending memory |
| PUT | /api/canvas/{id}/node/{id}/scope | Update node memory scope |
| GET | /api/canvas/{id}/session-audit | Get session audit items |
| POST | /api/canvas/{id}/audit | Submit audit decisions |
| GET | /api/canvas/{id}/export/markdown | Export as Markdown |
| POST | /api/canvas/{id}/export/pdf | Export as PDF |
| WS | /ws/voice?canvas_id= | Real-time voice WebSocket |
| GET | /api/auth/login/google | OAuth initiate |
| POST | /api/contact | Contact form |

---

## 2. UI Layout Description (Pixel-Perfect)

### 2.1 Entry States

**Loading State:**  
Full `h-screen w-screen` centered div. Background `#111111`. 12px text, color `#9c9c9c`. Text: "Initialising canvas…" No animation, no spinner.

**Error State:**  
Same layout. 12px text, color `#e84040`. Text: "Failed to connect to the Kleos AI service. Please try again later." followed by raw error string. No retry button.

**ModeSelector (First-Use Onboarding):**  
`fixed inset-0 z-50`. Background `#111111`. Centered column layout.  
- Top label: 12px, `#9c9c9c`, uppercase, tracking-wide: "WHAT KIND OF THINKING ARE YOU DOING TODAY?"  
- Heading: 48px, weight 400, uppercase, center, `#f9f9f9`: "CHOOSE YOUR / REASONING MODE"  
- 2×2 grid (max-width 560px, gap 16px) of mode cards:
  - Each card: `#1a1a1a` background, `1px solid #2b2b2b` border, `12px` radius, `p-5`
  - Icon (20px, colored) + label (16px, weight 500, `#f9f9f9`) + description (13px, `#9c9c9c`)
  - Hover: scale(1.02) via framer-motion, tap: scale(0.98)

### 2.2 Main Workspace Layout

**NavBar (absolute top, z-50, height 60px):**  
The marketing site NavBar intrudes into the workspace. It sits absolutely positioned with backdrop blur over the canvas. Contains: Kleos wordmark (left), Docs/Research/Contact links (center-right), Log In link + "Open Workspace" pill (right). This NavBar is **not workspace-aware** — it shows marketing navigation inside the product.

**Header Bar (48px height, background `#1a1a1a`, `1px solid #2b2b2b` bottom border):**  
Left-to-right: `px-4` padding, `gap-2`, `items-center`.
1. Memory icon button (18px `#9c9c9c`, yellow when open)
2. ModeIndicator pill (11px, colored background+border, icon + label + swap_horiz icon)
3. SourceFilter (icon buttons for each provenance type)
4. `flex-1` spacer
5. StatusPill (11px, `#2b2b2b` bg, `1px solid #565656` border, 8px dot or mic icon, animated pulse)
6. PauseStopControls (pause + stop icons, only visible when compiling)
7. Voice toggle icon (18px, yellow when active)
8. Incognito toggle icon (18px, white when on)
9. Assumption Audit toggle icon (help, 18px)
10. Activity Log toggle icon (history, 18px)
11. Export icon (download, 18px)
12. Incognito badge (conditional: 10px pill, `#f9f9f9` text, `#2b2b2b` bg with white border)

**Branch Rail (36px height, background `#1a1a1a`, bottom border):**  
Horizontal scroll strip below header. Contains branch pills (11px, active: `#2b2b2b` bg + `#e5ff5d` border; inactive: transparent). Each inactive branch has a `compare_arrows` icon. Plus a `fork_right` icon to create new branch. "Compare Mode" amber label appears at far right when active.

**Canvas Area (flex-1, relative):**  
- ReactFlow renders here: background `#111111`, dot grid (color `#2b2b2b`, gap 24, size 1)
- ReactFlow built-in Controls: bottom-left, `#2b2b2b` bg, `1px solid #565656` border, `8px` radius
- ReactFlow attribution: bottom-left
- **Issue:** The built-in ReactFlow Controls overlap the React Flow attribution watermark

**SuggestionChips (absolute center, empty state only):**  
Centered column. Label: 12px, `#565656`, uppercase. 4 chips in a wrapping flex: `#2b2b2b` bg, `1px solid #565656` border, `4px` radius. Icon + label. One chip has a yellow "← primary input" annotation.

**MemoryPanel (absolute left-0, z-30, width 288px):**  
Spring-animated slide from left. `#1a1a1a` bg, `1px solid #2b2b2b` right border.
- Header: "Memory" (13px, 500, `#f9f9f9`) + close X
- Search bar: `#111111` bg, `1px solid #565656` border, 4px radius
- Tabs: Core / Session / Pending / Source (10px uppercase, active: `#e5ff5d` with 2px bottom border)
- Memory items: 12px text, tier color badges (9px), action buttons (9px)

**AssumptionAuditPanel (absolute right-0, z-30, width 300px):**  
Spring-animated slide from right. Mirror of MemoryPanel. Empty state: `help_outline` icon, 12px gray text.

**ReasoningRibbon (absolute bottom-0 left-0 right-0, z-20, 36px):**  
Appears during/after compilation. Numbered step badges (16×16px circles) + truncated action text + `chevron_right` connectors, scrollable horizontally. Fades out 2s after compilation.

**TextInputBar (shrink-0, bottom of main column):**  
`#1a1a1a` bg, `1px solid #2b2b2b` top border, `px-4 py-3`. Textarea (2 rows, `#111111` bg, `1px solid #565656`) + Submit button (`#e5ff5d` bg, `#111111` text, 8px radius, 40px height). Button label: "Drop" (not "Submit" or "Compile"). Spinner shows "Working…" during compile.

**MemoryNegotiationCard (absolute bottom-16 right-4, z-40):**  
288px wide, `#1a1a1a` bg, `1px solid #f5c842` border (amber), 12px radius. Spring animation with amber glow pulse. Shows observation text + 2×2 grid of scope buttons.

**ExportDialog (fixed inset-0, z-50):**  
Modal with `rgba(17,17,17,0.8)` backdrop. 384px panel: format toggle (Markdown/PDF), export type radio list (3 options), progress bar for PDF, Export button (`#e5ff5d`).

---

## 3. Node & Edge System

### 3.1 Node Types (8 types)

| Type | Border | Border Style | Background | Icon |
|------|--------|-------------|------------|------|
| idea | `#565656` | solid | `#2b2b2b` | lightbulb |
| evidence | `#4a90d9` | solid | `#2b2b2b` | article |
| assumption | `#e5ff5d` | **dashed** | `#2b2b2b` | help |
| question | `#9c9c9c` | solid | `#2b2b2b` | question_mark |
| constraint | `#d97b4a` | solid | `#3a2a1a` | block |
| insight | `#7dcfb6` | solid (2px) | `#2b2b2b` | psychology |
| decision | `#f9f9f9` | solid | `#1a1a1a` | check_circle |
| source | `#565656` | solid | `#1f2329` | folder |
| cluster | (special) | — | — | — |

**Node anatomy (BaseNode.tsx):**
- `motion.div`: entrance animation (opacity 0→1, scale 0.88→1, 180ms ease-out, staggered 60ms delay)
- Min-width 200px, max-width 280px, 12px radius, 10px/12px padding
- Header row: 14px icon (type color) + 10px uppercase label (`#9c9c9c`) + ProvenanceBadge (ml-auto)
- Content: 13px text, `#f9f9f9`, italic for questions, medium weight for decisions
- Optional: ScopeChip, error state (with Retry button)
- Connection handles: left (target, 8×8px circle, `#565656` bg) + right (source, same)
- Selected state: yellow `#e5ff5d` border override
- Impact Halo: amber glow `0 0 0 2px #f5c842, 0 0 12px 4px #f5c84240` (pulsing)
- Dimmed state: opacity 0.15

### 3.2 Edge System

4 edge types, 3 confidence levels:

| Type | Color |
|------|-------|
| supports | `#4a90d9` (blue) |
| contradicts | `#e84040` (red) |
| depends_on | `#f5c842` (amber) |
| derived_from | `#9c9c9c` (gray) |

| Confidence | Dash Pattern |
|-----------|-------------|
| high | solid (0) |
| medium | `6,3` dashes |
| low | `3,3` dashes |

Edge rendering: SVG `getBezierPath`, 1.5px stroke, 0.8 opacity. Wide 16px transparent hit area for easier interaction.

### 3.3 Provenance Badge Colors

`document: #4a90d9` | `core_memory: #4caf7d` | `ai_inference: #f5c842` | `parametric: #e84040` | `user_created: #f9f9f9` | `voice_input: #e5ff5d`

---

## 4. Interaction Documentation

### 4.1 Node Interactions

| Interaction | Current Behavior | Expected | UX Implications |
|-------------|-----------------|---------|----------------|
| Node creation | AI-driven via text drop. SSE stream → DB write → canvas reload | Same | ✅ Works |
| Node selection | ReactFlow default single-click | — | No visual feedback beyond yellow border |
| Multi-selection | ReactFlow default (Shift+click, drag box) | — | No custom behavior |
| Node drag | ReactFlow default. **Not persisted to backend.** | Position should persist | Positions reset on reload |
| Right-click / context menu | **No context menu implemented** | Should show: Edit, Delete, Pin, Branch from here, Trace reasoning | Major missing affordance |
| Hover on assumption | **Not implemented in UI.** Impact Halo state exists (`activateImpactHalo`) in useCanvas but never called from any user gesture | Should dim other nodes, glow impact nodes | Critical gap — main selling point |
| Node edit | **Not implemented.** No inline edit possible | Should allow double-click to edit text | Ideas are read-only once created |
| Node delete | **Not implemented via UI.** API endpoint exists | Should allow Del key or context menu | Cannot remove nodes from canvas |
| Node pin | Shortcut `P` is registered → `onPin: () => {}` (no-op) | Should pin/unpin node | Broken shortcut |

### 4.2 Canvas Interactions

| Interaction | Current | Expected | Notes |
|-------------|---------|---------|-------|
| Pan | ReactFlow default (middle-mouse / space+drag) | Same | ✅ Works |
| Zoom | ReactFlow default (scroll wheel, +/- controls) | Same | ✅ Works. minZoom 0.2, maxZoom 2 |
| fitView | Automatic on load | — | ✅ Works |
| Drop file | **Only TextInputBar text submission triggers compilation.** `SuggestionChips` "Drop your documents here" button calls `onOpenDrop()` which is `() => {}` (no-op). File drag-and-drop onto canvas is not implemented. | Should accept PDF/DOCX drag-drop | Broken CTA |
| Undo/Redo | **Not implemented.** No history stack. | Essential for canvas | Missing entirely |
| Select all | **Not implemented.** | Cmd+A | Missing |

### 4.3 AI Interactions

| Interaction | Current | Status |
|-------------|---------|--------|
| Text submission | TextInputBar → SSE stream → nodes appear | ✅ Works |
| Voice input | useVoice → WebSocket → GPT-4o realtime API → canvas reload | ✅ Architecturally complete, needs testing |
| Compilation feedback | ReasoningRibbon (3 steps visible during compile) | ✅ Works, fades correctly |
| Status indication | StatusPill (Working/Listening/Ready) | ✅ Works |
| Pause compilation | PauseStopControls → closes SSE stream, marks `isCompiling=false` | ✅ Works (client-side pause) |
| Stop compilation | Same as Pause + `revertCompilation()` removes in-progress nodes | ✅ Works |
| Contradiction detection | Backend detects contradictions, but no UI shows them | ❌ Backend feature, frontend silent |

### 4.4 Branching

| Interaction | Current | Status |
|-------------|---------|--------|
| Create branch | BranchRail `fork_right` button → inline name input → POST /api/canvas/{id}/branch | ✅ Works |
| Switch branch | Click branch pill → `setActiveBranchId()` → **does not reload canvas nodes for that branch** | ❌ Partial. Branch switching only changes the UI indicator, does not fetch branch-specific nodes |
| Compare branches | `compare_arrows` button → `setCompareMode(true)` → amber "Compare Mode" label appears, nothing else | ❌ Not implemented |
| Keyboard shortcut B | `onBranch: () => {}` no-op | ❌ Broken |
| Keyboard shortcut C | `setCompareMode(c => !c)` | ✅ Partially works |
| Keyboard shortcut M | `onMerge: () => {}` no-op | ❌ Broken |

### 4.5 Memory Interactions

| Interaction | Current | Status |
|-------------|---------|--------|
| Open memory panel | Header memory icon | ✅ Works |
| View memories by tier | Tabs (Core/Session/Pending/Source) | ✅ Works |
| Search memories | Search input with filter | ✅ Works |
| Edit memory text | Edit button → textarea → Save | ✅ Works |
| Archive memory | Archive button | ✅ Works |
| Ratify pending memory | Ratify buttons (global/workspace/session) | ✅ Works |
| Memory Negotiation Card | Triggered by backend `memory_card_trigger` SSE event | ✅ Wired. Appears bottom-right |
| Session Memory Audit | `triggerSessionAudit()` exists but is never called — exposed to `void` but not attached to any UI gesture | ❌ Not triggerable by user |

### 4.6 Keyboard Shortcuts

| Key | Action | Status |
|-----|--------|--------|
| B | Create branch | ❌ No-op |
| M | Merge | ❌ No-op |
| C | Toggle compare mode | ✅ Works |
| T | Trace reasoning path | ❌ No-op |
| P | Pin node | ❌ No-op |
| Escape | Dismiss panels/overlays | ✅ Works |
| Ctrl+Enter | Submit text input | ✅ Works |

---

## 5. ThoughtDAG Comparison

### 5.1 ThoughtDAG Core Principle

> "Wires are the context. What the model sees is exactly what wires into the node. Editing the graph edits the model's memory."

ThoughtDAG treats graph topology as the prompt. Deleting an edge literally changes what the model knows. Nodes are explicit inputs to AI queries, not just visualizations of AI outputs.

### 5.2 What ThoughtDAG Does Better

| Area | ThoughtDAG | Kleos Current |
|------|-----------|--------------|
| **User control over AI context** | Edges = context. Delete edge = change AI input. Explicit, tactile | AI decides all nodes and edges. User is observer |
| **Human in the loop** | No autonomous agent redraws your graph | AI rewrites entire canvas on each submission |
| **In-place PDF reading** | Select text in PDF, ask right there, answer lands on canvas with page chip | File drop not even implemented in UI |
| **Semantic zoom** | Three zoom levels show different abstraction tiers | Single zoom level, no semantic clustering |
| **Node merging** | Merge multiple nodes into one synthesis | Merge shortcut (M) is a no-op |
| **Graph condensation** | Graph folds inward on synthesis | Canvas only ever grows |
| **Direct node editing** | Nodes are editable text | Nodes are read-only after AI creation |

### 5.3 What Kleos Does Better / Differently

| Area | Kleos | ThoughtDAG |
|------|-------|-----------|
| **Provenance tracking** | Every node has ProvenanceType, ProvenanceBadge, source tracing | Basic |
| **Memory architecture** | 4-tier memory system, consent-first, quarantine model | Not applicable |
| **Workspace modes** | 4 modes that change AI reasoning behavior | Single mode |
| **Assumption auditability** | Dedicated Assumption Audit Panel with impact nodes | Not applicable |
| **Impact Halo** | (Designed) — visual blast radius of belief changes | Not applicable |
| **Voice-first input** | Full WebSocket voice pipeline | Not implemented |
| **Branch as reasoning path** | Branches for parallel hypothesis exploration | Minimal |
| **Incognito mode** | No memory write mode | Not applicable |

### 5.4 Patterns Worth Adopting from ThoughtDAG

1. **Edges as context**: Allow users to select specific nodes as "context" for the next AI query, rather than always compiling the entire text input. This transforms the model from "AI owns the graph" to "human steers the AI with the graph."
2. **In-place annotation**: Click a node to ask a follow-up question that anchors to that node's context — like ThoughtDAG's PDF passage selection pattern.
3. **Direct inline editing**: Nodes must be double-click editable. ThoughtDAG's core UX depends on this.
4. **Graph condensation affordance**: A "synthesize selected" interaction that merges multiple nodes into one higher-order conclusion.
5. **Semantic zoom levels**: At high zoom, show full node content; at medium, show just labels; at low zoom, show clusters with summaries only.

### 5.5 Patterns Not Worth Adopting

- **Wire-as-prompt architecture**: Kleos' value is in the memory system, provenance, and mode-directed reasoning, not in manual graph wiring. Adopting ThoughtDAG's wire-as-context model completely would gut Kleos' differentiation.
- **No autonomous AI rewriting**: Kleos' core UX is that the AI compiles ideas into structured nodes. ThoughtDAG's philosophy would restrict this. The right answer is a **hybrid**: AI creates initial structure, user can then prune, edit, and reconnect.

---

## 6. Cross-Application Integration Audit

### 6.1 Navigation to Workspace

| Entry Point | Location | Status | Issue |
|-------------|----------|--------|-------|
| "Open Workspace" pill | NavBar (all pages) | ✅ Link to `/workspace` | — |
| "Open Workspace" CTA | Landing Page hero | ✅ Link to `/workspace` | — |
| "Try it in Workspace →" | Landing Page WOW 1 section | ✅ Link to `/workspace` | — |
| "Open Workspace →" | Landing Page WOW 2 section | ✅ Link to `/workspace` | — |
| "Workspace" | Footer Site column | ✅ Link to `/workspace` | — |
| "Log in" | NavBar | ⚠️ Links to `/api/auth/login/google` directly | OAuth HTTPS fix deployed; verify |

### 6.2 Routes & Layouts

| Route | Layout | Component |
|-------|--------|-----------|
| `/` | Layout (NavBar + Footer) | LandingPage |
| `/docs` | Layout (NavBar + Footer) | DocsPage |
| `/research` | Layout (NavBar + Footer) | ResearchPage |
| `/contact` | Layout (NavBar + Footer) | ContactPage |
| `/workspace` | **WorkspaceLayout** (NavBar only, no Footer) | App.tsx |
| `*` | Layout | NotFoundPage |

**Critical Issue: NavBar inside WorkspaceLayout**  
WorkspaceLayout renders the marketing NavBar (`absolute top-0 z-50`) over the workspace. This means:
1. The workspace header bar is 48px tall, positioned at `top-0` of `main` (after `pt-[60px]` for NavBar)
2. Users inside the workspace can click "Docs", "Research", "Contact" and navigate away, losing their canvas session
3. There is no "Back to Canvas" or workspace-specific navigation
4. The workspace has no breadcrumb showing which canvas the user is in

### 6.3 Terminology Consistency

| Term | Marketing Site | Workspace | Issue |
|------|---------------|-----------|-------|
| Input modality | "Voice-first" | "Say something ← primary input" | ✅ Consistent |
| Memory | "Memory you control" | Memory Panel, tier system | ✅ Consistent |
| Assumptions | "Hover any assumption" | AssumptionAuditPanel | ⚠️ Hover doesn't work yet |
| Reasoning | "Reasoning isn't buried" | ReasoningRibbon, ReasoningPathWalk | ⚠️ PathWalk component exists but is never rendered |
| Branching | Not prominently mentioned | BranchRail | OK |

### 6.4 Orphaned / Dead References

| Issue | Location | Description |
|-------|----------|-------------|
| `ReasoningPathWalk.tsx` | `canvas/` | Fully implemented component (126 lines). Never imported or rendered anywhere in App.tsx |
| `ThinkingTimeline.tsx` | `panels/` | Fully implemented component (3.7KB). Never imported or rendered |
| `BranchRailStub.tsx` | `components/` | Alternative branch rail stub. Never imported |
| `useSSE.ts` | `hooks/` | Separate SSE hook. App.tsx implements its own inline SSE instead |
| `onOpenDrop` prop | SuggestionChips | Passed as `() => {}` no-op from App.tsx. "Drop your documents" chip does nothing |
| `onFocusText` prop | SuggestionChips | Passed as `() => {}` no-op. "Type an idea" chip does nothing |
| `triggerSessionAudit` | App.tsx L222 | Called `void triggerSessionAudit` — exposed but not attached to any UI trigger |
| GitHub, Hackathon, SIGCHI links | Footer | All `href="#"` — dead |
| "Read Docs" CTA | Landing hero | Links to `/docs` which shows "Work in progress" |

### 6.5 CORS Configuration Bug

`main.py` line 23: CORS `allow_origins` only permits `["http://localhost:5173"]`. In production, all API requests come from `https://kleos-ai.duckdns.org`. However, since Nginx proxies `/api/*` as a same-origin request to the backend container, CORS headers are evaluated against the request origin. If the browser ever makes a direct cross-origin request (which it doesn't with the Nginx setup), this would fail. The `FRONTEND_URL` env variable is injected by deploy.yml but is never used in main.py to configure CORS. **Latent bug that will surface if deployment topology changes.**

---

## 7. Design System Compatibility Audit

### 7.1 Two Design Systems

The project has two distinct design registers:

**Marketing Site (Light Mode):**
- Background: `#edede8` (warm cream)
- Text: `#292929` (near-black)
- Secondary text: `#6f6f6e` (warm gray)
- Accent: `#141414` (near-black buttons) and `#e4e4e0` (soft buttons)
- Radius: `rounded-full` for CTAs, `rounded-[12px]` for cards
- Typography: 64–80px hero, 45px section heads, 27px body leads
- Font: Switzer (index.css) / Geist Variable (theme.css) — **conflicting declarations**

**Workspace (Dark Mode):**
- Background: `#111111` (carbon black)
- Surface: `#1a1a1a` panels, `#2b2b2b` raised elements
- Text: `#f9f9f9` (bone white)
- Secondary text: `#9c9c9c` (stone)
- Accent: `#e5ff5d` (citrine signal)
- Radius: `4px` (buttons), `8px` (inputs), `12px` (cards)
- Typography: 10–13px primary, 11px controls, 14px node text
- Font: Switzer / Neue Haas Grotesk (variables.css) — inconsistent with theme.css

### 7.2 Specific Incompatibilities

| Element | Marketing Site | Workspace | Severity |
|---------|---------------|-----------|----------|
| NavBar | Light bg, blur, warm text | Same NavBar overlaid on dark canvas | High — jarring visual transition |
| Background | `#edede8` | `#111111` | By design — acceptable |
| Font | Switzer (index.css) | Switzer (index.css) | ✅ Same |
| Button radius | `rounded-full` (CTAs) | `4px` | Medium — inconsistent pill vs sharp |
| Error color | `red-50 / red-600` (ContactPage Tailwind) | `#e84040` (workspace custom) | Medium |
| Spacing unit | Mixed (Tailwind arbitrary values) | Mixed (inline styles) | Medium |
| Link styles | `no-underline`, hover color shift | Icon buttons | OK |
| `theme.css` font | Geist Variable | — | Low — loaded but unused |
| `theme.css` OKLCH colors | shadcn defaults | Never used in workspace | Medium — dead CSS |

### 7.3 The Marketing NavBar in the Workspace

This is the single most important design system incompatibility. The NavBar was designed for the marketing site. In the workspace it:
1. Occupies 60px of workspace vertical space
2. Shows marketing navigation (Docs, Research, Contact) that breaks the canvas session
3. Clips over the workspace header bar at the top-left (z-50 NavBar vs the workspace header below)
4. Has a `backdrop-filter: blur(12px)` with `rgba(237,237,232,0.85)` — a warm beige glass effect floating over the dark canvas

The correct solution is a purpose-built workspace nav/topbar that shows: canvas title, user avatar/logout, breadcrumb back to landing page — not the marketing nav links.

---

## 8. HCI Evaluation

### 8.1 Cognitive Load

**High cognitive load issues:**
- 10+ icon buttons in the header with no labels. A new user has no idea what `history`, `help`, `visibility`, `memory`, `analytics` icons mean in context.
- The workspace spawns immediately into a full-screen dark canvas with suggestion chips. There is no progressive onboarding.
- ModeSelector presents 4 technical concepts ("Analytical", "Critical", "Creative", "Strategic") before the user has done anything. The user must make a high-stakes conceptual choice before seeing the tool.
- No tooltip system for header icons (titles exist as HTML `title` attributes but these are invisible on touch and poorly positioned on desktop).

### 8.2 Discoverability

- The most important interaction (hover an assumption to see impact) is completely invisible. There is no affordance, no hint, no tooltip.
- The branch creation button (`fork_right`) has no label.
- Keyboard shortcuts exist but are never surfaced anywhere in the UI.
- The ReasoningRibbon shows step numbers and action names, but clicking a step does nothing (the `onStepClick` prop is `() => {}` no-op in App.tsx).

### 8.3 Recognition Over Recall

- The 8 node types have icons and labels, which is good.
- Edge types are color-coded but there is no legend visible on the canvas.
- Memory tiers (Core/Session/Pending/Source) are meaningful terms but require learning. No tooltip or explainer.
- Provenance badge colors are semantic but there is no key.

### 8.4 Feedback

- `StatusPill` provides good working/listening/ready feedback.
- Compilation progress is well-visualized through the ReasoningRibbon.
- Node entrance animation (staggered scale-up) provides clear "something was added" feedback.
- No feedback when node positions are not saved (user drags → reload → positions lost).
- No feedback when branch switch does nothing (nodes don't change).
- No undo feedback.

### 8.5 User Control

- Users cannot delete, edit, or rearrange nodes through the UI.
- Users cannot undo any action.
- Users cannot directly control which nodes are sent as context to the AI.
- Incognito mode is the one strong user control story.

### 8.6 Error Prevention

- TextInputBar correctly disables submission during compilation.
- No guard against navigating away from workspace (losing canvas session).
- No validation on branch name input (empty string allowed — caught by `if (!newName.trim()) return`).
- SessionMemoryAuditCard "Skip" button says "(reject all)" — potentially destructive action with no confirmation.

---

## 9. Technical Audit

### 9.1 Architecture Strengths

- **Type safety**: `types/index.ts` is an excellent, complete domain model. All components use it.
- **Module-level constants**: `NODE_TYPES` and `EDGE_TYPES` defined at module level in KleosCanvas avoid React warning #002.
- **Impact Halo O(1) lookup**: Pre-computed at node creation, never recomputed on hover.
- **SSE lifecycle**: Correct event ordering (steps → compilation → DB write → done) with proper client reload after DB write.
- **useCanvas**: Clean, focused hook with good separation of concerns.
- **framer-motion**: Consistent animation library, well-used.

### 9.2 Technical Debt

| Issue | File | Severity |
|-------|------|----------|
| 455-line monolithic App.tsx | App.tsx | High |
| `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'` fallback in ExportDialog | ExportDialog.tsx L28 | High — still uses old fallback |
| `VITE_WS_BASE_URL ?? 'ws://localhost:8000'` in useVoice | useVoice.ts L59 | High — production WebSocket will fail |
| CORS hardcoded to localhost | main.py L23 | Medium |
| `theme.css` imports `shadcn/tailwind.css` which is likely not installed | theme.css L3 | Medium — may cause build warnings |
| `theme.css` `@import "tw-animate-css"` | theme.css L2 | Low |
| `type any` in ContactPage catch | ContactPage.tsx L47 | Low |
| Inline style parsing hack in AssumptionAuditPanel | AssumptionAuditPanel.tsx L181–185 | Low — `style.split(';')` is fragile |
| `ScriptProcessorNode` deprecated | useVoice.ts L54 | Low — works in Chrome, will break in future |
| Empty catch blocks `catch {}` | Multiple | Low |

### 9.3 Performance

- **ReactFlow re-renders**: `displayNodes` is computed inline in `useCanvas` on every render. With many nodes this creates a new array every time any state changes in App.tsx. Should be memoized with `useMemo`.
- **App.tsx re-renders**: 30+ state variables in a single component means nearly any state change re-renders the entire workspace tree.
- **No virtualization**: ReactFlow handles this internally.
- **SSE connection**: Correctly closed on completion/error.

### 9.4 Scalability

- The current architecture cannot support multi-user collaboration (no WebSocket broadcast, no optimistic locking).
- The 455-line App.tsx will become unmaintainable. State should be split into domain-specific contexts or a state manager.
- The `useCanvas` hook does not support pagination of nodes — large canvases will load all nodes at once.

---

## 10. Prioritized Issues

### 🔴 Critical

| # | Issue | Root Cause | Impact | Fix | Complexity |
|---|-------|------------|--------|-----|-----------|
| C1 | Node drag positions not persisted | No PUT /nodes/{id}/position call on ReactFlow `onNodesChange` | Every reload resets canvas layout — completely unusable for real work | Wire `onNodesChange` to debounced position update API call | Medium |
| C2 | WebSocket voice uses hardcoded `ws://localhost:8000` | `useVoice.ts:59` still has localhost fallback | Voice completely non-functional in production | Use `/ws/` relative path or `wss://kleos-ai.duckdns.org/ws/` | Low |
| C3 | ExportDialog still uses `http://localhost:8000` fallback | `ExportDialog.tsx:28` | Export non-functional in production | Use relative URL `/api/canvas/...` | Low |
| C4 | Branch switching does not reload branch nodes | `onBranchSwitch` only calls `setActiveBranchId`, does not call `loadCanvas` with branch filter | Branches are UI only — switching does nothing to the canvas | Pass `branchId` to `loadCanvas`, filter nodes by branch_id in API | Medium |
| C5 | Hover assumption → Impact Halo never triggers | `activateImpactHalo` exists in useCanvas but never wired to any hover event | Core product promise from marketing site is invisible | Wire assumption node hover to `activateImpactHalo` | Low |
| C6 | Incognito CORS allows only localhost | `main.py:23` | Production auth may fail under non-Nginx conditions | Add `FRONTEND_URL` env var to CORS allow_origins | Low |

### 🟠 High

| # | Issue | Root Cause | Impact | Fix | Complexity |
|---|-------|------------|--------|-----|-----------|
| H1 | No node context menu | Not implemented | Users cannot delete, pin, edit, or act on nodes | Add right-click context menu to BaseNode | High |
| H2 | No node inline editing | Not implemented | Ideas are permanently fixed after AI creation | Double-click to edit node text | Medium |
| H3 | Marketing NavBar in workspace | WorkspaceLayout includes NavBar | Breaks workspace session, visual mismatch | Create WorkspaceNav component (canvas title, breadcrumb, user) | Medium |
| H4 | ReasoningPathWalk never rendered | Imported nowhere | Key transparency feature invisible to users | Mount in App.tsx, wire to ribbon step click | Low |
| H5 | ThinkingTimeline never rendered | Imported nowhere | Feature dead | Evaluate if needed; wire or remove | Low |
| H6 | Keyboard shortcuts B, M, T, P are no-ops | App.tsx passes empty lambdas | Advertised shortcut model non-functional | Implement: B → open branch creation, M → merge selection | High |
| H7 | SuggestionChip "Drop files" does nothing | `onOpenDrop: () => {}` | First-time UX completely broken for file drop | Implement file drop zone | High |
| H8 | SessionMemoryAudit never triggered | `triggerSessionAudit` not attached to any UI gesture | Major consent flow inaccessible | Attach to workspace close or session timer | Low |
| H9 | No undo/redo | No history stack | Destructive mistakes are permanent | Implement canvas action history | Very High |

### 🟡 Medium

| # | Issue | Root Cause | Impact | Fix |
|---|-------|------------|--------|-----|
| M1 | Header icon labels missing | Icon-only toolbar | High cognitive load, not learnable | Add tooltip on hover (with keyboard shortcut shown) |
| M2 | ReasoningRibbon step click is no-op | `onStepClick: () => {}` | Ribbon is decorative, not interactive | Wire to open ReasoningPathWalk at that step |
| M3 | No edge legend | Not implemented | Edge colors/patterns not interpretable | Add minimal legend (toggleable) |
| M4 | No node type legend | Not implemented | Node border colors unclear | Show on first load or as canvas info button |
| M5 | Node positions reset on reload | No position persistence | Spatial work is lost | Fix C1 |
| M6 | Compare mode has no visual | `compareMode` state set but no UI for split view | Feature appears broken | Implement side-by-side branch view or remove |
| M7 | App.tsx cognitive overload | 455 lines, 30+ state vars | Unmaintainable | Decompose into domain contexts |
| M8 | `displayNodes` not memoized | Computed inline | Performance on large canvases | `useMemo` |
| M9 | ModeSelector shown on every session | No persistence | Repetitive onboarding | Store selection in localStorage |
| M10 | No breadcrumb / canvas title | Not implemented | User disoriented in workspace | Show canvas title in WorkspaceNav |
| M11 | Contradiction detection results invisible | Backend sends them, frontend ignores | Feature gap | Show contradictions on canvas (red pulsing edges?) |
| M12 | Assumption audit empty always | `assumptions` state initialized as `[]`, never populated from API | Panel is always empty | Load assumptions from canvas API |

### 🟢 Low

| # | Issue |
|---|-------|
| L1 | Footer links (GitHub, Hackathon, SIGCHI) all point to `#` |
| L2 | theme.css imports shadcn and tw-animate-css which may not be installed |
| L3 | Two conflicting font declarations (Switzer in index.css vs Geist Variable in theme.css) |
| L4 | `ScriptProcessorNode` deprecated in Web Audio API |
| L5 | Empty catch blocks suppress errors silently |
| L6 | Contact page uses Tailwind `red-50`/`red-600` classes (marketing palette), workspace uses `#e84040` |
| L7 | ReactFlow attribution watermark visible (consider hiding or repositioning) |
| L8 | No 404 page in workspace routes (e.g., `/workspace/unknown`) |
| L9 | BranchRailStub.tsx and useSSE.ts are dead code |
| L10 | ModeSelector uses uppercase CSS transform on heading — accessibility concern for screen readers |
| L11 | No aria-labels on icon-only buttons |
| L12 | No keyboard navigation for MemoryPanel, AssumptionPanel |
| L13 | ScopeChip component referenced in BaseNode but never tested with data |

---

## 11. Strengths

1. **Domain model is excellent.** `types/index.ts` is complete, well-named, and correctly used throughout.
2. **Node entrance animation.** The staggered scale-up with 60ms delays feels premium and satisfying.
3. **Memory consent architecture.** The 4-tier system with quarantine and negotiation is genuinely novel and well-implemented.
4. **SSE streaming pipeline.** The event ordering (steps → compile → DB write → done → reload) is correct and robust.
5. **CitrineSignal accent.** `#e5ff5d` yellow is distinctive, visible on dark, and consistently applied.
6. **Provenance model.** Every node carries provenance type, detail, and a visual badge — excellent for transparency.
7. **Impact Halo architecture.** Pre-computed at creation time, O(1) lookup — technically excellent even though not yet visible.
8. **useCanvas hook.** Clean, well-scoped, good separation from App.tsx orchestration layer.
9. **Error states.** Nodes have inline error display with retry button — good resilience pattern.
10. **Incognito mode.** Simple but powerful — visual border + backend opt-out is a clean solution.

---

## 12. Recommendations for Workspace v2

### Immediate (1–2 days)
1. Fix C2: Relative WebSocket URL (`/ws/voice`)
2. Fix C3: Relative export URL
3. Fix C5: Wire assumption hover to Impact Halo
4. Fix H4: Mount ReasoningPathWalk, wire ribbon step clicks
5. Fix H8: Trigger SessionMemoryAudit on explicit "Close session" button
6. Fix M9: Persist mode selection to localStorage
7. Fix M12: Load assumptions from canvas API into AssumptionAuditPanel

### Short-term (1 week)
1. Fix C1: Persist node positions via debounced API call
2. Fix C4: Branch node filtering in loadCanvas
3. Fix H3: Replace marketing NavBar in workspace with WorkspaceNav
4. Fix H1: Node context menu (right-click)
5. Fix H2: Inline node editing (double-click)
6. Fix M1: Icon button tooltips with keyboard shortcut hints
7. Fix M2: ReasoningRibbon → open ReasoningPathWalk at clicked step

### Medium-term (2–4 weeks)
1. Decompose App.tsx into domain-specific hooks/contexts
2. Implement file drop onto canvas
3. Implement node delete
4. Implement merge (M shortcut)
5. Implement branch creation shortcut (B)
6. Implement canvas action history (limited undo)
7. Add edge/node type legend
8. Semantic zoom (3 tiers)
9. "Synthesize selected" node condensation

---

## 13. Production Readiness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| Technical stability | 7/10 | Backend is solid; critical frontend bugs exist |
| Feature completeness | 4/10 | Many features exist in code but are not triggered by any UI |
| HCI / Learnability | 3/10 | No tooltips, many no-op interactions, high cognitive load |
| Design coherence | 5/10 | Workspace design is internally consistent; site/workspace transition is jarring |
| API reliability | 7/10 | CORS latent bug; otherwise sound |
| Voice | 3/10 | Architecture exists; WebSocket localhost bug makes it production-broken |
| Export | 3/10 | Same localhost bug |
| Memory system | 7/10 | Most flows work; SessionAudit unreachable |
| Branching | 3/10 | UI exists; branch node isolation broken |
| **Overall** | **5/10** | Strong foundation, wide feature-implementation gap |

**The workspace has the architecture of a production-ready system and the UX of an early prototype. The path to production readiness is primarily about wiring existing components to their intended triggers, not building new systems.**
