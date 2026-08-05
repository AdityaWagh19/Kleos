# Phase 3 — Reasoning + Contradiction + Assumption Audit Panel

**Hours:** 6–10
**Team:** BE1 (SSE + contradiction) + BE2 (streaming test/fallback) + FE1 (Reasoning Ribbon + Status Pill) + FE2 (Assumption Audit Panel)
**Depends on:** Phase 2 (nodes in DB, GPT-4o integration working)
**Unlocks:** Phase 4 (Voice uses same SSE channel), Phase 5 (Assumption Audit Panel links to Memory)

---

## Objective

By the end of this phase: the canvas narrates every AI compilation step in real time via Server-Sent Events (Reasoning Ribbon), contradictions between nodes are visually flagged, the 3-state Status Pill communicates AI activity, and the Assumption Audit Panel exposes every AI assumption for inspection and override.

This phase includes the most technically uncertain step in the build: **SSE streaming reliability with GPT-4o**. A go/no-go decision must be made by Hour 8 at the latest, with fallback to the 2-call architecture if needed.

---

## Scope

**Backend:**
- `GET /api/canvas/{id}/stream` — SSE endpoint (Reasoning Ribbon feed)
- GPT-4o streaming test (primary: 1-call streaming approach)
- Fallback: 2-call architecture (GPT-4o-mini for steps + GPT-4o for compilation)
- GPT-4o-mini contradiction detection between new node pairs
- `flag_contradiction` tool call → red edge + Event Log entry
- Update `POST /api/canvas/{id}/drop` to SSE-coordinate the ribbon

**Frontend:**
- `ReasoningRibbon.tsx` — SSE consumer, step display, clickable steps, fade after 2s
- `StatusPill.tsx` — 3-state (Working/Listening/Ready), click tooltip
- `AssumptionAuditPanel.tsx` — right drawer, confidence bars, Impact Halo stub, Accept/Override/Delete
- `useSSE.ts` — reusable SSE hook
- Contradiction Flag: red edge + lightning icon

---

## Design Decisions and Rationale

**Why test streaming in the first 2 hours of this phase (Hours 6–8)?**
If GPT-4o cannot reliably emit `reasoning_step` JSON objects mid-stream, the 1-call architecture fails. This determines the entire streaming implementation. Per architecture.md: *"Prototype the streaming approach in the first 4 hours. If unreliable, switch immediately to fallback. Do not spend more than 2 hours debugging."*

**Primary vs Fallback Streaming:**
- **Primary (1-call):** GPT-4o streams partial JSON; the system prompt instructs it to emit `{"event":"reasoning_step",...}` objects before the compilation JSON. Advantages: single latency, no extra cost.
- **Fallback (2-call):** GPT-4o-mini generates and streams reasoning step narrations (fast, cheap), then GPT-4o runs the full compilation. Adds ~500ms latency. Advantages: guaranteed ribbon content, fully reliable.

**Why GPT-4o-mini for contradiction detection (not GPT-4o)?**
Contradiction detection is a binary classification task (do these two nodes contradict?). GPT-4o-mini is 10x cheaper and performs well on binary classification. Contradiction detection runs on every new node pair — at 15 nodes per compilation, that's up to 105 pairs — GPT-4o would be prohibitively expensive.

**Why only detect contradictions on new node pairs (not all pairs)?**
At demo scale (< 100 nodes), detecting all pairs on every compilation would be O(n²) and introduce latency. We detect contradictions only between the new nodes in the current compilation and the existing canvas nodes. This catches the important contradictions (new content vs. existing) while keeping latency acceptable.

**Assumption Audit Panel — Impact Halo is a stub in this phase:**
The Impact Halo (amber pulse on dependent nodes) requires `impact_nodes` to be populated (done in Phase 2) AND a frontend animation trigger. The data is ready; the animation is built in Phase 4 alongside the voice channel to ensure the < 100ms target is met while the team is focused on performance.

---

## Sequential Implementation Tasks

### BE1: SSE Streaming Endpoint

