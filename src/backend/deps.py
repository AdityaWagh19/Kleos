import os
from fastapi import Request, HTTPException
from cache.redis import get_client as get_redis
from db.supabase import get_client as get_supabase

async def get_current_user(request: Request) -> dict:
    """
    Dependency to get the current authenticated user.
    Checks the 'session_id' cookie against Redis.
    """
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    redis_client = get_redis()
    user_id = redis_client.get(f"session:{session_id}")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    sb = get_supabase()
    user_res = sb.table("users").select("*").eq("id", user_id).single().execute()
    
    if not user_res.data:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user_res.data

async def get_optional_user(request: Request) -> dict | None:
    """
    Dependency to get the current authenticated user optionally.
    """
    try:
        return await get_current_user(request)
    except HTTPException:
        return None
