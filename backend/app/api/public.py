from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.api.deps import get_api_user
from app.models.user import User

router = APIRouter()

@router.get("/me")
def get_public_me(current_user: User = Depends(get_api_user)):
    """
    Test endpoint for external developers to verify their API Key.
    """
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "plan": current_user.plan
    }

# Example of an endpoint that external devs might use
@router.post("/images/process")
def process_image_public(
    # payload: ImageProcessRequest,  # Could be added later
    current_user: User = Depends(get_api_user)
):
    """
    Public API to process images programmatically.
    Requires X-API-Key header.
    """
    # Just a stub for now
    return {
        "status": "pending",
        "message": "Image processing started via public API",
        "job_id": "test_job_123"
    }
