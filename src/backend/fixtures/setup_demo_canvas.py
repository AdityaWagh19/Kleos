"""
Demo canvas setup — run ONCE before the demo.
Creates the pre-populated canvas state for the 7-minute demo script.

Usage:
    cd src/backend
    python fixtures/setup_demo_canvas.py

After running, note the DEMO_CANVAS_ID printed at the end.
Open that canvas in the browser before starting the demo.
"""

import os, sys, uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from dotenv import load_dotenv
load_dotenv()

from db.supabase import get_client


def setup():
    sb = get_client()
    canvas_id = str(uuid.uuid4())
    branch_id = str(uuid.uuid4())

    # Canvas — Analytical mode
    sb.table("canvases").insert({"id": canvas_id, "workspace_mode": "analytical"}).execute()
    sb.table("branches").insert({"id": branch_id, "canvas_id": canvas_id, "name": "main"}).execute()

    # 4 pre-populated nodes (from a "prior voice session")
    nodes = [
        {"type": "idea",       "text": "AI startup product strategy for Indian market",
         "confidence": "high",   "provenance_type": "voice_input", "input_modality": "voice",
         "created_by": "user",   "position": {"x": 200, "y": 200}, "impact_nodes": []},
        {"type": "assumption", "text": "The market is primarily B2B enterprise",
         "confidence": "medium", "provenance_type": "parametric",   "input_modality": "voice",
         "created_by": "ai",     "position": {"x": 500, "y": 150}, "impact_nodes": []},
        {"type": "constraint", "text": "Budget ceiling: ~$50k initial runway",
         "confidence": "high",   "provenance_type": "voice_input", "input_modality": "voice",
         "created_by": "user",   "position": {"x": 200, "y": 380}, "impact_nodes": []},
        {"type": "question",   "text": "Which product category: analytics, automation, or insights?",
         "confidence": "low",    "provenance_type": "ai_inference", "input_modality": "voice",
         "created_by": "ai",     "position": {"x": 500, "y": 380}, "impact_nodes": []},
    ]

    node_ids = []
    for n in nodes:
        nid = str(uuid.uuid4())
        node_ids.append(nid)
        sb.table("nodes").insert({
            "id": nid, "canvas_id": canvas_id, "branch_id": branch_id,
            "workspace_mode_at_creation": "analytical",
            **n,
        }).execute()

    # Pre-compute impact_nodes on the assumption node (node_ids[1])
    # Assumption impacts: idea (0), constraint (2), question (3)
    dependent_ids = [node_ids[0], node_ids[2], node_ids[3]]
    sb.table("nodes").update({"impact_nodes": dependent_ids}).eq("id", node_ids[1]).execute()

    # 3 Core Memories (Tier 0, global, voice-origin)
    for text in [
        "User is building a B2B SaaS product for Indian market",
        "User consistently prioritises cost optimisation over speed",
        "Primary competitor is DataBridge with 34% market share",
    ]:
        sb.table("memories").insert({
            "id": str(uuid.uuid4()), "tier": 0, "scope": "global",
            "text": text, "canvas_id": None,
            "quarantined": False, "provenance": {"input_modality": "voice"},
        }).execute()

    # 1 Inferred (Tier 2, quarantined — for Pending tab demo)
    sb.table("memories").insert({
        "id": str(uuid.uuid4()), "tier": 2, "scope": "session",
        "text": "User prefers async communication in the team",
        "canvas_id": canvas_id, "quarantined": True,
        "provenance": {"trigger": "mentioned async twice", "input_modality": "voice"},
    }).execute()

    print(f"Demo canvas created!")
    print(f"DEMO_CANVAS_ID={canvas_id}")
    print(f"Assumption node ID (WOW #1): {node_ids[1]}")
    print(f"Impact nodes ({len(dependent_ids)}): {dependent_ids}")
    print()
    print("Update fixtures/drop_pdf_result.json to use these IDs if needed.")

    # Save canvas ID for reference
    Path("fixtures/.demo_canvas_id").write_text(canvas_id)


if __name__ == "__main__":
    setup()
