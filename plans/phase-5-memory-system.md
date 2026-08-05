# Phase 5 — Memory System (PS06 Core)

**Hours:** 14–18
**Team:** BE2 (Memory CRUD, context assembly, trigger logic) + FE2 (Memory Panel, Negotiation Card, Session Audit, Scope Chips, Workspace Modes)
**Depends on:** Phase 1 (memories table with scope/quarantined/rejected columns), Phase 2 (canvas nodes exist to reference), Phase 3 (SSE for Negotiation Card triggers)
**Unlocks:** Phase 6 (Branch inherits workspace mode; Incognito Mode is a memory flag), Phase 7 (Session Audit at canvas close)

---

## Objective

By the end of this phase: the four-tier memory architecture is fully functional with Tier 2 quarantine enforced at the database layer; the Memory Negotiation Card appears at natural pause points; the Memory Panel exposes all tiers with full CRUD; the Session Memory Audit captures what the AI learned; Inline Scope Chips provide in-canvas memory control; and all four Workspace Modes configure the AI's reasoning posture. This is the PS06 core.

---

## Scope

**Backend:**
- `GET/POST/PUT/DELETE /api/canvas/{id}/memory` — Memory CRUD
- `POST /api/canvas/{id}/memory/{id}/ratify` — Accept Tier 2 into Tier 0 or Tier 1
- `POST /api/canvas/{id}/audit` — Session Memory Audit (accept/reject/edit batch)
- Context assembly service — enforces Tier 2 quarantine at query layer
- GPT-4o-mini Memory Negotiation Card trigger evaluation
- `propose_memory` tool call integration → Tier 2 insert with `quarantined=TRUE`
- Workspace Modes — 4 system prompt variants stored on canvas row

**Frontend:**
- `MemoryPanel.tsx` — Left slide-out, 4 tabs (Core/Session/Pending/Source), search, CRUD actions
- `MemoryNegotiationCard.tsx` — Dismissible, 4 scope options, shows AI's observation
- `SessionMemoryAuditCard.tsx` — Per-item Accept/Reject/Edit at canvas close
- `ScopeChip.tsx` — Inline [Session]/[Workspace]/[Global], clickable to cycle
- `ModeSelector.tsx` — Full-screen first-use onboarding
- `ModeIndicator.tsx` — Header display of active mode
- `useMemory.ts` hook — Memory CRUD state management

---

## Design Decisions and Rationale

**Why enforce Tier 2 quarantine at the database query layer?**
Application logic can be bypassed by bugs or shortcuts. The quarantine is the foundational PS06 commitment — it must be structural. The context assembly service (`assemble_context`) uses a WHERE clause: `WHERE quarantined = FALSE AND rejected = FALSE AND archived = FALSE`. This runs at the database, not in Python conditionals. A future developer cannot accidentally include Tier 2 items by forgetting to add a Python filter.

**Why soft-delete (rejected=TRUE) instead of hard-delete for rejected memories?**
The export must include a "consent ledger" showing what was rejected (PS06 auditability per test.md Section 13). Hard-deleting makes this impossible. Rejected items are excluded from all LLM context (same WHERE clause as quarantined) but remain in the DB for export queries.

**Why the Negotiation Card trigger uses GPT-4o-mini watching session events?**
The trigger condition ("same preference mentioned 2+ times in a session") requires semantic understanding — checking if two events express the same preference requires an LLM. GPT-4o-mini is cheap enough ($0.0001 per check) to run after each significant canvas event.

**Why the Memory Panel uses tabs (not a flat list)?**
The four tiers serve different purposes. A flat list of 20+ memories with different statuses creates cognitive overload. Tabs pre-filter by tier: Core (permanent), Session (current), Pending (needs decision), Source (document-tied). The pending tab with its banner ("These have not influenced any response yet") is the visual realization of the PS06 quarantine commitment.

**Mode system — why 4 prompts stored on canvas row?**
The mode must persist across sessions (restore on canvas open per test.md Section 9). Storing on the canvas row (not in session storage or localStorage) ensures it's available server-side for context assembly, which happens in the backend service. The mode configures both memory priority AND reasoning posture simultaneously — a single row is the right level of abstraction.

---

## Sequential Implementation Tasks

### BE2: Memory Service + API

