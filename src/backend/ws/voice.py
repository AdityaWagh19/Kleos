"""
Voice channel — FastAPI WebSocket /ws/voice
Proxies audio bidirectionally between the browser and the OpenAI Realtime API.

Tool call results from Realtime API are routed to the canvas service and
then pushed to the frontend via the SSE channel. Uses asyncio.Queue for
in-process routing (no Redis required at hackathon scale).
"""

import os
import json
import asyncio
import base64
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

REALTIME_API_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"
OPENAI_API_KEY   = os.environ.get("OPENAI_API_KEY", "")

# In-process SSE event bus: canvas_id → list of queues
# Each SSE connection registers a queue; the voice handler pushes events to it.
_sse_queues: dict[str, list[asyncio.Queue]] = {}


def register_sse_queue(canvas_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    _sse_queues.setdefault(canvas_id, []).append(q)
    return q


def unregister_sse_queue(canvas_id: str, q: asyncio.Queue):
    if canvas_id in _sse_queues:
        try:
            _sse_queues[canvas_id].remove(q)
        except ValueError:
            pass


async def push_sse_event(canvas_id: str, event: dict):
    """Push an event to all SSE consumers for this canvas."""
    for q in _sse_queues.get(canvas_id, []):
        await q.put(event)


REALTIME_SESSION_CONFIG = {
    "type": "session.update",
    "session": {
        "modalities": ["text", "audio"],
        "instructions": (
            "You are the AI engine for Kleos, a spatial thinking canvas. "
            "Translate user voice commands into tool calls from the available vocabulary. "
            "create_node: new ideas, evidence, assumptions, questions, constraints, insights, decisions. "
            "create_branch: when user says 'branch on X' or 'explore alternative'. "
            "merge_nodes: when user says 'merge these' or 'combine these nodes'. "
            "collapse_cluster: when user says 'collapse this cluster' or 'summarise this group'. "
            "create_edge: when user says 'connect X to Y' or 'X supports Y'. "
            "flag_contradiction: when user says 'these contradict'. "
            "propose_memory: when user expresses a recurring preference. "
            "emit_reasoning_step: narrate what you are doing before tool calls. "
            "Always set provenance_type=voice_input for nodes created from voice commands. "
            "Be concise in spoken responses."
        ),
        "voice": "alloy",
        "input_audio_format":  "pcm16",
        "output_audio_format": "pcm16",
        "turn_detection": {
            "type":               "server_vad",
            "threshold":          0.5,
            "prefix_padding_ms":  300,
            "silence_duration_ms": 600,
        },
        "tools": [
            {
                "type": "function", "name": "create_node",
                "description": "Add a new typed node to the canvas",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "type":           {"type": "string", "enum": ["idea","evidence","assumption","question","constraint","insight","decision","source"]},
                        "text":           {"type": "string"},
                        "confidence":     {"type": "string", "enum": ["low","medium","high"]},
                        "provenance_type":{"type": "string", "enum": ["document","core_memory","ai_inference","parametric","user_created","voice_input"]},
                    },
                    "required": ["type","text","confidence","provenance_type"],
                },
            },
            {
                "type": "function", "name": "create_branch",
                "description": "Fork the canvas into a new branch",
                "parameters": {
                    "type": "object",
                    "properties": {"name": {"type": "string"}},
                    "required": ["name"],
                },
            },
            {
                "type": "function", "name": "emit_reasoning_step",
                "description": "Emit an intermediate step to the Reasoning Ribbon",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "step":       {"type": "integer"},
                        "action":     {"type": "string"},
                        "detail":     {"type": "string"},
                        "confidence": {"type": "string", "enum": ["low","medium","high"]},
                    },
                    "required": ["step","action","detail","confidence"],
                },
            },
            {
                "type": "function", "name": "flag_contradiction",
                "description": "Mark two nodes as logically contradicting",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_a":      {"type": "string"},
                        "node_b":      {"type": "string"},
                        "explanation": {"type": "string"},
                    },
                    "required": ["node_a","node_b","explanation"],
                },
            },
            {
                "type": "function", "name": "propose_memory",
                "description": "Queue a Tier 2 memory for user ratification",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "text":    {"type": "string"},
                        "trigger": {"type": "string"},
                    },
                    "required": ["text","trigger"],
                },
            },
            {
                "type": "function", "name": "create_edge",
                "description": "Link two existing nodes with a typed relationship",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "source_id":  {"type": "string"},
                        "target_id":  {"type": "string"},
                        "type":       {"type": "string", "enum": ["supports","contradicts","depends_on","derived_from"]},
                        "confidence": {"type": "string", "enum": ["low","medium","high"]},
                    },
                    "required": ["source_id","target_id","type","confidence"],
                },
            },
            {
                "type": "function", "name": "merge_nodes",
                "description": "Combine two or more nodes into a single synthesized insight node",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_ids":    {"type": "array", "items": {"type": "string"}},
                        "merged_text": {"type": "string"},
                    },
                    "required": ["node_ids","merged_text"],
                },
            },
            {
                "type": "function", "name": "collapse_cluster",
                "description": "Fold a cluster of nodes into a single summary node",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "cluster_id":   {"type": "string"},
                        "summary_text": {"type": "string"},
                    },
                    "required": ["cluster_id","summary_text"],
                },
            },
        ],
        "tool_choice": "auto",
    },
}


