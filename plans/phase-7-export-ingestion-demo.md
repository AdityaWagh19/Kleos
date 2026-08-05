# Phase 7 — Export, Ingestion, and Demo Preparation

**Hours:** 22–32
**Team:** All 4 (BE1: Celery + PDF export | BE2: Fixture generation + DEMO_MODE | FE1: Export dialog + loading states | FE2: Demo canvas pre-population + rehearsal)
**Depends on:** Phase 5 (memories for export), Phase 6 (branches for branch-aware export)
**Unlocks:** Phase 8 (stable base for advanced features), Phase 9 (demo rehearsal requires fixtures)

---

## Objective

By the end of this phase: heavy document ingestion is offloaded to Celery workers, Markdown and PDF exports produce branded, structured documents, all scripted demo beat LLM responses are pre-cached as JSON fixtures, `DEMO_MODE=true` serves fixtures with zero live API calls, and the demo canvas is pre-populated with the correct state for the 7-minute demo script.

---

## Scope

**Backend:**
- Celery task for heavy PDF ingestion (> 5 pages)
- Supabase Storage integration (`kleos-artifacts` bucket)
- DOCX ingestion (python-docx)
- Markdown export — 3 types (Full Canvas, Decision Summary, Research Notes)
- pyppeteer PDF export Celery task (pdfkit fallback)
- `GET /api/canvas/{id}/export` — JSON export
- `fixtures/generate_fixtures.py` — pre-cache all scripted beat responses
- `DEMO_MODE` middleware — intercepts AI calls and serves fixtures

