import uuid
import io
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import Response as HttpResponse
from pydantic import BaseModel
from db.supabase import get_client
from db.queries import log_event
from services import llm_service, canvas_service
from services import export_service
from deps import get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _verify_canvas_owner(sb, canvas_id: str, user: dict) -> dict:
    """Returns canvas row if user owns it, raises 403/404 otherwise."""
    canvas = sb.table("canvases").select("*").eq("id", canvas_id).single().execute()
    if not canvas.data:
        raise HTTPException(404, "Canvas not found")
    if canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized")
    return canvas.data


def _get_active_branch_id(sb, canvas_id: str) -> str:
    branch = (
        sb.table("branches").select("id")
        .eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
    )
    return branch.data[0]["id"] if branch.data else "main"


# ---------------------------------------------------------------------------
# Canvas CRUD
# ---------------------------------------------------------------------------

class CreateCanvasRequest(BaseModel):
    workspace_mode: str = "analytical"
    title: str | None = None


@router.post("/canvas")
async def create_canvas(req: CreateCanvasRequest, user: dict = Depends(get_current_user)):
    valid_modes = {"analytical", "creative", "critical", "strategic"}
    if req.workspace_mode not in valid_modes:
        raise HTTPException(422, f"Invalid workspace_mode")
    sb = get_client()
    canvas_id = str(uuid.uuid4())
    branch_id = str(uuid.uuid4())
    sb.table("canvases").insert({
        "id": canvas_id,
        "workspace_mode": req.workspace_mode,
        "user_id": user["id"],
        "title": req.title,
    }).execute()
    sb.table("branches").insert({
        "id": branch_id,
        "canvas_id": canvas_id,
        "name": "main",
    }).execute()
    return {"id": canvas_id, "branch_id": branch_id}


class UpdateCanvasTitleRequest(BaseModel):
    title: str


