import uuid
from db.supabase import get_client


def log_event(
    canvas_id: str,
    branch_id: str,
    event_type: str,
    author: str,
    input_modality: str,
    affected_node_ids: list,
    delta: dict = None,
    workspace_mode: str = "analytical",
):
    """Insert an event. Never stores empty branch_id — uses 'main' as fallback."""
    sb = get_client()
    # B-04: guard against empty branch_id
    safe_branch_id = branch_id.strip() if branch_id and branch_id.strip() else "main"
    sb.table("events").insert({
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "author": author,
        "input_modality": input_modality,
        "affected_node_ids": affected_node_ids,
        "delta": delta or {},
        "canvas_id": canvas_id,
        "branch_id": safe_branch_id,
        "workspace_mode": workspace_mode,
    }).execute()
