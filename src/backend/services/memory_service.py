"""
Memory service — full PS06 implementation.
Handles four-tier memory architecture with Tier 2 quarantine enforced at DB query layer.
"""

import uuid
import json
from datetime import datetime, timezone
from db.supabase import get_client
from db.queries import log_event

try:
    from openai import OpenAI
    import os
    _openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
except Exception:
    _openai_client = None

WORKSPACE_MODE_PROMPTS = {
    "analytical": (
        "Weight evidence heavily. Every claim requires attribution to a dropped document or Tier 0 Core Memory. "
        "Flag all unsourced claims as Parametric immediately. Unsourced assumptions are HIGH RISK."
    ),
    "creative": (
        "Embrace possibility. Parametric AI knowledge is acceptable. Tier 0 Core Memories are your primary guides. "
        "Derive new ideas freely. Uncertainty is acceptable — note it but do not block on it."
    ),
    "critical": (
        "Challenge everything. Generate counter-arguments for every accepted claim. "
        "Treat every assumption as wrong until proven. Mark parametric claims HIGH RISK."
    ),
    "strategic": (
        "Synthesize across all tiers. Integrate evidence, assumptions, and ideas. "
        "Highlight convergence. Focus on decisions and insights."
    ),
}


def assemble_context(canvas_id: str, workspace_mode: str = "analytical") -> str:
    """
    Assembles LLM context in strict priority order.
    Tier 2 items (quarantined) are NEVER included.
    Rejected items are NEVER included.
    """
    sb = get_client()
    mode_prompt = WORKSPACE_MODE_PROMPTS.get(workspace_mode, WORKSPACE_MODE_PROMPTS["analytical"])

    # Tier 0: Core (global, permanent)
    tier0 = (
        sb.table("memories")
        .select("text,scope,created_at")
        .eq("tier", 0)
        .eq("quarantined", False)
        .eq("archived", False)
        .eq("rejected", False)
        .execute().data
    )

    # Tier 1 Workspace
    tier1_ws = (
        sb.table("memories")
        .select("text,scope,created_at")
        .eq("tier", 1).eq("scope", "workspace")
        .eq("canvas_id", canvas_id)
        .eq("quarantined", False)
        .eq("archived", False)
        .eq("rejected", False)
        .execute().data
    )

    # Tier 1 Session (most recent 10)
    tier1_session = (
        sb.table("memories")
        .select("text,scope,created_at")
        .eq("tier", 1).eq("scope", "session")
        .eq("canvas_id", canvas_id)
        .eq("quarantined", False)
        .eq("archived", False)
        .eq("rejected", False)
        .order("created_at", desc=True)
        .limit(10)
        .execute().data
    )

    # Tier 3: Source (tied to artifacts)
    tier3 = (
        sb.table("memories")
        .select("text,scope,created_at")
        .eq("tier", 3)
        .eq("canvas_id", canvas_id)
        .eq("quarantined", False)
        .eq("archived", False)
        .eq("rejected", False)
        .execute().data
    )

    # NOTE: Tier 2 is NEVER queried here — this is the PS06 foundational commitment.

    parts = [f"WORKSPACE MODE: {workspace_mode.upper()}\n{mode_prompt}"]
    if tier0:
        parts.append("CORE MEMORIES (permanent):\n" + "\n".join(f"- {m['text']}" for m in tier0))
    if tier1_ws:
        parts.append("WORKSPACE MEMORIES:\n" + "\n".join(f"- {m['text']}" for m in tier1_ws))
    if tier1_session:
        parts.append("SESSION MEMORIES:\n" + "\n".join(f"- {m['text']}" for m in tier1_session))
    if tier3:
        parts.append("SOURCE MEMORIES:\n" + "\n".join(f"- {m['text']}" for m in tier3))

    return "\n\n".join(parts)


