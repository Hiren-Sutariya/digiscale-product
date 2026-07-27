import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.config import settings
from app.services.auth_service import decode_access_token
from app.services.image_service import remove_background, add_white_background
from app.models.user import User
from app.models.project import ProjectImage


router = APIRouter(tags=["upload"])

security = HTTPBearer(auto_error=False)

def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return None
    email = payload.get("sub")
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()

def process_image_background(
    original_path: str,
    processed_path: str,
    white_bg: bool,
    image_id: int
):
    db = SessionLocal()
    try:
        success = remove_background(original_path, processed_path)
        if success:
            final_processed_path = processed_path
            if white_bg:
                white_processed_filename = os.path.basename(processed_path).replace("_proc", "_white").replace(".webp", ".webp")
                white_processed_path = os.path.join(settings.PROCESSED_DIR, white_processed_filename)
                if add_white_background(processed_path, white_processed_path):
                    final_processed_path = white_processed_path
                    
            db_image = db.query(ProjectImage).filter(ProjectImage.id == image_id).first()
            if db_image:
                db_image.status = "completed"
                db_image.processed_path = f"uploads/processed/{os.path.basename(final_processed_path)}"
                db.commit()

        else:
            db_image = db.query(ProjectImage).filter(ProjectImage.id == image_id).first()
            if db_image:
                db_image.status = "failed"
                db.commit()

    except Exception as e:
        db_image = db.query(ProjectImage).filter(ProjectImage.id == image_id).first()
        if db_image:
            db_image.status = "failed"
            db.commit()
    finally:
        db.close()

@router.post("/upload")
async def upload_and_process_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(None),
    white_bg: Optional[bool] = Form(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
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
    processed_filename = f"{unique_id}_proc.webp"
    
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
        
    relative_original_path = f"uploads/originals/{original_filename}"
    
    # Create DB record if project_id is provided
    image_id = None
    if project_id:
        db_image = ProjectImage(
            project_id=project_id,
            original_path=relative_original_path,
            status="processing"
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        image_id = db_image.id

    if image_id:
        # Process in background

        background_tasks.add_task(
            process_image_background,
            original_path,
            processed_path,
            white_bg,
            image_id
        )
        
        return {
            "message": "Image processing started in background",
            "originalImage": relative_original_path,
            "processedImage": None,
            "imageId": image_id,
            "status": "processing"
        }
    else:
        # Fallback for anonymous / no project ID (synchronous)
        success = remove_background(original_path, processed_path)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process image background removal."
            )
            
        if white_bg:
            white_processed_filename = f"{unique_id}_white.jpg"
            white_processed_path = os.path.join(settings.PROCESSED_DIR, white_processed_filename)
            if add_white_background(processed_path, white_processed_path):
                processed_path = white_processed_path
                processed_filename = white_processed_filename
                
        relative_processed_path = f"uploads/processed/{processed_filename}"
        
        return {
            "message": "Image processed successfully",
            "originalImage": relative_original_path,
            "processedImage": relative_processed_path,
            "imageId": None,
            "status": "completed"
        }