async def _handle_tool_call(canvas_id: str, tool_name: str, args: dict) -> dict:
    """Route a Realtime API tool call to the canvas service."""
    from db.supabase import get_client
    from services import canvas_service
    from services.memory_service import propose_inferred_memory
    from db.queries import log_event

    sb = get_client()
    branch = (
        sb.table("branches")
        .select("id")
        .eq("canvas_id", canvas_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    branch_id = branch.data[0]["id"] if branch.data else "main"

    if tool_name == "create_node":
        node_id = str(uuid.uuid4())
        sb.table("nodes").insert({
            "id":                         node_id,
            "canvas_id":                  canvas_id,
            "branch_id":                  branch_id,
            "type":                       args["type"],
            "text":                       args["text"],
            "confidence":                 args.get("confidence", "medium"),
            "provenance_type":            "voice_input",
            "impact_nodes":               [],
            "position":                   canvas_service._auto_position(0),
            "created_by":                 "user",
            "input_modality":             "voice",
            "workspace_mode_at_creation": canvas_service.get_current_workspace_mode(canvas_id),
        }).execute()
        log_event(canvas_id, branch_id, "voice_command_received", "user", "voice", [node_id])
        log_event(canvas_id, branch_id, "node_created", "user", "voice", [node_id])
        # Push canvas update to SSE consumers
        await push_sse_event(canvas_id, {"type": "node_created", "node_id": node_id, "input_modality": "voice"})
        return {"success": True, "node_id": node_id}

    elif tool_name == "emit_reasoning_step":
        await push_sse_event(canvas_id, {"type": "step", "data": args})
        return {"success": True}

    elif tool_name == "create_branch":
        new_branch_id = str(uuid.uuid4())
        sb.table("branches").insert({
            "id": new_branch_id, "canvas_id": canvas_id, "name": args["name"]
        }).execute()
        log_event(canvas_id, new_branch_id, "branch_created", "user", "voice", [])
        await push_sse_event(canvas_id, {"type": "branch_created", "branch_id": new_branch_id, "name": args["name"]})
        return {"success": True, "branch_id": new_branch_id}

    elif tool_name == "flag_contradiction":
        edge_id = canvas_service.create_edge(
            canvas_id, branch_id,
            args["node_a"], args["node_b"],
            "contradicts", "high"
        )
        await push_sse_event(canvas_id, {
            "type":        "contradiction_flagged",
            "node_a":      args["node_a"],
            "node_b":      args["node_b"],
            "explanation": args["explanation"],
        })
        return {"success": True, "edge_id": edge_id}

    elif tool_name == "propose_memory":
        memory_id = await propose_inferred_memory(canvas_id, args["text"], args["trigger"], "voice")
        return {"success": True, "memory_id": memory_id}

    elif tool_name == "create_edge":
        edge_id = canvas_service.create_edge(
            canvas_id, branch_id,
            args["source_id"], args["target_id"],
            args.get("type", "supports"), args.get("confidence", "medium"),
        )
        await push_sse_event(canvas_id, {"type": "edge_created", "edge_id": edge_id})
        return {"success": True, "edge_id": edge_id}

    elif tool_name == "merge_nodes":
        # Merge: delete source nodes, create a new synthesized node
        node_ids = args.get("node_ids", [])
        merged_text = args.get("merged_text", "Merged node")
        merged_id = str(uuid.uuid4())
        sb.table("nodes").insert({
            "id":                         merged_id,
            "canvas_id":                  canvas_id,
            "branch_id":                  branch_id,
            "type":                       "insight",
            "text":                       merged_text,
            "confidence":                 "medium",
            "provenance_type":            "voice_input",
            "impact_nodes":               [],
            "position":                   canvas_service._auto_position(0),
            "created_by":                 "user",
            "input_modality":             "voice",
            "workspace_mode_at_creation": canvas_service.get_current_workspace_mode(canvas_id),
        }).execute()
        # Mark source nodes as archived (soft-delete)
        for nid in node_ids:
            sb.table("nodes").update({"cluster_id": f"merged_into_{merged_id}"}).eq("id", nid).execute()
        log_event(canvas_id, branch_id, "merge", "user", "voice", node_ids)
        await push_sse_event(canvas_id, {"type": "merge_done", "merged_id": merged_id})
        return {"success": True, "merged_id": merged_id}

    elif tool_name == "collapse_cluster":
        cluster_id = args.get("cluster_id", "")
        summary_text = args.get("summary_text", "Cluster summary")
        summary_id = str(uuid.uuid4())
        sb.table("nodes").insert({
            "id":                         summary_id,
            "canvas_id":                  canvas_id,
            "branch_id":                  branch_id,
            "type":                       "insight",
            "text":                       summary_text,
            "confidence":                 "medium",
            "provenance_type":            "ai_inference",
            "impact_nodes":               [],
            "position":                   canvas_service._auto_position(0),
            "created_by":                 "ai",
            "input_modality":             "voice",
            "workspace_mode_at_creation": canvas_service.get_current_workspace_mode(canvas_id),
        }).execute()
        log_event(canvas_id, branch_id, "merge", "ai", "voice", [summary_id])
        await push_sse_event(canvas_id, {"type": "cluster_collapsed", "summary_id": summary_id})
        return {"success": True, "summary_id": summary_id}

    return {"success": False, "error": f"Unknown tool: {tool_name}"}


@router.websocket("/ws/voice")
async def voice_websocket(ws: WebSocket, canvas_id: str = ""):
    await ws.accept()

    # Maximum reconnection attempts with exponential backoff
    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            import websockets
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "OpenAI-Beta":   "realtime=v1",
            }
            async with websockets.connect(
                REALTIME_API_URL, extra_headers=headers, ping_interval=20
            ) as openai_ws:
                # Configure Realtime API session
                await openai_ws.send(json.dumps(REALTIME_SESSION_CONFIG))

                # Run bidirectional relay
                await _relay(ws, openai_ws, canvas_id)
                break  # Normal exit — stop retry loop

        except WebSocketDisconnect:
            break

        except Exception as e:
            if attempt < max_attempts - 1:
                await ws.send_text(json.dumps({
                    "type":    "status",
                    "status":  "reconnecting",
                    "attempt": attempt + 1,
                }))
                await asyncio.sleep(min(2 ** attempt, 30))
            else:
                try:
                    await ws.send_text(json.dumps({
                        "type":    "error",
                        "message": f"Voice channel unavailable: {e}",
                    }))
                except Exception:
                    pass


async def _relay(client_ws: WebSocket, openai_ws, canvas_id: str):
    """Bidirectional relay: browser ↔ OpenAI Realtime API."""

    async def client_to_openai():
        while True:
            try:
                data = await client_ws.receive_bytes()
                audio_b64 = base64.b64encode(data).decode()
                await openai_ws.send(json.dumps({
                    "type":  "input_audio_buffer.append",
                    "audio": audio_b64,
                }))
            except WebSocketDisconnect:
                return
            except Exception:
                return

    async def openai_to_client():
        while True:
            try:
                raw = await openai_ws.recv()
                msg = json.loads(raw)
                msg_type = msg.get("type", "")

                # Forward transcript + audio + text deltas to browser
                if msg_type in (
                    "response.audio.delta",
                    "response.audio_transcript.delta",
                    "response.text.delta",
                    "conversation.item.input_audio_transcription.completed",
                    "response.audio_transcript.done",
                ):
                    await client_ws.send_text(raw)

                # Handle tool calls
                elif msg_type == "response.function_call_arguments.done":
                    tool_name = msg.get("name", "")
                    try:
                        args = json.loads(msg.get("arguments", "{}"))
                    except json.JSONDecodeError:
                        args = {}

                    result = await _handle_tool_call(canvas_id, tool_name, args)

                    # Send tool result back to Realtime API
                    await openai_ws.send(json.dumps({
                        "type": "conversation.item.create",
                        "item": {
                            "type":    "function_call_output",
                            "call_id": msg.get("call_id"),
                            "output":  json.dumps(result),
                        },
                    }))
                    await openai_ws.send(json.dumps({"type": "response.create"}))

                    # Forward tool result to browser for canvas update
                    await client_ws.send_text(json.dumps({
                        "type":   "tool_call_result",
                        "tool":   tool_name,
                        "args":   args,
                        "result": result,
                    }))

                elif msg_type == "session.expired":
                    await client_ws.send_text(json.dumps({"type": "session_expired"}))
                    return

            except Exception:
                return

    await asyncio.gather(client_to_openai(), openai_to_client())
