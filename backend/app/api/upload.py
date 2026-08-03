import os
import io
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from PIL import Image

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.api.deps import get_optional_user

try:
    from rembg import remove, new_session
    # Initialize the session globally to avoid reloading the model on every request
    bg_session = new_session("birefnet-general")
    REMBG_AVAILABLE = True
except ImportError:
    print("Warning: rembg not installed. Background removal will be skipped.")
    bg_session = None
    REMBG_AVAILABLE = False

router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(None),  # Deprecated — kept for compatibility
    auto_remove: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    # Ensure upload directories exist
    os.makedirs(settings.ORIGINALS_DIR, exist_ok=True)
    os.makedirs(settings.PROCESSED_DIR, exist_ok=True)

    # Generate unique filenames
    file_ext = os.path.splitext(file.filename)[1] or ".png"
    unique_id = str(uuid.uuid4())
    original_filename = f"{unique_id}_orig{file_ext}"
    original_path = os.path.join(settings.ORIGINALS_DIR, original_filename)

    # Save original file
    try:
        content = await file.read()
        with open(original_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded image: {str(e)}",
        )

    relative_original_path = f"uploads/originals/{original_filename}"
    relative_processed_path = relative_original_path  # default fallback

    # Remove background if requested and rembg is available
    if REMBG_AVAILABLE and auto_remove:
        try:
            from starlette.concurrency import run_in_threadpool

            processed_filename = f"{unique_id}_processed.png"
            processed_path = os.path.join(settings.PROCESSED_DIR, processed_filename)

            input_image = Image.open(io.BytesIO(content))
            output_image = await run_in_threadpool(remove, input_image, session=bg_session)
            output_image.save(processed_path, "PNG")

            relative_processed_path = f"uploads/processed/{processed_filename}"
        except Exception as e:
            print(f"Background removal failed: {e}")
            # Fallback to original if processing fails

    return {
        "message": "Image uploaded successfully",
        "originalImage": relative_original_path,
        "processedImage": relative_processed_path,
        "imageId": None,
        "status": "completed",
    }
