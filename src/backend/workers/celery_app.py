import os
from dotenv import load_dotenv
load_dotenv()

from celery import Celery


def _build_redis_url() -> str:
    """Build Redis URL with embedded credentials for Celery broker/backend."""
    base_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    password = os.environ.get("REDIS_PASSWORD", "")
    if not password:
        return base_url + "/0"
    # Insert password into URL: rediss://host:port → rediss://:password@host:port/0
    scheme, rest = base_url.split("://", 1)
    return f"{scheme}://:{password}@{rest}/0"


_broker_url = _build_redis_url()

celery_app = Celery(
    "kleos",
    broker=_broker_url,
    backend=_broker_url,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    broker_use_ssl={"ssl_cert_reqs": None},   # Upstash requires SSL
    redis_backend_use_ssl={"ssl_cert_reqs": None},
)
