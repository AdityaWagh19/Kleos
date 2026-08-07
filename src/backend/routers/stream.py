"""
SSE streaming endpoint for the Reasoning Ribbon.

Flow:
  1. Emit 3 immediate ribbon steps (animates visibly while GPT-4o runs)
  2. Call compile_document() with the correct workspace_mode
  3. Emit compilation event
  4. Persist nodes to Supabase (THEN emit done — frontend reloads AFTER this)
  5. Check Memory Negotiation Card trigger
  6. Emit done
"""

import json
import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from services.llm_service import compile_document, evaluate_memory_card_trigger
from services import canvas_service
from db.supabase import get_client
from deps import verify_canvas_ownership

router = APIRouter()

IMMEDIATE_STEPS = [
    {"event": "reasoning_step", "step": 1, "action": "reading_source",    "detail": "Analysing provided content",                    "confidence": "high"},
    {"event": "reasoning_step", "step": 2, "action": "extracting_claims", "detail": "Identifying key concepts, assumptions, evidence",  "confidence": "high"},
    {"event": "reasoning_step", "step": 3, "action": "classifying_nodes", "detail": "Tagging node types and provenance",               "confidence": "medium"},
]

@router.get("/canvas/{canvas_id}/stream")
async def stream_canvas(
    canvas_id: str,
    text: str = "",
    branch_id: str = "",
    user: dict = Depends(verify_canvas_ownership)
):
    # Always read workspace_mode from DB to ensure it reflects the user's current selection
    if canvas_id and canvas_id != "test":
        try:
            sb = get_client()
            canvas_row = sb.table("canvases").select("workspace_mode").eq("id", canvas_id).single().execute()
            if canvas_row.data:
                workspace_mode = canvas_row.data.get("workspace_mode", workspace_mode)
        except Exception:
            pass  # Fall back to query param value

    async def generate():
        # 1. Emit ribbon steps immediately
        for step in IMMEDIATE_STEPS:
            yield f"data: {json.dumps({'type': 'step', 'data': step})}\n\n"
            await asyncio.sleep(0.3)

        # 2. Run compilation with the confirmed workspace_mode
        try:
            compilation = compile_document(text, workspace_mode)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield 'data: {"type":"done"}\n\n'
            return

        # 3. Emit compilation result (frontend does NOT reload yet — nodes not in DB yet)
        yield f"data: {json.dumps({'type': 'compilation', 'data': compilation})}\n\n"

        # 4. Persist to Supabase — frontend reloads AFTER this via the 'done' event
        nodes_created = 0
        if branch_id and canvas_id and canvas_id != "test" and branch_id != "test":
            try:
                nodes_created = await canvas_service.apply_compilation(
                    canvas_id, branch_id, compilation, "text", workspace_mode
                )
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'DB write failed: {e}'})}\n\n"

        # 5. Check Memory Negotiation Card trigger (after events are in DB)
        if canvas_id and canvas_id != "test" and nodes_created > 0:
            try:
                sb = get_client()
                recent_events = (
                    sb.table("events")
                    .select("event_type,delta,workspace_mode")
                    .eq("canvas_id", canvas_id)
                    .order("timestamp", desc=True)
                    .limit(10)
                    .execute().data
                )
                card = evaluate_memory_card_trigger(recent_events)
                if card:
                    yield f"data: {json.dumps({'type': 'memory_card_trigger', 'observation': card['observation'], 'proposed_text': card['proposed_text']})}\n\n"
            except Exception:
                pass  # Never block done on trigger check failure

        # 6. Done — frontend reloads canvas here (after nodes are in DB)
        yield 'data: {"type":"done"}\n\n'

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":        "keep-alive",
        },
    )
