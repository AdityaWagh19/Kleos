# Phase 9 — Polish, QA, and Demo Rehearsal

**Hours:** 42–48
**Team:** All 4
**Depends on:** All previous phases complete and stable
**This is the final phase — no new features. Only polish, verification, and demo preparation.**

---

## Objective

By the end of this phase: all 24 test sections in `project-context/test.md` pass, all 6 performance targets are met and measured, Framer Motion animations are smooth and purposeful, error states show inline with [Retry] buttons, the Source Filter toolbar is functional, voice transcript is styled cleanly, and the complete 7-minute demo script runs end-to-end without errors.

---

## Scope

- **Framer Motion animations:** Status Pill state transitions, Scope Chip cycles, card entrances, Impact Halo pulse, node entrance
- **Error state hardening:** All failure modes show inline errors + [Retry] button; canvas state never lost
- **Source Filter toolbar:** Dims all nodes except selected provenance type
- **Voice transcript styling:** Clean, readable, ephemeral
- **Onboarding returning-user flow:** Canvas opens directly with last active mode restored
- **Performance verification:** Measure all 6 targets, record in `progress.md`
- **All 24 test sections:** Run every test case in `project-context/test.md`
- **Chrome browser testing**
- **Final demo rehearsal:** Voice-first run (no keyboard/mouse for first 60 seconds)
- **Git:** Clean commit history, tag release

---

## Design Decisions and Rationale

**Animation philosophy (from design.md):**
Animations must be purposeful. Every animation must reduce cognitive load by communicating state, not adding visual noise. The design system is dark with one lime accent — animations that add color variety violate the single-accent principle.

Rules:
- Duration: 150-300ms for micro-interactions; 400-600ms for panel slides
- Ease: `ease-out` for entrances, `ease-in` for exits, `spring(damping=28, stiffness=300)` for panels
- Impact Halo pulse: amber glow + scale, repeat: Infinity while hovered, 800ms cycle
- No bounce, no elastic, no playful spring on data interactions
- Node entrance: `opacity 0→1, scale 0.92→1, duration 180ms, ease-out`
- Status Pill state change: `opacity fade 150ms`
- Card entrance: `opacity 0→1, y 16→0, scale 0.96→1, spring`

---

## Sequential Implementation Tasks

### Animation Polish

**Task 9.1 — Status Pill smooth transitions**
The StatusPill in Phase 3 uses basic `motion.div` animations. Polish:
- Add a crossfade between state labels (not an instant swap)
- The mic icon in `Listening` state should breathe (scale 1→1.1→1, 1.5s cycle)
- The blue dot in `Working...` should pulse smoothly (opacity 1→0.3→1, 1.2s cycle)
- Tooltip enters with `opacity 0→1, y -4→0, duration 150ms`

**Task 9.2 — Scope Chip cycle animation**
```tsx
// In ScopeChip.tsx, wrap the text change with AnimatePresence:
<AnimatePresence mode="wait">
  <motion.span
    key={scope}
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 4 }}
    transition={{ duration: 0.12 }}
    className="..."
  >
    [{config.label}]
  </motion.span>
</AnimatePresence>
```

**Task 9.3 — Memory Negotiation Card entrance**
Already has spring animation. Polish: add a subtle amber border glow pulse on the card for the first 2 seconds to draw attention:
```tsx
animate={{
  boxShadow: [
    '0 0 0 0 rgba(245, 200, 66, 0)',
    '0 0 20px 4px rgba(245, 200, 66, 0.2)',
    '0 0 0 0 rgba(245, 200, 66, 0)',
  ]
}}
transition={{ duration: 2, times: [0, 0.5, 1], repeat: 0 }}
```

**Task 9.4 — Node entrance animation**
Already in `BaseNode.tsx`. Verify: when new nodes appear after compilation, they animate in sequentially (staggered, not all at once). Add stagger via delay proportional to index:
```tsx
// In KleosCanvas.tsx, when addNodes() is called:
const staggeredNodes = newNodes.map((n, i) => ({
  ...n,
  data: { ...n.data, entranceDelay: i * 0.06 },  // 60ms stagger between nodes
}));
```

