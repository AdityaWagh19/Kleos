import os
import json
from pathlib import Path
from typing import AsyncGenerator
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

DEMO_MODE = os.environ.get("DEMO_MODE", "false").lower() == "true"
FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"

COMPILATION_SYSTEM_PROMPT = """
You are a structured knowledge extraction engine for a spatial reasoning canvas.
Extract typed, connected knowledge nodes from the provided content.

Output ONLY a valid JSON object matching this schema exactly:
{
  "nodes": [
    {
      "id": "short-unique-id",
      "type": "idea|evidence|assumption|question|constraint|insight|decision|source",
      "text": "concise node content (max 120 chars)",
      "confidence": "low|medium|high",
      "provenance_type": "document|core_memory|ai_inference|parametric|user_created|voice_input",
      "impact_nodes": ["id1", "id2"]
    }
  ],
  "reasoning_steps": [
    { "step": 1, "action": "extracted_from_source", "detail": "page 3, paragraph 2", "confidence": "high" }
  ],
  "contradictions": [
    { "node_a": "id1", "node_b": "id2", "explanation": "Node A claims X while Node B claims not-X" }
  ],
  "proposed_memories": [
    { "tier": 2, "text": "User preference observed", "trigger": "mentioned cost 3 times" }
  ]
}

RULES:
- Every assumption node MUST have impact_nodes listing all other node IDs in this output that depend on that assumption
- Every evidence node MUST have provenance_type=document
- Parametric AI knowledge (no source document) MUST have provenance_type=parametric
- Hedged language ("likely", "assumed", "probably") → type=assumption
- Maximum 15 nodes per call
- impact_nodes uses the short IDs from this output (they will be remapped to UUIDs on the server)
"""

WORKSPACE_MODE_SUFFIXES = {
    "analytical": "Weight evidence heavily. Flag all unsourced claims as parametric. Every claim requires attribution.",
    "creative":   "Generate ideas freely. Uncertainty is acceptable. Prefer idea nodes.",
    "critical":   "Challenge every claim. Create counter-argument nodes. Mark parametric claims HIGH RISK.",
    "strategic":  "Synthesize. Focus on convergence and decisions. Balanced approach.",
}


def _load_fixture(name: str) -> dict | None:
    if not DEMO_MODE:
        return None
    path = FIXTURES_DIR / f"{name}.json"
    if path.exists():
        return json.loads(path.read_text())
    return None


def compile_document(text: str, workspace_mode: str = "analytical") -> dict:
    """Primary compilation: text → structured nodes (CompilationOutput dict)."""
    mode_suffix = WORKSPACE_MODE_SUFFIXES.get(workspace_mode, "")

    # DEMO_MODE: return fixture if available
    if cached := _load_fixture(f"compile_document_{workspace_mode}"):
        return cached

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": COMPILATION_SYSTEM_PROMPT + f"\n\nMode: {mode_suffix}"},
            {"role": "user",   "content": f"Extract knowledge from:\n\n{text[:8000]}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    raw = json.loads(response.choices[0].message.content)

    # Validate required keys exist
    raw.setdefault("nodes", [])
    raw.setdefault("reasoning_steps", [])
    raw.setdefault("contradictions", [])
    raw.setdefault("proposed_memories", [])
    return raw


def detect_contradictions(new_nodes: list[dict], existing_nodes: list[dict]) -> list[dict]:
    """Uses GPT-4o-mini to detect contradictions between new and existing nodes."""
    if not new_nodes or not existing_nodes:
        return []

    lines = []
    for n in new_nodes[:10]:
        lines.append(f"NEW[{n['id'][:8]}]: {n['text']}")
    for n in existing_nodes[:20]:
        lines.append(f"EX[{n['id'][:8]}]: {n['text']}")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": (
                'Find logical contradictions between NEW and EX nodes. '
                'Output JSON: {"contradictions": [{"node_a": "full_id", "node_b": "full_id", "explanation": "..."}]}. '
                'Only output direct contradictions (claim X vs. not-X). If none, output {"contradictions": []}.'
            )},
            {"role": "user", "content": "\n".join(lines)},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    result = json.loads(response.choices[0].message.content)

    # Resolve short prefix IDs back to full IDs
    all_nodes_map = {}
    for n in new_nodes + existing_nodes:
        all_nodes_map[n["id"][:8]] = n["id"]
        all_nodes_map[n["id"]] = n["id"]

    resolved = []
    for c in result.get("contradictions", []):
        na = c["node_a"].replace("NEW[", "").replace("]", "").replace("EX[", "")
        nb = c["node_b"].replace("NEW[", "").replace("]", "").replace("EX[", "")
        resolved.append({
            "node_a":      all_nodes_map.get(na, na),
            "node_b":      all_nodes_map.get(nb, nb),
            "explanation": c["explanation"],
        })
    return resolved


# ---------------------------------------------------------------------------
# Streaming compilation (Reasoning Ribbon)
# ---------------------------------------------------------------------------

