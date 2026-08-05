# Test

**Kleos** — Feature Verification Checklist
**Purpose:** Confirm every MVP feature works correctly before the demo. Run in full at Hours 26–32 and again at Hours 40–42.

---

## How to Use This Checklist

Run each section end-to-end in the order listed. Mark [ ] → [x] when verified. For any failure: log the issue, assign it, and re-test after the fix before moving to the next section.

**Testing environment:** Chrome browser. Backend running locally at localhost:8000. Frontend at localhost:5173.

---

## Section 1: Canvas Foundation

| Test | Pass Criteria | Status |
|---|---|---|
| Canvas loads without errors | Canvas renders, Status Pill shows "Ready," no console errors | |
| Pan and zoom | Smooth pan with click-drag; smooth zoom with scroll wheel | |
| Mode Selector (first use) | Full-screen mode selector appears on fresh load; disappears after mode selection | |
| Active mode indicator | Selected mode name visible in canvas header after mode selection | |
| Suggestion chips (empty canvas) | "Drop your documents here," "Type an idea," "Describe what you're deciding" appear on empty canvas | |
| Suggestion chips disappear | Chips disappear when first node is added | |
| Empty state: Assumption Audit Panel | "No assumptions detected yet. Drop content to begin." shown when panel is open with no content | |
| Empty state: Memory Panel | "No memories stored yet. Kleos will only remember what you approve." shown on fresh Memory Panel | |

---

## Section 2: Drop and Compilation (PS01 Core)

| Test | Pass Criteria | Status |
|---|---|---|
| PDF drop | Drop a PDF → Status Pill switches to "Working..." → Reasoning Ribbon appears → nodes appear on canvas → Status Pill returns to "Ready" | |
| Plain text drop | Paste text → compilation → nodes appear with correct types | |
| DOCX drop | Drop a .docx file → text extracted → nodes appear | |
| Reasoning Ribbon narration | Each compilation step appears in plain language; steps appear in sequence | |
| Reasoning Ribbon click | Clicking a ribbon step expands to show specific evidence for that step | |
| Reasoning Ribbon fades | Ribbon fades 2 seconds after compilation completes | |
| Uncertainty surfaced | If AI cannot classify a node type, ribbon shows: "Could not determine if this is a constraint or assumption — treating as assumption. Click to change." | |
| Status Pill click (during compilation) | Clicking "Working..." shows last 3 ribbon steps as tooltip; does NOT pause compilation | |
| Provenance badges | Every node has a badge; badge color matches source type (blue=document, green=core memory, yellow=AI inference, red=parametric, white=user-created) | |
| Badge hover | Hovering a badge shows full provenance chain in tooltip | |
| Source Filter | Toolbar Source Filter icon dims all nodes except selected source type | |
| Contradiction flag | When two contradicting nodes are created: both pulse red for 1 second → red edge persists → hover shows explanation | |
| Node types | All 8 node types (idea, evidence, assumption, question, constraint, insight, decision, source) render with distinct visual treatments | |
| Cluster backgrounds | Related nodes grouped with translucent colored background and text label | |

---

## Section 3: Assumption Audit Panel (PS01 Core — WOW #1)

| Test | Pass Criteria | Status |
|---|---|---|
| Panel opens and closes | Right-side drawer toggles correctly | |
| Assumption list | All AI assumptions listed with plain-language statements | |
| Confidence bar | Low/Medium/High bar displayed per assumption; no raw percentages | |
| Source badge per assumption | Source badge visible on each assumption row | |
| Impact Halo (response time) | Hovering an assumption pulses all dependent nodes in amber in under 100ms | |
| Impact Halo (correct nodes) | Only nodes in the assumption's impact_nodes array pulse — not all nodes | |
| Override assumption | Typing an override → only the affected subgraph recomputes → Reasoning Ribbon narrates recomputation | |
| "Ask AI to reconsider" | Triggers recomputation of the assumption; updated assumption appears in the panel | |
| Delete assumption | Assumption removed from panel; dependent nodes pulse briefly to signal the change | |
| Accept assumption | Assumption moved to "accepted" state; no further action required | |

