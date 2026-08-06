"""
SSE streaming endpoint for the Reasoning Ribbon.
Architecture: emit 3 immediate ribbon steps, then call compile_document() synchronously,
then emit the compilation event. This is the most reliable approach.
"""

import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services.llm_service import compile_document
from services import canvas_service

router = APIRouter()

IMMEDIATE_STEPS = [
    {"event": "reasoning_step", "step": 1, "action": "reading_source",    "detail": "Analysing provided content",                   "confidence": "high"},
    {"event": "reasoning_step", "step": 2, "action": "extracting_claims", "detail": "Identifying key concepts, assumptions, evidence", "confidence": "high"},
    {"event": "reasoning_step", "step": 3, "action": "classifying_nodes", "detail": "Tagging node types and provenance",              "confidence": "medium"},
]


@router.get("/canvas/{canvas_id}/stream")
async def stream_canvas(
    canvas_id: str,
    text: str = "",
    workspace_mode: str = "analytical",
    branch_id: str = "",
):
    async def generate():
        # 1. Emit ribbon steps immediately (no waiting)
        for step in IMMEDIATE_STEPS:
            yield f"data: {json.dumps({'type': 'step', 'data': step})}\n\n"
            await asyncio.sleep(0.3)   # small delay so ribbon animates visibly

        # 2. Run compilation (synchronous GPT-4o call with JSON mode — proven reliable)
        try:
            compilation = compile_document(text, workspace_mode)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield 'data: {"type":"done"}\n\n'
            return

        # 3. Emit the compilation result
        yield f"data: {json.dumps({'type': 'compilation', 'data': compilation})}\n\n"

        # 4. Persist to Supabase if canvas context is available
        if branch_id and canvas_id:
            try:
                canvas_service.apply_compilation(
                    canvas_id, branch_id, compilation, "text", workspace_mode
                )
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'DB write failed: {e}'})}\n\n"

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
