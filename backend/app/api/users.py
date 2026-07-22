from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.name = data.name
    current_user.email = data.email
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/upgrade", response_model=UserResponse)
def upgrade_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.plan = "Pro"
    current_user.credits_limit = 99999  # Unlimited
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me")
def schedule_account_deletion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    current_user.deletion_scheduled_at = datetime.utcnow()
    db.commit()
    return {"message": "Account scheduled for deletion. It will be permanently removed in 7 days."}