STREAMING_SYSTEM_PROMPT = COMPILATION_SYSTEM_PROMPT + """

STREAMING REQUIREMENT:
Before the final JSON object, emit intermediate reasoning steps.
Each step must be a JSON object on its own line:
{"event":"reasoning_step","step":N,"action":"...","detail":"...","confidence":"low|medium|high"}

Emit 3-5 steps covering: reading source, extracting claims, classifying nodes, detecting patterns.
Then emit the final compilation JSON object.
"""


async def compile_document_stream(
    text: str,
    workspace_mode: str = "analytical",
) -> AsyncGenerator[str, None]:
    """
    Primary streaming: GPT-4o emits reasoning_step objects mid-stream, then the compilation JSON.
    Yields SSE-formatted strings: 'data: {...}\\n\\n'
    """
    mode_suffix = WORKSPACE_MODE_SUFFIXES.get(workspace_mode, "")

    if cached := _load_fixture(f"compile_document_{workspace_mode}"):
        # Demo mode: emit fake steps then the cached compilation
        steps = [
            {"event": "reasoning_step", "step": 1, "action": "reading_source",     "detail": "Analysing provided content",          "confidence": "high"},
            {"event": "reasoning_step", "step": 2, "action": "extracting_claims",   "detail": "Identifying key concepts and claims",  "confidence": "high"},
            {"event": "reasoning_step", "step": 3, "action": "classifying_nodes",   "detail": "Tagging node types and confidence",    "confidence": "medium"},
        ]
        for s in steps:
            yield f"data: {json.dumps({'type':'step','data':s})}\n\n"
        yield f"data: {json.dumps({'type':'compilation','data':cached})}\n\n"
        return

    buffer = ""
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": STREAMING_SYSTEM_PROMPT + f"\n\nMode: {mode_suffix}"},
            {"role": "user",   "content": f"Extract knowledge from:\n\n{text[:6000]}"},
        ],
        stream=True,
        temperature=0.2,
    )

    compilation_json = ""
    for chunk in stream:
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
                    yield f"data: {json.dumps({'type':'step','data':obj})}\n\n"
                elif "nodes" in obj:
                    yield f"data: {json.dumps({'type':'compilation','data':obj})}\n\n"
                    return
            except json.JSONDecodeError:
                compilation_json += line + "\n"

    # Flush remaining buffer as compilation
    remaining = (buffer + compilation_json).strip()
    if remaining:
        try:
            obj = json.loads(remaining)
            # Ensure required keys
            obj.setdefault("nodes", [])
            obj.setdefault("reasoning_steps", [])
            obj.setdefault("contradictions", [])
            obj.setdefault("proposed_memories", [])
            yield f"data: {json.dumps({'type':'compilation','data':obj})}\n\n"
        except json.JSONDecodeError:
            yield f"data: {json.dumps({'type':'error','message':'Compilation parse failed'})}\n\n"


async def compile_document_stream_fallback(
    text: str,
    workspace_mode: str = "analytical",
) -> AsyncGenerator[str, None]:
    """
    Fallback 2-call streaming:
    1. GPT-4o-mini streams reasoning steps (fast, cheap)
    2. GPT-4o generates full compilation (synchronous JSON mode)
    """
    # Step 1: stream reasoning steps via GPT-4o-mini
    steps_stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": (
                "Generate 3-5 concise reasoning steps. Each on its own line as JSON: "
                '{"event":"reasoning_step","step":N,"action":"...","detail":"...","confidence":"low|medium|high"}'
            )},
            {"role": "user", "content": f"Analyse:\n\n{text[:500]}"},
        ],
        stream=True,
    )
    buf = ""
    for chunk in steps_stream:
        delta = chunk.choices[0].delta.content or ""
        buf += delta
        while "\n" in buf:
            line, buf = buf.split("\n", 1)
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if obj.get("event") == "reasoning_step":
                    yield f"data: {json.dumps({'type':'step','data':obj})}\n\n"
            except json.JSONDecodeError:
                pass

    # Step 2: full compilation via GPT-4o
    compilation = compile_document(text, workspace_mode)
    yield f"data: {json.dumps({'type':'compilation','data':compilation})}\n\n"


def evaluate_memory_card_trigger(session_events: list[dict]) -> dict | None:
    """
    GPT-4o-mini checks if the Memory Negotiation Card should appear.
    Returns card content dict if trigger met, None otherwise.
    """
    if len(session_events) < 2:
        return None

    if cached := _load_fixture("memory_card_trigger"):
        if cached.get("trigger"):
            return {"observation": cached["observation"], "proposed_text": cached["proposed_text"]}
        return None

    events_text = "\n".join(
        f"[{e.get('event_type','')}] {json.dumps(e.get('delta',{}))[:80]}"
        for e in session_events[-10:]
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": (
                'Has the user expressed the same preference 2+ times? '
                'Output JSON: {"trigger":true,"observation":"I noticed you...","proposed_text":"..."} '
                'or {"trigger":false}'
            )},
            {"role": "user", "content": events_text},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    result = json.loads(response.choices[0].message.content)
    if result.get("trigger"):
        return {"observation": result.get("observation", ""), "proposed_text": result.get("proposed_text", "")}
    return None
