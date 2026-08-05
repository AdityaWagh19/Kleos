import os
import redis as redis_lib
from functools import lru_cache


@lru_cache(maxsize=1)
def get_client() -> redis_lib.Redis:
    redis_url = os.environ["REDIS_URL"]
    password = os.environ.get("REDIS_PASSWORD", "")

    # Parse host and port from REDIS_URL
    # Expected format: redis://host:port or rediss://host:port
    url_without_scheme = redis_url.split("://", 1)[1]
    if ":" in url_without_scheme:
        host, port_str = url_without_scheme.rsplit(":", 1)
        port = int(port_str)
    else:
        host = url_without_scheme
        port = 6379

    use_ssl = redis_url.startswith("rediss://")

    return redis_lib.Redis(
        host=host,
        port=port,
        password=password if password else None,
        ssl=use_ssl,
        decode_responses=True,
    )