**Task 5.1 — `services/memory_service.py`**
```python
import uuid, json, os
from db.supabase import get_client
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY",""))

WORKSPACE_MODE_PROMPTS = {
    "analytical": (
        "Weight evidence heavily. Every claim requires attribution to a dropped document or Tier 0 Core Memory. "
        "Flag all unsourced claims as Parametric immediately. Mark high-confidence assumptions as medium when no source exists. "
        "Counter-indicate speculation. Output evidence nodes before idea nodes."
    ),
    "creative": (
        "Embrace possibility. Parametric AI knowledge is acceptable. Tier 0 Core Memories are your primary guides. "
        "Generate ideas freely from the content and memory context. Uncertainty is acceptable — note it but don't block on it. "
        "Cluster ideas generously. Idea nodes are preferred over assumption nodes."
    ),
    "critical": (
        "Your job is to challenge. For every accepted claim in the canvas, generate a counter-argument. "
        "Treat every assumption as wrong until proven. Highlight contradictions. "
        "Session memories and contradiction flags are your highest-priority signals. Mark parametric claims HIGH RISK."
    ),
    "strategic": (
        "Synthesize across all tiers. Identify agreements and converging conclusions across evidence, assumptions, and ideas. "
        "Focus on decisions and insights. Minimize uncertainty language — synthesize through it. "
        "Balanced across all memory tiers. Convergence and clarity are the primary goals."
    ),
}

def assemble_context(canvas_id: str, workspace_mode: str = "analytical") -> str:
    """
    Assembles LLM context in strict priority order.
    Tier 2 items with quarantined=TRUE are NEVER included.
    Rejected items (rejected=TRUE) are NEVER included.
    """
    sb = get_client()

    # Get workspace mode prompt
    mode_prompt = WORKSPACE_MODE_PROMPTS.get(workspace_mode, WORKSPACE_MODE_PROMPTS["analytical"])

    # Tier 0: Core (global, permanent)
    tier0 = sb.table("memories") \
        .select("text,scope,created_at") \
        .eq("tier", 0).eq("quarantined", False) \
        .eq("archived", False).eq("rejected", False) \
        .execute().data

    # Tier 1: Workspace (persists for this canvas/project)
    tier1_ws = sb.table("memories") \
        .select("text,scope,created_at") \
        .eq("tier", 1).eq("scope", "workspace").eq("canvas_id", canvas_id) \
        .eq("quarantined", False).eq("archived", False).eq("rejected", False) \
        .execute().data

    # Tier 1: Session (expires on canvas close)
    tier1_session = sb.table("memories") \
        .select("text,scope,created_at") \
        .eq("tier", 1).eq("scope", "session").eq("canvas_id", canvas_id) \
        .eq("quarantined", False).eq("archived", False).eq("rejected", False) \
        .order("created_at", desc=True).limit(10) \
        .execute().data

    # Tier 3: Source (tied to dropped artifacts)
    tier3 = sb.table("memories") \
        .select("text,scope,created_at") \
        .eq("tier", 3).eq("canvas_id", canvas_id) \
        .eq("quarantined", False).eq("archived", False).eq("rejected", False) \
        .execute().data

    # Tier 2: NEVER included regardless of quarantine status
    # (This is enforced structurally — Tier 2 is not queried at all)

    context_parts = [
        f"WORKSPACE MODE: {workspace_mode.upper()}\n{mode_prompt}",
    ]
    if tier0:
        context_parts.append("CORE MEMORIES (permanent, user-ratified):\n" +
                            "\n".join(f"- {m['text']}" for m in tier0))
    if tier1_ws:
        context_parts.append("WORKSPACE MEMORIES (this project):\n" +
                            "\n".join(f"- {m['text']}" for m in tier1_ws))
    if tier1_session:
        context_parts.append("SESSION MEMORIES (this session):\n" +
                            "\n".join(f"- {m['text']}" for m in tier1_session))
    if tier3:
        context_parts.append("SOURCE MEMORIES (from dropped artifacts):\n" +
                            "\n".join(f"- {m['text']}" for m in tier3))

    return "\n\n".join(context_parts)


async def propose_inferred_memory(canvas_id: str, text: str, trigger: str, input_modality: str) -> str:
    """
    Inserts a Tier 2 (Inferred) memory with quarantined=TRUE.
    This memory will NEVER appear in LLM context until explicitly ratified by the user.
    """
    sb = get_client()
    mem_id = str(uuid.uuid4())
    sb.table("memories").insert({
        "id": mem_id,
        "tier": 2,
        "scope": "session",
        "text": text,
        "provenance": {"trigger": trigger, "input_modality": input_modality},
        "canvas_id": canvas_id,
        "quarantined": True,    # CRITICAL: must be TRUE
        "archived": False,
        "rejected": False,
    }).execute()
    return mem_id


def ratify_memory(memory_id: str, scope: str) -> dict:
    """
    User accepts a Tier 2 memory.
    Maps scope string to tier integer.
    Sets quarantined=FALSE so the memory is included in future LLM context.
    """
    scope_to_tier = {
        "global": 0,
        "workspace": 1,
        "session": 1,
        "source": 3,
    }
    tier = scope_to_tier.get(scope, 1)
    sb = get_client()
    sb.table("memories").update({
        "tier": tier,
        "scope": scope,
        "quarantined": False,  # Now included in LLM context
    }).eq("id", memory_id).execute()
    return {"tier": tier, "scope": scope}


def evaluate_negotiation_card_trigger(session_events: list[dict]) -> dict | None:
    """
    Uses GPT-4o-mini to evaluate whether the Memory Negotiation Card should appear.
    Returns card content if trigger condition is met, None otherwise.
    Trigger: same preference expressed 2+ times in recent session events.
    """
    if len(session_events) < 2:
        return None

    events_text = "\n".join(
        f"[{e.get('event_type','')}] {e.get('delta',{}).get('text','')}"
        for e in session_events[-10:]  # Last 10 events
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": (
                'Analyze these canvas events. Has the user expressed the same preference or pattern 2+ times? '
                'If yes, output JSON: {"trigger": true, "observation": "I noticed you...", "proposed_text": "..."} '
                'If no, output: {"trigger": false}'
            )},
            {"role": "user", "content": events_text},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    result = json.loads(response.choices[0].message.content)
    if result.get("trigger"):
        return {
            "observation": result.get("observation", "I noticed a pattern in your session"),
            "proposed_text": result.get("proposed_text", ""),
        }
    return None


async def generate_session_audit(canvas_id: str) -> list[dict]:
    """
    At canvas close: GPT-4o-mini analyzes session events and generates inference list.
    Returns list of {text, confidence} for the Session Memory Audit card.
    """
    sb = get_client()
    events = sb.table("events").select("event_type,input_modality,delta,workspace_mode") \
        .eq("canvas_id", canvas_id).order("timestamp").execute().data

    if not events:
        return []

    events_text = "\n".join(
        f"[{e['event_type']}] {json.dumps(e.get('delta',{}))[:100]}"
        for e in events[-20:]
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": (
                'Based on these session events, what did you learn about the user\'s preferences and working style? '
                'Generate 2-4 concise inferences. Output JSON: '
                '{"inferences": [{"text": "User prefers...", "confidence": "low|medium|high"}]}'
            )},
            {"role": "user", "content": events_text},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    result = json.loads(response.choices[0].message.content)
    return result.get("inferences", [])
```