**Frontend:**
- Export dialog (format selector + type selector)
- PDF loading state (progress bar + Celery task polling)
- `GET /api/canvas/{id}/export` → trigger and download
- Onboarding suggestion chips (4 chips, disappear on first node)
- Empty state designs (Assumption Audit Panel, Memory Panel — already spec'd, confirm rendering)

---

## Design Decisions and Rationale

**Why Celery for heavy PDFs?**
Large PDFs (> 5 pages) take 8-30 seconds to extract and compile. Running this synchronously in an HTTP request thread would timeout. Celery offloads the work to a background worker; the frontend polls for task completion via SSE. This prevents API timeout errors on large documents.

**Why pyppeteer (not puppeteer) for PDF?**
The backend is Python. pyppeteer is the Python port of puppeteer. `pdfkit` is the fallback if Chromium is unavailable on EC2 (pdfkit uses wkhtmltopdf instead). Both are pre-installed in `requirements.txt`. The PDF Celery task checks pyppeteer first, logs which path is used, and records the result in `progress.md` Architecture Changes.

**Why pre-cache fixtures (DEMO_MODE)?**
Live API calls during a scripted demo introduce unpredictable latency, content variation, and failure risk. Pre-caching all scripted beat responses eliminates all of these. `DEMO_MODE=true` intercepts LLM service calls and returns pre-cached JSON responses. Live API calls are only used during judge Q&A (the open-ended portion).

**Fixture generation strategy:**
Each fixture maps a `(function_name, content_hash)` key to a response. The demo canvas state (4 nodes, 3 Core Memories + 1 Inferred) is the seed state. All subsequent scripted beats build on this state deterministically. The `generate_fixtures.py` script runs once before the demo, making exactly the LLM API calls needed for all scripted beats and caching the results.

---

## Sequential Implementation Tasks

### BE1: Celery + Supabase Storage + PDF Export

**Task 7.1 — `workers/document_worker.py`**
```python
from workers.celery_app import celery_app
from services import llm_service, canvas_service
from services.ingestion_service import extract_pdf, extract_docx
from db.supabase import get_client
from cache.redis import get_client as get_redis
import json

@celery_app.task(bind=True, max_retries=2)
def process_document(self, canvas_id: str, branch_id: str, file_content: bytes,
                     workspace_mode: str = "analytical", filename: str = "document.pdf"):
    """
    Processes heavy documents (> 5 pages) in a background Celery worker.
    Sends SSE progress updates via Redis pub/sub.
    """
    redis = get_redis()
    channel = f"progress:{canvas_id}"

    def emit_progress(msg: str):
        redis.publish(channel, json.dumps({"type": "progress", "message": msg}))

    try:
        emit_progress("Reading document...")
        if filename.endswith(".pdf"):
            import fitz, io
            doc = fitz.open(stream=file_content, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
        elif filename.endswith(".docx"):
            text = extract_docx(file_content)
        else:
            text = file_content.decode("utf-8", errors="replace")

        emit_progress("Extracting knowledge...")
        context = llm_service.memory_service_import(canvas_id)  # Get assembled context
        compilation = llm_service.compile_document(text, workspace_mode)

        emit_progress("Writing to canvas...")
        nodes_created = canvas_service.apply_compilation(canvas_id, branch_id, compilation, "drop", workspace_mode)

        emit_progress(f"Done. {nodes_created} nodes created.")
        redis.publish(channel, json.dumps({"type": "compilation_done", "nodes_created": nodes_created, "compilation": compilation}))

    except Exception as exc:
        redis.publish(channel, json.dumps({"type": "error", "message": str(exc)}))
        raise self.retry(exc=exc, countdown=5)
```

**Task 7.2 — Supabase Storage helpers in `db/supabase.py`**
```python
import os

def upload_file(file_content: bytes, filename: str, content_type: str = "application/octet-stream") -> str:
    """Upload file to Supabase Storage. Returns storage path."""
    sb = get_client()
    bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "kleos-artifacts")
    path = f"uploads/{filename}"
    sb.storage.from_(bucket).upload(path, file_content,
        file_options={"content-type": content_type, "upsert": "true"})
    return path

def get_presigned_url(path: str, expires_in: int = 3600) -> str:
    """Get a presigned download URL for a stored file."""
    sb = get_client()
    bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "kleos-artifacts")
    result = sb.storage.from_(bucket).create_signed_url(path, expires_in)
    return result["signedURL"]
```

**Task 7.3 — `services/export_service.py`**
```python
from db.supabase import get_client
from datetime import datetime

EXPORT_TEMPLATES = {
    "full": """# Kleos Canvas Export
Generated: {timestamp}
Mode: {mode}

## Problem Statement
{problem_statement}

## Assumptions
{assumptions_table}

## Evidence
{evidence_list}

## Decisions Made
{decisions_list}

## Open Questions
{questions_list}

## Memory Context
### Memories Active During This Session
{memories_active}

### Rejected Memories (PS06 Consent Ledger)
{memories_rejected}
""",

    "decision_summary": """# Decision Summary
Generated: {timestamp}

## Problem Statement
{problem_statement}

## Key Assumptions
{assumptions_table}

## Evidence Used
{evidence_list}

## Decisions Made
{decisions_list}

## Memory Context
{memories_active}

## Rejected Memories (PS06 Consent Ledger)
{memories_rejected}
""",

    "research_notes": """# Research Notes
Generated: {timestamp}

## Evidence
{evidence_list}

## Open Questions
{questions_list}

## Reasoning Summary
{insights_list}

## Memory Context
{memories_active}
""",
}

def export_markdown(canvas_id: str, branch_id: str, export_type: str = "full") -> str:
    sb = get_client()
    canvas = sb.table("canvases").select("workspace_mode").eq("id", canvas_id).single().execute().data
    nodes = sb.table("nodes").select("*").eq("canvas_id", canvas_id).eq("branch_id", branch_id).execute().data
    memories = sb.table("memories").select("*").eq("canvas_id", canvas_id).execute().data

    def node_list(type_: str) -> str:
        filtered = [n for n in nodes if n["type"] == type_]
        if not filtered:
            return "None identified."
        return "\n".join(f"- [{n['confidence'].upper()}] {n['text']}" for n in filtered)

    assumptions = [n for n in nodes if n["type"] == "assumption"]
    assumptions_table = "| Assumption | Confidence | Provenance |\n|---|---|---|\n"
    for a in assumptions:
        assumptions_table += f"| {a['text']} | {a['confidence']} | {a['provenance_type']} |\n"
    if not assumptions:
        assumptions_table = "No assumptions detected."

    active_memories = [m for m in memories if not m["quarantined"] and not m["rejected"] and not m["archived"]]
    rejected_memories = [m for m in memories if m["rejected"]]

    template = EXPORT_TEMPLATES.get(export_type, EXPORT_TEMPLATES["full"])
    return template.format(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
        mode=canvas.get("workspace_mode", "analytical"),
        problem_statement=node_list("decision") or "No decision nodes found.",
        assumptions_table=assumptions_table,
        evidence_list=node_list("evidence"),
        decisions_list=node_list("decision"),
        questions_list=node_list("question"),
        insights_list=node_list("insight"),
        memories_active="\n".join(f"- [{m['scope'].upper()}] {m['text']}" for m in active_memories) or "None",
        memories_rejected="\n".join(f"- {m['text']} (rejected)" for m in rejected_memories) or "None",
    )

def export_json(canvas_id: str, branch_id: str) -> dict:
    sb = get_client()
    canvas = sb.table("canvases").select("*").eq("id", canvas_id).single().execute().data
    nodes = sb.table("nodes").select("*").eq("canvas_id", canvas_id).eq("branch_id", branch_id).execute().data
    edges = sb.table("edges").select("*").eq("canvas_id", canvas_id).eq("branch_id", branch_id).execute().data
    memories = sb.table("memories").select("*").eq("canvas_id", canvas_id).execute().data
    events = sb.table("events").select("*").eq("canvas_id", canvas_id).execute().data
    return {"canvas": canvas, "nodes": nodes, "edges": edges, "memories": memories, "events": events}
```

**Task 7.4 — `workers/pdf_export_worker.py`**
```python
from workers.celery_app import celery_app
from services.export_service import export_markdown
from db.supabase import upload_file, get_presigned_url
import uuid, tempfile, os, asyncio

@celery_app.task
def generate_pdf_export(canvas_id: str, branch_id: str, export_type: str = "full") -> str:
    """
    Generates PDF export. Returns presigned URL to the PDF in Supabase Storage.
    Primary: pyppeteer (headless Chromium). Fallback: pdfkit (wkhtmltopdf).
    """
    markdown_content = export_markdown(canvas_id, branch_id, export_type)
    filename = f"kleos-export-{canvas_id[:8]}-{uuid.uuid4().hex[:8]}.pdf"

    # Try pyppeteer first
    pdf_bytes = None
    try:
        pdf_bytes = _generate_with_pyppeteer(markdown_content)
    except Exception as e:
        print(f"pyppeteer failed: {e}. Falling back to pdfkit.")
        try:
            pdf_bytes = _generate_with_pdfkit(markdown_content)
        except Exception as e2:
            raise RuntimeError(f"Both PDF engines failed: pyppeteer={e}, pdfkit={e2}")

    storage_path = upload_file(pdf_bytes, filename, "application/pdf")
    return get_presigned_url(storage_path, expires_in=3600)


def _generate_with_pyppeteer(markdown_content: str) -> bytes:
    import asyncio, pyppeteer

    # Convert markdown to HTML
    import marked  # Not a real package — use subprocess or a simple template
    html = f"""<!DOCTYPE html>
<html>
<head>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 800px; margin: 0 auto; padding: 40px; color: #111; }}
  h1, h2, h3 {{ font-weight: 600; }}
  table {{ width: 100%; border-collapse: collapse; }}
  td, th {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
</style>
</head>
<body>{_md_to_html(markdown_content)}</body>
</html>"""

    async def _run():
        browser = await pyppeteer.launch(
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        page = await browser.newPage()
        await page.setContent(html)
        pdf = await page.pdf({'format': 'A4', 'margin': {'top':'40px','bottom':'40px','left':'40px','right':'40px'}})
        await browser.close()
        return pdf

    return asyncio.run(_run())


def _generate_with_pdfkit(markdown_content: str) -> bytes:
    import pdfkit, tempfile
    html = f"<html><body style='font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px'>{_md_to_html(markdown_content)}</body></html>"
    with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as f:
        f.write(html.encode())
        tmp_path = f.name
    try:
        pdf_path = tmp_path.replace('.html', '.pdf')
        pdfkit.from_file(tmp_path, pdf_path)
        with open(pdf_path, 'rb') as f:
            return f.read()
    finally:
        os.unlink(tmp_path)
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)


def _md_to_html(md: str) -> str:
    """Very simple markdown to HTML conversion for PDF generation."""
    import re
    html = md
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^- (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\n\n', r'</p><p>', html)
    return f'<p>{html}</p>'
```

**Task 7.5 — Export endpoints in `routers/canvas.py`**
```python
@router.get("/canvas/{canvas_id}/export/markdown")
async def export_markdown_endpoint(canvas_id: str, branch_id: str = None, export_type: str = "full"):
    sb = get_client()
    if not branch_id:
        branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
        branch_id = branch.data[0]["id"] if branch.data else "main"
    md = export_service.export_markdown(canvas_id, branch_id, export_type)
    from fastapi.responses import Response
    return Response(content=md, media_type="text/markdown",
                   headers={"Content-Disposition": f'attachment; filename="kleos-export.md"'})

@router.post("/canvas/{canvas_id}/export/pdf")
async def trigger_pdf_export(canvas_id: str, branch_id: str = None, export_type: str = "full"):
    """Queues PDF generation as a Celery task. Returns task_id for polling."""
    from workers.pdf_export_worker import generate_pdf_export
    if not branch_id:
        sb = get_client()
        branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
        branch_id = branch.data[0]["id"] if branch.data else "main"
    task = generate_pdf_export.delay(canvas_id, branch_id, export_type)
    return {"task_id": task.id, "status": "queued"}

@router.get("/canvas/{canvas_id}/export/pdf/{task_id}")
async def poll_pdf_export(canvas_id: str, task_id: str):
    """Poll Celery task status."""
    from celery.result import AsyncResult
    result = AsyncResult(task_id)
    if result.ready():
        return {"status": "complete", "url": result.result}
    elif result.failed():
        return {"status": "failed", "error": str(result.result)}
    return {"status": "processing"}

@router.get("/canvas/{canvas_id}/export")
async def json_export(canvas_id: str, branch_id: str = None):
    """Full JSON export of canvas state."""
    sb = get_client()
    if not branch_id:
        branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
        branch_id = branch.data[0]["id"] if branch.data else "main"
    return export_service.export_json(canvas_id, branch_id)
```

---

### BE2: Fixture Generation + DEMO_MODE

**Task 7.6 — `fixtures/generate_fixtures.py`**
```python
"""
Run this script ONCE before the demo to pre-cache all scripted beat LLM responses.
Usage: python fixtures/generate_fixtures.py
Requires: OPENAI_API_KEY and DEMO_CANVAS_ID in environment.

This script makes real OpenAI API calls. After running, DEMO_MODE=true serves
these cached responses with zero live API calls during scripted beats.
"""
import os, json, uuid
from openai import OpenAI
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def save_fixture(name: str, data: dict):
    path = FIXTURES_DIR / f"{name}.json"
    path.write_text(json.dumps(data, indent=2))
    print(f"✓ Saved {name}.json")

# Beat 1: Drop PDF → nodes + ribbon steps
def gen_drop_pdf_result():
    from services.llm_service import compile_document
    result = compile_document(
        "Prism AI is a fictional SaaS startup targeting the Indian B2B market. "
        "The company has high growth (40% MoM) but negative cash flow. "
        "Main competitors: DataBridge, InsightCo, and Analytica. "
        "Key assumption: The market is primarily enterprise, not SMB. "
        "Risk: High customer acquisition cost may not be sustainable.",
        workspace_mode="analytical"
    )
    save_fixture("drop_pdf_result", result)

# Beat 2: Assumption hover → impact_nodes (must produce 6-node impact)
def gen_assumption_impact():
    # This is a static fixture — the demo canvas is pre-populated to guarantee this
    save_fixture("assumption_impact", {
        "assumption_id": "DEMO_ASSUMPTION_ID",  # Replace with actual ID after canvas setup
        "impact_nodes": ["NODE1", "NODE2", "NODE3", "NODE4", "NODE5", "NODE6"],  # Replace
        "explanation": "This assumption about B2B market scope underlies 6 canvas nodes"
    })

# Beat 3: Assumption override → subgraph recompile
def gen_assumption_override():
    from services.llm_service import compile_document
    result = compile_document(
        "The market is actually mixed B2B and B2C, with SMB segment growing 60% faster.",
        workspace_mode="analytical"
    )
    save_fixture("assumption_override", result)

# Beat 4: Memory Negotiation Card trigger
def gen_memory_card_trigger():
    save_fixture("memory_card_trigger", {
        "trigger": True,
        "observation": "I noticed you prioritized cost optimization over speed in this session.",
        "proposed_text": "User consistently prioritizes cost over performance trade-offs"
    })

# Beat 5: Tier 2 quarantine demo
def gen_tier2_quarantine_demo():
    save_fixture("tier2_quarantine_demo", {
        "memory_included": False,
        "explanation": "The pending memory (quarantined=TRUE) was not included in this response.",
        "response_preview": "Based on the Analytical mode context and your core memories..."
    })

# Beat 6: Critical mode switch
def gen_critical_mode_switch():
    from services.llm_service import compile_document
    result = compile_document(
        "Challenge all existing assumptions about Prism AI's market strategy.",
        workspace_mode="critical"
    )
    save_fixture("critical_mode_switch", result)

# Beat 7: Branch creation
def gen_branch_creation():
    save_fixture("branch_creation", {
        "branch_id": "DEMO_BRANCH_2_ID",  # Replace after canvas setup
        "name": "Branch 2: B2C assumption removed",
        "node_count": 4,
        "status": "active"
    })

# Beat 8: Compare Mode diff
def gen_compare_mode_diff():
    save_fixture("compare_mode_diff", {
        "delta_count": 3,
        "changed_nodes": ["NODE_A", "NODE_B", "NODE_C"],  # Replace
        "summary": "3 nodes changed when the B2B assumption was removed"
    })

# Beat 9: Session Memory Audit
def gen_session_audit():
    save_fixture("session_audit", {
        "items": [
            {"memory_id": "AUDIT_1", "text": "You prefer visual over textual outputs", "confidence": "high"},
            {"memory_id": "AUDIT_2", "text": "This project has a budget constraint of approximately $50k", "confidence": "medium"},
            {"memory_id": "AUDIT_3", "text": "You tend to branch when facing uncertainty", "confidence": "high"},
        ]
    })

# Beat 10: Export Decision Summary
def gen_export_decision_summary():
    FIXTURES_DIR.joinpath("export_decision_summary.md").write_text("""# Decision Summary
Generated: Demo Session

## Problem Statement
Prism AI product strategy for Indian market (fictional demo scenario)

## Key Assumptions
| Assumption | Confidence | Provenance |
|---|---|---|
| Market is primarily B2B enterprise | medium | parametric |
| Cost optimization is higher priority than speed | high | voice_input |

## Evidence Used
- [HIGH] Competitor analysis shows DataBridge holds 34% market share (Document)
- [MEDIUM] Indian SMB market growing 60% faster than enterprise (Document)

## Decisions Made
- Committed Branch 2: B2B assumption validated with qualification

## Memory Context
- [GLOBAL] User consistently prioritizes cost over performance trade-offs

## Rejected Memories (PS06 Consent Ledger)
- "User prefers async communication" (rejected)
""")
    print("✓ Saved export_decision_summary.md")


if __name__ == "__main__":
    print("Generating demo fixtures...")
    gen_drop_pdf_result()
    gen_assumption_impact()
    gen_assumption_override()
    gen_memory_card_trigger()
    gen_tier2_quarantine_demo()
    gen_critical_mode_switch()
    gen_branch_creation()
    gen_compare_mode_diff()
    gen_session_audit()
    gen_export_decision_summary()
    print("\nAll fixtures generated. Set DEMO_MODE=true to use them.")
```

**Task 7.7 — DEMO_MODE middleware in `services/llm_service.py`**
```python
import os
from pathlib import Path

DEMO_MODE = os.environ.get("DEMO_MODE", "false").lower() == "true"
FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"

FIXTURE_MAP = {
    "compile_document_analytical": "drop_pdf_result",
    "compile_document_critical": "critical_mode_switch",
    "detect_contradictions": None,  # Always live — binary classification is fast + cheap
    "evaluate_negotiation_card_trigger": "memory_card_trigger",
    "generate_session_audit": "session_audit",
}

def _load_fixture(name: str) -> dict | None:
    if not DEMO_MODE or not name:
        return None
    path = FIXTURES_DIR / f"{name}.json"
    if path.exists():
        import json
        return json.loads(path.read_text())
    return None

# Wrap compile_document to check DEMO_MODE:
_original_compile = compile_document

def compile_document(text: str, workspace_mode: str = "analytical") -> dict:
    fixture_key = f"compile_document_{workspace_mode}"
    if cached := _load_fixture(FIXTURE_MAP.get(fixture_key)):
        return cached
    return _original_compile(text, workspace_mode)
```

**Task 7.8 — Pre-populate demo canvas**
Create a script `fixtures/setup_demo_canvas.py`:
```python
"""
One-time setup: creates the pre-populated demo canvas state.
Run before the demo: python fixtures/setup_demo_canvas.py
Outputs DEMO_CANVAS_ID to .env.demo
"""
import os, uuid, json
from db.supabase import get_client

def setup():
    sb = get_client()
    canvas_id = str(uuid.uuid4())
    branch_id = str(uuid.uuid4())

    sb.table("canvases").insert({"id": canvas_id, "workspace_mode": "analytical"}).execute()
    sb.table("branches").insert({"id": branch_id, "canvas_id": canvas_id, "name": "main"}).execute()

    # 4 pre-populated nodes from "prior voice session"
    nodes = [
        {"id": str(uuid.uuid4()), "canvas_id": canvas_id, "branch_id": branch_id,
         "type": "idea", "text": "AI startup product strategy for Indian market",
         "confidence": "high", "provenance_type": "voice_input",
         "impact_nodes": [], "position": {"x": 200, "y": 200},
         "created_by": "user", "input_modality": "voice"},
        {"id": str(uuid.uuid4()), "canvas_id": canvas_id, "branch_id": branch_id,
         "type": "assumption", "text": "The market is primarily B2B enterprise",
         "confidence": "medium", "provenance_type": "parametric",
         "impact_nodes": [],  # Will be populated after all nodes created
         "position": {"x": 450, "y": 150},
         "created_by": "ai", "input_modality": "voice"},
        {"id": str(uuid.uuid4()), "canvas_id": canvas_id, "branch_id": branch_id,
         "type": "constraint", "text": "Budget ceiling: ~$50k initial runway",
         "confidence": "high", "provenance_type": "voice_input",
         "impact_nodes": [], "position": {"x": 200, "y": 380},
         "created_by": "user", "input_modality": "voice"},
        {"id": str(uuid.uuid4()), "canvas_id": canvas_id, "branch_id": branch_id,
         "type": "question", "text": "Which product category: analytics, automation, or insights?",
         "confidence": "low", "provenance_type": "ai_inference",
         "impact_nodes": [], "position": {"x": 450, "y": 380},
         "created_by": "ai", "input_modality": "voice"},
    ]
    for n in nodes:
        n["workspace_mode_at_creation"] = "analytical"
        sb.table("nodes").insert(n).execute()

    # Update impact_nodes on assumption node (3 nodes depend on it)
    assumption_id = nodes[1]["id"]
    dependent_ids = [nodes[0]["id"], nodes[2]["id"], nodes[3]["id"]]
    sb.table("nodes").update({"impact_nodes": dependent_ids}).eq("id", assumption_id).execute()

    # 3 Core Memories (voice-origin)
    for mem_text in [
        "User is building a B2B SaaS product for Indian market",
        "User consistently prioritizes cost optimization over speed",
        "Primary competitor is DataBridge with 34% market share",
    ]:
        sb.table("memories").insert({
            "id": str(uuid.uuid4()), "tier": 0, "scope": "global",
            "text": mem_text, "canvas_id": None,
            "quarantined": False, "provenance": {"input_modality": "voice"},
        }).execute()

    # 1 Inferred (Tier 2, quarantined)
    sb.table("memories").insert({
        "id": str(uuid.uuid4()), "tier": 2, "scope": "session",
        "text": "User prefers async communication in the team",
        "canvas_id": canvas_id, "quarantined": True,
        "provenance": {"trigger": "mentioned async twice", "input_modality": "voice"},
    }).execute()

    # Save canvas_id for demo
    with open(".env.demo", "w") as f:
        f.write(f"DEMO_CANVAS_ID={canvas_id}\n")
    print(f"Demo canvas created: {canvas_id}")
    print(f"Update fixtures/assumption_impact.json with assumption_id={assumption_id}")
    print(f"Impact nodes: {dependent_ids}")

if __name__ == "__main__":
    setup()
```

---

### FE1: Export Dialog + Loading States

**Task 7.9 — `src/frontend/src/cards/ExportDialog.tsx`**
```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

type ExportFormat = 'markdown' | 'pdf';
type ExportType = 'full' | 'decision_summary' | 'research_notes';

interface Props {
  open: boolean;
  canvasId: string;
  branchId: string;
  onClose: () => void;
}

export function ExportDialog({ open, canvasId, branchId, onClose }: Props) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [type, setType] = useState<ExportType>('decision_summary');
  const [loading, setLoading] = useState(false);
  const [pdfTaskId, setPdfTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    setLoading(true);
    try {
      if (format === 'markdown') {
        const url = `${import.meta.env.VITE_API_BASE_URL}/api/canvas/${canvasId}/export/markdown?branch_id=${branchId}&export_type=${type}`;
        window.open(url, '_blank');
      } else {
        // PDF: trigger Celery task, poll for completion
        const { task_id } = await api.post<{ task_id: string }>(
          `/api/canvas/${canvasId}/export/pdf`, { branch_id: branchId, export_type: type }
        );
        setPdfTaskId(task_id);
        pollPdfTask(task_id);
      }
    } catch (err) {
      alert('Export failed. Try Markdown as fallback.');
    } finally {
      if (format === 'markdown') setLoading(false);
    }
  };

  const pollPdfTask = async (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 10s timeout (20 × 500ms)

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 500));
      setProgress(Math.min(90, (attempts / maxAttempts) * 100));
      const result = await api.get<{ status: string; url?: string }>(
        `/api/canvas/${canvasId}/export/pdf/${taskId}`
      );
      if (result.status === 'complete' && result.url) {
        setProgress(100);
        window.open(result.url, '_blank');
        setLoading(false);
        setPdfTaskId(null);
        setProgress(0);
        return;
      } else if (result.status === 'failed') {
        alert('PDF generation failed. Try Markdown as fallback.');
        setLoading(false);
        setPdfTaskId(null);
        setProgress(0);
        return;
      }
      attempts++;
    }
    // Timeout after 10s
    alert('PDF is taking longer than expected. Try Markdown export instead.');
    setLoading(false);
    setPdfTaskId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-96 bg-[#1a1a1a] border border-[#2b2b2b] rounded-[12px] p-5"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[16px] font-medium text-[#f9f9f9]">Export Canvas</h3>
              <button onClick={onClose} className="material-symbols-outlined text-[18px] text-[#9c9c9c] hover:text-[#f9f9f9]">close</button>
            </div>

            {/* Format selector */}
            <div className="mb-4">
              <p className="text-[11px] text-[#9c9c9c] uppercase tracking-[0.04em] mb-2">Format</p>
              <div className="flex gap-2">
                {(['markdown', 'pdf'] as ExportFormat[]).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                          className={`flex-1 py-2 rounded-[4px] text-[12px] font-medium border transition-colors ${format === f ? 'bg-[#e5ff5d] border-[#e5ff5d] text-[#111111]' : 'border-[#565656] text-[#9c9c9c] hover:border-[#9c9c9c]'}`}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Type selector */}
            <div className="mb-5">
              <p className="text-[11px] text-[#9c9c9c] uppercase tracking-[0.04em] mb-2">Content</p>
              {[
                { value: 'full', label: 'Full Canvas', desc: 'Everything' },
                { value: 'decision_summary', label: 'Decision Summary', desc: 'Problem, Assumptions, Evidence, Decisions' },
                { value: 'research_notes', label: 'Research Notes', desc: 'Evidence, Questions, Reasoning' },
              ].map(({ value, label, desc }) => (
                <button key={value} onClick={() => setType(value as ExportType)}
                        className={`w-full text-left px-3 py-2 rounded-[4px] border mb-1.5 transition-colors ${type === value ? 'border-[#565656] bg-[#2b2b2b]' : 'border-transparent hover:border-[#565656]'}`}>
                  <span className="text-[12px] text-[#f9f9f9] font-medium">{label}</span>
                  <span className="text-[10px] text-[#9c9c9c] ml-2">{desc}</span>
                </button>
              ))}
            </div>

            {/* PDF loading state */}
            {loading && pdfTaskId && (
              <div className="mb-4">
                <div className="h-1 bg-[#2b2b2b] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#e5ff5d] rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[11px] text-[#9c9c9c] mt-1">Generating PDF... ({Math.round(progress)}%)</p>
              </div>
            )}

            <button onClick={handleExport} disabled={loading}
                    className="w-full py-2.5 bg-[#e5ff5d] text-[#111111] text-[13px] font-medium rounded-[4px] hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Generating...' : 'Export'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Task 7.10 — Onboarding Suggestion Chips**
```tsx
// src/frontend/src/onboarding/SuggestionChips.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;  // False when first node added
  onStartVoice: () => void;
  onFocusText: (placeholder?: string) => void;
  onOpenDropZone: () => void;
}

