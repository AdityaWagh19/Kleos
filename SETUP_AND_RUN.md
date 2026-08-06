# Kleos — Setup & Run Guide

**Hackathon:** Human-Centred Design of LLM Interfaces | IIIT Pune x IIT Bombay ACM SIGCHI  
**Stack:** FastAPI + Supabase + Redis (Upstash) + OpenAI | React + Vite + react-flow

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Git | Latest | `git --version` |

No local database required. All persistence is managed cloud services.

---

## 1. Clone the Repository

```bash
git clone https://github.com/AdityaWagh19/Kleos.git
cd Kleos
```

---

## 2. Cloud Services Required

You need accounts and credentials for four services:

| Service | Purpose | Where to get credentials |
|---|---|---|
| **Supabase** | PostgreSQL database + file storage | supabase.com → Project Settings → API |
| **Redis (Upstash)** | Celery broker + caching | upstash.com → Database → Redis CLI connection string |
| **OpenAI** | GPT-4o, Realtime API, GPT-4o-mini | platform.openai.com → API keys |

---

## 3. Supabase Setup

### Step 1 — Create Supabase project
Go to supabase.com → New project → note the **Project URL** and **service_role key** (Settings → API).

### Step 2 — Run database migrations

The schema is in `supabase/migrations/20240001000000_initial_schema.sql`.

**Option A — Via Supabase Dashboard (easiest):**
1. Go to your Supabase project → SQL Editor
2. Open `supabase/migrations/20240001000000_initial_schema.sql`
3. Copy the entire file → paste into SQL Editor → Run

**Option B — Via psql (requires knowing your region):**
```bash
# Find your region in: Supabase Dashboard → Project Settings → General
# Pooler format: aws-0-{region}.pooler.supabase.com

pip install psycopg2-binary

python -c "
import psycopg2, pathlib
conn = psycopg2.connect(
    host='aws-0-YOUR-REGION.pooler.supabase.com',
    port=6543,
    dbname='postgres',
    user='postgres.YOUR-PROJECT-REF',
    password='YOUR-DB-PASSWORD',
    sslmode='require'
)
conn.autocommit = True
sql = pathlib.Path('supabase/migrations/20240001000000_initial_schema.sql').read_text()
conn.cursor().execute(sql)
print('Done')
conn.close()
"
```

### Step 3 — Create storage bucket
In Supabase Dashboard → Storage → New bucket → name it `kleos-artifacts` → **Private** (no public access).

---

## 4. Backend Setup

```bash
cd src/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS / Linux)
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

### Configure environment variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `src/backend/.env`:

```env
# OpenAI — get from platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Supabase — get from Dashboard → Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← use service_role key, NOT anon key
SUPABASE_STORAGE_BUCKET=kleos-artifacts

# Redis (Upstash) — get from upstash.com → Database → Redis CLI connection string
# Format from Upstash: redis-cli --tls -u redis://default:TOKEN@host:6379
REDIS_URL=rediss://your-host.upstash.io:6379
REDIS_PASSWORD=your-upstash-token

# App settings
DEMO_MODE=false
STREAMING_FALLBACK=false
```

> **Important:** Use the `service_role` key from Supabase (the secret one), NOT the `anon/publishable` key.
> The `REDIS_PASSWORD` is the token shown in the Upstash Redis CLI connection string (after `default:` and before `@`).

---

## 5. Frontend Setup

```bash
cd src/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

`src/frontend/.env` (defaults are correct for local development):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

---

## 6. Running the Application

You need **3 terminal windows**.

### Terminal 1 — Backend API

```bash
cd src/backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

Verify: `http://localhost:8000/health` → `{"status":"ok","supabase":true,"redis":true}`

### Terminal 2 — Celery Worker (for heavy PDF processing)

```bash
cd src/backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

celery -A workers.celery_app worker --loglevel=info
```

> **Note:** Celery is only required for PDFs >5 pages. For small documents and the demo, you can skip this terminal.

### Terminal 3 — Frontend

```bash
cd src/frontend
npm run dev
```

Expected output:
```
VITE v8.x  ready in Xms
➜  Local:   http://localhost:5173/
```

---

## 7. Open the App

**http://localhost:5173** in Chrome (Chrome only — Safari has WebSocket/Web Audio API incompatibilities)

**API documentation:** http://localhost:8000/docs (Swagger UI)

---

## 8. First Use

1. **Mode Selector** appears — choose **Analytical** to start
2. **Canvas** opens with 4 suggestion chips
3. **Type text** in the input bar at the bottom → press **Ctrl+Enter** to compile
4. Nodes appear on the canvas with the Reasoning Ribbon animating at the bottom

---

## 9. Demo Setup (Hackathon)

Before the demo, run these two scripts once:

```bash
cd src/backend
venv\Scripts\activate

# Step 1: Generate all pre-cached LLM fixtures (makes ~10 API calls)
python fixtures/generate_fixtures.py

# Step 2: Create pre-populated demo canvas
python fixtures/setup_demo_canvas.py
# Note the DEMO_CANVAS_ID printed at the end
```

Then set in `src/backend/.env`:
```env
DEMO_MODE=true
```