---

## Section 4: Memory System (PS06 Core)

| Test | Pass Criteria | Status |
|---|---|---|
| Memory Panel opens | Left-side slide-out appears; 4 tabs (Core / Session / Pending / Source) visible | |
| Memory item display | Each item shows: text, provenance, last-used timestamp | |
| Pending tab banner | "These have not influenced any response yet. Review before accepting." banner visible on Pending tab | |
| Inline Edit | Clicking Edit on a memory item opens editable field; save works | |
| Archive | Archiving a memory item removes it from the active list (soft delete; not permanently removed) | |
| Promote / Demote | Promote moves an item to a higher tier; Demote moves it to a lower tier | |
| Conflict indicator | When two items in the same tier contradict, a warning indicator appears | |
| Search | Search bar filters memory items correctly | |

---

## Section 5: Memory Negotiation Card (PS06 Core — WOW #2)

| Test | Pass Criteria | Status |
|---|---|---|
| Card trigger | Card appears after same preference is referenced 2+ times in a session | |
| Card content | Card shows what the AI observed ("I noticed you...") — not just what it wants to store | |
| Four scope options | "Remember Always," "This Project Only," "Don't Remember," "Not Now" all present | |
| "This Project Only" selection | Memory stored in Tier 1 (Session/Workspace scope); confirmation visible | |
| "Don't Remember" selection | No memory created; card dismissed | |
| "Not Now" selection | Card dismissed; memory remains in Tier 2 pending | |
| Card is dismissible | Clicking outside the card or pressing Esc dismisses it | |

---

## Section 6: Tier 2 Quarantine (PS06 Foundational Constraint)

| Test | Pass Criteria | Status |
|---|---|---|
| Tier 2 items visible in Pending tab | Inferred memories appear in the Pending tab with quarantine indicator | |
| Tier 2 excluded from LLM context | Trigger an AI action with a Tier 2 item pending; verify the AI response does not reference the pending inference | |
| Tier 2 ratification | Accept a Tier 2 item → it moves to Tier 0 or Tier 1 → it is now included in future LLM context | |
| Tier 2 rejection | Reject a Tier 2 item → it is permanently discarded → Pending tab updates | |

---

## Section 7: Session Memory Audit (PS06 Core — WOW #3)

| Test | Pass Criteria | Status |
|---|---|---|
| Audit card appears on canvas close | Clicking "Close Canvas" triggers the Session Memory Audit card | |
| Per-item controls | Each inference has individual Accept / Reject / Edit controls | |
| Accept | Accepted item promoted to Tier 0 or Tier 1; visible in Memory Panel after close/reopen | |
| Reject | Rejected item permanently discarded; not visible in Memory Panel after close/reopen | |
| Edit | Edited item saved with user's correction; visible in Memory Panel with corrected text | |
| "Accept All" | All items accepted in batch | |
| "Skip" | Audit dismissed; no items saved | |
| Audit skipped in Incognito | Session Memory Audit card does not appear when Incognito Mode is active | |

---

## Section 8: Inline Scope Chips

| Test | Pass Criteria | Status |
|---|---|---|
| Chip visible on relevant nodes | Nodes with memory-relevant content display [Session] / [Workspace] / [Global] chip | |
| Click cycles through states | Each click cycles: Session → Workspace → Global → Session | |
| Tooltip on hover | Hovering chip shows what the next state will be | |
| Global scope pulse | Setting scope to Global pulses all open branches in the Branch Rail briefly | |

---

## Section 9: Workspace Modes

| Test | Pass Criteria | Status |
|---|---|---|
| All 4 modes selectable | Analytical, Creative, Critical, Strategic all selectable from canvas header | |
| Mode description on switch | Switching mode shows a one-line description of the new mode's behavior | |
| Mode saved with canvas | Closing and reopening a canvas restores the last active mode | |
| Analytical behavior | Drops produce evidence-first nodes; unsourced claims immediately flagged | |
| Creative behavior | Drops produce Idea nodes freely; liberal clustering | |
| Critical behavior | Counter-argument nodes appear for existing clusters after mode switch | |
| Strategic behavior | Inter-cluster relationship suggestions appear; synthesis focus | |
| Mode does not alter memories | Switching modes does not change any stored memory tier contents | |

