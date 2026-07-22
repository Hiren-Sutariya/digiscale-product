import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from app.config import settings
from app.services.image_service import remove_background, add_white_background

router = APIRouter(tags=["upload"])

@router.post("/upload")
async def upload_and_process_image(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    white_bg: Optional[bool] = Form(False)
):
    # Ensure folders exist
    os.makedirs(settings.ORIGINALS_DIR, exist_ok=True)
    os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
    
    # Generate unique filenames
    file_ext = os.path.splitext(file.filename)[1]
    if not file_ext:
        file_ext = ".png"
    unique_id = str(uuid.uuid4())
    original_filename = f"{unique_id}_orig{file_ext}"
    processed_filename = f"{unique_id}_proc.png"
    
    original_path = os.path.join(settings.ORIGINALS_DIR, original_filename)
    processed_path = os.path.join(settings.PROCESSED_DIR, processed_filename)
    
    # Save original file
    try:
        content = await file.read()
        with open(original_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded image: {str(e)}"
        )
        
    # Process image (remove background)
    success = remove_background(original_path, processed_path)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process image background removal."
        )
        
    # If white background requested, apply it
    if white_bg:
        white_processed_filename = f"{unique_id}_white.jpg"
        white_processed_path = os.path.join(settings.PROCESSED_DIR, white_processed_filename)
        if add_white_background(processed_path, white_processed_path):
            processed_path = white_processed_path
            processed_filename = white_processed_filename
            
    # Return path relative to base URL (e.g., uploads/processed/filename)
    # The static files router mounts "/uploads" from directory "uploads",
    # so we should return "uploads/processed/filename"
    relative_processed_path = f"uploads/processed/{processed_filename}"
    relative_original_path = f"uploads/originals/{original_filename}"
    
    return {
        "message": "Image processed successfully",
        "originalImage": relative_original_path,
        "processedImage": relative_processed_path,
        "imageId": None,
        "creditsRemaining": None
    }
