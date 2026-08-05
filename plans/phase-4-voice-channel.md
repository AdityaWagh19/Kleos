# Phase 4 — Voice Channel

**Hours:** 10–14
**Team:** BE1 (WebSocket proxy + tool call routing) + FE1 (Web Audio API + voice UI + Impact Halo)
**Depends on:** Phase 2 (canvas service, 8-tool vocabulary), Phase 3 (SSE channel exists for delivering voice-triggered ribbon steps)
**Unlocks:** Voice-addressable verbs, Impact Halo (WOW #1), Status Pill Listening state

---

## Objective

By the end of this phase: a user can speak to the canvas, voice commands are processed via the OpenAI Realtime API, tool calls are routed to the canvas service and reflected on the canvas identically to text commands, the Status Pill shows a Listening state, voice transcript appears below the canvas, and the Impact Halo pulses dependent nodes in < 100ms on assumption hover.

---

## Scope

**Backend:**
- `FastAPI WebSocket /ws/voice` — accepts client WebSocket connection
- Bidirectional proxy: backend ↔ OpenAI Realtime API WebSocket (`wss://api.openai.com/v1/realtime`)
- Realtime API session configuration (model, tools, turn detection)
- Tool call routing: `voice tool call → canvas_service → Supabase → SSE to frontend`
- Event Log entry with `input_modality='voice'` for all voice-originated actions
- Realtime API session timeout recovery (re-establish at 15-minute limit)

**Frontend:**
- `useVoice.ts` hook — Web Audio API mic capture + WebSocket management
- Voice transcript display component (below canvas)
- Status Pill: wire up `Listening` state
- Impact Halo implementation: hover Assumption node → pulse `impact_nodes` array amber simultaneously (< 100ms)
- Voice reconnect visual feedback ("Voice reconnecting..." in Status Pill)

---

## Design Decisions and Rationale

**Why FastAPI as a proxy (not direct browser → Realtime API)?**
The OpenAI Realtime API requires an `Authorization` header with the API key. Browser WebSocket connections cannot set arbitrary headers due to browser security restrictions. A server-side proxy is mandatory. FastAPI proxies audio bidirectionally while keeping the API key server-side.

**Why the same 8 tools for voice and text?**
Per the Hexagonal Architecture constraint and the voice-text parity principle: *"Voice and text paths must produce identical canvas mutations. Input modality is invisible to the canvas service."* The canvas service (`canvas_service.py`) receives tool call results; it does not know (or care) whether they originated from voice or text.

**Impact Halo implementation: animation-only, data-only lookup:**
The data (`impact_nodes` array) is already stored in each node record since Phase 2. The hover handler reads `node.data.impact_nodes` (O(1)) and triggers a Framer Motion animation on each affected node. No API call, no graph traversal. This guarantees the < 100ms constraint.

**Impact Halo uses Framer Motion `useAnimation()`:**
Each react-flow node that can be impacted exposes a Framer Motion `AnimationControls` ref. A global `impactedNodes` state in the canvas stores which node IDs are currently pulsing. On hover enter, set `impactedNodes = assumption.impact_nodes`. On hover leave, clear. Nodes in `impactedNodes` play their amber pulse animation.

**Why AudioWorklet over ScriptProcessorNode?**
`ScriptProcessorNode` is deprecated (though still functional). `AudioWorklet` runs off the main thread and avoids audio dropouts during intensive canvas rendering. However, AudioWorklet requires a separate worklet file, which adds complexity. Use `ScriptProcessorNode` for the hackathon (it works in Chrome) with a note to migrate to AudioWorklet in V1.

**Turn detection: `server_vad` (Voice Activity Detection):**
The Realtime API's `server_vad` mode automatically detects speech start/end without requiring a push-to-talk mechanism. This is better for the demo — judges can speak naturally. The `silence_duration_ms=600` setting cuts off input after 600ms of silence, reducing latency.

---

## Sequential Implementation Tasks

### BE1: WebSocket Voice Proxy

**Task 4.1 — `ws/voice.py`**
```python
import os, json, asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import websockets

router = APIRouter()

REALTIME_API_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# The 8 tool definitions — identical to the text path
REALTIME_TOOLS = [
    {
        "type": "function",
        "name": "create_node",
        "description": "Add a new typed node to the canvas",
        "parameters": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["idea","evidence","assumption","question","constraint","insight","decision","source"]},
                "text": {"type": "string"},
                "confidence": {"type": "string", "enum": ["low","medium","high"]},
                "provenance_type": {"type": "string", "enum": ["document","core_memory","ai_inference","parametric","user_created","voice_input"]},
            },
            "required": ["type","text","confidence","provenance_type"],
        },
    },
    {"type": "function", "name": "create_edge", "description": "Link two nodes with a typed relationship",
     "parameters": {"type": "object", "properties": {
         "source_id": {"type": "string"}, "target_id": {"type": "string"},
         "type": {"type": "string", "enum": ["supports","contradicts","depends_on","derived_from"]},
         "confidence": {"type": "string", "enum": ["low","medium","high"]},
     }, "required": ["source_id","target_id","type","confidence"]}},
    {"type": "function", "name": "flag_contradiction", "description": "Mark two nodes as logically contradicting",
     "parameters": {"type": "object", "properties": {
         "node_a": {"type": "string"}, "node_b": {"type": "string"}, "explanation": {"type": "string"}
     }, "required": ["node_a","node_b","explanation"]}},
    {"type": "function", "name": "create_branch", "description": "Fork the canvas into a new branch",
     "parameters": {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]}},
    {"type": "function", "name": "merge_nodes", "description": "Combine two nodes into one synthesized node",
     "parameters": {"type": "object", "properties": {
         "node_ids": {"type": "array", "items": {"type": "string"}}, "merged_text": {"type": "string"}
     }, "required": ["node_ids","merged_text"]}},
    {"type": "function", "name": "collapse_cluster", "description": "Fold a cluster into a single summary node",
     "parameters": {"type": "object", "properties": {
         "cluster_id": {"type": "string"}, "summary_text": {"type": "string"}
     }, "required": ["cluster_id","summary_text"]}},
    {"type": "function", "name": "propose_memory", "description": "Queue a Tier 2 memory for user ratification",
     "parameters": {"type": "object", "properties": {
         "text": {"type": "string"}, "trigger": {"type": "string"}
     }, "required": ["text","trigger"]}},
    {"type": "function", "name": "emit_reasoning_step", "description": "Emit an intermediate step to the Reasoning Ribbon",
     "parameters": {"type": "object", "properties": {
         "step": {"type": "integer"}, "action": {"type": "string"},
         "detail": {"type": "string"}, "confidence": {"type": "string", "enum": ["low","medium","high"]},
     }, "required": ["step","action","detail","confidence"]}},
]

REALTIME_SESSION_CONFIG = {
    "type": "session.update",
    "session": {
        "modalities": ["text", "audio"],
        "instructions": (
            "You are the AI engine for Kleos, a spatial thinking canvas. "
            "The user speaks commands. Translate them into tool calls. "
            "Use create_node for new ideas, evidence, assumptions, questions. "
            "Use create_branch when user says 'branch on X'. "
            "Use emit_reasoning_step to narrate what you're doing. "
            "Always use voice_input as provenance_type for nodes from voice commands. "
            "Be concise in text responses."
        ),
        "voice": "alloy",
        "input_audio_format": "pcm16",
        "output_audio_format": "pcm16",
        "turn_detection": {
            "type": "server_vad",
            "threshold": 0.5,
            "prefix_padding_ms": 300,
            "silence_duration_ms": 600,
        },
        "tools": REALTIME_TOOLS,
        "tool_choice": "auto",
    },
}

@router.websocket("/ws/voice")
async def voice_websocket(ws: WebSocket, canvas_id: str = ""):
    await ws.accept()

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "OpenAI-Beta": "realtime=v1",
    }

    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            async with websockets.connect(REALTIME_API_URL, extra_headers=headers) as openai_ws:
                # Configure the session
                await openai_ws.send(json.dumps(REALTIME_SESSION_CONFIG))

                # Run bidirectional relay until disconnect
                await _relay(ws, openai_ws, canvas_id)
                break  # Normal exit — don't retry
        except WebSocketDisconnect:
            break
        except Exception as e:
            if attempt < max_attempts - 1:
                # Signal reconnect to frontend
                await ws.send_text(json.dumps({"type": "status", "status": "reconnecting", "attempt": attempt + 1}))
                await asyncio.sleep(min(2 ** attempt, 30))  # Exponential backoff
            else:
                await ws.send_text(json.dumps({"type": "error", "message": "Voice channel unavailable"}))


async def _relay(client_ws: WebSocket, openai_ws, canvas_id: str):
    """Bidirectional relay: client ↔ OpenAI Realtime API."""
    from services.canvas_service import handle_voice_tool_call

    async def client_to_openai():
        while True:
            try:
                data = await client_ws.receive_bytes()
                # Wrap raw audio in Realtime API input audio buffer append message
                import base64
                audio_b64 = base64.b64encode(data).decode()
                await openai_ws.send(json.dumps({
                    "type": "input_audio_buffer.append",
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

                # Forward transcript + audio to client
                if msg_type in ("response.audio.delta", "response.audio_transcript.delta",
                                "response.text.delta", "conversation.item.input_audio_transcription.completed"):
                    await client_ws.send_text(json.dumps(msg))

                # Handle tool calls
                elif msg_type == "response.function_call_arguments.done":
                    tool_name = msg.get("name")
                    args = json.loads(msg.get("arguments", "{}"))
                    result = await handle_voice_tool_call(canvas_id, tool_name, args)

                    # Send tool result back to Realtime API
                    await openai_ws.send(json.dumps({
                        "type": "conversation.item.create",
                        "item": {
                            "type": "function_call_output",
                            "call_id": msg.get("call_id"),
                            "output": json.dumps(result),
                        },
                    }))
                    # Resume response generation
                    await openai_ws.send(json.dumps({"type": "response.create"}))

                    # Forward tool result to client for canvas update
                    await client_ws.send_text(json.dumps({
                        "type": "tool_call_result",
                        "tool": tool_name,
                        "args": args,
                        "result": result,
                    }))

            except Exception:
                return

    await asyncio.gather(client_to_openai(), openai_to_client())
```

**Task 4.2 — `services/canvas_service.py` — add `handle_voice_tool_call`**
```python
async def handle_voice_tool_call(canvas_id: str, tool_name: str, args: dict) -> dict:
    """
    Routes voice tool calls to the same canvas service methods as text calls.
    Input modality is voice — all canvas mutations are identical to text path.
    """
    from db.supabase import get_client
    sb = get_client()
    branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
    branch_id = branch.data[0]["id"] if branch.data else "main"

    if tool_name == "create_node":
        node_id = str(uuid.uuid4())
        # Force voice_input as provenance_type for all voice-created nodes
        node_data = {
            "id": node_id,
            "canvas_id": canvas_id,
            "branch_id": branch_id,
            "type": args["type"],
            "text": args["text"],
            "confidence": args.get("confidence", "medium"),
            "provenance_type": "voice_input",  # Always voice_input for voice channel
            "impact_nodes": [],  # Voice nodes don't have pre-computed impact at creation
            "position": _auto_position_voice(canvas_id),
            "created_by": "user",   # Voice commands originate from the user
            "input_modality": "voice",
            "workspace_mode_at_creation": get_current_workspace_mode(canvas_id),
        }
        sb.table("nodes").insert(node_data).execute()
        log_event(canvas_id, branch_id, "voice_command_received", "user", "voice", [node_id])
        log_event(canvas_id, branch_id, "node_created", "user", "voice", [node_id])
        return {"success": True, "node_id": node_id}

    elif tool_name == "emit_reasoning_step":
        # Route to SSE pub/sub so the Reasoning Ribbon receives it
        from cache.redis import get_client as get_redis
        get_redis().publish(f"ribbon:{canvas_id}", json.dumps({
            "type": "step",
            "data": args,
        }))
        return {"success": True}

    elif tool_name == "create_branch":
        new_branch_id = str(uuid.uuid4())
        sb.table("branches").insert({
            "id": new_branch_id, "canvas_id": canvas_id, "name": args["name"]
        }).execute()
        log_event(canvas_id, new_branch_id, "branch_created", "user", "voice", [])
        return {"success": True, "branch_id": new_branch_id}

    elif tool_name == "propose_memory":
        from services.memory_service import propose_inferred_memory
        memory_id = await propose_inferred_memory(canvas_id, args["text"], args["trigger"], "voice")
        return {"success": True, "memory_id": memory_id}

    elif tool_name == "flag_contradiction":
        edge_id = create_edge(canvas_id, branch_id, args["node_a"], args["node_b"], "contradicts", "high")
        return {"success": True, "edge_id": edge_id}

    return {"success": False, "error": f"Unknown tool: {tool_name}"}


def _auto_position_voice(canvas_id: str) -> dict:
    """Position voice-created nodes at center of existing node cluster."""
    from db.supabase import get_client
    nodes = get_client().table("nodes").select("position").eq("canvas_id", canvas_id).execute().data
    if not nodes:
        return {"x": 400, "y": 300}
    avg_x = sum(n["position"]["x"] for n in nodes) / len(nodes)
    avg_y = sum(n["position"]["y"] for n in nodes) / len(nodes)
    import random
    return {"x": avg_x + random.randint(-100, 100), "y": avg_y + random.randint(-100, 100)}
```

**Task 4.3 — Register WebSocket router in `main.py`**
```python
# Add to main.py
from ws.voice import router as voice_router
app.include_router(voice_router)
```

**Task 4.4 — Realtime API session timeout recovery**
The Realtime API has a 15-minute session limit. When the session ends (`session.expired` event), re-establish the connection with a session summary as context. Implement in `_relay()`:
```python
elif msg_type == "session.expired":
    # Get last 10 canvas events as session summary
    events = get_client().table("events").select("event_type,affected_node_ids").eq("canvas_id", canvas_id).order("timestamp", desc=True).limit(10).execute()
    summary = f"Resuming session. Recent actions: {[e['event_type'] for e in events.data]}"
    # Signal client to reconnect — the client-side WebSocket auto-reconnects
    await client_ws.send_text(json.dumps({"type": "session_expired", "summary": summary}))
```

---

### FE1: Web Audio API + Impact Halo

**Task 4.5 — `src/frontend/src/hooks/useVoice.ts`**
```typescript
import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'reconnecting' | 'error';

interface UseVoiceOptions {
  canvasId: string;
  onToolCall: (tool: string, args: Record<string, unknown>, result: unknown) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onStatusChange: (status: VoiceStatus) => void;
}

export function useVoice({ canvasId, onToolCall, onTranscript, onStatusChange }: UseVoiceOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttemptRef = useRef(0);

  const updateStatus = useCallback((s: VoiceStatus) => {
    setStatus(s);
    onStatusChange(s);
  }, [onStatusChange]);

  const startVoice = useCallback(async () => {
    try {
      updateStatus('connecting');

      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      // ScriptProcessorNode: bufferSize 4096, 1 input channel, 1 output channel
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Connect WebSocket
      const wsBase = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000';
      const ws = new WebSocket(`${wsBase}/ws/voice?canvas_id=${canvasId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        updateStatus('listening');
        reconnectAttemptRef.current = 0;

        // Start streaming audio when WebSocket is open
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert float32 to int16 PCM
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          ws.send(pcm16.buffer);
        };
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'response.audio_transcript.delta':
            onTranscript(msg.delta ?? '', false);
            break;
          case 'conversation.item.input_audio_transcription.completed':
            onTranscript(msg.transcript ?? '', true);
            break;
          case 'tool_call_result':
            onToolCall(msg.tool, msg.args, msg.result);
            break;
          case 'status':
            if (msg.status === 'reconnecting') updateStatus('reconnecting');
            break;
          case 'session_expired':
            // Re-establish connection
            stopVoice();
            setTimeout(() => startVoice(), 500);
            break;
        }
      };

      ws.onclose = () => {
        if (status !== 'idle') {
          // Auto-reconnect with exponential backoff
          const delay = Math.min(2 ** reconnectAttemptRef.current * 1000, 30000);
          reconnectAttemptRef.current++;
          updateStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(() => startVoice(), delay);
        }
      };

      ws.onerror = () => updateStatus('error');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        updateStatus('error');
        alert('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        updateStatus('error');
      }
    }
  }, [canvasId, onToolCall, onTranscript, updateStatus]);

  const stopVoice = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    processorRef.current?.disconnect();
    audioCtxRef.current?.close();
    wsRef.current?.close();
    processorRef.current = null;
    audioCtxRef.current = null;
    wsRef.current = null;
    updateStatus('idle');
  }, [updateStatus]);

  useEffect(() => () => stopVoice(), [stopVoice]);

  return { status, startVoice, stopVoice };
}
```

**Task 4.6 — `src/frontend/src/components/VoiceTranscript.tsx`**
```tsx
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  transcript: string;
  isActive: boolean;
}