async def propose_inferred_memory(
    canvas_id: str,
    text: str,
    trigger: str,
    input_modality: str,
) -> str | None:
    """
    Inserts a Tier 2 (Inferred) memory with quarantined=TRUE.
    Returns None if canvas is in Incognito Mode.
    """
    sb = get_client()
    canvas = sb.table("canvases").select("incognito_mode").eq("id", canvas_id).single().execute()
    if canvas.data and canvas.data.get("incognito_mode"):
        return None

    mem_id = str(uuid.uuid4())
    sb.table("memories").insert({
        "id":          mem_id,
        "tier":        2,
        "scope":       "session",
        "text":        text,
        "provenance":  {"trigger": trigger, "input_modality": input_modality},
        "canvas_id":   canvas_id,
        "quarantined": True,
        "archived":    False,
        "rejected":    False,
    }).execute()
    return mem_id


def ratify_memory(memory_id: str, scope: str) -> dict:
    """
    User accepts a Tier 2 memory; sets quarantined=FALSE.
    Maps scope to the correct tier.
    """
    scope_to_tier = {"global": 0, "workspace": 1, "session": 1, "source": 3}
    tier = scope_to_tier.get(scope, 1)
    sb = get_client()
    sb.table("memories").update({
        "tier":        tier,
        "scope":       scope,
        "quarantined": False,
    }).eq("id", memory_id).execute()
    return {"tier": tier, "scope": scope}


def compute_freshness(memories: list[dict], canvas_nodes: list[dict]) -> dict[str, dict]:
    """
    Computes age badge and staleness flag for each memory.
    Called once at canvas load — NOT continuously during session.
    """
    now = datetime.now(timezone.utc)
    node_texts = [n.get("text", "").lower() for n in canvas_nodes]
    result = {}

    for mem in memories:
        raw_ts = mem.get("created_at")
        if raw_ts:
            try:
                created = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            except Exception:
                created = now
        else:
            created = now

        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)

        days = (now - created).days
        if days == 0:
            age_label = "Today"
        elif days == 1:
            age_label = "Yesterday"
        elif days < 7:
            age_label = f"{days}d ago"
        elif days < 30:
            age_label = f"{days // 7}w ago"
        else:
            age_label = f"{days // 30}mo ago"

        # Upgraded staleness heuristic (M-04)
        STOP_WORDS = {"the", "a", "an", "is", "are", "was", "were", "to", "for", "of", "and", "in", "on", "it", "this", "that", "with", "as", "by", "at", "be"}
        mem_words = set(mem.get("text", "").lower().split()) - STOP_WORDS
        negation = {
            "not", "no", "against", "rejected", "false", "incorrect", "wrong",
            "deprecated", "outdated", "superseded", "changed", "invalid", "obsolete",
            "never", "cannot", "disproven", "untrue"
        }

        stale = False
        if len(mem_words) > 0:
            for nt in node_texts:
                nt_words = set(nt.split()) - STOP_WORDS
                has_negation = bool(negation & nt_words)
                shared_keywords = mem_words & nt_words
                if has_negation and len(shared_keywords) >= 1:
                    stale = True
                    break

        result[mem["id"]] = {"age_label": age_label, "stale": stale}

    return result


async def generate_session_audit(canvas_id: str) -> list[dict]:
    """
    At canvas close: GPT-4o-mini summarises session events and returns 2-4 inferences.
    """
    if _openai_client is None:
        return []

    sb = get_client()
    events = (
        sb.table("events")
        .select("event_type,input_modality,delta,workspace_mode")
        .eq("canvas_id", canvas_id)
        .order("timestamp")
        .execute().data
    )
    if not events:
        return []

    events_text = "\n".join(
        f"[{e['event_type']}] {json.dumps(e.get('delta', {}))[:80]}"
        for e in events[-20:]
    )
    response = _openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": (
                "Based on these session events, what did you learn about the user's preferences? "
                "Generate 2-4 concise inferences. Output JSON: "
                '{"inferences":[{"text":"User prefers...","confidence":"low|medium|high"}]}'
            )},
            {"role": "user", "content": events_text},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    result = json.loads(response.choices[0].message.content)
    return result.get("inferences", [])
