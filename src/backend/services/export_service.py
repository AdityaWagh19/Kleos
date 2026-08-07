"""Export service — Markdown (3 types), JSON, and PDF (pyppeteer/pdfkit)."""

import re
from datetime import datetime
from db.supabase import get_client

EXPORT_TEMPLATES = {
    "full": """\
# Kleos Canvas Export
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

## Insights
{insights_list}

## Memory Context
### Active Memories
{memories_active}

### Rejected Memories (PS06 Consent Ledger)
{memories_rejected}
""",

    "decision_summary": """\
# Decision Summary
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

    "research_notes": """\
# Research Notes
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
    canvas  = sb.table("canvases").select("workspace_mode").eq("id", canvas_id).single().execute().data or {}
    nodes   = sb.table("nodes").select("*").eq("canvas_id", canvas_id).eq("branch_id", branch_id).execute().data or []
    memories = sb.table("memories").select("*").eq("canvas_id", canvas_id).execute().data or []

    def node_list(ntype: str) -> str:
        filtered = [n for n in nodes if n["type"] == ntype]
        if not filtered:
            return "None identified."
        return "\n".join(f"- [{n['confidence'].upper()}] {n['text']}" for n in filtered)

    # Assumptions table
    assumptions = [n for n in nodes if n["type"] == "assumption"]
    if assumptions:
        rows = "\n".join(
            f"| {a['text']} | {a['confidence']} | {a['provenance_type']} |"
            for a in assumptions
        )
        assumptions_table = "| Assumption | Confidence | Provenance |\n|---|---|---|\n" + rows
    else:
        assumptions_table = "No assumptions detected."

    active   = [m for m in memories if not m["quarantined"] and not m["rejected"] and not m["archived"]]
    rejected = [m for m in memories if m["rejected"]]

    template = EXPORT_TEMPLATES.get(export_type, EXPORT_TEMPLATES["full"])
    return template.format(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
        mode=canvas.get("workspace_mode", "analytical"),
        problem_statement=(
            node_list("question")
            if node_list("question") != "None identified."
            else (node_list("constraint") if node_list("constraint") != "None identified." else "No problem statement identified.")
        ),
        assumptions_table=assumptions_table,
        evidence_list=node_list("evidence"),
        decisions_list=node_list("decision"),
        questions_list=node_list("question"),
        insights_list=node_list("insight"),
        memories_active="\n".join(f"- [{m['scope'].upper()}] {m['text']}" for m in active) or "None",
        memories_rejected="\n".join(f"- {m['text']} (rejected)" for m in rejected) or "None",
    )


def export_json(canvas_id: str, branch_id: str) -> dict:
    sb = get_client()
    return {
        "canvas":   sb.table("canvases").select("*").eq("id", canvas_id).single().execute().data,
        "nodes":    sb.table("nodes").select("*").eq("canvas_id", canvas_id).eq("branch_id", branch_id).execute().data,
        "edges":    sb.table("edges").select("*").eq("canvas_id", canvas_id).eq("branch_id", branch_id).execute().data,
        "memories": sb.table("memories").select("*").eq("canvas_id", canvas_id).execute().data,
        "events":   sb.table("events").select("*").eq("canvas_id", canvas_id).execute().data,
    }


def _md_to_html(md: str) -> str:
    """Minimal Markdown → HTML for PDF generation."""
    html = md
    html = re.sub(r'^# (.+)$',   r'<h1>\1</h1>',   html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$',  r'<h2>\1</h2>',   html, flags=re.MULTILINE)
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>',   html, flags=re.MULTILINE)
    html = re.sub(r'^- (.+)$',   r'<li>\1</li>',   html, flags=re.MULTILINE)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\n\n', '</p><p>', html)
    return (
        "<!DOCTYPE html><html><head><style>"
        "body{font-family:-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#111}"
        "h1,h2,h3{font-weight:600}table{width:100%;border-collapse:collapse}"
        "td,th{border:1px solid #ddd;padding:8px;text-align:left}"
        "</style></head><body>"
        f"<p>{html}</p>"
        "</body></html>"
    )


def generate_pdf_sync(markdown_content: str) -> bytes:
    """Generate PDF synchronously. Tries pyppeteer, falls back to pdfkit."""
    html = _md_to_html(markdown_content)

    # Try pyppeteer
    try:
        import asyncio
        import pyppeteer

        async def _run() -> bytes:
            browser = await pyppeteer.launch(args=["--no-sandbox", "--disable-setuid-sandbox"])
            page    = await browser.newPage()
            await page.setContent(html)
            pdf = await page.pdf({"format": "A4", "margin": {"top": "40px", "bottom": "40px", "left": "40px", "right": "40px"}})
            await browser.close()
            return pdf

        return asyncio.run(_run())

    except Exception as pyp_err:
        # Fallback to pdfkit
        try:
            import pdfkit  # type: ignore
            import tempfile, os
            with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w") as f:
                f.write(html)
                tmp_html = f.name
            tmp_pdf = tmp_html.replace(".html", ".pdf")
            try:
                pdfkit.from_file(tmp_html, tmp_pdf)
                with open(tmp_pdf, "rb") as f:
                    return f.read()
            finally:
                os.unlink(tmp_html)
                if os.path.exists(tmp_pdf):
                    os.unlink(tmp_pdf)
        except Exception as pdfkit_err:
            raise RuntimeError(
                f"Both PDF engines failed. pyppeteer: {pyp_err}. pdfkit: {pdfkit_err}"
            )
