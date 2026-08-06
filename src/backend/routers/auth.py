import os
import uuid
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from cache.redis import get_client as get_redis
from db.supabase import get_client as get_supabase
from deps import get_current_user

router = APIRouter()

oauth = OAuth()

client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")

if client_id and client_secret:
    oauth.register(
        name="google",
        client_id=client_id,
        client_secret=client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile"
        }
    )

@router.get("/login/google")
async def login_google(request: Request, return_to: str = "/dashboard"):
    if not client_id:
        raise HTTPException(500, "Google OAuth not configured (missing GOOGLE_CLIENT_ID)")
    redirect_uri = request.url_for("auth_callback", provider="google")
    # Store return_to in session so the callback can redirect correctly
    request.session["return_to"] = return_to
    return await oauth.google.authorize_redirect(request, str(redirect_uri))

@router.get("/callback/{provider}")
async def auth_callback(request: Request, provider: str):
    if provider != "google":
        raise HTTPException(400, "Unsupported provider")
    
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(400, f"OAuth error: {str(e)}")
        
    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(400, "Failed to get user info")
        
    email = user_info.get("email")
    name = user_info.get("name")
    avatar_url = user_info.get("picture")
    
    sb = get_supabase()
    
    # Check if user exists
    res = sb.table("users").select("*").eq("email", email).execute()
    
    user_id = None
    if res.data:
        user_id = res.data[0]["id"]
        sb.table("users").update({
            "name": name,
            "avatar_url": avatar_url
        }).eq("id", user_id).execute()
    else:
        user_id = str(uuid.uuid4())
        sb.table("users").insert({
            "id": user_id,
            "email": email,
            "name": name,
            "avatar_url": avatar_url
        }).execute()
        
    session_id = str(uuid.uuid4())
    redis = get_redis()
    redis.setex(f"session:{session_id}", 604800, user_id)
    
    # Read return_to from session, default to /dashboard
    return_to = request.session.pop("return_to", "/dashboard")
    # Sanitize return_to to prevent open redirect — only allow relative paths
    if not return_to.startswith("/"):
        return_to = "/dashboard"
    
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    response = RedirectResponse(url=f"{frontend_url}{return_to}")
    
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=os.environ.get("ENV") == "production",
        samesite="lax",
        max_age=604800
    )
    return response

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}

@router.post("/logout")
async def logout(request: Request):
    session_id = request.cookies.get("session_id")
    from fastapi.responses import JSONResponse
    response = JSONResponse(content={"logged_out": True})
        
    if session_id:
        redis = get_redis()
        redis.delete(f"session:{session_id}")
        response.delete_cookie("session_id")
    return response
