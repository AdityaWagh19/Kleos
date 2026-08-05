import uuid
from db.supabase import get_client
from db.queries import log_event


def apply_compilation(
    canvas_id: str,
    branch_id: str,
    compilation: dict,
    input_modality: str,
    workspace_mode: str,
) -> int:
    """
    Writes compilation output (nodes + edges + contradiction edges) to Supabase.
    Remaps LLM temp IDs → DB UUIDs after insertion so impact_nodes references are correct.
    Returns number of nodes created.
    """
    sb = get_client()
    id_map: dict[str, str] = {}   # LLM temp_id → DB UUID

    nodes_raw = compilation.get("nodes", [])

    # Pass 1: insert all nodes with raw impact_nodes (temp IDs still)
    for i, raw in enumerate(nodes_raw):
        db_id = str(uuid.uuid4())
        id_map[raw["id"]] = db_id
        node_row = {
            "id":                         db_id,
            "canvas_id":                  canvas_id,
            "branch_id":                  branch_id,
            "type":                       raw["type"],
            "text":                       raw["text"],
            "confidence":                 raw.get("confidence", "medium"),
            "provenance_type":            raw.get("provenance_type", "ai_inference"),
            "impact_nodes":               raw.get("impact_nodes", []),  # still temp IDs; remapped in pass 2
            "position":                   _auto_position(i),
            "created_by":                 "ai",
            "input_modality":             input_modality,
            "workspace_mode_at_creation": workspace_mode,
        }
        sb.table("nodes").insert(node_row).execute()
        log_event(canvas_id, branch_id, "node_created", "ai", input_modality, [db_id], workspace_mode=workspace_mode)

    # Pass 2: remap impact_nodes from temp IDs → DB UUIDs
    for raw in nodes_raw:
        db_id = id_map[raw["id"]]
        remapped = [id_map.get(imp_id, imp_id) for imp_id in raw.get("impact_nodes", [])]
        if remapped:
            sb.table("nodes").update({"impact_nodes": remapped}).eq("id", db_id).execute()

    # Create contradiction edges from compilation output
    for contradiction in compilation.get("contradictions", []):
        node_a = id_map.get(contradiction["node_a"], contradiction["node_a"])
        node_b = id_map.get(contradiction["node_b"], contradiction["node_b"])
        create_edge(canvas_id, branch_id, node_a, node_b, "contradicts", "high")

    return len(nodes_raw)


def create_edge(
    canvas_id: str,
    branch_id: str,
    source_id: str,
    target_id: str,
    edge_type: str,
    confidence: str,
) -> str:
    sb = get_client()
    edge_id = str(uuid.uuid4())
    sb.table("edges").insert({
        "id":         edge_id,
        "canvas_id":  canvas_id,
        "branch_id":  branch_id,
        "source_id":  source_id,
        "target_id":  target_id,
        "type":       edge_type,
        "confidence": confidence,
    }).execute()
    log_event(canvas_id, branch_id, "edge_created", "ai", "text", [source_id, target_id])
    return edge_id


def get_current_workspace_mode(canvas_id: str) -> str:
    sb = get_client()
    result = sb.table("canvases").select("workspace_mode").eq("id", canvas_id).single().execute()
    return result.data.get("workspace_mode", "analytical") if result.data else "analytical"


def _auto_position(index: int) -> dict:
    """Grid auto-layout — 4 columns, 280px × 180px cells."""
    cols = 4
    x = (index % cols) * 280 + 80
    y = (index // cols) * 180 + 80
    return {"x": x, "y": y}
