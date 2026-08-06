import uuid
import io
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import Response as HttpResponse
from pydantic import BaseModel
from db.supabase import get_client
from db.queries import log_event
from services import llm_service, canvas_service
from services import export_service
from deps import get_current_user, get_optional_user

# ---------------------------------------------------------------------------
# Branch endpoints
# ---------------------------------------------------------------------------

router = APIRouter()


# ---------------------------------------------------------------------------
# Canvas CRUD
# ---------------------------------------------------------------------------

class CreateCanvasRequest(BaseModel):
    workspace_mode: str = "analytical"


@router.post("/canvas")
async def create_canvas(req: CreateCanvasRequest, user: dict = Depends(get_current_user)):
    sb = get_client()
    canvas_id = str(uuid.uuid4())
    branch_id = str(uuid.uuid4())
    sb.table("canvases").insert({
        "id": canvas_id,
        "workspace_mode": req.workspace_mode,
        "user_id": user["id"],
    }).execute()
    sb.table("branches").insert({
        "id": branch_id,
        "canvas_id": canvas_id,
        "name": "main",
    }).execute()
    return {"id": canvas_id, "branch_id": branch_id}


@router.get("/canvases")
async def list_canvases(user: dict = Depends(get_current_user)):
    sb = get_client()
    res = sb.table("canvases").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return {"canvases": res.data}


@router.get("/canvas/{canvas_id}")
async def get_canvas(canvas_id: str, user: dict = Depends(get_current_user)):
    sb = get_client()
    canvas  = sb.table("canvases").select("*").eq("id", canvas_id).single().execute()
    if not canvas.data:
        raise HTTPException(404, "Canvas not found")
        
    if canvas.data.get("user_id") != user["id"]:
        raise HTTPException(403, "Not authorized to access this canvas")
        
    nodes   = sb.table("nodes").select("*").eq("canvas_id", canvas_id).execute()
    edges   = sb.table("edges").select("*").eq("canvas_id", canvas_id).execute()
    branches = sb.table("branches").select("*").eq("canvas_id", canvas_id).execute()
    
    return {
        "canvas":   canvas.data,
        "nodes":    nodes.data,
        "edges":    edges.data,
        "branches": branches.data,
    }


# ---------------------------------------------------------------------------
# Drop endpoint — PDF, DOCX, or plain text → AI compilation
# ---------------------------------------------------------------------------

@router.post("/canvas/{canvas_id}/drop")
async def drop_artifact(
    canvas_id: str,
    file: UploadFile = File(None),
    text: str = Form(None),
):
    """
    Accepts either a file upload (PDF/DOCX) or plain text via form field.
    PDFs > 5 pages are queued to Celery (Phase 7); smaller docs processed synchronously.
    """
    sb = get_client()

    canvas_row = sb.table("canvases").select("workspace_mode").eq("id", canvas_id).single().execute()
    if not canvas_row.data:
        raise HTTPException(404, "Canvas not found")
    workspace_mode = canvas_row.data["workspace_mode"]

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

    # --- Extract text from input ---
    extracted_text = ""
    if file and file.filename:
        content = await file.read()
        filename = file.filename.lower()

        if filename.endswith(".pdf"):
            import fitz  # PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            if len(doc) > 5:
                # Stub for Celery — implemented in Phase 7
                return {"status": "queued", "message": "Heavy PDF processing available in Phase 7"}
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

    # --- Compile via GPT-4o ---
    compilation = llm_service.compile_document(extracted_text, workspace_mode)

    # --- Contradiction detection against existing nodes ---
    existing = sb.table("nodes").select("id,text,type").eq("canvas_id", canvas_id).execute().data
    if existing and compilation.get("nodes"):
        new_nodes = compilation["nodes"]
        contradictions = llm_service.detect_contradictions(new_nodes, existing)
        compilation["contradictions"] = compilation.get("contradictions", []) + contradictions

    # --- Persist to Supabase ---
    nodes_created = canvas_service.apply_compilation(
        canvas_id, branch_id, compilation, "drop", workspace_mode
    )

    return {
        "status":        "complete",
        "nodes_created": nodes_created,
        "compilation":   compilation,
    }


