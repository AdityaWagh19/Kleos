"""
SSE streaming endpoint for the Reasoning Ribbon.
Supports two architectures (selected via STREAMING_FALLBACK env var):
  Primary (STREAMING_FALLBACK=false): GPT-4o emits reasoning_step JSON objects mid-stream.
  Fallback (STREAMING_FALLBACK=true):  GPT-4o-mini streams steps first, then GPT-4o compiles.
"""

import os
import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services.llm_service import (
    compile_document_stream,
    compile_document_stream_fallback,
)
from db.supabase import get_client
from services import canvas_service
from db.queries import log_event

router = APIRouter()
USE_FALLBACK = os.environ.get("STREAMING_FALLBACK", "false").lower() == "true"


@router.get("/canvas/{canvas_id}/stream")
async def stream_canvas(
    canvas_id: str,
    text: str = "",
    workspace_mode: str = "analytical",
    branch_id: str = "",
):
    """
    SSE endpoint consumed by the Reasoning Ribbon.
    Streams: {"type":"step","data":{...}} events, then {"type":"compilation","data":{...}},
    then {"type":"done"}.

    After streaming, applies the compilation to Supabase (only on "compilation" event).
    """
    async def generate():
        compilation_result = None

        gen = (
            compile_document_stream_fallback(text, workspace_mode)
            if USE_FALLBACK
            else compile_document_stream(text, workspace_mode)
        )

        async for event_str in gen:
            yield event_str
            # Parse to detect compilation event
            try:
                payload = json.loads(event_str.replace("data: ", "", 1).strip())
                if payload.get("type") == "compilation":
                    compilation_result = payload.get("data", {})
            except Exception:
                pass

        # Apply compilation to DB after streaming completes
        if compilation_result and branch_id and canvas_id:
            try:
                canvas_service.apply_compilation(
                    canvas_id, branch_id, compilation_result, "text", workspace_mode
                )
            except Exception as e:
                yield f"data: {json.dumps({'type':'error','message':str(e)})}\n\n"

        yield 'data: {"type":"done"}\n\n'

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":   "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":      "keep-alive",
        },
    )