Then in `BaseNode.tsx`:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.88 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.18, ease: 'easeOut', delay: data.entranceDelay ?? 0 }}
```

---

### Error State Hardening

**Task 9.5 — Node-level error states**
Every async operation that modifies a node must have an inline error state with [Retry]:

```tsx
// In BaseNode.tsx — add error display:
{data.error && (
  <div className="mt-1 p-1.5 bg-[#3a1a1a] border border-[#e84040] rounded-[4px] flex items-center justify-between gap-2">
    <span className="text-[10px] text-[#e84040]">{data.error}</span>
    <button onClick={data.onRetry}
            className="text-[10px] text-[#e84040] border border-[#e84040] px-1.5 py-0.5 rounded-[4px] hover:bg-[#e84040] hover:text-white transition-colors">
      Retry
    </button>
  </div>
)}
```

**Task 9.6 — LLM API failure fallback to fixtures**
```python
# In services/llm_service.py:
def compile_document(text: str, workspace_mode: str = "analytical") -> dict:
    # DEMO_MODE fixture check
    if cached := _load_fixture(FIXTURE_MAP.get(f"compile_document_{workspace_mode}")):
        return cached

    try:
        # ... normal GPT-4o call
    except Exception as e:
        # Fallback to cached nodes (canvas must never be blank)
        fallback_fixture = _load_fixture("drop_pdf_result")
        if fallback_fixture:
            return fallback_fixture
        raise  # Re-raise if no fixture available
```

**Task 9.7 — Voice WebSocket error display**
```tsx
// In StatusPill.tsx — add error state:
// When voice status === 'error':
<div className="flex items-center gap-1 px-2 py-1 bg-[#3a1a1a] border border-[#e84040] rounded-[4px] text-[10px] text-[#e84040]">
  <span className="material-symbols-outlined text-[12px]">mic_off</span>
  Voice unavailable
</div>
```

**Task 9.8 — File size enforcement (frontend)**
```tsx
// In drop handler:
const MAX_SIZES: Record<string, number> = { 'pdf': 20, 'docx': 10, 'pptx': 25, 'image': 5 };

const validateFileSize = (file: File): string | null => {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const maxMB = MAX_SIZES[ext];
  if (maxMB && file.size > maxMB * 1024 * 1024) {
    return `File too large. Maximum is ${maxMB}MB for .${ext} files.`;
  }
  return null;
};
```

---

### Source Filter Toolbar

**Task 9.9 — Source Filter button**
```tsx
// src/frontend/src/components/SourceFilter.tsx
import type { ProvenanceType } from '../types';

const FILTER_OPTIONS: Array<{ type: ProvenanceType; label: string; color: string }> = [
  { type: 'document',     label: 'Docs',   color: '#4a90d9' },
  { type: 'core_memory',  label: 'Memory', color: '#4caf7d' },
  { type: 'ai_inference', label: 'AI',     color: '#f5c842' },
  { type: 'parametric',   label: 'AI*',    color: '#e84040' },
  { type: 'voice_input',  label: 'Voice',  color: '#e5ff5d' },
  { type: 'user_created', label: 'You',    color: '#f9f9f9' },
];

interface Props {
  activeFilter: ProvenanceType | null;
  onFilter: (type: ProvenanceType | null) => void;
}

