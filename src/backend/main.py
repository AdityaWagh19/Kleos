import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from routers import canvas, memory, health
from routers.stream import router as stream_router
from routers.auth import router as auth_router
from routers.contact import router as contact_router
from routers.settings import router as settings_router
from ws.voice import router as voice_router

app = FastAPI(title="Kleos API", version="1.0.0")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ.get("SESSION_SECRET", "super-secret-key")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth_router, prefix="/api/auth")
app.include_router(contact_router, prefix="/api/contact")
app.include_router(canvas.router,  prefix="/api")
app.include_router(memory.router,  prefix="/api")
app.include_router(stream_router,  prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(voice_router)
