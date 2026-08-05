# Demo Script

**Kleos** — 7-Minute Hackathon Demo
**Hackathon:** Human-Centred Design of LLM Interfaces | IIIT Pune x IIT Bombay ACM SIGCHI
**Mode:** Fully scripted. All LLM responses pre-cached. No improvisation on scripted beats.

---

## Pre-Demo Setup Checklist

Complete before the demo begins. Verify each item.

- [ ] Canvas pre-loaded with 4 nodes from a "AI startup product strategy for the Indian market" session
- [ ] Memory Panel pre-populated: 3 Core Memories, 1 Inferred (pending) memory in Pending tab
- [ ] Competitor analysis PDF (synthetic/fictional) staged and ready to drop
- [ ] All scripted beat LLM responses pre-cached as JSON fixtures; DEMO_MODE=true
- [ ] Active Workspace Mode: Analytical (visible in canvas header)
- [ ] Status Pill: Ready (green)
- [ ] Browser: Chrome, full screen, no other tabs visible
- [ ] Network: tested; exponential backoff configured for any live API calls during judge Q&A

---

## Beat-by-Beat Script

| Time | What to Say | Feature Demonstrated | Pre-cached |
|---|---|---|---|
| 0:00–0:30 | "Chat is a transcript. Kleos is a canvas. Ideas are objects you can touch, trace, and question. Everything on this canvas has a source, a confidence level, and a reason for being here." Show the pre-loaded canvas. | Vision framing, Canvas overview | — |
| 0:30–1:15 | "Watch what happens when I drop this competitor analysis." Drop the PDF. "The AI is thinking out loud — you can see every step it takes." Status Pill switches to Working. Ribbon narrates: "Reading PDF → Extracting claims → Found 3 assumptions → Detecting contradictions → Done." Nodes appear. Status Pill returns to Ready. | B1 Reasoning Ribbon, C2 Status Pill, Drop verb | Yes |
| 1:15–2:00 | Hover the red-badged node. "This one — the AI guessed it. No source document. Treat it with skepticism." Hover the blue-badged node. "This one — page 3 of the PDF. Verifiable." | B3 Provenance Badges | — |
| 2:00–2:50 | Open Assumption Audit Panel. "This is every assumption the AI made while building this canvas." Hover one assumption. Six nodes pulse amber simultaneously. "This single belief underpins six things on this canvas. That is PS01 — blast radius of an assumption, visible instantly." Override it with a correction. Canvas subgraph recomputes. "You just rewrote the AI's reasoning." | **WOW #1: B2 Assumption Audit + Impact Halo** | Yes |
| 2:50–3:20 | Memory Negotiation Card appears. "I noticed you optimized for cost over latency twice in this session. The system is asking if it should remember that — and at what scope." Choose "This Project Only." "I consented. Kleos stored it at the scope I chose. Not silently. Not automatically. This is PS06." | **WOW #2: A2 Memory Negotiation Card** | Yes |
| 3:20–3:50 | Open Memory Panel. Navigate to the Pending tab. "This item is still pending. I have not accepted it yet. Read the banner: these have not influenced any response yet. Watch." Trigger an AI action that does not use the pending item. | A3 Memory Panel, A1 Tier 2 quarantine | Yes |
| 3:50–4:20 | Switch to Critical Mode. "Now the AI challenges itself. Same canvas — different reasoning posture." Counter-argument nodes appear on existing clusters. Switch back to Analytical. Canvas returns to previous state. | Workspace Modes | Yes |
| 4:20–4:50 | "Branch on the B2B market assumption." Branch 2 is created. Activate Compare Mode. "Two worlds. One assumption apart. Both visible simultaneously. The AI is not forcing you to be sequential." | C4 Compare Mode, Branch verb | Yes |
| 4:50–5:20 | Close the canvas. Session Memory Audit card appears. "This session taught Kleos three things about how I think. I will accept two, reject one." Accept 2, reject 1. Reopen Memory Panel. "The rejected inference is gone. It will never influence a future response. That is PS06." | **WOW #3: A6 Session Memory Audit** | Yes |
| 5:20–5:50 | Click Export → Decision Summary → PDF. Wait for generation. Show the branded document. "A clean, structured, citable document — not a screenshot of a canvas. Every assumption, every decision, every source. Including the memory context active during this session." | Export System | Yes |
| 5:50–6:30 | "Every feature in Kleos passed two filters. Does it make AI reasoning visible? Does it give the user real control over memory? If it did not pass both — it did not ship." | Framing / closing | — |
| 6:30–7:00 | Open for judge questions. | Q&A | Live API |

---

## Three Critical WOW Moments

### WOW 1 — Impact Halo (2:00–2:50)