Restart the backend. Zero live API calls during scripted demo beats.

---

## 10. Testing the Four Core Features

### Feature 1 — Drop & AI Compilation
1. Open the canvas
2. Type in the bottom input bar: `Prism AI targets B2B Indian market. High growth but negative cash flow. Key assumption: market is enterprise not SMB.`
3. Press **Ctrl+Enter**
4. Watch the Reasoning Ribbon (3 steps) → nodes appear on canvas

### Feature 2 — Assumption Audit + Impact Halo (WOW #1)
1. After drop (nodes on canvas), click **`help`** icon in header
2. Right panel opens: Assumption Audit
3. **Hover** an assumption row → dependent nodes pulse amber
4. Click **Override** → type correction → **Apply Override**

### Feature 3 — Memory System (WOW #2 + #3)
1. Click **`memory`** icon (top-left) → Memory Panel opens
2. Check all 4 tabs: Core / Session / Pending / Source
3. The **Pending** tab shows the amber banner: *"These have not influenced any response yet"*
4. Click **Reject** on a pending item → it soft-deletes (gone from active list, kept for audit)
5. On canvas "close" (Session Audit): per-item Accept/Reject/Edit flow

### Feature 4 — Voice Input
1. Click **`mic_off`** icon in header → browser asks for mic permission → **Allow**
2. Status Pill switches to lime animated mic icon (**Listening**)
3. Speak: *"Create a node about market competition"*
4. Within 3–5 seconds: new node appears with lime **VOICE** badge
5. Click mic icon again to stop

---

## 11. Keyboard Shortcuts

| Key | Action |
|---|---|
| `B` | Create branch |
| `M` | Merge selected nodes |
| `C` | Toggle Compare Mode |
| `T` | Trace (Reasoning Path Walk) |
| `P` | Pin selected node |
| `Esc` | Dismiss any open panel |
| `Ctrl+Enter` | Submit text input |

---

## 12. API Quick Reference

All endpoints are documented at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/canvas` | Create new canvas |
| `GET` | `/api/canvas/{id}` | Get canvas state |
| `POST` | `/api/canvas/{id}/drop` | Drop PDF/DOCX/text for AI compilation |
| `GET` | `/api/canvas/{id}/stream` | SSE stream for Reasoning Ribbon |
| `WS` | `/ws/voice` | Voice channel (OpenAI Realtime API proxy) |
| `POST` | `/api/canvas/{id}/branch` | Fork canvas into new branch |
| `GET` | `/api/canvas/{id}/memory` | Get all memories |
| `POST` | `/api/canvas/{id}/memory/{id}/ratify` | Accept a Tier 2 (pending) memory |
| `GET` | `/api/canvas/{id}/session-audit` | Generate session inferences |
| `POST` | `/api/canvas/{id}/audit` | Process Accept/Reject/Edit batch |
| `GET` | `/api/canvas/{id}/export/markdown` | Download Markdown export |
| `POST` | `/api/canvas/{id}/export/pdf` | Generate PDF export |
| `GET` | `/api/canvas/{id}/export` | Full JSON data export |

---

## 13. Troubleshooting

### "Supabase: false" in health check
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Ensure you used the `service_role` key, not the anon key
- Check that migrations ran (7 tables should exist in Supabase Dashboard → Table Editor)

### "Redis: false" in health check
- Get the Redis CLI connection string from Upstash dashboard
- Extract: `REDIS_URL=rediss://host:6379`, `REDIS_PASSWORD=token-after-default-colon`
- The token is the string between `default:` and `@` in the Upstash connection string

### Compilation fails / "Connection error during compilation"
- Check the backend terminal for error output
- Verify `OPENAI_API_KEY` is set and has GPT-4o access
- Try the health check: `curl http://localhost:8000/health`

### Voice not working
- Use Chrome (Safari is not supported)
- Allow microphone permission when browser prompts
- Check that `OPENAI_API_KEY` has Realtime API access (gpt-4o-realtime-preview)
- WebSocket connects to `ws://localhost:8000/ws/voice`

### Canvas shows blank after drop
- Likely a timing issue between SSE stream and canvas reload
- Manually refresh: The backend stores nodes in Supabase — reload the page and nodes appear
- Check `GET http://localhost:8000/api/canvas/{id}` to verify nodes exist in DB

### PDF export fails
- pyppeteer downloads Chromium (~150MB) on first use — wait for download to complete
- If Chromium fails: `pip install pdfkit` + install wkhtmltopdf as a fallback
- Use Markdown export as a reliable alternative: always works

### Port already in use
```bash
# Kill whatever is on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill //F //PID <pid>

# Kill whatever is on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill //F //PID <pid>
```

---

## 14. Project Structure

