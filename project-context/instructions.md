# Instructions

**Kleos** — Environment Setup and Development

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Frontend runtime |
| npm | 10+ | Frontend package manager |
| Python | 3.11+ | Backend runtime |
| pip | Latest | Python package manager |
| Git | Latest | Version control |

No local database installation required. No local vector store required. All persistence is handled by managed cloud services.

---

## Cloud Service Accounts Required

| Service | Purpose | Setup URL |
|---|---|---|
| Supabase | PostgreSQL database + file storage | supabase.com |
| Redis Cloud | Vector search + task queue + caching | redis.com/redis-enterprise-cloud |
| OpenAI | GPT-4o, gpt-4o-realtime-preview, GPT-4o-mini | platform.openai.com |
| AWS | EC2 compute (production deployment only) | aws.amazon.com |

---

## API Keys and Connection Strings

All required environment variables. Do not commit any of these to the repository.

| Variable | Required | Source |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI platform — single key covers all three models |
| `SUPABASE_URL` | Yes | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase project → Settings → API (service role, not anon key) |
| `REDIS_URL` | Yes | Redis Cloud → Database → Configuration → Public endpoint |
| `REDIS_PASSWORD` | Yes | Redis Cloud → Database → Configuration |
| `DEMO_MODE` | Yes (demo) | Set to `true` to serve pre-cached LLM responses for scripted beats |
| `SUPABASE_STORAGE_BUCKET` | Yes | Name of the storage bucket created in Supabase Storage |

---

## Project Structure

```
Kleos/
├── README.md
├── Kleos_Master_Document.md
├── project-context/
└── src/
    ├── frontend/
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── src/
    │       ├── components/         # Canvas, panels, voice UI, export
    │       ├── hooks/              # Custom React hooks (useVoice, useSSE, useCanvas)
    │       ├── services/           # API client, WebSocket handler, SSE consumer
    │       └── types/              # TypeScript: Node, Edge, Memory, Branch, Event
    └── backend/
        ├── requirements.txt
        ├── main.py                 # FastAPI entry point
        ├── routers/                # HTTP route handlers
        ├── ws/                     # WebSocket handlers (/ws/voice)
        ├── services/               # LLM orchestration, memory, ingestion, export
        ├── workers/                # Celery task definitions (document processing, PDF export)
        ├── db/                     # Supabase client, schema migrations
        ├── cache/                  # Redis client, vector search helpers
        └── fixtures/               # Pre-cached LLM responses for demo beats
```

---

## Supabase Setup

```bash
# Install the Supabase CLI
npm install -g supabase

# Initialise (from repo root)
supabase init

# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Run schema migrations
supabase db push
```

Migrations must create:
- `canvases` table
- `nodes` table (with `impact_nodes` as JSONB array, `provenance_detail` as JSONB)
- `edges` table
- `memories` table (with `quarantined` and `archived` boolean fields)
- `events` table (event log)
- `branches` table

Create a storage bucket named `kleos-artifacts` (or set via `SUPABASE_STORAGE_BUCKET`) for PDF uploads and PDF export files.

---

## Redis Cloud Setup

```bash
pip install redis
```

Redis Cloud requires no local installation. Connect using the connection string from your Redis Cloud database configuration.

```python
# Example connection (backend/cache/client.py)
import redis

client = redis.Redis(
    host="your-redis-endpoint.redis.com",
    port=12345,
    password=os.environ["REDIS_PASSWORD"],
    ssl=True,
    decode_responses=True
)
```

Redis Cloud (Redis Stack) includes RedisVSS for vector search. No separate vector database is required.

---

## Backend Setup

```bash
cd src/backend

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and populate the environment file
cp .env.example .env
# Edit .env with your Supabase, Redis, and OpenAI credentials

# Start the backend (development)
uvicorn main:app --reload --port 8000

# Start the Celery worker (separate terminal, same venv)
celery -A workers.celery_app worker --loglevel=info
```

API documentation: `http://localhost:8000/docs`

---

## Frontend Setup

