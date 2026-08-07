import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db.supabase import get_client
from db.queries import log_event
from services.memory_service import (
    ratify_memory,
    generate_session_audit,
    compute_freshness,
)
from deps import verify_canvas_ownership

router = APIRouter()


# ---------------------------------------------------------------------------
# Memory CRUD
# ---------------------------------------------------------------------------

@router.get("/canvas/{canvas_id}/memory")
async def get_memories(canvas_id: str, user: dict = Depends(verify_canvas_ownership)):
    """
    Returns all non-archived, non-rejected memories for this canvas.
    Includes Tier 2 quarantined items (for display in Pending tab) but
    they are NEVER included in LLM context assembly (enforced in memory_service.py).
    """
    sb = get_client()
    # Tier 0: global (no canvas_id)
    tier0 = (
        sb.table("memories")
        .select("*")
        .eq("tier", 0)
        .eq("archived", False)
        .eq("rejected", False)
        .execute().data
    )
    # Tier 1, 2, 3: canvas-scoped
    canvas_mems = (
        sb.table("memories")
        .select("*")
        .eq("canvas_id", canvas_id)
        .eq("archived", False)
        .eq("rejected", False)
        .execute().data
    )

    # Compute freshness
    nodes = sb.table("nodes").select("id,text").eq("canvas_id", canvas_id).execute().data
    all_mems = tier0 + canvas_mems
    freshness = compute_freshness(all_mems, nodes)

    for m in all_mems:
        m["freshness"] = freshness.get(m["id"], {"age_label": "", "stale": False})

    return all_mems


class CreateMemoryRequest(BaseModel):
    tier: int
    scope: str
    text: str
    provenance: dict = {}


@router.post("/canvas/{canvas_id}/memory")
async def create_memory(canvas_id: str, req: CreateMemoryRequest, user: dict = Depends(verify_canvas_ownership)):
    sb = get_client()
    mem_id = str(uuid.uuid4())
    sb.table("memories").insert({
        "id":          mem_id,
        "tier":        req.tier,
        "scope":       req.scope,
        "text":        req.text,
        "provenance":  req.provenance,
        "canvas_id":   canvas_id if req.scope != "global" else None,
        "quarantined": req.tier == 2,
    }).execute()
    log_event(canvas_id, "main", "memory_accepted", "user", "text", [])
    return {"id": mem_id}


class UpdateMemoryRequest(BaseModel):
    text: str | None = None
    scope: str | None = None


@router.put("/canvas/{canvas_id}/memory/{memory_id}")
async def update_memory(canvas_id: str, memory_id: str, req: UpdateMemoryRequest, user: dict = Depends(verify_canvas_ownership)):
    sb = get_client()
    update: dict = {}
    if req.text is not None:
        update["text"] = req.text
    if req.scope is not None:
        update["scope"] = req.scope
        update["tier"]  = {"global": 0, "workspace": 1, "session": 1}.get(req.scope, 1)
    if update:
        sb.table("memories").update(update).eq("id", memory_id).execute()
    return {"updated": True}


@router.delete("/canvas/{canvas_id}/memory/{memory_id}")
async def archive_memory(canvas_id: str, memory_id: str, user: dict = Depends(verify_canvas_ownership)):
    """Soft-delete: archived=TRUE. Item remains in DB for audit trail."""
    sb = get_client()
    sb.table("memories").update({"archived": True}).eq("id", memory_id).execute()
    return {"archived": True}


@router.post("/canvas/{canvas_id}/memory/{memory_id}/reject")
async def reject_memory_endpoint(canvas_id: str, memory_id: str, user: dict = Depends(verify_canvas_ownership)):
    """Soft-delete: rejected=TRUE, quarantined=TRUE. Excluded from LLM context forever."""
    sb = get_client()
    sb.table("memories").update({"rejected": True, "quarantined": True}).eq("id", memory_id).execute()
    log_event(canvas_id, "main", "memory_rejected", "user", "text", [])
    return {"rejected": True}


# ---------------------------------------------------------------------------
# Ratify (accept Tier 2 memory)
# ---------------------------------------------------------------------------

class RatifyRequest(BaseModel):
    scope: str   # "global" | "workspace" | "session"


@router.post("/canvas/{canvas_id}/memory/{memory_id}/ratify")
async def ratify_memory_endpoint(canvas_id: str, memory_id: str, req: RatifyRequest, user: dict = Depends(verify_canvas_ownership)):
    result = ratify_memory(memory_id, req.scope)
    log_event(canvas_id, "main", "memory_accepted", "user", "text", [])
    return result


# ---------------------------------------------------------------------------
# Session Memory Audit
# ---------------------------------------------------------------------------

@router.get("/canvas/{canvas_id}/session-audit")
async def get_session_audit(canvas_id: str, user: dict = Depends(verify_canvas_ownership)):
    """
    Generates the Session Memory Audit inference list at canvas close.
    Creates Tier 2 quarantined entries for each inference.
    """
    sb = get_client()
    inferences = await generate_session_audit(canvas_id)

    audit_items = []
    for inf in inferences:
        mem_id = str(uuid.uuid4())
        sb.table("memories").insert({
            "id":          mem_id,
            "tier":        2,
            "scope":       "session",
            "text":        inf["text"],
            "canvas_id":   canvas_id,
            "quarantined": True,
            "provenance":  {"source": "session_audit"},
        }).execute()
        audit_items.append({
            "memory_id":  mem_id,
            "text":       inf["text"],
            "confidence": inf.get("confidence", "medium"),
        })
    return {"items": audit_items}


class AuditActionItem(BaseModel):
    memory_id: str
    action: str          # "accept" | "reject" | "edit"
    text: str | None = None
    scope: str | None = None


class ProcessAuditRequest(BaseModel):
    items: list[AuditActionItem]


@router.post("/canvas/{canvas_id}/audit")
async def process_session_audit(canvas_id: str, req: ProcessAuditRequest, user: dict = Depends(verify_canvas_ownership)):
    sb = get_client()
    for item in req.items:
        if item.action == "accept":
            scope = item.scope or "session"
            ratify_memory(item.memory_id, scope)
            log_event(canvas_id, "main", "memory_accepted", "user", "text", [])

        elif item.action == "reject":
            # Soft-delete: rejected=TRUE — excluded from LLM forever, kept for export auditability
            sb.table("memories").update({
                "rejected":    True,
                "quarantined": True,
            }).eq("id", item.memory_id).execute()
            log_event(canvas_id, "main", "memory_rejected", "user", "text", [])

        elif item.action == "edit":
            scope = item.scope or "session"
            sb.table("memories").update({
                "text":        item.text,
                "quarantined": False,
                "tier":        {"global": 0, "workspace": 1, "session": 1}.get(scope, 1),
                "scope":       scope,
            }).eq("id", item.memory_id).execute()
            log_event(canvas_id, "main", "memory_accepted", "user", "text", [])

    return {"processed": len(req.items)}
