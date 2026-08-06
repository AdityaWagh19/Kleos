from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from db.supabase import get_client as get_supabase

router = APIRouter()

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.post("/")
async def submit_contact_form(req: ContactRequest):
    sb = get_supabase()
    
    try:
        sb.table("contacts").insert({
            "name": req.name,
            "email": req.email,
            "message": req.message
        }).execute()
    except Exception as e:
        raise HTTPException(500, f"Failed to save contact message: {str(e)}")
        
    return {"success": True}