**What happens:** Hover one assumption. Six nodes pulse amber simultaneously. Audience sees the blast radius of a single belief with zero setup time.

**Why it lands:** The connection between one invisible assumption and six concrete canvas nodes becomes instantly visible — no panel, no explanation needed. This is PS01 operationalized as a gesture.

**Pre-caching required:** The compilation result that produces these nodes + their impact_nodes mappings.

### WOW 2 — Memory Consent (2:50–3:20)

**What happens:** The system proposes remembering something and waits. The user chooses the scope. The AI respects it.

**Why it lands:** Memory is not a background process — it is a negotiation. The user has agency before storage occurs, not after. This is the CHI 2026 "Relational Gains, Privacy Strains" finding operationalized.

**Pre-caching required:** The Memory Negotiation Card trigger; the confirmation that the memory was stored at the chosen scope.

### WOW 3 — Session Memory Audit (4:50–5:20)

**What happens:** At canvas close, the system shows exactly what it learned during the session. The user accepts two items, rejects one. The rejection is respected immediately. Memory Panel updates live.

**Why it lands:** The session closes with an explicit ledger of what the AI now knows. Nothing is hidden. The user leaves with full awareness of what Kleos remembers. This is the defining PS06 interaction.

**Pre-caching required:** The session audit inference list; the Memory Panel state after rejection.

---

## Pre-Caching Checklist

All of the following must have JSON fixtures created before the demo:

| Beat | Fixture File | Status |
|---|---|---|
| Drop PDF → nodes + ribbon steps | fixtures/drop_pdf_result.json | |
| Assumption hover → impact_nodes (6 nodes) | fixtures/assumption_impact.json | |
| Assumption override → subgraph recompute | fixtures/assumption_override.json | |
| Memory Negotiation Card trigger | fixtures/memory_card_trigger.json | |
| Tier 2 quarantine demo (no influence) | fixtures/tier2_quarantine_demo.json | |
| Critical Mode switch → counter-argument nodes | fixtures/critical_mode_switch.json | |
| Branch creation → Branch 2 state | fixtures/branch_creation.json | |
| Compare Mode diff | fixtures/compare_mode_diff.json | |
| Session Memory Audit inferences | fixtures/session_audit.json | |
| Export → Decision Summary Markdown | fixtures/export_decision_summary.md | |

---

## Contingency Notes

| Failure | Response |
|---|---|
| Live API call fails during Q&A | Exponential backoff fires automatically. Say: "Let me pull that reasoning together" — do not acknowledge the failure. If > 10s, offer to continue to the next question. |
| Pre-cached beat fails to load | Fall back to describing what would have happened. The canvas state is pre-populated so the visual context is still present. |
| PDF export takes > 10s | Switch to Markdown export ("For the purpose of the demo, here is the Markdown version — the PDF format is identical in structure.") |
| Canvas blank mid-demo | Should not occur. Pre-populated canvas ensures nodes are always present. If it does: reload and return to the pre-populated state (< 3 seconds). |

---

## Judge Q&A Preparation

| Anticipated Question | Answer | Reference |
|---|---|---|
| "What research informed the memory design?" | PersonaTree (ACL 2026), Hindsight (Emergent Mind 2026), "Relational Gains, Privacy Strains" (CHI 2026), "Ghost of the Past" (CHI 2025). See research.md. | prd.md — Research Foundation |
| "What research informed the XAI features?" | Armstrong et al. MAVS (Visible Language 2025), Hippo (CHI 2025), "Seeing the Reasoning" (CHI 2026), Counterfactual XAI (VISIGRAPP 2025). | prd.md — Research Foundation |
| "How is this different from ChatGPT memory?" | ChatGPT memory is opaque and retroactive. Kleos memory is tiered, visible, and negotiated before storage. Tier 2 items are quarantined from all LLM context until the user explicitly accepts them. | prd.md — A1, A2 |
| "Why target both PS01 and PS06?" | They share infrastructure. The memory system gives the XAI system something to explain. The XAI system gives the memory system a reason to be trusted. Provenance Badges serve both simultaneously. | context.md |
| "What novel AI techniques are you using?" | None — intentionally. The innovation is the HCI layer. All AI capability is standard tool-calling, structured output, and streaming on GPT-4o. The research contribution is the interaction design. | architecture.md |
| "What is the path to production?" | See future-plans.md: V1 (1–3 months) adds Trust Lens, Counterfactual Branches, Voice, collaborative canvases. V2 (3–9 months) adds enterprise integrations and production-grade memory backend (Neo4j + Pinecone). |  future-plans.md |

---

*Reference: Kleos_Master_Document.md — Section 27*
