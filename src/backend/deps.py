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
    if isinstance(user_id, bytes):
        user_id = user_id.decode("utf-8")
    
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

async def verify_canvas_ownership(canvas_id: str, request: Request) -> dict:
    """
    Dependency to ensure the current user owns the canvas.
    """
    user = await get_current_user(request)
    sb = get_supabase()
    canvas = sb.table("canvases").select("user_id").eq("id", canvas_id).single().execute()
    
    if not canvas.data:
        raise HTTPException(status_code=404, detail="Canvas not found")
        
    if canvas.data.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this canvas")
        
    return user