# ---------------------------------------------------------------------------
# Node delete (for Pause/Stop — Phase 6)
# ---------------------------------------------------------------------------

@router.delete("/canvas/{canvas_id}/node/{node_id}")
async def delete_node(canvas_id: str, node_id: str):
    sb = get_client()
    sb.table("nodes").delete().eq("id", node_id).eq("canvas_id", canvas_id).execute()
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Workspace mode update
# ---------------------------------------------------------------------------

@router.put("/canvas/{canvas_id}/mode")
async def update_workspace_mode(canvas_id: str, mode: str):
    sb = get_client()
    sb.table("canvases").update({"workspace_mode": mode}).eq("id", canvas_id).execute()
    branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).limit(1).execute()
    branch_id = branch.data[0]["id"] if branch.data else "main"
    log_event(canvas_id, branch_id, "mode_changed", "user", "text", [], {"mode": mode}, mode)
    return {"mode": mode}


# ---------------------------------------------------------------------------
# Incognito mode toggle
# ---------------------------------------------------------------------------

@router.put("/canvas/{canvas_id}/incognito")
async def set_incognito(canvas_id: str, enabled: bool):
    sb = get_client()
    sb.table("canvases").update({"incognito_mode": enabled}).eq("id", canvas_id).execute()
    return {"incognito_mode": enabled}


# ---------------------------------------------------------------------------
# Branch API (Phase 6)
# ---------------------------------------------------------------------------

class CreateBranchRequest(BaseModel):
    name: str
    based_on_branch_id: str | None = None


@router.post("/canvas/{canvas_id}/branch")
async def create_branch(canvas_id: str, req: CreateBranchRequest):
    """Forks all nodes and edges from the active branch into a new branch."""
    sb = get_client()

    # Determine source branch
    if req.based_on_branch_id:
        source_branch_id = req.based_on_branch_id
    else:
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

    # Duplicate nodes
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

        # Remap impact_nodes in forked nodes
        for old_n, new_n in zip(source_nodes, new_nodes):
            remapped = [old_to_new.get(imp, imp) for imp in (old_n.get("impact_nodes") or [])]
            if remapped:
                sb.table("nodes").update({"impact_nodes": remapped}).eq("id", new_n["id"]).execute()

    # Duplicate edges
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
async def list_branches(canvas_id: str):
    sb = get_client()
    return sb.table("branches").select("*").eq("canvas_id", canvas_id).order("created_at").execute().data


@router.post("/canvas/{canvas_id}/branch/{branch_id}/commit")
async def commit_branch(canvas_id: str, branch_id: str):
    """Mark branch as committed. Creates a Decision node on main branch."""
    sb = get_client()
    sb.table("branches").update({"status": "committed"}).eq("id", branch_id).execute()
    main_branch = sb.table("branches").select("id").eq("canvas_id", canvas_id).eq("name", "main").execute()
    if main_branch.data:
        sb.table("nodes").insert({
            "id":               str(uuid.uuid4()),
            "canvas_id":        canvas_id,
            "branch_id":        main_branch.data[0]["id"],
            "type":             "decision",
            "text":             f"Committed branch: {branch_id[:8]}",
            "confidence":       "high",
            "provenance_type":  "user_created",
            "impact_nodes":     [],
            "position":         {"x": 600, "y": 100},
            "created_by":       "user",
            "input_modality":   "text",
        }).execute()
    log_event(canvas_id, branch_id, "branch_committed", "user", "text", [])
    return {"committed": True}


# ---------------------------------------------------------------------------
# Counterfactual branch (Phase 8 — wired here for branch infrastructure)
# ---------------------------------------------------------------------------

