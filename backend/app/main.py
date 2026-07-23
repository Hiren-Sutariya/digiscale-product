import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.projects import router as projects_router
from app.api.upload import router as upload_router
from app.api.payments import router as payments_router

# Create database tables at startup
Base.metadata.create_all(bind=engine)

# Migration to add deletion_scheduled_at if it does not exist in sqlite database
from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN deletion_scheduled_at DATETIME NULL;"))
except Exception as e:
    print("Migration exception:", e)

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
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(upload_router)
app.include_router(payments_router)

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