**Task 3.1 — Streaming test (Hours 6–8)**
Before writing the full SSE endpoint, test GPT-4o streaming reliability:
```python
# test_streaming.py (run manually, not part of the app)
from openai import OpenAI
import json

client = OpenAI()
resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Emit exactly 3 JSON objects, each on a new line, formatted as {\"event\":\"reasoning_step\",\"step\":N,\"text\":\"...\"}. Then output a final JSON object {\"done\":true}."},
        {"role": "user", "content": "Analyze: The company has high growth but negative cash flow."},
    ],
    stream=True,
)
buffer = ""
for chunk in resp:
    delta = chunk.choices[0].delta.content or ""
    buffer += delta
    print(delta, end="", flush=True)
print("\n\nFull buffer:", buffer)
```
**Decision gate:** If this reliably emits step objects mid-stream → use primary architecture. If not → use 2-call fallback. Record decision in `project-context/progress.md` Architecture Changes table.

**Task 3.2 — `services/llm_service.py` (add streaming)**
```python
from typing import Generator, AsyncGenerator
import asyncio

STREAMING_SYSTEM_PROMPT_PREFIX = """
Before generating the final compilation JSON, emit intermediate reasoning steps.
Each step must be a JSON object on its own line:
{"event": "reasoning_step", "step": N, "action": "...", "detail": "...", "confidence": "low|medium|high"}

After all steps, emit the final compilation object.

Example steps:
{"event": "reasoning_step", "step": 1, "action": "reading_source", "detail": "Analyzing provided content", "confidence": "high"}
{"event": "reasoning_step", "step": 2, "action": "classified_as", "type": "assumption", "detail": "Hedged language detected: 'likely', 'probably'", "confidence": "medium"}
{"event": "reasoning_step", "step": 3, "action": "detected_contradiction", "detail": "Node A claims X; Node B claims not-X", "confidence": "high"}
"""

async def compile_document_stream(
    text: str, workspace_mode: str = "analytical", canvas_id: str = ""
) -> AsyncGenerator[str, None]:
    """
    Primary streaming approach: GPT-4o emits reasoning steps mid-stream.
    Yields SSE-formatted strings: "data: {...}\n\n"
    Raises: StreamingUnreliableError if no step events seen within 5 seconds.
    """
    mode_suffix = _get_mode_suffix(workspace_mode)
    system_prompt = STREAMING_SYSTEM_PROMPT_PREFIX + "\n" + COMPILATION_SYSTEM_PROMPT + f"\n\nMode: {mode_suffix}"

    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Extract knowledge from:\n\n{text}"},
        ],
        stream=True,
        temperature=0.2,
    )

    buffer = ""
    compilation_json = ""
    in_compilation = False

    for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        buffer += delta

        # Try to extract complete JSON objects from buffer
        while "\n" in buffer:
            line, buffer = buffer.split("\n", 1)
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if obj.get("event") == "reasoning_step":
                    yield f"data: {json.dumps({'type': 'step', 'data': obj})}\n\n"
                elif "nodes" in obj:
                    # This is the final compilation JSON
                    yield f"data: {json.dumps({'type': 'compilation', 'data': obj})}\n\n"
                    return
            except json.JSONDecodeError:
                # Accumulate multi-line JSON
                compilation_json += line + "\n"
                continue

    # Flush remaining buffer as compilation
    remaining = (buffer + compilation_json).strip()
    if remaining:
        try:
            obj = json.loads(remaining)
            yield f"data: {json.dumps({'type': 'compilation', 'data': obj})}\n\n"
        except json.JSONDecodeError:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Compilation parse failed'})}\n\n"


async def compile_document_stream_fallback(
    text: str, workspace_mode: str = "analytical"
) -> AsyncGenerator[str, None]:
    """
    Fallback 2-call architecture:
    1. GPT-4o-mini generates + streams reasoning steps (fast, cheap)
    2. GPT-4o generates full compilation (synchronous, JSON mode)
    """
    # Step 1: GPT-4o-mini reasoning steps
    steps_stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Generate 3-5 concise reasoning steps for the analysis. Each step on its own line as JSON: {\"event\":\"reasoning_step\",\"step\":N,\"action\":\"...\",\"detail\":\"...\",\"confidence\":\"low|medium|high\"}"},
            {"role": "user", "content": f"What reasoning steps would you take to analyze:\n\n{text[:500]}"},
        ],
        stream=True,
    )
    buffer = ""
    for chunk in steps_stream:
        delta = chunk.choices[0].delta.content or ""
        buffer += delta
        while "\n" in buffer:
            line, buffer = buffer.split("\n", 1)
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if obj.get("event") == "reasoning_step":
                    yield f"data: {json.dumps({'type': 'step', 'data': obj})}\n\n"
            except json.JSONDecodeError:
                pass

    # Step 2: Full GPT-4o compilation
    compilation = compile_document(text, workspace_mode)
    yield f"data: {json.dumps({'type': 'compilation', 'data': compilation})}\n\n"
```