export function SourceFilter({ activeFilter, onFilter }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px] text-[#9c9c9c]">filter_list</span>
      {FILTER_OPTIONS.map(({ type, label, color }) => (
        <button
          key={type}
          onClick={() => onFilter(activeFilter === type ? null : type)}
          className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-medium transition-all"
          style={activeFilter === type ? {
            background: color + '25', border: `1px solid ${color}`, color
          } : {
            background: 'transparent', border: '1px solid #565656', color: '#9c9c9c'
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

When a filter is active, nodes with non-matching `provenance_type` are rendered with `opacity: 0.15` in `BaseNode.tsx`:
```tsx
// In KleosCanvas.tsx, pass activeSourceFilter down to nodes:
const filteredNodes = nodes.map(n => ({
  ...n,
  data: {
    ...n.data,
    dimmed: activeSourceFilter !== null && n.data.provenance_type !== activeSourceFilter,
  },
}));
```

---

## Performance Verification Procedure

Run these measurements and record in `project-context/progress.md` Performance Measurements table.

**Target 1: Impact Halo response time < 100ms**
1. Open DevTools → Performance tab → Start recording
2. Hover an assumption node in the Assumption Audit Panel
3. Stop recording
4. Find the time between `mouseenter` event and the first amber animation frame
5. If > 100ms: verify `impact_nodes` is pre-populated (not computed on hover); check for unnecessary re-renders

**Target 2: Reasoning Ribbon first token < 3s**
1. Open DevTools → Network tab
2. Drop a PDF → watch the SSE stream (`/api/canvas/{id}/stream`)
3. Time from request initiation to first `data:` event
4. If > 3s: verify `STREAMING_FALLBACK` is set correctly; check GPT-4o or GPT-4o-mini routing

**Target 3: Voice-to-canvas latency < 5s**
1. Open DevTools → Performance tab → Start recording
2. Speak a clear voice command ("Create a node called test")
3. Stop recording
4. Measure from speech recognition completion to node render
5. If > 5s: check Realtime API response time; check WebSocket proxy overhead

**Target 4: Memory Panel load < 300ms**
1. Open DevTools → Network tab
2. Click Memory Panel toggle
3. Measure the `GET /api/canvas/{id}/memory` request duration
4. If > 300ms: verify demo data has < 20 memory items; add Supabase index if needed

**Target 5: Branch comparison render < 1s**
1. Open DevTools → Performance tab
2. Click "Compare" in Branch Rail
3. Measure time from click to both canvases visible
4. If > 1s: verify Compare Mode renders two react-flow instances in parallel (not sequential)

**Target 6: PDF export < 8s**
1. Trigger a PDF export
2. Measure from `POST /api/canvas/{id}/export/pdf` to Celery task completion
3. If > 8s but < 10s: acceptable for non-demo use; switch to Markdown-only for demo
4. If > 10s: switch demo to Markdown export only; record in `progress.md`

**Target 7: Redis query latency < 30ms**
1. Add a simple timing log to `cache/redis.py` around `get()` calls
2. Check logs during Memory Panel load
3. If > 30ms: verify Redis Cloud region matches EC2 region (latency penalty for cross-region)

---

## Complete QA Test Run

Run ALL 24 sections of `project-context/test.md` in order. Mark each test case `[x]` when passing.

| Section | Feature | Must Pass Before Demo |
|---|---|---|
| 1 | Canvas Foundation | Yes |
| 2 | Drop and Compilation | Yes |
| 3 | Assumption Audit Panel + WOW #1 | Yes — demo critical |
| 4 | Memory System | Yes |
| 5 | Memory Negotiation Card + WOW #2 | Yes — demo critical |
| 6 | Tier 2 Quarantine | Yes |
| 7 | Session Memory Audit + WOW #3 | Yes — demo critical |
| 8 | Inline Scope Chips | Yes |
| 9 | Workspace Modes | Yes |
| 10 | Branch and Compare | Yes |
| 11 | Incognito Mode | Yes |
| 12 | Pause / Stop Controls | Yes |
| 13 | Export | Yes |
| 14 | Error Handling | Yes |
| 15 | Performance Verification | Yes (all 6 targets) |
| 16 | Status Pill Listening State | Yes (voice demo) |
| 17 | Voice Input | Yes (voice is primary channel) |
| 18 | Memory Freshness Indicators | Yes |
| 19 | Trust Lens Toggle | Only if implemented |
| 20 | Counterfactual Branches | Yes |
| 21 | Reasoning Path Walk | Yes |
| 22 | Thinking Timeline | Yes |
| 23 | Quick Override | Yes |
| 24 | Activity Log | Yes |

---

## Pre-Demo Final Verification Checklist

Run this immediately before the demo. Every item must be checked.

```
- [ ] DEMO_MODE=true set in .env
- [ ] All 10 fixtures verified: DEMO_MODE routes each scripted beat to its fixture
- [ ] Canvas pre-populated: 4 nodes ("AI startup product strategy for Indian market")
- [ ] Assumption node has 3+ impact_nodes — Impact Halo will pulse ≥ 3 nodes
- [ ] Memory Panel: 3 Core Memories (scope=global) + 1 Inferred (Pending, quarantined)
- [ ] Competitor analysis PDF staged and ready to drop
- [ ] Active Workspace Mode: Analytical — visible in canvas header
- [ ] Status Pill: Ready (green dot)
- [ ] Browser: Chrome, full screen, no other tabs visible
- [ ] No console errors in DevTools
- [ ] Network tab: no failed requests
- [ ] Voice channel: tested — say "test" and confirm transcript appears
- [ ] Demo script open on a separate device or printed (not on the demo screen)
- [ ] All 3 WOW moments rehearsed at least twice:
  - [ ] WOW #1: Impact Halo — hover assumption → 3+ nodes pulse amber < 100ms
  - [ ] WOW #2: Memory Negotiation Card — appears after drop → 4 scope options
  - [ ] WOW #3: Session Memory Audit — close canvas → per-item consent flow
- [ ] Export verified: PDF export of Decision Summary works (< 8s)
- [ ] Exponential backoff configured for Q&A live API calls
```

---

## Voice-First Demo Rehearsal

**Requirement:** The first 60 seconds of the demo must use voice input only (no keyboard or mouse on the canvas). This demonstrates that voice is the primary channel, not a peripheral feature.

**60-second voice-only sequence:**
1. "Open canvas" (or canvas pre-loaded — no mouse needed)
2. "Switch to Analytical mode" — voice command triggers mode switch
3. "Drop the competitor analysis" — demo presenter drags file (this is a physical action, not canvas input)
4. Canvas compiles — no keyboard input needed during compilation
5. "Open the Assumption Audit Panel" — voice command

After 60 seconds, mouse/keyboard interactions are permitted.

Assign one team member to time the 60-second voice-only window during rehearsal.

---

## Final Git Operations

**Task 9.10 — Clean commit before demo**
```bash
# Review all changes
git status
git diff

# Stage and commit
git add src/
git commit -m "feat: complete Kleos hackathon build — all 9 phases implemented"

# Tag the release
git tag -a v1.0.0-hackathon -m "Hackathon submission — IIIT Pune x IIT Bombay ACM SIGCHI"

# Do NOT push until explicitly authorized
```

---

## Acceptance Criteria

All of the following must be true for Phase 9 to be complete:

**QA:**
- [ ] All 24 test sections pass (every individual test case marked [x] in test.md)
- [ ] Zero console errors in Chrome DevTools during normal demo flow
- [ ] All API failures show inline error + [Retry] button (no blank canvas)

**Performance:**
- [ ] Impact Halo response time: measured ≤ 100ms (recorded in progress.md)
- [ ] Reasoning Ribbon first token: measured ≤ 3s (recorded)
- [ ] Voice-to-canvas latency: measured ≤ 5s (recorded)
- [ ] Memory Panel load: measured ≤ 300ms (recorded)
- [ ] Branch comparison render: measured ≤ 1s (recorded)
- [ ] PDF export: measured ≤ 8s (recorded)

**Design:**
- [ ] All Framer Motion animations are smooth (no jank at 60fps)
- [ ] All panels slide in/out with spring physics
- [ ] Status Pill transitions are smooth between all 3 states
- [ ] Node entrances are staggered (not all at once)
- [ ] No layout shifts during compilation
- [ ] Carbon Black (#111111) canvas maintained throughout all interactions
- [ ] Zero instances of a second chromatic accent appearing

**Demo:**
- [ ] Complete 7-minute demo script runs end-to-end without errors
- [ ] Voice-only first 60 seconds runs without keyboard/mouse
- [ ] All 3 WOW moments land correctly on scripted beats
- [ ] Judge Q&A preparation: team can answer all 6 anticipated questions (demo.md)

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| Performance target not met (Impact Halo > 100ms) | Low | Pre-computation is in place from Phase 2; profile if issue; memoize BaseNode with React.memo |
| Framer Motion animations cause layout shift | Low | Use `layout` prop sparingly; avoid animating `width/height` directly |
| Voice channel unstable during demo | Low | Pre-scripted beats use fixtures (no voice needed during scripted part); voice only needed for judge Q&A |
| PDF export > 8s | Medium | Fallback to Markdown is seamless; brief it in demo contingency notes |
| Git tag created on wrong commit | Low | Run `git log --oneline -5` to verify HEAD is correct before tagging |

---

## Deliverables

- All Framer Motion animations polished across all components
- `SourceFilter.tsx` — toolbar source type filter
- Error states on all node types + voice channel
- File size validation on drop
- Performance measurements recorded in `project-context/progress.md`
- All 24 test sections in `project-context/test.md` marked [x]
- Git release tag `v1.0.0-hackathon`

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 42–48: Buffer and Final Recording" complete
- `project-context/progress.md` → Performance Measurements: all 7 rows filled with actual values
- `project-context/tasks.md` — All remaining tasks marked [x]
- `project-context/tasks.md` — Trust Lens Toggle marked [x] or [deferred: not implemented, buffer hours used for QA]
- `project-context/progress.md` → Post-Mortem: partially filled while memory is fresh

---

## Dependencies

All 8 previous phases complete and tested. Phase 9 must not begin if any Phase 7 (Demo Prep) or Phase 8 (Advanced Features) items are unresolved — polish on an unstable foundation is wasted effort.