```
Kleos/
├── SETUP_AND_RUN.md          ← You are here
├── AUDIT_REPORT.md           ← Comprehensive code audit
├── plans/                    ← Engineering specification (9 phases)
├── project-context/          ← Product documentation (13 files)
├── supabase/
│   └── migrations/           ← SQL schema (run once)
└── src/
    ├── backend/
    │   ├── main.py             ← FastAPI entry point
    │   ├── requirements.txt
    │   ├── .env.example        ← Copy to .env and fill in credentials
    │   ├── routers/            ← HTTP route handlers
    │   │   ├── canvas.py       ← Canvas, branch, export endpoints
    │   │   ├── memory.py       ← Memory CRUD, ratify, audit
    │   │   ├── health.py       ← GET /health
    │   │   └── stream.py       ← SSE Reasoning Ribbon endpoint
    │   ├── ws/
    │   │   └── voice.py        ← WebSocket /ws/voice (Realtime API proxy)
    │   ├── services/
    │   │   ├── canvas_service.py    ← Core domain: node/edge mutations
    │   │   ├── llm_service.py       ← GPT-4o compilation + streaming
    │   │   ├── memory_service.py    ← Four-tier memory + context assembly
    │   │   ├── export_service.py    ← Markdown/JSON/PDF export
    │   │   └── ingestion_service.py ← PDF/DOCX/URL text extraction
    │   ├── workers/
    │   │   └── celery_app.py        ← Celery initialization (Redis broker)
    │   ├── db/
    │   │   ├── supabase.py          ← Supabase client
    │   │   └── queries.py           ← log_event() helper
    │   ├── cache/
    │   │   └── redis.py             ← Redis client
    │   └── fixtures/
    │       ├── generate_fixtures.py ← Pre-cache demo LLM responses
    │       └── setup_demo_canvas.py ← Create pre-populated demo canvas
    └── frontend/
        ├── package.json
        ├── vite.config.ts
        └── src/
            ├── App.tsx              ← Main shell (all panels + voice + shortcuts)
            ├── types/index.ts       ← All TypeScript domain types
            ├── canvas/
            │   ├── KleosCanvas.tsx  ← react-flow canvas wrapper
            │   ├── nodeRegistry.ts  ← 8 node type configurations
            │   ├── nodes/BaseNode.tsx    ← Unified node renderer (Impact Halo)
            │   ├── KleosEdge.tsx        ← Typed relationship edges
            │   └── clusters/ClusterBackground.tsx
            ├── components/
            │   ├── StatusPill.tsx        ← Working/Listening/Ready indicator
            │   ├── ReasoningRibbon.tsx   ← SSE-driven AI narration strip
            │   ├── ProvenanceBadge.tsx   ← 6-type source attribution
            │   ├── ScopeChip.tsx         ← [Session]/[Workspace]/[Global]
            │   ├── ConfidenceBar.tsx
            │   ├── BranchRail.tsx        ← Branch tabs + Compare action
            │   ├── VoiceTranscript.tsx
            │   ├── TextInputBar.tsx      ← Bottom text input (Ctrl+Enter)
            │   ├── PauseStopControls.tsx
            │   ├── SourceFilter.tsx
            │   └── ModeIndicator.tsx
            ├── panels/
            │   ├── MemoryPanel.tsx       ← Left slide-out (4 tabs)
            │   ├── AssumptionAuditPanel.tsx ← Right drawer (Impact Halo)
            │   ├── ActivityLog.tsx
            │   └── ThinkingTimeline.tsx
            ├── cards/
            │   ├── MemoryNegotiationCard.tsx  ← WOW #2: pre-storage consent
            │   ├── SessionMemoryAuditCard.tsx ← WOW #3: close-session ledger
            │   └── ExportDialog.tsx
            ├── onboarding/
            │   ├── ModeSelector.tsx      ← First-use full-screen mode picker
            │   └── SuggestionChips.tsx   ← 4 empty-canvas action chips
            ├── hooks/
            │   ├── useCanvas.ts          ← react-flow state + Impact Halo
            │   ├── useVoice.ts           ← Web Audio API + WebSocket
            │   ├── useMemory.ts          ← Memory CRUD state
            │   ├── useKeyboardShortcuts.ts
            │   └── useSSE.ts
            └── services/
                ├── api.ts               ← HTTP client (fetch wrapper)
                └── ws.ts                ← WebSocket helper
```

---

## 15. Environment Variables Reference

### Backend (`src/backend/.env`)

| Variable | Required | Description | Where to get |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o, GPT-4o-mini, Realtime API | platform.openai.com → API keys |
| `SUPABASE_URL` | Yes | Supabase project URL | Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (bypasses RLS) | Dashboard → Settings → API → service_role (secret) |
| `SUPABASE_STORAGE_BUCKET` | Yes | Storage bucket name | Create `kleos-artifacts` in Storage → Buckets |
| `REDIS_URL` | Yes | Redis connection URL with SSL | Upstash → Database → Redis CLI → copy host:port |
| `REDIS_PASSWORD` | Yes | Redis AUTH password | Upstash → Database → Redis CLI → token after `default:` |
| `DEMO_MODE` | No | `true` = serve pre-cached fixtures | Set to `true` for demo |
| `STREAMING_FALLBACK` | No | `true` = 2-call streaming (more reliable) | Defaults to `false`; set `true` if streaming fails |

### Frontend (`src/frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend URL (default: `http://localhost:8000`) |
| `VITE_WS_BASE_URL` | Yes | WebSocket backend URL (default: `ws://localhost:8000`) |