```bash
cd src/frontend

npm install

# Copy and populate the environment file
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000
# Set VITE_WS_BASE_URL=ws://localhost:8000

npm run dev
```

Frontend: `http://localhost:5173`

---

## Python Dependencies (`requirements.txt`)

```
fastapi
uvicorn[standard]
websockets
openai
supabase
redis[hiredis]
celery[redis]
pymupdf
python-docx
python-pptx
requests
beautifulsoup4
pandas
openpyxl
pydantic
python-multipart
sse-starlette
python-dotenv
pyppeteer
```

**Removed:** `chromadb`, `SQLAlchemy` (replaced by Supabase client), `sarvam` (replaced by OpenAI Realtime API)

---

## Frontend Dependencies (key packages)

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "reactflow": "^11",
    "marked": "^9",
    "typescript": "^5"
  },
  "devDependencies": {
    "vite": "^5",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

---

## Voice Channel Setup

The voice channel uses the OpenAI Realtime API over WebSocket. No additional libraries are required beyond the standard `openai` Python package.

**Backend:** FastAPI WebSocket at `/ws/voice` proxies audio to the OpenAI Realtime API WebSocket endpoint. Tool call results from the Realtime API are routed to the canvas service and delivered to the frontend via SSE.

**Frontend:** Web Audio API captures microphone input. The browser's native `WebSocket` API connects to `/ws/voice`. No additional npm package is required.

```typescript
// Frontend voice hook skeleton (src/hooks/useVoice.ts)
const ws = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/voice`);
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// AudioContext → MediaStreamSource → ScriptProcessor → ws.send(audioChunk)
```

**Test the voice channel first.** In Hours 0–4, verify that:
1. The FastAPI WebSocket can proxy bidirectional audio to the OpenAI Realtime API
2. A simple "create a node called test" voice command produces the correct `create_node` tool call
3. End-to-end latency from speech to canvas change is under 5 seconds

---

## PDF Export Setup

pyppeteer downloads Chromium automatically on first import. On EC2, verify that Chromium can run headless.

```bash
# In the backend venv:
python -c "import pyppeteer; print('pyppeteer OK')"
# First run will download Chromium (~150MB) — this is expected
```

**If Chromium fails on EC2**, install system dependencies:
```bash
sudo apt-get install -y libgbm-dev libasound2 libatk-bridge2.0-0 libcups2 libxkbcommon0 libxdamage1 libxrandr2
```

**Fallback:** If Chromium cannot run, fall back to `pdfkit`:
```bash
pip install pdfkit
sudo apt-get install -y wkhtmltopdf
```

Log the fallback. Update `progress.md` with which PDF export path is active.

---

## Running All Services

**Terminal 1 — Backend:**
```bash
cd src/backend && source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Celery Worker:**
```bash
cd src/backend && source venv/bin/activate
celery -A workers.celery_app worker --loglevel=info
```

**Terminal 3 — Frontend:**
```bash
cd src/frontend
npm run dev
```

---

## Pre-Caching Demo Fixtures

Before the demo, generate all fixture files:

```bash
cd src/backend && source venv/bin/activate
python fixtures/generate_fixtures.py
```

Fixtures are served when `DEMO_MODE=true`. Zero live API calls are made during scripted beats.

---

## Environment Variables Reference

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=kleos-artifacts

# Redis Cloud
REDIS_URL=redis://your-endpoint.redis.com:12345
REDIS_PASSWORD=...

# App
DEMO_MODE=false
```

---

## Known Considerations

- URL ingestion is server-side only. CORS prevents browser-side fetching of external URLs.
- `SUPABASE_SERVICE_ROLE_KEY` (not anon key) is required for server-side Supabase access. Never expose this in the frontend.
- The OpenAI Realtime API charges per audio minute — keep test sessions short during development.
- pyppeteer's Chromium download (~150MB) only happens once per environment. Cache the download path in `.env` as `PYPPETEER_HOME` if needed.
- Celery workers must share the same `.env` as the main FastAPI process.

---

*Update this file with any environment-specific discoveries during the build.*