---

## Section 10: Branch and Compare (PS01 Supporting)

| Test | Pass Criteria | Status |
|---|---|---|
| Branch creation | Branch verb creates a new Branch; Branch Rail adds a new tab | |
| Branch naming | New branch receives a default name; editable | |
| Branch Rail navigation | Clicking a Branch Rail tab switches the main canvas to that branch | |
| Compare Mode activation | Compare action in Branch Rail splits canvas into two side-by-side views | |
| Delta highlighting | Nodes present in one branch but not the other highlighted in amber | |
| Exit Compare Mode | Closing Compare Mode returns to single-branch view | |

---

## Section 11: Incognito Mode

| Test | Pass Criteria | Status |
|---|---|---|
| Incognito toggle | Toggle in canvas header activates Incognito Mode | |
| Visual indicator | Dark chrome border around canvas + "Incognito" badge in header visible at all times during session | |
| No memory writes | Completing a full session with drops and interactions creates zero memory items in any tier | |
| Session Audit skipped | Canvas close in Incognito Mode does not show Session Memory Audit card | |

---

## Section 12: Pause / Stop Controls

| Test | Pass Criteria | Status |
|---|---|---|
| Pause mid-compilation | Clicking Pause halts SSE stream; Reasoning Ribbon shows what was processed; canvas shows partial nodes | |
| Stop compilation | Clicking Stop cancels entirely; affected nodes revert to pre-operation state | |

---

## Section 13: Export

| Test | Pass Criteria | Status |
|---|---|---|
| Export dialog opens | Export button opens dialog with format selector and export type selector | |
| Decision Summary (Markdown) | Exports correctly with: Problem Statement, Assumptions table, Evidence, Decisions Made sections | |
| Decision Summary (PDF) | PDF exports within 8 seconds; branded template applied; loading state shown during generation | |
| Full Canvas Export | All sections present in export | |
| Export includes memory context | Active Core and Session memories listed under "Memory Context" section | |
| Export includes rejected memories | Proposed-but-rejected memories listed for PS06 auditability | |
| JSON export | Accessible via Settings → "Export data (JSON)"; full canvas data model serialized | |

---

## Section 14: Error Handling

| Test | Pass Criteria | Status |
|---|---|---|
| LLM API failure | Simulated API failure → inline error on affected node/cluster: "Compilation failed — [Retry]" → canvas state preserved | |
| File too large | Upload file exceeding size limit → clear error message: "File too large. Maximum is [X]MB for [type]." | |
| Unsupported format | Drop an unsupported file type → clear error message | |
| URL fetch failure | Enter unreachable URL → "Could not reach this URL. Paste the content manually instead." → text input fallback offered | |

---

## Section 15: Performance Verification

| Test | Target | Measured | Status |
|---|---|---|---|
| Impact Halo response time | < 100ms | | |
| Reasoning Ribbon first token | < 3s | | |
| Memory Panel load | < 300ms | | |
| Branch comparison render | < 1s | | |
| PDF export time | < 8s | | |
| ChromaDB query latency | < 30ms | | |

---

## Pre-Demo Final Verification

Run this immediately before the demo begins.

- [ ] All pre-cached fixtures load correctly (DEMO_MODE=true)
- [ ] Canvas pre-populated with 4 nodes; correct content
- [ ] Memory Panel shows 3 Core Memories and 1 Inferred (pending) memory
- [ ] Competitor analysis PDF staged and ready to drop
- [ ] Active mode: Analytical; Status Pill: Ready (green)
- [ ] Chrome browser in full screen; no other tabs visible
- [ ] Demo script open in a separate device or printed (not on the demo screen)
- [ ] All 3 WOW moments rehearsed at least twice

---

*Reference: Kleos_Master_Document.md — Sections 10, 25, 27, 29*