**Task 5.2 — `routers/memory.py`**
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.supabase import get_client
from db.queries import log_event
from services.memory_service import ratify_memory, generate_session_audit
import uuid

router = APIRouter()

@router.get("/canvas/{canvas_id}/memory")
async def get_memories(canvas_id: str, tier: int = None):
    sb = get_client()
    query = sb.table("memories").select("*") \
        .eq("archived", False).eq("rejected", False)
    # Include Tier 2 (quarantined) items for display in Pending tab
    # But they must be excluded from LLM context assembly (done in memory_service.py)
    if tier is not None:
        query = query.eq("tier", tier)
    else:
        # Return Tier 0 (global) + Tier 1/2/3 scoped to this canvas
        # (complex OR — handle with two queries)
        tier0 = sb.table("memories").select("*").eq("tier", 0).eq("archived", False).eq("rejected", False).execute().data
        canvas_memories = sb.table("memories").select("*").eq("canvas_id", canvas_id).eq("archived", False).eq("rejected", False).execute().data
        return tier0 + canvas_memories
    result = query.execute()
    return result.data

class CreateMemoryRequest(BaseModel):
    tier: int
    scope: str
    text: str
    provenance: dict = {}

@router.post("/canvas/{canvas_id}/memory")
async def create_memory(canvas_id: str, req: CreateMemoryRequest):
    sb = get_client()
    mem_id = str(uuid.uuid4())
    sb.table("memories").insert({
        "id": mem_id, "tier": req.tier, "scope": req.scope,
        "text": req.text, "provenance": req.provenance,
        "canvas_id": canvas_id if req.scope != "global" else None,
        "quarantined": req.tier == 2,  # Tier 2 always starts quarantined
    }).execute()
    log_event(canvas_id, "main", "memory_accepted", "user", "text", [])
    return {"id": mem_id}

class UpdateMemoryRequest(BaseModel):
    text: str = None
    scope: str = None

@router.put("/canvas/{canvas_id}/memory/{memory_id}")
async def update_memory(canvas_id: str, memory_id: str, req: UpdateMemoryRequest):
    sb = get_client()
    update = {}
    if req.text: update["text"] = req.text
    if req.scope:
        update["scope"] = req.scope
        update["tier"] = {"global": 0, "workspace": 1, "session": 1}.get(req.scope, 1)
    sb.table("memories").update(update).eq("id", memory_id).execute()
    return {"updated": True}

@router.delete("/canvas/{canvas_id}/memory/{memory_id}")
async def archive_memory(canvas_id: str, memory_id: str):
    """Soft-delete: archived=TRUE. Item remains in DB for audit."""
    sb = get_client()
    sb.table("memories").update({"archived": True}).eq("id", memory_id).execute()
    return {"archived": True}

class RatifyRequest(BaseModel):
    scope: str  # "global" | "workspace" | "session"