@router.patch("/canvas/{canvas_id}/title")
async def update_canvas_title(
    canvas_id: str,
    req: UpdateCanvasTitleRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    title = req.title.strip()
    if not title:
        raise HTTPException(422, "Title cannot be empty")
    sb.table("canvases").update({"title": title}).eq("id", canvas_id).execute()
    return {"title": title}


@router.delete("/canvas/{canvas_id}")
async def delete_canvas(canvas_id: str, user: dict = Depends(get_current_user)):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    # CASCADE deletes branches, nodes, edges, events, artifacts
    sb.table("canvases").delete().eq("id", canvas_id).execute()
    return {"deleted": True}


@router.get("/canvases")
async def list_canvases(user: dict = Depends(get_current_user)):
    sb = get_client()
    res = (
        sb.table("canvases")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return {"canvases": res.data}


@router.get("/canvas/{canvas_id}")
async def get_canvas(
    canvas_id: str,
    branch_id: str = "",
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas_row = _verify_canvas_owner(sb, canvas_id, user)

    nodes_query = sb.table("nodes").select("*").eq("canvas_id", canvas_id)
    if branch_id:
        nodes_query = nodes_query.eq("branch_id", branch_id)
    nodes = nodes_query.execute()

    edges_query = sb.table("edges").select("*").eq("canvas_id", canvas_id)
    if branch_id:
        edges_query = edges_query.eq("branch_id", branch_id)
    edges = edges_query.execute()

    branches = sb.table("branches").select("*").eq("canvas_id", canvas_id).execute()

    return {
        "canvas":   canvas_row,
        "nodes":    nodes.data,
        "edges":    edges.data,
        "branches": branches.data,
    }


# ---------------------------------------------------------------------------
# Workspace mode
# ---------------------------------------------------------------------------

class UpdateModeRequest(BaseModel):
    mode: str


@router.put("/canvas/{canvas_id}/mode")
async def update_workspace_mode(
    canvas_id: str,
    req: UpdateModeRequest,
    user: dict = Depends(get_current_user)
):
    valid_modes = {"analytical", "creative", "critical", "strategic"}
    if req.mode not in valid_modes:
        raise HTTPException(422, f"Invalid mode. Must be one of: {valid_modes}")
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    sb.table("canvases").update({"workspace_mode": req.mode}).eq("id", canvas_id).execute()
    branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).limit(1).execute()
    branch_id = branch.data[0]["id"] if branch.data else ""
    log_event(canvas_id, branch_id, "mode_changed", "user", "text", [], {"mode": req.mode}, req.mode)
    return {"mode": req.mode}


# ---------------------------------------------------------------------------
# Incognito
# ---------------------------------------------------------------------------

class SetIncognitoRequest(BaseModel):
    enabled: bool


@router.put("/canvas/{canvas_id}/incognito")
async def set_incognito(
    canvas_id: str,
    req: SetIncognitoRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    sb.table("canvases").update({"incognito_mode": req.enabled}).eq("id", canvas_id).execute()
    return {"incognito_mode": req.enabled}


# ---------------------------------------------------------------------------
# Node CRUD
# ---------------------------------------------------------------------------

class CreateNodeRequest(BaseModel):
    type: str
    text: str
    branch_id: str
    position: dict  # {"x": float, "y": float}


@router.post("/canvas/{canvas_id}/node")
async def create_node(
    canvas_id: str,
    req: CreateNodeRequest,
    user: dict = Depends(get_current_user)
):
    valid_types = {"idea", "evidence", "assumption", "question", "constraint", "insight", "decision", "source"}
    if req.type not in valid_types:
        raise HTTPException(422, f"Invalid node type")
    if not req.text.strip():
        raise HTTPException(422, "Text cannot be empty")
    sb = get_client()
    canvas_row = _verify_canvas_owner(sb, canvas_id, user)
    node_id = str(uuid.uuid4())
    sb.table("nodes").insert({
        "id":                         node_id,
        "canvas_id":                  canvas_id,
        "branch_id":                  req.branch_id,
        "type":                       req.type,
        "text":                       req.text.strip(),
        "confidence":                 "high",
        "provenance_type":            "user_created",
        "provenance_detail":          {},
        "impact_nodes":               [],
        "position":                   req.position,
        "pinned":                     False,
        "created_by":                 "user",
        "input_modality":             "text",
        "workspace_mode_at_creation": canvas_row.get("workspace_mode", "analytical"),
    }).execute()
    log_event(canvas_id, req.branch_id, "node_created", "user", "text", [node_id])
    return {"id": node_id}


class UpdateNodeTextRequest(BaseModel):
    text: str


@router.patch("/canvas/{canvas_id}/node/{node_id}/text")
async def update_node_text(
    canvas_id: str,
    node_id: str,
    req: UpdateNodeTextRequest,
    user: dict = Depends(get_current_user)
):
    text = req.text.strip()
    if not text:
        raise HTTPException(422, "Text cannot be empty")
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    sb.table("nodes").update({"text": text}).eq("id", node_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "node_text_updated", "user", "text", [node_id], {"text": text})
    return {"updated": True, "text": text}


class UpdateNodePositionRequest(BaseModel):
    x: float
    y: float


@router.patch("/canvas/{canvas_id}/node/{node_id}/position")
async def update_node_position(
    canvas_id: str,
    node_id: str,
    req: UpdateNodePositionRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    sb.table("nodes").update({"position": {"x": req.x, "y": req.y}}).eq("id", node_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "node_position_updated", "user", "text", [node_id])
    return {"updated": True}


class PinNodeRequest(BaseModel):
    pinned: bool


@router.patch("/canvas/{canvas_id}/node/{node_id}/pin")
async def pin_node(
    canvas_id: str,
    node_id: str,
    req: PinNodeRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    sb.table("nodes").update({"pinned": req.pinned}).eq("id", node_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "node_pinned", "user", "text", [node_id], {"pinned": req.pinned})
    return {"pinned": req.pinned}


@router.delete("/canvas/{canvas_id}/node/{node_id}")
async def delete_node(
    canvas_id: str,
    node_id: str,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    sb.table("nodes").delete().eq("id", node_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "node_deleted", "user", "text", [node_id])
    return {"deleted": True}


# Scope update (used by ScopeChip)
class UpdateScopeRequest(BaseModel):
    scope: str


@router.put("/canvas/{canvas_id}/node/{node_id}/scope")
async def update_node_scope(
    canvas_id: str,
    node_id: str,
    req: UpdateScopeRequest,
    user: dict = Depends(get_current_user)
):
    valid_scopes = {"session", "workspace", "global", "source"}
    if req.scope not in valid_scopes:
        raise HTTPException(422, f"Invalid scope")
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    sb.table("nodes").update({"memory_scope": req.scope}).eq("id", node_id).eq("canvas_id", canvas_id).execute()
    return {"scope": req.scope}


# ---------------------------------------------------------------------------
# Edge CRUD
# ---------------------------------------------------------------------------

class CreateEdgeRequest(BaseModel):
    source_id: str
    target_id: str
    type: str
    confidence: str = "medium"
    label: str | None = None
    branch_id: str


@router.post("/canvas/{canvas_id}/edge")
async def create_edge(
    canvas_id: str,
    req: CreateEdgeRequest,
    user: dict = Depends(get_current_user)
):
    valid_types = {"supports", "contradicts", "depends_on", "derived_from"}
    valid_confidence = {"low", "medium", "high"}
    if req.type not in valid_types:
        raise HTTPException(422, f"Invalid edge type. Must be one of: {valid_types}")
    if req.confidence not in valid_confidence:
        raise HTTPException(422, f"Invalid confidence. Must be one of: {valid_confidence}")
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    edge_id = str(uuid.uuid4())
    sb.table("edges").insert({
        "id":         edge_id,
        "canvas_id":  canvas_id,
        "branch_id":  req.branch_id,
        "source_id":  req.source_id,
        "target_id":  req.target_id,
        "type":       req.type,
        "confidence": req.confidence,
        "label":      req.label,
        "created_by": "user",
    }).execute()
    log_event(canvas_id, req.branch_id, "edge_created", "user", "text", [req.source_id, req.target_id])
    return {"id": edge_id, "type": req.type, "confidence": req.confidence}


@router.delete("/canvas/{canvas_id}/edge/{edge_id}")
async def delete_edge(
    canvas_id: str,
    edge_id: str,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    sb.table("edges").delete().eq("id", edge_id).eq("canvas_id", canvas_id).execute()
    log_event(canvas_id, "", "edge_deleted", "user", "text", [edge_id])
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Assumptions
# ---------------------------------------------------------------------------

@router.get("/canvas/{canvas_id}/assumptions")
async def get_assumptions(
    canvas_id: str,
    branch_id: str = "",
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    bid = branch_id or _get_active_branch_id(sb, canvas_id)
    nodes = (
        sb.table("nodes")
        .select("id, text, confidence, provenance_type, impact_nodes")
        .eq("canvas_id", canvas_id)
        .eq("branch_id", bid)
        .eq("type", "assumption")
        .execute().data
    )
    assumptions = [
        {
            "node_id":         n["id"],
            "statement":       n["text"],
            "confidence":      n["confidence"],
            "provenance_type": n["provenance_type"],
            "impact_nodes":    n.get("impact_nodes") or [],
        }
        for n in nodes
    ]
    return {"assumptions": assumptions}


# ---------------------------------------------------------------------------
# Activity log
# ---------------------------------------------------------------------------

@router.get("/canvas/{canvas_id}/activity")
async def get_activity(
    canvas_id: str,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    events = (
        sb.table("events")
        .select("event_id, timestamp, event_type, author, input_modality, workspace_mode, affected_node_ids")
        .eq("canvas_id", canvas_id)
        .order("timestamp", desc=True)
        .limit(min(limit, 200))
        .execute().data
    )
    return {"events": events}


# ---------------------------------------------------------------------------
# Node Merge
# ---------------------------------------------------------------------------

class MergeNodesRequest(BaseModel):
    node_ids: list[str]
    branch_id: str


@router.post("/canvas/{canvas_id}/merge")
async def merge_nodes(
    canvas_id: str,
    req: MergeNodesRequest,
    user: dict = Depends(get_current_user)
):
    if len(req.node_ids) < 2:
        raise HTTPException(422, "Must select at least 2 nodes to merge")
    sb = get_client()
    canvas_row = _verify_canvas_owner(sb, canvas_id, user)
    nodes = (
        sb.table("nodes").select("id, text, type, position")
        .in_("id", req.node_ids).eq("canvas_id", canvas_id).execute().data
    )
    if not nodes:
        raise HTTPException(404, "None of the specified nodes found")

    workspace_mode = canvas_row.get("workspace_mode", "analytical")
    combined_text = "\n".join(f"[{n['type']}] {n['text']}" for n in nodes)
    synthesis_prompt = f"Synthesize these nodes into one concise insight:\n\n{combined_text}"
    compilation = llm_service.compile_document(synthesis_prompt, workspace_mode)

    # Centroid position
    positions = [n.get("position") or {"x": 0, "y": 0} for n in nodes]
    centroid = {
        "x": sum(p.get("x", 0) for p in positions) / len(positions),
        "y": sum(p.get("y", 0) for p in positions) / len(positions),
    }

    # Delete source nodes
    for nid in req.node_ids:
        sb.table("nodes").delete().eq("id", nid).execute()

    # Create merged insight node
    merged_id = str(uuid.uuid4())
    merged_text = (
        compilation["nodes"][0]["text"]
        if compilation.get("nodes")
        else combined_text[:240]
    )
    sb.table("nodes").insert({
        "id":                         merged_id,
        "canvas_id":                  canvas_id,
        "branch_id":                  req.branch_id,
        "type":                       "insight",
        "text":                       merged_text,
        "confidence":                 "high",
        "provenance_type":            "ai_inference",
        "provenance_detail":          {"merged_from": req.node_ids},
        "impact_nodes":               [],
        "position":                   centroid,
        "pinned":                     False,
        "created_by":                 "ai",
        "input_modality":             "text",
        "workspace_mode_at_creation": workspace_mode,
    }).execute()
    log_event(canvas_id, req.branch_id, "merge", "user", "text", req.node_ids + [merged_id])
    return {"merged_node_id": merged_id, "deleted_ids": req.node_ids}


# ---------------------------------------------------------------------------
# Reasoning feedback
# ---------------------------------------------------------------------------

class ReasoningFeedbackRequest(BaseModel):
    positive: bool
    step_count: int = 0


@router.post("/canvas/{canvas_id}/feedback")
async def log_reasoning_feedback(
    canvas_id: str,
    req: ReasoningFeedbackRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    log_event(
        canvas_id, "", "reasoning_feedback", "user", "text", [],
        {"positive": req.positive, "step_count": req.step_count}
    )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Drop endpoint — PDF, DOCX, or plain text → AI compilation
# ---------------------------------------------------------------------------

@router.post("/canvas/{canvas_id}/drop")
async def drop_artifact(
    canvas_id: str,
    file: UploadFile = File(None),
    text: str = Form(None),
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas_row = _verify_canvas_owner(sb, canvas_id, user)
    workspace_mode = canvas_row.get("workspace_mode", "analytical")

    branch = (
        sb.table("branches")
        .select("id")
        .eq("canvas_id", canvas_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not branch.data:
        raise HTTPException(404, "No active branch found")
    branch_id = branch.data[0]["id"]

    extracted_text = ""
    if file and file.filename:
        content = await file.read()
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            import fitz
            doc = fitz.open(stream=content, filetype="pdf")
            extracted_text = "\n".join(page.get_text() for page in doc)
        elif filename.endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(content))
            extracted_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        else:
            extracted_text = content.decode("utf-8", errors="replace")
    elif text:
        extracted_text = text
    else:
        raise HTTPException(400, "Provide either a file or text")

    if not extracted_text.strip():
        raise HTTPException(422, "No text could be extracted from the provided input")

    compilation = llm_service.compile_document(extracted_text, workspace_mode)

    existing = sb.table("nodes").select("id,text,type").eq("canvas_id", canvas_id).execute().data
    if existing and compilation.get("nodes"):
        contradictions = llm_service.detect_contradictions(compilation["nodes"], existing)
        compilation["contradictions"] = compilation.get("contradictions", []) + contradictions

    nodes_created = canvas_service.apply_compilation(
        canvas_id, branch_id, compilation, "drop", workspace_mode
    )
    return {"status": "complete", "nodes_created": nodes_created, "compilation": compilation}


# ---------------------------------------------------------------------------
# Branch API
# ---------------------------------------------------------------------------

class CreateBranchRequest(BaseModel):
    name: str
    based_on_branch_id: str | None = None


@router.post("/canvas/{canvas_id}/branch")
async def create_branch(
    canvas_id: str,
    req: CreateBranchRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)

    source_branch_id = req.based_on_branch_id
    if not source_branch_id:
        branch = (
            sb.table("branches").select("id")
            .eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
        )
        source_branch_id = branch.data[0]["id"] if branch.data else None

    if not source_branch_id:
        raise HTTPException(400, "No active branch to fork from")

    new_branch_id = str(uuid.uuid4())
    sb.table("branches").insert({
        "id": new_branch_id, "canvas_id": canvas_id, "name": req.name
    }).execute()

    source_nodes = (
        sb.table("nodes").select("*")
        .eq("canvas_id", canvas_id).eq("branch_id", source_branch_id).execute().data
    )
    old_to_new: dict[str, str] = {}
    if source_nodes:
        new_nodes = []
        for n in source_nodes:
            new_id = str(uuid.uuid4())
            old_to_new[n["id"]] = new_id
            new_nodes.append({**n, "id": new_id, "branch_id": new_branch_id})
        sb.table("nodes").insert(new_nodes).execute()
        for old_n, new_n in zip(source_nodes, new_nodes):
            remapped = [old_to_new.get(imp, imp) for imp in (old_n.get("impact_nodes") or [])]
            if remapped:
                sb.table("nodes").update({"impact_nodes": remapped}).eq("id", new_n["id"]).execute()

    source_edges = (
        sb.table("edges").select("*")
        .eq("canvas_id", canvas_id).eq("branch_id", source_branch_id).execute().data
    )
    if source_edges:
        new_edges = []
        for e in source_edges:
            new_edges.append({
                **e,
                "id":        str(uuid.uuid4()),
                "branch_id": new_branch_id,
                "source_id": old_to_new.get(e["source_id"], e["source_id"]),
                "target_id": old_to_new.get(e["target_id"], e["target_id"]),
            })
        sb.table("edges").insert(new_edges).execute()

    log_event(canvas_id, new_branch_id, "branch_created", "user", "text", [])
    return {"branch_id": new_branch_id, "node_count": len(source_nodes)}


@router.get("/canvas/{canvas_id}/branches")
async def list_branches(
    canvas_id: str,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    return sb.table("branches").select("*").eq("canvas_id", canvas_id).order("created_at").execute().data


@router.post("/canvas/{canvas_id}/branch/{branch_id}/commit")
async def commit_branch(
    canvas_id: str,
    branch_id: str,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas_row = _verify_canvas_owner(sb, canvas_id, user)
    sb.table("branches").update({"status": "committed"}).eq("id", branch_id).execute()
    main_branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("name", "main").execute()
    if main_branch.data:
        branch_row = sb.table("branches").select("name").eq("id", branch_id).single().execute()
        branch_name = branch_row.data.get("name", branch_id[:8]) if branch_row.data else branch_id[:8]
        sb.table("nodes").insert({
            "id":               str(uuid.uuid4()),
            "canvas_id":        canvas_id,
            "branch_id":        main_branch.data[0]["id"],
            "type":             "decision",
            "text":             f"Committed branch: {branch_name}",
            "confidence":       "high",
            "provenance_type":  "user_created",
            "impact_nodes":     [],
            "position":         {"x": 600, "y": 100},
            "created_by":       "user",
            "input_modality":   "text",
            "workspace_mode_at_creation": canvas_row.get("workspace_mode", "analytical"),
        }).execute()
    log_event(canvas_id, branch_id, "branch_committed", "user", "text", [])
    return {"committed": True}


# ---------------------------------------------------------------------------
# Counterfactual branch
# ---------------------------------------------------------------------------

class CounterfactualRequest(BaseModel):
    assumption_node_id: str
    branch_name: str | None = None


@router.post("/canvas/{canvas_id}/counterfactual")
async def create_counterfactual(
    canvas_id: str,
    req: CounterfactualRequest,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    canvas_row = _verify_canvas_owner(sb, canvas_id, user)

    assumption = (
        sb.table("nodes").select("*").eq("id", req.assumption_node_id).single().execute().data
    )
    if not assumption:
        raise HTTPException(404, "Assumption node not found")

    impact_node_ids: list[str] = assumption.get("impact_nodes") or []
    branch_name = req.branch_name or f"Counterfactual: without '{assumption['text'][:30]}'"

    fork_result = await create_branch(
        canvas_id, CreateBranchRequest(name=branch_name), user
    )
    new_branch_id = fork_result["branch_id"]

    forked_assumption = (
        sb.table("nodes").select("id")
        .eq("canvas_id", canvas_id).eq("branch_id", new_branch_id)
        .eq("text", assumption["text"]).execute()
    )
    if forked_assumption.data:
        sb.table("nodes").delete().eq("id", forked_assumption.data[0]["id"]).execute()

    impacted = (
        sb.table("nodes").select("id,text,type")
        .eq("canvas_id", canvas_id).eq("branch_id", new_branch_id)
        .in_("id", impact_node_ids).execute().data
    )
    if impacted:
        context = (
            f"Recompile these nodes WITHOUT the assumption: '{assumption['text']}'\n\n"
            + "\n".join(f"[{n['type']}] {n['text']}" for n in impacted)
        )
        workspace_mode = canvas_row.get("workspace_mode", "analytical")
        compilation = llm_service.compile_document(context, workspace_mode)
        for n in impacted:
            sb.table("nodes").delete().eq("id", n["id"]).execute()
        canvas_service.apply_compilation(canvas_id, new_branch_id, compilation, "text", workspace_mode)

    return {
        "branch_id":        new_branch_id,
        "changed_node_ids": impact_node_ids,
        "summary":          f"Removed assumption affected {len(impact_node_ids)} nodes",
    }


# ---------------------------------------------------------------------------
# Timeline
# ---------------------------------------------------------------------------

@router.get("/canvas/{canvas_id}/timeline")
async def get_timeline(
    canvas_id: str,
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    keyframe_types = [
        "branch_created", "memory_accepted", "mode_changed",
        "branch_committed", "assumption_overridden", "merge",
    ]
    events = (
        sb.table("events")
        .select("event_id,timestamp,event_type,workspace_mode,author")
        .eq("canvas_id", canvas_id)
        .in_("event_type", keyframe_types)
        .order("timestamp")
        .execute()
    )
    return {"keyframes": events.data}


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

@router.get("/canvas/{canvas_id}/export/markdown")
async def export_markdown(
    canvas_id: str,
    branch_id: str = "",
    export_type: str = "full",
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    bid = branch_id or _get_active_branch_id(sb, canvas_id)
    md = export_service.export_markdown(canvas_id, bid, export_type)
    return HttpResponse(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="kleos-export.md"'},
    )


@router.post("/canvas/{canvas_id}/export/pdf")
async def export_pdf(
    canvas_id: str,
    branch_id: str = "",
    export_type: str = "full",
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    bid = branch_id or _get_active_branch_id(sb, canvas_id)
    md = export_service.export_markdown(canvas_id, bid, export_type)
    try:
        pdf_bytes = export_service.generate_pdf_sync(md)
        return HttpResponse(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="kleos-export.pdf"'},
        )
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {e}")


@router.get("/canvas/{canvas_id}/export")
async def export_json(
    canvas_id: str,
    branch_id: str = "",
    user: dict = Depends(get_current_user)
):
    sb = get_client()
    _verify_canvas_owner(sb, canvas_id, user)
    bid = branch_id or _get_active_branch_id(sb, canvas_id)
    return export_service.export_json(canvas_id, bid)
