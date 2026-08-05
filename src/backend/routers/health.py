from fastapi import APIRouter
from db.supabase import get_client as get_supabase
from cache.redis import get_client as get_redis

router = APIRouter()


@router.get("/health")
async def health():
    sb_ok = False
    redis_ok = False

    try:
        get_supabase().table("canvases").select("id").limit(1).execute()
        sb_ok = True
    except Exception:
        pass

    try:
        get_redis().ping()
        redis_ok = True
    except Exception:
        pass

    status = "ok" if (sb_ok and redis_ok) else "degraded"
    return {"status": status, "supabase": sb_ok, "redis": redis_ok}
