# Future Plans

**Kleos** — Post-Hackathon Roadmap and Research Agenda

---

## Hackathon Deliverable (Current Scope)

The hackathon build delivers the PS01 and PS06 MVP: a working spatial canvas with real-time AI reasoning transparency, four-tier negotiated memory, and a scripted 7-minute demo. Features deferred from the hackathon scope are the starting point for V1.

---

## Hackathon → V1 (1–3 Months Post-Hackathon)

Features that were designed but deferred from the 48-hour build. V1 completes the full designed system.

| Feature | Category | Notes |
|---|---|---|
| A3. Memory Panel (relational graph view) | Memory | Visual graph view of memory items and their relationships (V1 upgrade from flat list) |
| B9. Epistemic Health Check | XAI | Automated check before Decision node commit: surfaces unresolved assumptions and contradictions |
| Cognitive Load Monitor | Canvas | Canvas entropy detection; Collapse suggestion when node density is high but structure is low |
| Custom Workspace Modes | Workspace | User-created modes extending the 4 defaults |
| text-embedding-3-small + RedisVSS | Infrastructure | Semantic vector retrieval for context assembly at production canvas scale (> 200 nodes); deferred from hackathon build |
| CSV / XLSX input | Ingestion | pandas + GPT-4o for pricing tables, data comparisons, research datasets |
| PPTX input | Ingestion | python-pptx with GPT-4o Vision for slide images |

---

## V1 → V2 (3–9 Months)

Collaborative and enterprise capabilities. Requires production-grade infrastructure.

| Area | Features |
|---|---|
| Collaboration | Multi-user canvases with presence indicators, real-time sync, memory conflict resolution when two users hold contradicting memories |
| Enterprise integrations | Slack, Google Drive, GitHub, Jira as Drop sources; OAuth-based connection management |
| URL ingestion (dynamic) | Playwright headless browser for SPAs and JavaScript-rendered pages (V1 supports static pages only via requests + BeautifulSoup) |
| Organization memory | Organization-wide shared Core Memory with permission tiers (read-only vs. editable for different user roles) |
| Advanced memory backend | Production-grade hybrid: Neo4j AuraDB (graph relationships) + Pinecone (vector similarity); augments the Supabase PostgreSQL + Redis Cloud stack used in V1 |
| Multi-timescale memory | Memory decay curves visible to users; automatic demotion of unused Core Memories to Session tier after configurable period |
| Video transcript input | Whisper-compatible STT service for meeting recordings and lecture notes |

---

## V2 → V3 (9–18 Months)

Research-grade and spatial computing extensions.

| Area | Features |
|---|---|
| Proactive background agents | Agents that populate and maintain the canvas between sessions based on user calendars, email threads, and linked sources |
| Formal evaluation study | CHI-style matched-task experiment: Kleos vs. chat for sensemaking tasks. N >= 12. Measuring: decision quality, cognitive load, trust calibration, exploration diversity. Target venue: CHI 2027 or UIST 2027. |
| Spatial computing extensions | XR/AR canvas for physical-space reasoning; spatial anchoring of canvas nodes to physical locations |
| Multi-agent simulation modes | Parallel expert perspectives as separate branch agents: one agent plays devil's advocate, one plays optimist, one plays conservative analyst |

---

## Research Directions (Publication-Worthy)

Four study designs that emerge directly from Kleos's design decisions. Each is a gap in the current HCI literature.

### Study 1: Canvas vs. Chat for Sensemaking

**Research question:** Does a spatial semantic canvas produce better decisions than chat for complex sensemaking tasks?

**Design:** Within-subjects experiment. Matched tasks (e.g., "evaluate three architectural options and make a recommendation") completed in both Kleos and a chat interface (ChatGPT). Counterbalanced order.

**Measures:** Decision quality (independent evaluation panel), cognitive load (NASA-TLX), trust calibration (predicted vs. actual confidence), exploration diversity (number of distinct hypotheses considered).

**Target venue:** CHI 2027

---

### Study 2: Workspace Mode Effectiveness

**Research question:** Which Workspace Mode produces better outcomes for which task type?

**Design:** Between-subjects or within-subjects study with the 4 modes. Task types: literature synthesis (Analytical), creative brainstorming (Creative), risk review (Critical), strategic synthesis (Strategic).

**Measures:** Task-appropriate outcome quality, time on task, user-reported reasoning confidence, retrospective accuracy of AI assumption acceptance.

**Target venue:** UIST 2027 or IUI 2027

---

### Study 3: Memory Negotiation Burden

**Research question:** At what Memory Negotiation Card frequency does user fatigue exceed the trust benefit?

**Design:** Longitudinal study over 5 sessions. Vary the Negotiation Card trigger threshold (low frequency: 1 per session, high frequency: 1 per 5 interactions). Measure: trust in AI memory, fatigue (retrospective survey), consent quality (how carefully users read the card before choosing).

**Hypothesis:** There is an optimal trigger threshold between 1 and 3 cards per session where trust benefit peaks before fatigue increases.

**Target venue:** CHI 2027

---

### Study 4: Quick Override Patterns

**Research question:** Do users actually use per-cluster reasoning mode overrides, or does one global mode suffice for most tasks?

**Design:** Observational study of Kleos usage logs from V1 users. Measure: Quick Override usage frequency, override mode selection patterns, session types where overrides cluster.

**Hypothesis:** The majority of Quick Override usage occurs in Critical mode overrides within Analytical global mode sessions — users want to stress-test a single cluster without changing their global analytical posture.

**Target venue:** CHI 2028 (requires V1 deployment data)

---

## Infrastructure Migration (Hackathon → Production)

| Component | Hackathon | Production Target |
|---|---|---|
| Memory store | Supabase PostgreSQL | Same — scale with RLS and read replicas |
| Vector store | Redis Cloud (RedisVSS) | Same — add semantic retrieval in V1 with text-embedding-3-small |
| File storage | Supabase Storage | Same — add CDN fronting if needed |
| LLM routing | OpenAI API direct | LiteLLM or similar with fallback routing |
| Authentication | None | Supabase Auth (built-in) |
| Deployment | AWS EC2 single instance | Add load balancer + multiple EC2 instances (V2) |
| PDF export | pyppeteer on EC2 | Containerized worker or Browserless.io cloud service |
| Task queue | Celery + Redis | Same — add priority queues and retry policies in V1 |

---

*Reference: Kleos_Master_Document.md — Section 26*
