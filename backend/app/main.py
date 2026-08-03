import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.upload import router as upload_router
from app.api.remove_bg import router as remove_bg_router

from app.api.settings import router as settings_router

# Import models to ensure they are registered with SQLAlchemy
import app.models.user
import app.models.user_settings
import app.models.client

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
app.include_router(settings_router, prefix="/settings", tags=["settings"])
app.include_router(remove_bg_router)


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
