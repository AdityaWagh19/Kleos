"""Celery worker for background document ingestion (I-03)."""

import os

try:
    from celery import Celery  # type: ignore[import-untyped]
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    celery_app = Celery(
        "kleos_tasks",
        broker=REDIS_URL,
        backend=REDIS_URL,
    )
except ImportError:  # celery not installed in this environment
    Celery = None  # type: ignore[assignment,misc]
    celery_app = None  # type: ignore[assignment]

if celery_app is not None:
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )


def _task_decorator(fn):  # noqa: ANN001
    """Register fn as a Celery task if celery is available, else return it as-is."""
    if celery_app is None:
        return fn
    return celery_app.task(name=fn.__name__)(fn)


@_task_decorator
def process_document_async(canvas_id: str, branch_id: str, file_bytes_base64: str, filename: str, workspace_mode: str):
    """Background task to extract and compile large documents asynchronously."""
    import base64
    import asyncio
    from services import ingestion_service, llm_service, canvas_service

    content = base64.b64decode(file_bytes_base64)
    if filename.lower().endswith(".pdf"):
        extracted_text = ingestion_service.extract_pdf(content)
    elif filename.lower().endswith(".docx"):
        extracted_text = ingestion_service.extract_docx(content)
    else:
        extracted_text = content.decode("utf-8", errors="replace")

    compilation = llm_service.compile_document(extracted_text, workspace_mode)
    loop = asyncio.get_event_loop()
    nodes_created = loop.run_until_complete(
        canvas_service.apply_compilation(canvas_id, branch_id, compilation, "drop", workspace_mode)
    )
    return {"status": "success", "nodes_created": nodes_created}