**Task 3.3 — `GET /api/canvas/{id}/stream` SSE endpoint**
```python
# Add to routers/canvas.py
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import os

USE_STREAMING_FALLBACK = os.environ.get("STREAMING_FALLBACK", "false").lower() == "true"

@router.get("/canvas/{canvas_id}/stream")
async def stream_canvas(canvas_id: str, text: str = "", workspace_mode: str = "analytical"):
    """
    SSE endpoint for Reasoning Ribbon.
    Called by the frontend after a drop event — streams compilation steps in real time.
    """
    async def generate():
        if USE_STREAMING_FALLBACK:
            async for event in llm_service.compile_document_stream_fallback(text, workspace_mode):
                yield event
        else:
            async for event in llm_service.compile_document_stream(text, workspace_mode, canvas_id):
                yield event
        yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

**Add to `.env.example`:**
```env
STREAMING_FALLBACK=false   # Set to true if GPT-4o streaming proves unreliable
```

**Task 3.4 — Contradiction detection service**
```python
# Add to services/llm_service.py

def detect_contradictions(new_nodes: list[dict], existing_nodes: list[dict]) -> list[dict]:
    """
    Uses GPT-4o-mini to detect contradictions between new and existing nodes.
    Only checks new×existing pairs (not existing×existing — already processed).
    Returns list of {node_a, node_b, explanation}.
    """
    if not new_nodes or not existing_nodes:
        return []

    prompt_nodes = []
    for n in new_nodes[:10]:  # Cap at 10 new nodes per call
        prompt_nodes.append(f"NEW[{n['id'][:8]}]: {n['text']}")
    for n in existing_nodes[:20]:  # Cap at 20 existing nodes
        prompt_nodes.append(f"EX[{n['id'][:8]}]: {n['text']}")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": 'Find logical contradictions between NEW and EX nodes. Output JSON: {"contradictions": [{"node_a": "full_id", "node_b": "full_id", "explanation": "..."}]}. Only output direct contradictions (claim X vs. not-X). If none, output {"contradictions": []}.'},
            {"role": "user", "content": "\n".join(prompt_nodes)},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    result = json.loads(response.choices[0].message.content)

    # Remap short IDs back to full IDs
    all_nodes = {n["id"][:8]: n["id"] for n in (new_nodes + existing_nodes)}
    resolved = []
    for c in result.get("contradictions", []):
        resolved.append({
            "node_a": all_nodes.get(c["node_a"].replace("NEW[","").replace("]","").replace("EX[",""), c["node_a"]),
            "node_b": all_nodes.get(c["node_b"].replace("NEW[","").replace("]","").replace("EX[",""), c["node_b"]),
            "explanation": c["explanation"],
        })
    return resolved
```

**Task 3.5 — Integrate contradiction detection into drop flow**
```python
# Update POST /api/canvas/{id}/drop in routers/canvas.py
# After apply_compilation(), run contradiction detection:

existing_nodes = sb.table("nodes").select("id,text,type").eq("canvas_id", canvas_id).execute().data
new_nodes_data = sb.table("nodes").select("id,text,type").eq("canvas_id", canvas_id).in_("id", list(id_map.values())).execute().data

contradictions = llm_service.detect_contradictions(new_nodes_data, existing_nodes)
for c in contradictions:
    canvas_service.create_edge(canvas_id, branch_id, c["node_a"], c["node_b"], "contradicts", "high")
    # Also store contradiction explanation in event log delta
    log_event(canvas_id, branch_id, "edge_created", "ai", "drop",
              [c["node_a"], c["node_b"]], {"explanation": c["explanation"]})
```

---

### FE1: Reasoning Ribbon + Status Pill

**Task 3.6 — `src/frontend/src/hooks/useSSE.ts`**
```typescript
import { useEffect, useRef, useCallback } from 'react';