export function SuggestionChips({ visible, onStartVoice, onFocusText, onOpenDropZone }: Props) {
  const chips = [
    { label: 'Drop your documents here', icon: 'upload_file', action: onOpenDropZone },
    { label: 'Say something',            icon: 'mic',         action: onStartVoice,
      note: '← This is the primary input' },
    { label: 'Type an idea',             icon: 'edit',        action: () => onFocusText() },
    { label: 'Describe what you\'re deciding', icon: 'psychology',
      action: () => onFocusText("What decision are you working through?") },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        >
          <div className="flex flex-col items-center gap-3 pointer-events-auto">
            <p className="text-[12px] text-[#565656] uppercase tracking-[0.06em]">How would you like to start?</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {chips.map(({ label, icon, action, note }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={action}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#2b2b2b] border border-[#565656] rounded-[4px] text-[12px] text-[#9c9c9c] hover:border-[#9c9c9c] hover:text-[#f9f9f9] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>
                  {label}
                  {note && <span className="text-[#e5ff5d] text-[9px] ml-1">{note}</span>}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Validation Strategy

1. `python fixtures/generate_fixtures.py` → verify all 10 fixture files created in `fixtures/`
2. `DEMO_MODE=true` + `POST /api/canvas/{id}/drop` → verify fixture is returned (not a live API call — check OpenAI API usage dashboard shows no new call)
3. `GET /api/canvas/{id}/export/markdown?export_type=decision_summary` → verify Markdown file with correct sections
4. `POST /api/canvas/{id}/export/pdf` → verify task_id returned → poll until complete → PDF URL returned → PDF downloads
5. PDF includes: Problem Statement, Assumptions table, Memory Context, Rejected Memories section
6. `python fixtures/setup_demo_canvas.py` → verify 4 nodes + 3 Core Memories + 1 Inferred memory in Supabase
7. Load pre-populated canvas in browser → verify nodes render correctly
8. Suggestion chips appear on empty canvas; disappear when first node is added
9. Full demo script rehearsal: walk through all 10 scripted beats, verify each fixture loads correctly

---

## Acceptance Criteria

- [ ] All 10 fixture files exist in `src/backend/fixtures/`
- [ ] `DEMO_MODE=true` routes all scripted beats to fixtures; zero live API calls during demo script
- [ ] `GET /api/canvas/{id}/export/markdown` returns valid Markdown with all required sections
- [ ] Markdown export includes: Problem Statement, Assumptions table, Evidence, Decisions, Memory Context, Rejected Memories
- [ ] PDF export completes in < 8s (measured); loading state shown during generation
- [ ] PDF export falls back to pdfkit and logs fallback if Chromium unavailable
- [ ] `GET /api/canvas/{id}/export` returns full JSON canvas state
- [ ] Demo canvas pre-populated: 4 nodes, 3 Core Memories, 1 Inferred (quarantined) memory
- [ ] Assumption node has `impact_nodes` array with 3+ entries (for WOW #1 Impact Halo)
- [ ] Suggestion chips (4 chips) appear on empty canvas; disappear after first node
- [ ] Full 7-minute demo script rehearsal completes without errors

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| pyppeteer Chromium download (150MB) fails on EC2 | Medium | Run `python -c "import pyppeteer; print('OK')"` during setup; pdfkit fallback is always available |
| Fixture generation creates incorrect assumption impact count | Medium | After `setup_demo_canvas.py`, manually verify impact_nodes count; update `assumption_impact.json` with actual IDs |
| DEMO_MODE routing misses a fixture (falls through to live API) | Low | Add logging: `if DEMO_MODE and not cached: logger.warning(f"DEMO_MODE: fixture miss for {fixture_key}")` |

---

## Deliverables

- `src/backend/workers/document_worker.py`
- `src/backend/workers/pdf_export_worker.py`
- `src/backend/services/export_service.py`
- `src/backend/fixtures/generate_fixtures.py`
- `src/backend/fixtures/setup_demo_canvas.py`
- `src/backend/fixtures/*.json` (10 fixture files)
- `src/backend/fixtures/export_decision_summary.md`
- All export endpoints in `src/backend/routers/canvas.py`
- `src/frontend/src/cards/ExportDialog.tsx`
- `src/frontend/src/onboarding/SuggestionChips.tsx`

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 22–26: Export and Ingestion" + "Hours 26–32: Demo Preparation" complete
- `project-context/progress.md` → Architecture Changes: record PDF export path (pyppeteer vs pdfkit)
- `project-context/tasks.md` — Mark all Hours 22–32 tasks [x]
- `project-context/demo.md` → Pre-Caching Checklist: mark all fixtures as complete

---

## Dependencies

- Phase 5 complete: Memory system (memories returned in export)
- Phase 6 complete: Branch awareness for export
- Celery worker running alongside FastAPI
- Supabase Storage bucket `kleos-artifacts` created
- OpenAI API key available for fixture generation run