@router.post("/canvas/{canvas_id}/memory/{memory_id}/ratify")
async def ratify_memory_endpoint(canvas_id: str, memory_id: str, req: RatifyRequest):
    result = ratify_memory(memory_id, req.scope)
    log_event(canvas_id, "main", "memory_accepted", "user", "text", [])
    return result

class AuditRequest(BaseModel):
    items: list[dict]  # [{memory_id, action: "accept"|"reject"|"edit", text?: str, scope?: str}]

@router.post("/canvas/{canvas_id}/audit")
async def process_session_audit(canvas_id: str, req: AuditRequest):
    sb = get_client()
    for item in req.items:
        if item["action"] == "accept":
            scope = item.get("scope", "session")
            ratify_memory(item["memory_id"], scope)
            log_event(canvas_id, "main", "memory_accepted", "user", "text", [])
        elif item["action"] == "reject":
            # Soft-delete: rejected=TRUE (never in LLM context, but retained for export auditability)
            sb.table("memories").update({"rejected": True, "quarantined": True}) \
                .eq("id", item["memory_id"]).execute()
            log_event(canvas_id, "main", "memory_rejected", "user", "text", [])
        elif item["action"] == "edit":
            sb.table("memories").update({
                "text": item["text"],
                "quarantined": False,
                "tier": {"global": 0, "workspace": 1, "session": 1}.get(item.get("scope","session"), 1),
                "scope": item.get("scope", "session"),
            }).eq("id", item["memory_id"]).execute()
            log_event(canvas_id, "main", "memory_accepted", "user", "text", [])
    return {"processed": len(req.items)}

@router.get("/canvas/{canvas_id}/session-audit")
async def get_session_audit(canvas_id: str):
    """Generates the Session Memory Audit inference list at canvas close."""
    inferences = await generate_session_audit(canvas_id)
    # Create Tier 2 memories for each inference (quarantined)
    sb = get_client()
    audit_items = []
    for inf in inferences:
        mem_id = str(uuid.uuid4())
        sb.table("memories").insert({
            "id": mem_id, "tier": 2, "scope": "session",
            "text": inf["text"], "canvas_id": canvas_id,
            "quarantined": True, "provenance": {"source": "session_audit"},
        }).execute()
        audit_items.append({"memory_id": mem_id, "text": inf["text"], "confidence": inf["confidence"]})
    return {"items": audit_items}

@router.put("/canvas/{canvas_id}/mode")
async def update_workspace_mode(canvas_id: str, mode: str):
    sb = get_client()
    sb.table("canvases").update({"workspace_mode": mode}).eq("id", canvas_id).execute()
    log_event(canvas_id, "main", "mode_changed", "user", "text", [], {"mode": mode})
    return {"mode": mode}
```

---

### FE2: Memory Panel + Cards + Scope Chips + Mode UI

**Task 5.3 — `src/frontend/src/hooks/useMemory.ts`**
```typescript
import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Memory, MemoryScope } from '../types';

export function useMemory(canvasId: string) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Memory[]>(`/api/canvas/${canvasId}/memory`);
      setMemories(data);
    } finally {
      setLoading(false);
    }
  }, [canvasId]);

  const archiveMemory = useCallback(async (memoryId: string) => {
    await api.delete(`/api/canvas/${canvasId}/memory/${memoryId}`);
    setMemories(prev => prev.filter(m => m.id !== memoryId));
  }, [canvasId]);

  const updateMemory = useCallback(async (memoryId: string, text: string) => {
    await api.put(`/api/canvas/${canvasId}/memory/${memoryId}`, { text });
    setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, text } : m));
  }, [canvasId]);

  const ratifyMemory = useCallback(async (memoryId: string, scope: MemoryScope) => {
    await api.post(`/api/canvas/${canvasId}/memory/${memoryId}/ratify`, { scope });
    await loadMemories();
  }, [canvasId, loadMemories]);

  const tier0 = memories.filter(m => m.tier === 0 && !m.quarantined && !m.rejected);
  const tier1 = memories.filter(m => m.tier === 1 && !m.quarantined && !m.rejected);
  const tier2 = memories.filter(m => m.tier === 2 && m.quarantined && !m.rejected);
  const tier3 = memories.filter(m => m.tier === 3 && !m.quarantined && !m.rejected);

  return { memories, loading, loadMemories, archiveMemory, updateMemory, ratifyMemory, tier0, tier1, tier2, tier3 };
}
```

**Task 5.4 — `src/frontend/src/panels/MemoryPanel.tsx`**
```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Memory, MemoryScope } from '../types';
import { useMemory } from '../hooks/useMemory';

type Tab = 'core' | 'session' | 'pending' | 'source';

interface Props {
  open: boolean;
  canvasId: string;
  onClose: () => void;
}