class CounterfactualRequest(BaseModel):
    assumption_node_id: str
    branch_name: str | None = None


@router.post("/canvas/{canvas_id}/counterfactual")
async def create_counterfactual(canvas_id: str, req: CounterfactualRequest):
    """Creates a branch with the assumption deleted; recompiles affected subgraph."""
    sb = get_client()

    assumption = (
        sb.table("nodes").select("*").eq("id", req.assumption_node_id).single().execute().data
    )
    if not assumption:
        raise HTTPException(404, "Assumption node not found")

    impact_node_ids: list[str] = assumption.get("impact_nodes") or []
    branch_name = req.branch_name or f"Counterfactual: without '{assumption['text'][:30]}'"

    # Fork the current active branch
    fork_result = await create_branch(canvas_id, CreateBranchRequest(name=branch_name))
    new_branch_id = fork_result["branch_id"]

    # Delete the forked copy of the assumption node
    forked_assumption = (
        sb.table("nodes").select("id")
        .eq("canvas_id", canvas_id).eq("branch_id", new_branch_id)
        .eq("text", assumption["text"]).execute()
    )
    if forked_assumption.data:
        sb.table("nodes").delete().eq("id", forked_assumption.data[0]["id"]).execute()

    # Recompile affected subgraph
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
        canvas_row = (
            sb.table("canvases").select("workspace_mode").eq("id", canvas_id).single().execute().data
        )
        workspace_mode = canvas_row.get("workspace_mode", "analytical") if canvas_row else "analytical"
        compilation = llm_service.compile_document(context, workspace_mode)

        # Remove old impacted nodes and replace with recompiled ones
        for n in impacted:
            sb.table("nodes").delete().eq("id", n["id"]).execute()
        canvas_service.apply_compilation(canvas_id, new_branch_id, compilation, "text", workspace_mode)

    return {
        "branch_id":        new_branch_id,
        "changed_node_ids": impact_node_ids,
        "summary":          f"Removed assumption affected {len(impact_node_ids)} nodes",
    }


# ---------------------------------------------------------------------------
# Timeline (Phase 8 — wired here with canvas API)
# ---------------------------------------------------------------------------

@router.get("/canvas/{canvas_id}/timeline")
async def get_timeline(canvas_id: str):
    sb = get_client()
    keyframe_types = [
        "branch_created", "memory_accepted", "mode_changed",
        "branch_committed", "assumption_overridden",
    ]
    events = (
        sb.table("events").select("event_id,timestamp,event_type,workspace_mode")
        .eq("canvas_id", canvas_id)
        .in_("event_type", keyframe_types)
        .order("timestamp")
        .execute()
    )
    return {"keyframes": events.data}


# ---------------------------------------------------------------------------
# Export endpoints (Phase 7)
# ---------------------------------------------------------------------------

def _get_active_branch_id(sb, canvas_id: str) -> str:
    branch = (
        sb.table("branches").select("id")
        .eq("canvas_id", canvas_id).eq("status", "active").limit(1).execute()
    )
    return branch.data[0]["id"] if branch.data else "main"


@router.get("/canvas/{canvas_id}/export/markdown")
async def export_markdown(canvas_id: str, branch_id: str = "", export_type: str = "full"):
    sb = get_client()
    bid = branch_id or _get_active_branch_id(sb, canvas_id)
    md = export_service.export_markdown(canvas_id, bid, export_type)
    return HttpResponse(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="kleos-export.md"'},
    )


@router.post("/canvas/{canvas_id}/export/pdf")
async def export_pdf(canvas_id: str, branch_id: str = "", export_type: str = "full"):
    """Generate PDF synchronously (no Celery required at hackathon scale)."""
    sb = get_client()
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
async def export_json(canvas_id: str, branch_id: str = ""):
    sb = get_client()
    bid = branch_id or _get_active_branch_id(sb, canvas_id)
    return export_service.export_json(canvas_id, bid)