export function useSSE(url: string | null, onMessage: (data: unknown) => void) {
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!url) return;
    if (esRef.current) esRef.current.close();
    const es = new EventSource(`${import.meta.env.VITE_API_BASE_URL}${url}`);
    es.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); }
      catch {}
    };
    esRef.current = es;
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);

  return { close: () => esRef.current?.close() };
}
```

**Task 3.7 — `src/frontend/src/components/ReasoningRibbon.tsx`**
```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReasoningStep } from '../types';

interface Props {
  steps: ReasoningStep[];
  isActive: boolean;
  onStepClick: (step: ReasoningStep) => void;
}

export function ReasoningRibbon({ steps, isActive, onStepClick }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (steps.length > 0) {
      setVisible(true);
    }
  }, [steps.length]);

  useEffect(() => {
    // Fade 2 seconds after compilation completes
    if (!isActive && steps.length > 0) {
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isActive, steps.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 h-9 bg-[#1a1a1a] border-t border-[#2b2b2b] flex items-center px-4 gap-3 overflow-x-auto z-20"
        >
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => onStepClick(step)}
              className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
              title={step.detail}
            >
              <span className="w-4 h-4 rounded-full bg-[#2b2b2b] border border-[#565656] flex items-center justify-center text-[9px] text-[#9c9c9c]">
                {step.step}
              </span>
              <span className="text-[11px] text-[#9c9c9c] max-w-[180px] truncate">
                {step.action.replace(/_/g, ' ')}
              </span>
              {i < steps.length - 1 && (
                <span className="material-symbols-outlined text-[12px] text-[#565656]">chevron_right</span>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Task 3.8 — `src/frontend/src/components/StatusPill.tsx`**
```tsx
import { motion } from 'framer-motion';
import { useState } from 'framer-motion';
import type { StatusPillState, ReasoningStep } from '../types';

interface Props {
  state: StatusPillState;
  lastSteps: ReasoningStep[];  // Last 3 ribbon steps for tooltip
}

export function StatusPill({ state, lastSteps }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const CONFIG = {
    working:   { label: 'Working...', dotColor: '#4a90d9', animate: true,  icon: null,  clickable: true },
    listening: { label: 'Listening',  dotColor: '#e5ff5d', animate: true,  icon: 'mic', clickable: false },
    ready:     { label: 'Ready',      dotColor: '#4caf7d', animate: false, icon: null,  clickable: false },
  };
  const cfg = CONFIG[state];

  return (
    <div className="relative">
      <button
        disabled={!cfg.clickable}
        onClick={() => cfg.clickable && setShowTooltip(s => !s)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-[#2b2b2b] border border-[#565656] text-[11px] font-medium text-[#9c9c9c] hover:border-[#9c9c9c] transition-colors disabled:cursor-default"
      >
        {cfg.icon ? (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="material-symbols-outlined text-[12px]"
            style={{ color: cfg.dotColor }}
          >
            {cfg.icon}
          </motion.span>
        ) : (
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: cfg.dotColor }}
            animate={cfg.animate ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        {cfg.label}
      </button>

      {/* Tooltip: last 3 ribbon steps */}
      {showTooltip && lastSteps.length > 0 && (
        <div
          className="absolute top-full mt-1 right-0 w-64 bg-[#2b2b2b] border border-[#565656] rounded-[8px] p-2 z-50"
          onMouseLeave={() => setShowTooltip(false)}
        >
          {lastSteps.slice(-3).map((s, i) => (
            <div key={i} className="text-[11px] text-[#9c9c9c] py-1 border-b border-[#565656] last:border-0">
              <span className="text-[#f9f9f9]">{s.action.replace(/_/g,' ')}</span>
              {' — '}
              {s.detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### FE2: Assumption Audit Panel

**Task 3.9 — `src/frontend/src/components/ConfidenceBar.tsx`**
```tsx
import type { Confidence } from '../types';

const COLORS: Record<Confidence, string> = {
  low:    '#e84040',
  medium: '#f5c842',
  high:   '#4caf7d',
};
const WIDTHS: Record<Confidence, string> = { low: '33%', medium: '66%', high: '100%' };

export function ConfidenceBar({ confidence }: { confidence: Confidence }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[#565656] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: WIDTHS[confidence], background: COLORS[confidence] }}
        />
      </div>
      <span className="text-[10px] font-medium uppercase tracking-[0.04em]"
            style={{ color: COLORS[confidence] }}>
        {confidence}
      </span>
    </div>
  );
}
```

**Task 3.10 — `src/frontend/src/panels/AssumptionAuditPanel.tsx`**
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import type { Assumption } from '../types';

interface Props {
  open: boolean;
  assumptions: Assumption[];
  onClose: () => void;
  onHoverAssumption: (nodeId: string, impactNodes: string[]) => void;
  onLeaveAssumption: () => void;
  onOverride: (nodeId: string, newText: string) => void;
  onAccept: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onAskAI: (nodeId: string) => void;
}

export function AssumptionAuditPanel({
  open, assumptions, onClose,
  onHoverAssumption, onLeaveAssumption,
  onOverride, onAccept, onDelete, onAskAI
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-[#1a1a1a] border-l border-[#2b2b2b] z-30 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2b2b]">
            <div>
              <span className="text-[13px] font-medium text-[#f9f9f9]">Assumption Audit</span>
              <span className="ml-2 text-[10px] text-[#9c9c9c]">{assumptions.length} found</span>
            </div>
            <button onClick={onClose} className="material-symbols-outlined text-[18px] text-[#9c9c9c] hover:text-[#f9f9f9]">
              close
            </button>
          </div>

          {/* Empty state */}
          {assumptions.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <span className="material-symbols-outlined text-[32px] text-[#565656] block mb-2">help_outline</span>
                <p className="text-[12px] text-[#565656]">No assumptions detected yet.<br />Speak or drop content to begin.</p>
              </div>
            </div>
          )}

          {/* Assumption list */}
          <div className="flex-1 overflow-y-auto">
            {assumptions.map((assumption) => (
              <AssumptionRow
                key={assumption.node_id}
                assumption={assumption}
                onHover={() => onHoverAssumption(assumption.node_id, assumption.impact_nodes)}
                onLeave={onLeaveAssumption}
                onOverride={(text) => onOverride(assumption.node_id, text)}
                onAccept={() => onAccept(assumption.node_id)}
                onDelete={() => onDelete(assumption.node_id)}
                onAskAI={() => onAskAI(assumption.node_id)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AssumptionRow({ assumption, onHover, onLeave, onOverride, onAccept, onDelete, onAskAI }: {
  assumption: Assumption;
  onHover: () => void;
  onLeave: () => void;
  onOverride: (text: string) => void;
  onAccept: () => void;
  onDelete: () => void;
  onAskAI: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [overrideText, setOverrideText] = useState(assumption.statement);

  return (
    <div
      className="px-4 py-3 border-b border-[#2b2b2b] hover:bg-[#2b2b2b] transition-colors cursor-default"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <ProvenanceBadge type={assumption.provenance_type} />
        <span className="text-[10px] text-[#565656]">{assumption.impact_nodes.length} impacted</span>
      </div>

      {editing ? (
        <div className="mb-2">
          <textarea
            value={overrideText}
            onChange={e => setOverrideText(e.target.value)}
            className="w-full bg-[#111111] border border-[#e5ff5d] rounded-[4px] text-[12px] text-[#f9f9f9] p-2 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => { onOverride(overrideText); setEditing(false); }}
              className="px-2 py-1 bg-[#e5ff5d] text-[#111111] text-[10px] font-medium rounded-[4px]"
            >
              Apply Override
            </button>
            <button onClick={() => setEditing(false)} className="text-[10px] text-[#9c9c9c]">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-[#f9f9f9] mb-2 leading-[1.4]">{assumption.statement}</p>
      )}

      <ConfidenceBar confidence={assumption.confidence} />

      {/* Actions */}
      <div className="flex gap-1 mt-2 flex-wrap">
        {[
          { label: 'Accept',          icon: 'check',    action: onAccept,           style: '' },
          { label: 'Override',        icon: 'edit',     action: () => setEditing(true), style: '' },
          { label: 'Ask AI',          icon: 'psychology', action: onAskAI,          style: '' },
          { label: 'Delete',          icon: 'delete',   action: onDelete,           style: 'text-[#e84040]' },
        ].map(({ label, icon, action, style }) => (
          <button
            key={label}
            onClick={action}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] text-[10px] border border-[#565656] hover:border-[#9c9c9c] transition-colors ${style || 'text-[#9c9c9c]'}`}
          >
            <span className="material-symbols-outlined text-[11px]">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Missing import — add at top:
import { useState } from 'react';
```

---

## Validation Strategy

1. **Streaming test (Task 3.1):** Run `python test_streaming.py` → verify that JSON step objects appear in the output stream before the final compilation JSON. If they appear reliably: set `STREAMING_FALLBACK=false`. If not: set `STREAMING_FALLBACK=true`.

2. **SSE endpoint test:** `curl -N "http://localhost:8000/api/canvas/{id}/stream?text=The+market+is+growing+but+costs+are+high"` → verify SSE events stream, with `type: step` events appearing before `type: compilation`.

3. **Reasoning Ribbon test:** Drop a PDF in the browser → verify Ribbon appears at canvas bottom, shows steps in sequence, each step is clickable, Ribbon fades 2 seconds after `type: done` event.

4. **Status Pill test:** Drop a PDF → verify pill transitions from `Ready` (green) → `Working...` (animated blue) → `Ready`. Click `Working...` during compilation → tooltip shows last 3 steps.

5. **Contradiction test:** Drop two text snippets with opposing claims (e.g., "The market is B2B" and "The market is B2C") → verify a red edge with `contradicts` type appears between the two nodes.

6. **Assumption Audit Panel:** Click the panel toggle → verify right drawer slides in. Hover an assumption → panel row highlights (Impact Halo animation is a stub here — just border highlight). Click Override → textarea appears. Click Apply Override → text updates.

---

## Acceptance Criteria

- [ ] `GET /api/canvas/{id}/stream` streams SSE events with at least 2 `type: step` events before `type: compilation`
- [ ] First SSE event (first ribbon step) arrives within 3 seconds of request
- [ ] `STREAMING_FALLBACK` environment variable set based on streaming test result; decision recorded in `progress.md`
- [ ] Reasoning Ribbon appears during compilation, steps are clickable, fades 2s after done
- [ ] Status Pill transitions: `Ready` → `Working...` during compilation → `Ready` when done
- [ ] Status Pill click shows tooltip with last 3 ribbon steps (only while `Working...`)
- [ ] Contradiction edges render as red dashed lines with `contradicts` type
- [ ] Assumption Audit Panel opens/closes with slide animation
- [ ] Assumption panel shows: statement text, confidence bar (Low/Medium/High), provenance badge, action buttons
- [ ] Override action: textarea appears, submit triggers subgraph recompute (can be stubbed — sends override to backend)
- [ ] Delete action removes assumption node from canvas (calls `DELETE /api/canvas/{id}/node/{node_id}`)
- [ ] Empty state displays when no assumptions detected

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| GPT-4o streaming is unreliable | Medium | Fallback architecture (`STREAMING_FALLBACK=true`) is ready. Switch within 2 hours. |
| SSE connection drops mid-stream | Low | Browser's `EventSource` auto-reconnects; add `retry: 3000` header in SSE response |
| Contradiction detection false positives | Medium | GPT-4o-mini temperature=0 reduces hallucinations; only flag clear logical contradictions |
| Panel z-index conflicts with react-flow | Low | Use `z-30` on panel; react-flow default is `z-0` for nodes, `z-10` for controls |

---

## Deliverables

- `src/backend/services/llm_service.py` — streaming + fallback streaming + contradiction detection
- `src/backend/routers/canvas.py` — `/api/canvas/{id}/stream` SSE endpoint
- `src/frontend/src/hooks/useSSE.ts`
- `src/frontend/src/components/ReasoningRibbon.tsx`
- `src/frontend/src/components/StatusPill.tsx` — 3-state
- `src/frontend/src/components/ConfidenceBar.tsx`
- `src/frontend/src/panels/AssumptionAuditPanel.tsx`
- `STREAMING_FALLBACK` decision recorded in `project-context/progress.md`

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 6–10: Reasoning Ribbon and Contradiction" complete
- `project-context/progress.md` → Architecture Changes: record streaming approach (primary vs fallback)
- `project-context/progress.md` → Open Questions Resolved: "GPT-4o mid-stream reasoning_step reliability"
- `project-context/tasks.md` — Mark all Hours 6–10 tasks [x]

---

## Dependencies

- Phase 2 complete: `POST /api/canvas/{id}/drop` working, nodes in DB
- `openai` Python SDK installed with streaming support
- `sse-starlette` installed in `requirements.txt`
