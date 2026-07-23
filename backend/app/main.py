import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.upload import router as upload_router

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

cors_origins = [origin.strip().rstrip("/") for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(upload_router)

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
