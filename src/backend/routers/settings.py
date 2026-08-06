from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from db.supabase import get_client as get_supabase
from deps import get_current_user

router = APIRouter()


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    notification_email: Optional[bool] = None


@router.get("/settings/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Return current user's full profile including settings fields."""
    sb = get_supabase()
    res = sb.table("users").select(
        "id, email, name, display_name, avatar_url, bio, notification_email, created_at, updated_at"
    ).eq("id", user["id"]).single().execute()
    
    if not res.data:
        raise HTTPException(404, "User not found")
    
    return {"profile": res.data}


@router.put("/settings/profile")
async def update_profile(req: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    """Update user profile settings. Only updates provided fields."""
    sb = get_supabase()
    
    update_data: dict = {}
    if req.display_name is not None:
        update_data["display_name"] = req.display_name.strip() or None
    if req.bio is not None:
        update_data["bio"] = req.bio.strip() or None
    if req.notification_email is not None:
        update_data["notification_email"] = req.notification_email
    
    if not update_data:
        raise HTTPException(400, "No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    res = sb.table("users").update(update_data).eq("id", user["id"]).execute()
    
    if not res.data:
        raise HTTPException(500, "Failed to update profile")
    
    return {"profile": res.data[0]}


@router.delete("/settings/account")
async def delete_account(user: dict = Depends(get_current_user)):
    """Permanently deletes the user account and all associated data (cascades via FK)."""
    sb = get_supabase()
    
    # Cascade deletes canvases, memories, nodes, edges via FK ON DELETE CASCADE
    sb.table("users").delete().eq("id", user["id"]).execute()
    
    return {"deleted": True}
