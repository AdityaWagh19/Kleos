# Phase 7 — document processing Celery worker
# Stub — implemented in Phase 7
from workers.celery_app import celery_app


@celery_app.task(bind=True, max_retries=2, name="workers.document_worker.process_document")
def process_document(self, canvas_id: str, branch_id: str, file_content: bytes,
                     workspace_mode: str = "analytical", filename: str = "document.pdf"):
    raise NotImplementedError("Implemented in Phase 7")
