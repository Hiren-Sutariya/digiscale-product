from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=TokenResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Create new user
    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        plan="Starter",
        credits_limit=30,
        credits_used=0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    token = create_access_token(data={"sub": new_user.email})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_name=new_user.name,
        user_email=new_user.email
    )

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account deletion is scheduled
    if user.deletion_scheduled_at:
        # Check if the 7-day grace period has passed
        from datetime import datetime
        time_elapsed = datetime.utcnow() - user.deletion_scheduled_at
        if time_elapsed.days >= 7:
            # Permanently delete user
            db.delete(user)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account has been permanently deleted after the 7-day grace period."
            )
        else:
            # Cancel scheduled deletion because the user logged back in
            user.deletion_scheduled_at = None
            db.commit()
            db.refresh(user)
        
    token = create_access_token(data={"sub": user.email})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_name=user.name,
        user_email=user.email
    )

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    # Standard response for safety (prevent email enumeration)
    return {"message": "If the email exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    return {"message": "Password reset successfully."}
