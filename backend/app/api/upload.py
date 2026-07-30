import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.services.auth_service import decode_access_token
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


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(None),
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
    
    original_path = os.path.join(settings.ORIGINALS_DIR, original_filename)
    
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
            processed_path=relative_original_path, # No longer processing background
            status="completed"
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        image_id = db_image.id

    return {
        "message": "Image uploaded successfully",
        "originalImage": relative_original_path,
        "processedImage": relative_original_path,
        "imageId": image_id,
        "status": "completed"
    }
