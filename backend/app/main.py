import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.upload import router as upload_router
from app.api.payments import router as payments_router
from app.api.settings import router as settings_router
from app.api.team import router as team_router
from app.api.api_keys import router as api_keys_router
from app.api.public import router as public_router

# Import models to ensure they are registered with SQLAlchemy
import app.models.user
import app.models.project
import app.models.user_settings
import app.models.team_member
import app.models.api_key
import app.models.audit_log
import app.models.webhook

# Create database tables at startup
Base.metadata.create_all(bind=engine)
# Migration removed to prevent startup deadlocks on Supabase

app = FastAPI(
    title="DigiScale Product Studio API",
    version="1.0.0"
)

# Ensure upload directories exist
os.makedirs("uploads/originals", exist_ok=True)
os.makedirs("uploads/processed", exist_ok=True)

# Mount the static files router to serve uploaded original and processed images
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(upload_router)
app.include_router(payments_router)
app.include_router(settings_router, prefix="/settings", tags=["settings"])
app.include_router(team_router, prefix="/api/v1/team", tags=["team"])
app.include_router(api_keys_router, prefix="/api/v1/api-keys", tags=["api_keys"])
app.include_router(public_router, prefix="/api/v1/public", tags=["public_api"])

@app.get("/")
def root():
    return {
        "message": "Welcome to DigiScale Product Studio API 🚀"
    }

@app.get("/health")
def health():
    return {
        "status": "OK",
        "service": "Backend Running"
    }
