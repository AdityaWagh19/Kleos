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
    sb = get_client()
    sb.table("events").insert({
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "author": author,
        "input_modality": input_modality,
        "affected_node_ids": affected_node_ids,
        "delta": delta or {},
        "canvas_id": canvas_id,
        "branch_id": branch_id,
        "workspace_mode": workspace_mode,
    }).execute()