export function MemoryPanel({ open, canvasId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('core');
  const [searchQuery, setSearchQuery] = useState('');
  const { tier0, tier1, tier2, tier3, loadMemories, archiveMemory, updateMemory, ratifyMemory } =
    useMemory(canvasId);

  useEffect(() => { if (open) loadMemories(); }, [open, loadMemories]);

  const tabData: Record<Tab, { label: string; items: Memory[]; count: number }> = {
    core:    { label: 'Core',    items: tier0, count: tier0.length },
    session: { label: 'Session', items: [...tier1], count: tier1.length },
    pending: { label: 'Pending', items: tier2, count: tier2.length },
    source:  { label: 'Source',  items: tier3, count: tier3.length },
  };

  const filtered = tabData[activeTab].items.filter(m =>
    searchQuery === '' || m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute left-0 top-0 bottom-0 w-72 bg-[#1a1a1a] border-r border-[#2b2b2b] z-30 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2b2b]">
            <span className="text-[13px] font-medium text-[#f9f9f9]">Memory</span>
            <button onClick={onClose} className="material-symbols-outlined text-[18px] text-[#9c9c9c] hover:text-[#f9f9f9]">close</button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-[#2b2b2b]">
            <div className="flex items-center gap-2 bg-[#111111] border border-[#565656] rounded-[4px] px-2 py-1.5">
              <span className="material-symbols-outlined text-[14px] text-[#565656]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="flex-1 bg-transparent text-[12px] text-[#f9f9f9] placeholder-[#565656] outline-none"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2b2b2b]">
            {(Object.keys(tabData) as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[10px] font-medium uppercase tracking-[0.04em] transition-colors ${
                  activeTab === tab
                    ? 'text-[#e5ff5d] border-b-2 border-[#e5ff5d]'
                    : 'text-[#565656] hover:text-[#9c9c9c]'
                }`}
              >
                {tabData[tab].label}
                {tabData[tab].count > 0 && (
                  <span className="ml-1 text-[9px]">({tabData[tab].count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Pending tab banner */}
          {activeTab === 'pending' && tier2.length > 0 && (
            <div className="mx-3 mt-2 p-2 bg-[#2b1a00] border border-[#f5c842] rounded-[4px]">
              <p className="text-[11px] text-[#f5c842] leading-[1.4]">
                These have not influenced any response yet. Review before accepting.
              </p>
            </div>
          )}

          {/* Empty states */}
          {filtered.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <span className="material-symbols-outlined text-[28px] text-[#565656] block mb-2">
                  {activeTab === 'pending' ? 'pending_actions' : 'memory'}
                </span>
                <p className="text-[11px] text-[#565656]">
                  {activeTab === 'pending'
                    ? 'No pending memories.\nKleos will ask before storing anything.'
                    : 'No memories stored yet.\nKleos will only remember what you approve.'}
                </p>
              </div>
            </div>
          )}

          {/* Memory list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(memory => (
              <MemoryItem
                key={memory.id}
                memory={memory}
                showRatify={activeTab === 'pending'}
                onArchive={() => archiveMemory(memory.id)}
                onUpdate={(text) => updateMemory(memory.id, text)}
                onRatify={(scope) => ratifyMemory(memory.id, scope)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MemoryItem({ memory, showRatify, onArchive, onUpdate, onRatify }: {
  memory: Memory;
  showRatify: boolean;
  onArchive: () => void;
  onUpdate: (text: string) => void;
  onRatify: (scope: MemoryScope) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(memory.text);

  const tierColors = { 0: '#4caf7d', 1: '#4a90d9', 2: '#f5c842', 3: '#9c9c9c' };
  const tierLabels = { 0: 'Core', 1: 'Session', 2: 'Pending', 3: 'Source' };

  return (
    <div className="px-3 py-2.5 border-b border-[#2b2b2b] hover:bg-[#222222] transition-colors">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[9px] font-medium uppercase tracking-[0.04em]"
              style={{ color: tierColors[memory.tier as 0|1|2|3] }}>
          {tierLabels[memory.tier as 0|1|2|3]}
        </span>
        <span className="text-[9px] text-[#565656]">
          {new Date(memory.created_at).toLocaleDateString()}
        </span>
      </div>

      {editing ? (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full bg-[#111111] border border-[#e5ff5d] rounded-[4px] text-[11px] text-[#f9f9f9] p-1.5 resize-none"
            rows={2}
          />
          <div className="flex gap-2 mt-1">
            <button onClick={() => { onUpdate(text); setEditing(false); }}
                    className="text-[10px] px-2 py-0.5 bg-[#e5ff5d] text-[#111111] rounded-[4px] font-medium">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-[10px] text-[#9c9c9c]">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-[#f9f9f9] leading-[1.4] mb-2">{memory.text}</p>
      )}

      {/* Ratify buttons for Pending tab */}
      {showRatify && !editing && (
        <div className="flex gap-1 flex-wrap mb-1">
          {(['global', 'workspace', 'session'] as MemoryScope[]).map(scope => (
            <button key={scope} onClick={() => onRatify(scope)}
                    className="px-1.5 py-0.5 text-[9px] font-medium bg-[#2b2b2b] border border-[#4caf7d] text-[#4caf7d] rounded-[4px] hover:bg-[#1a3a1a] transition-colors capitalize">
              {scope === 'global' ? 'Remember Always' : scope === 'workspace' ? 'This Project' : 'This Session'}
            </button>
          ))}
          <button onClick={onArchive}
                  className="px-1.5 py-0.5 text-[9px] font-medium border border-[#e84040] text-[#e84040] rounded-[4px] hover:bg-[#3a1a1a] transition-colors">
            Reject
          </button>
        </div>
      )}

      {/* Standard actions */}
      {!editing && !showRatify && (
        <div className="flex gap-1">
          {[
            { icon: 'edit', label: 'Edit', action: () => setEditing(true) },
            { icon: 'archive', label: 'Archive', action: onArchive },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] text-[#9c9c9c] border border-[#565656] rounded-[4px] hover:border-[#9c9c9c] transition-colors">
              <span className="material-symbols-outlined text-[10px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Task 5.5 — `src/frontend/src/cards/MemoryNegotiationCard.tsx`**
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryScope } from '../types';

interface Props {
  open: boolean;
  observation: string;
  onChoice: (scope: MemoryScope | 'none' | 'later') => void;
}

export function MemoryNegotiationCard({ open, observation, onChoice }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="absolute bottom-16 right-4 w-72 bg-[#1a1a1a] border border-[#f5c842] rounded-[12px] p-4 z-40 shadow-lg"
        >
          {/* AI observation */}
          <div className="flex gap-2 mb-3">
            <span className="material-symbols-outlined text-[16px] text-[#f5c842] shrink-0 mt-0.5">psychology</span>
            <p className="text-[12px] text-[#f9f9f9] leading-[1.5]">{observation}</p>
          </div>

          {/* 4 scope options in 2×2 grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Remember Always',   scope: 'global' as MemoryScope,  color: '#4caf7d', icon: 'all_inclusive' },
              { label: 'This Project Only', scope: 'workspace' as MemoryScope, color: '#4a90d9', icon: 'folder_special' },
              { label: "Don't Remember",    scope: 'none',                    color: '#e84040', icon: 'block' },
              { label: 'Not Now',           scope: 'later',                   color: '#9c9c9c', icon: 'schedule' },
            ].map(({ label, scope, color, icon }) => (
              <button
                key={label}
                onClick={() => onChoice(scope as MemoryScope | 'none' | 'later')}
                className="flex items-center gap-1.5 px-2 py-2 rounded-[4px] border text-left transition-colors hover:opacity-90"
                style={{ borderColor: `${color}40`, background: `${color}0d`, color }}
              >
                <span className="material-symbols-outlined text-[13px]">{icon}</span>
                <span className="text-[10px] font-medium leading-[1.3]">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => onChoice('later')}
            className="mt-2 w-full text-[10px] text-[#565656] hover:text-[#9c9c9c] transition-colors"
          >
            Dismiss (Esc)
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Task 5.6 — `src/frontend/src/cards/SessionMemoryAuditCard.tsx`**
```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

interface AuditItem {
  memory_id: string;
  text: string;
  confidence: 'low' | 'medium' | 'high';
}

interface Props {
  canvasId: string;
  items: AuditItem[];
  onComplete: () => void;
}

export function SessionMemoryAuditCard({ canvasId, items, onComplete }: Props) {
  const [decisions, setDecisions] = useState<Record<string, { action: string; text?: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const setDecision = (id: string, action: string, text?: string) =>
    setDecisions(prev => ({ ...prev, [id]: { action, text } }));

  const submit = async (submitAll: boolean) => {
    if (submitAll) {
      items.forEach(item => {
        if (!decisions[item.memory_id]) setDecision(item.memory_id, 'accept');
      });
    }
    const payload = items.map(item => ({
      memory_id: item.memory_id,
      action: decisions[item.memory_id]?.action ?? 'reject',
      text: decisions[item.memory_id]?.text,
      scope: 'session',
    }));
    await api.post(`/api/canvas/${canvasId}/audit`, { items: payload });
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-[#111111]/90 flex items-center justify-center z-50 p-6"
    >
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2b2b2b] rounded-[12px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b2b2b]">
          <p className="text-[16px] font-medium text-[#f9f9f9]">
            This session taught me {items.length} new {items.length === 1 ? 'thing' : 'things'} about you.
          </p>
          <p className="text-[12px] text-[#9c9c9c] mt-1">
            Accept what you'd like me to remember. Rejected items are gone forever.
          </p>
        </div>

        {/* Items */}
        <div className="divide-y divide-[#2b2b2b] max-h-64 overflow-y-auto">
          {items.map((item, i) => {
            const d = decisions[item.memory_id];
            return (
              <div key={item.memory_id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-[#9c9c9c] mr-1">{i + 1}.</span>
                    {editingId === item.memory_id ? (
                      <input
                        defaultValue={item.text}
                        onBlur={e => { setDecision(item.memory_id, 'edit', e.target.value); setEditingId(null); }}
                        className="w-full bg-[#111111] border border-[#e5ff5d] rounded-[4px] text-[12px] text-[#f9f9f9] px-2 py-1 mt-1"
                        autoFocus
                      />
                    ) : (
                      <span className="text-[12px] text-[#f9f9f9]">{d?.text ?? item.text}</span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setDecision(item.memory_id, 'accept')}
                            className={`px-2 py-1 text-[10px] rounded-[4px] border transition-colors ${d?.action==='accept' ? 'bg-[#4caf7d] border-[#4caf7d] text-[#111111]' : 'border-[#4caf7d] text-[#4caf7d] hover:bg-[#1a3a1a]'}`}>
                      Accept
                    </button>
                    <button onClick={() => setEditingId(item.memory_id)}
                            className={`px-2 py-1 text-[10px] rounded-[4px] border transition-colors ${d?.action==='edit' ? 'bg-[#f5c842] border-[#f5c842] text-[#111111]' : 'border-[#f5c842] text-[#f5c842] hover:bg-[#2a2000]'}`}>
                      Edit
                    </button>
                    <button onClick={() => setDecision(item.memory_id, 'reject')}
                            className={`px-2 py-1 text-[10px] rounded-[4px] border transition-colors ${d?.action==='reject' ? 'bg-[#e84040] border-[#e84040] text-white' : 'border-[#e84040] text-[#e84040] hover:bg-[#3a1a1a]'}`}>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-[#2b2b2b] flex justify-between">
          <button onClick={() => submit(false)}
                  className="text-[11px] text-[#9c9c9c] hover:text-[#f9f9f9] transition-colors">
            Skip (reject all)
          </button>
          <div className="flex gap-2">
            <button onClick={() => submit(true)}
                    className="px-3 py-1.5 bg-[#e5ff5d] text-[#111111] text-[12px] font-medium rounded-[4px]">
              Accept All
            </button>
            <button onClick={() => submit(false)}
                    className="px-3 py-1.5 border border-[#565656] text-[#f9f9f9] text-[12px] rounded-[4px] hover:border-[#9c9c9c] transition-colors">
              Apply Choices
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

**Task 5.7 — `src/frontend/src/components/ScopeChip.tsx`**
```tsx
import { motion } from 'framer-motion';
import type { MemoryScope } from '../types';

const SCOPE_ORDER: MemoryScope[] = ['session', 'workspace', 'global'];
const SCOPE_CONFIG: Record<MemoryScope, { label: string; color: string; next: string }> = {
  session:   { label: 'Session',   color: '#4a90d9', next: 'Click for Workspace scope' },
  workspace: { label: 'Workspace', color: '#9c4af5', next: 'Click for Global scope' },
  global:    { label: 'Global',    color: '#4caf7d', next: 'Click for Session scope' },
  source:    { label: 'Source',    color: '#9c9c9c', next: '' },
};

interface Props {
  scope: MemoryScope;
  nodeId: string;
  onScopeChange?: (nodeId: string, newScope: MemoryScope) => void;
  className?: string;
}

export function ScopeChip({ scope, nodeId, onScopeChange, className = '' }: Props) {
  const config = SCOPE_CONFIG[scope];

  const handleClick = () => {
    if (!onScopeChange) return;
    const currentIdx = SCOPE_ORDER.indexOf(scope);
    const next = SCOPE_ORDER[(currentIdx + 1) % SCOPE_ORDER.length];
    onScopeChange(nodeId, next);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={!onScopeChange || scope === 'source'}
      title={config.next}
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-colors cursor-pointer disabled:cursor-default ${className}`}
      style={{
        background: `${config.color}18`,
        border: `1px solid ${config.color}60`,
        color: config.color,
      }}
    >
      [{config.label}]
    </motion.button>
  );
}
```

**Task 5.8 — `src/frontend/src/onboarding/ModeSelector.tsx`**
```tsx
import { motion } from 'framer-motion';
import type { WorkspaceMode } from '../types';

const MODES: Array<{ mode: WorkspaceMode; label: string; description: string; icon: string; color: string }> = [
  { mode: 'analytical', label: 'Analytical', description: 'Evidence-first. Every claim requires a source.', icon: 'analytics', color: '#4a90d9' },
  { mode: 'creative',   label: 'Creative',   description: 'Embrace possibility. Ideas flow freely.',        icon: 'lightbulb',  color: '#9c4af5' },
  { mode: 'critical',   label: 'Critical',   description: 'Challenge everything. The AI argues back.',      icon: 'gavel',      color: '#e84040' },
  { mode: 'strategic',  label: 'Strategic',  description: 'Synthesize and converge. Decisions first.',      icon: 'route',      color: '#4caf7d' },
];

interface Props {
  onSelect: (mode: WorkspaceMode) => void;
}

export function ModeSelector({ onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#111111] flex flex-col items-center justify-center z-50 p-8"
    >
      <p className="text-[12px] text-[#9c9c9c] uppercase tracking-[0.08em] mb-4">What kind of thinking are you doing today?</p>
      <h1 className="text-[48px] font-normal text-[#f9f9f9] tracking-[-0.02em] uppercase mb-12 leading-[1.1] text-center">
        Choose your<br />reasoning mode
      </h1>

      <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
        {MODES.map(({ mode, label, description, icon, color }) => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(mode)}
            className="p-5 bg-[#1a1a1a] border border-[#2b2b2b] rounded-[12px] text-left hover:border-opacity-80 transition-colors group"
            style={{ '--mode-color': color } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color }}>{icon}</span>
              <span className="text-[16px] font-medium text-[#f9f9f9]">{label}</span>
            </div>
            <p className="text-[13px] text-[#9c9c9c] leading-[1.4]">{description}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
```

---

## Validation Strategy

1. `GET /api/canvas/{id}/memory` → returns memories grouped correctly (none quarantined/rejected mixed in with live memories)
2. `POST /api/canvas/{id}/memory` with `tier=2` → verify `quarantined=TRUE` in Supabase
3. Trigger an LLM call with a Tier 2 memory pending → verify the AI response does NOT reference it
4. `POST /api/canvas/{id}/memory/{id}/ratify` with `scope=global` → verify `quarantined=FALSE`, `tier=0`, `scope='global'`
5. `POST /api/canvas/{id}/audit` with `action=reject` → verify `rejected=TRUE` in DB, item invisible in panel
6. Memory Panel opens with correct 4 tabs; Pending tab shows banner
7. Mode Selector appears on first load; selecting Analytical stores mode on canvas row
8. Memory Negotiation Card appears after simulating 2 identical session events

---

## Acceptance Criteria

- [ ] `GET /api/canvas/{id}/memory` returns all non-archived, non-rejected memories (Tier 2 quarantined items appear in Pending tab but NOT in LLM context)
- [ ] Tier 2 memory with `quarantined=TRUE` is excluded from `assemble_context()` output (verified by checking the context string)
- [ ] Ratifying a Tier 2 memory sets `quarantined=FALSE` and correct tier/scope in DB
- [ ] Rejecting a memory in Session Audit sets `rejected=TRUE` (soft-delete — item persists in DB for export)
- [ ] Memory Panel opens left side, shows 4 tabs, search works
- [ ] Pending tab shows amber banner "These have not influenced any response yet"
- [ ] Empty state shown when no memories of a given type
- [ ] Memory Negotiation Card shows observation text + 4 scope option buttons
- [ ] Session Memory Audit card shows per-item Accept/Reject/Edit controls
- [ ] Mode Selector appears on first load; does not reappear after selection
- [ ] Active workspace mode visible in canvas header
- [ ] `PUT /api/canvas/{id}/mode` updates mode and logs `mode_changed` event

---

## Risks and Trade-offs

| Risk | Probability | Mitigation |
|---|---|---|
| Negotiation Card trigger fires too often | Medium | Start with `similarity_threshold=0.9` in GPT-4o-mini prompt; tune down if needed |
| Tier 2 quarantine bypassed by a future developer | Low | Architecture comment in `assemble_context`: "DO NOT query Tier 2 here — this is the PS06 commitment" |
| Session Audit generates 0 inferences | Low | Min event count check in `generate_session_audit()`; return empty list without error |

---

## Deliverables

- `src/backend/services/memory_service.py` — assemble_context, propose, ratify, trigger, audit
- `src/backend/routers/memory.py` — all memory CRUD + ratify + audit endpoints
- `src/frontend/src/hooks/useMemory.ts`
- `src/frontend/src/panels/MemoryPanel.tsx` — 4-tab left slide-out
- `src/frontend/src/cards/MemoryNegotiationCard.tsx`
- `src/frontend/src/cards/SessionMemoryAuditCard.tsx`
- `src/frontend/src/components/ScopeChip.tsx`
- `src/frontend/src/onboarding/ModeSelector.tsx`

---

## Documentation Updates

- `project-context/progress.md` — Mark "Hours 14–18: Memory System" complete
- `project-context/tasks.md` — Mark all Hours 14–18 tasks [x]

---

## Dependencies

- Phase 1: `memories` table with `scope`, `quarantined`, `rejected` columns
- Phase 2: Canvas nodes exist in DB (Session Audit references events)
- Phase 3: SSE channel exists (Negotiation Card trigger can be pushed via SSE)
