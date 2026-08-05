# Phase 7 — PDF export Celery worker
# Stub — implemented in Phase 7
from workers.celery_app import celery_app


@celery_app.task(name="workers.pdf_export_worker.generate_pdf_export")
def generate_pdf_export(canvas_id: str, branch_id: str, export_type: str = "full") -> str:
    raise NotImplementedError("Implemented in Phase 7")