export function VoiceTranscript({ transcript, isActive }: Props) {
  return (
    <AnimatePresence>
      {(isActive || transcript) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 max-w-lg bg-[#1a1a1a] border border-[#2b2b2b] rounded-[8px] px-4 py-2 z-20"
        >
          <div className="flex items-center gap-2">
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#e5ff5d]"
              />
            )}
            <p className="text-[13px] text-[#f9f9f9]">
              {transcript || (isActive ? 'Listening...' : '')}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Task 4.7 — Impact Halo in `BaseNode.tsx`**

Add the following to `BaseNode.tsx`. The `impactedNodes` set is passed down from canvas-level state:

```tsx
// Add to BaseNode.tsx props:
interface KleosNodeProps extends NodeProps {
  data: KleosNode;
  isImpacted?: boolean;  // True when this node is in the currently hovered assumption's impact_nodes
}

// Wrap the main div with motion and add amber pulse when impacted:
<motion.div
  initial={{ opacity: 0, scale: 0.92 }}
  animate={{
    opacity: 1,
    scale: 1,
    boxShadow: isImpacted
      ? ['0 0 0 2px #f5c842', '0 0 12px 4px #f5c84240', '0 0 0 2px #f5c842']
      : 'none',
  }}
  transition={{
    duration: isImpacted ? 0.8 : 0.18,
    repeat: isImpacted ? Infinity : 0,
    ease: 'easeOut',
  }}
  // ... rest unchanged
>
```

**Task 4.8 — `useCanvas.ts` — add Impact Halo state**
```typescript
// Add to useCanvas.ts:
const [impactedNodeIds, setImpactedNodeIds] = useState<Set<string>>(new Set());

const activateImpactHalo = useCallback((assumptionNodeId: string, impactNodes: string[]) => {
  // This must complete synchronously — no async, no API calls
  // impact_nodes is pre-computed and stored on the node data
  setImpactedNodeIds(new Set(impactNodes));
}, []);

const clearImpactHalo = useCallback(() => {
  setImpactedNodeIds(new Set());
}, []);

// Pass impactedNodeIds to each node via nodeProps:
const nodesWithImpact = nodes.map(n => ({
  ...n,
  data: { ...n.data, isImpacted: impactedNodeIds.has(n.id) },
}));
```

---

## Validation Strategy

**Backend voice proxy test (critical — test first):**
1. Start backend: `uvicorn main:app --reload --port 8000`
2. Connect a simple WebSocket client (use `wscat` or Postman): `ws://localhost:8000/ws/voice?canvas_id=test`
3. Verify WebSocket accepts connection, Realtime API session config is sent
4. Send a text message via the Realtime API input (not audio): verify the model responds
5. Test tool call: inject a `response.function_call_arguments.done` message manually → verify `handle_voice_tool_call` writes a node to Supabase

**Frontend voice test:**
1. Open browser (Chrome) at `localhost:5173`
2. Click the microphone button → browser shows permission prompt → grant permission
3. Status Pill transitions to `Listening` (lime mic icon)
4. Speak "Create a node called test idea" → verify:
   - Voice transcript appears below canvas with spoken words
   - Within 5 seconds: a new node appears on canvas with `voice_input` (lime) badge
   - Status Pill transitions from `Listening` → `Working...` → `Ready`

**Impact Halo test:**
1. Ensure canvas has at least one assumption node with `impact_nodes` array non-empty
2. Hover the assumption node in the Assumption Audit Panel
3. Verify: dependent nodes pulse amber simultaneously (animated)
4. Measure time from hover to first pulse start using browser DevTools Performance tab → must be < 100ms
5. Move mouse off assumption → verify amber pulse stops

**All 12 verbs test (Hours 10-14 from tasks.md):**
Test each verb via voice command:
- "Create a node about X" → `create_node` fires
- "Branch on the cost assumption" → `create_branch` fires
- "What changes if I remove this assumption?" → `counterfactual` (Phase 8)
- etc. Mark untested verbs as deferred to Phase 8

---

## Acceptance Criteria

- [ ] `ws://localhost:8000/ws/voice` accepts WebSocket connections
- [ ] OpenAI Realtime API bidirectional proxy is functional (audio relayed, responses returned)
- [ ] Speaking "Create a node called [X]" produces a `create_node` tool call within 5 seconds
- [ ] Voice-created node appears on canvas with `voice_input` (lime) provenance badge
- [ ] Voice-created node has `input_modality: 'voice'` and `created_by: 'user'` in database
- [ ] Voice event logged in `events` table with `event_type: 'voice_command_received'`
- [ ] Status Pill shows `Listening` state (lime mic icon) when microphone is active
- [ ] Status Pill transitions to `Working...` when voice command is being compiled
- [ ] Voice transcript appears below canvas in real time during speech
- [ ] WebSocket disconnect → auto-reconnect with exponential backoff
- [ ] Status Pill shows "Voice reconnecting..." during reconnect attempts
- [ ] Impact Halo: hovering assumption in Audit Panel triggers amber pulse on `impact_nodes` within 100ms
- [ ] Impact Halo: only nodes in the assumption's `impact_nodes` array pulse (not all nodes)
- [ ] Impact Halo: hover-off clears the amber pulse
- [ ] Microphone permission denial shows clear guidance message

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| FastAPI WebSocket proxy introduces > 200ms latency | Medium | Test latency early (Task 4.1); accept up to 300ms proxy overhead within the 5s total budget |
| OpenAI Realtime API tool call format changes | Low | Lock to `gpt-4o-realtime-preview-2024-10-01` exact version in session config |
| ScriptProcessorNode audio quality issues | Low | Chrome supports it at 24kHz; acceptable for hackathon demo |
| Impact Halo > 100ms if react-flow re-renders all nodes | Medium | Use `React.memo` on BaseNode; only nodes in `impactedNodeIds` set re-render due to `isImpacted` change |
| Realtime API session expires mid-demo | Low | 15-minute timeout >> 7-minute demo; recovery code is insurance |
| Canvas ID not passed to WebSocket | Medium | Pass `canvas_id` as query parameter in WebSocket URL: `/ws/voice?canvas_id=...` |

---

## Deliverables

- `src/backend/ws/voice.py` — bidirectional Realtime API proxy with tool call routing
- `src/backend/services/canvas_service.py` — `handle_voice_tool_call()` routing all 8 tools
- `src/frontend/src/hooks/useVoice.ts` — Web Audio API + WebSocket management
- `src/frontend/src/components/VoiceTranscript.tsx`
- `src/frontend/src/canvas/nodes/BaseNode.tsx` — Impact Halo animation added
- `src/frontend/src/hooks/useCanvas.ts` — `impactedNodeIds` state + `activateImpactHalo()`
- `src/frontend/src/components/StatusPill.tsx` — Listening state wired up

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 10–14: Voice Channel" complete
- `project-context/progress.md` → Open Questions Resolved: "FastAPI WebSocket ↔ OpenAI Realtime API proxy latency" + "Redis Cloud write/read latency"
- `project-context/tasks.md` — Mark all Hours 10–14 tasks [x]
- If ScriptProcessorNode is replaced with AudioWorklet: record in Architecture Changes

---

## Dependencies

- Phase 2 complete: canvas service + 8-tool vocabulary defined
- Phase 3 complete: SSE channel exists (voice-triggered ribbon steps use SSE pub/sub via Redis)
- `websockets` Python library installed in `requirements.txt`
- OpenAI API key has Realtime API access (verify on OpenAI platform)
- Chrome browser for testing (Safari has WebSocket + Web Audio API limitations)
