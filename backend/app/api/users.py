from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserProfileUpdate, UserCreateRequest
from app.schemas.auth import ChangePasswordRequest
from app.services.auth_service import hash_password, verify_password

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


@router.put("/me/password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


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
    current_user.deletion_scheduled_at = datetime.utcnow()
    db.commit()
    return {"message": "Account scheduled for deletion. It will be permanently removed in 7 days."}


@router.get("/list", response_model=list[UserResponse])
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "Admin":
        return db.query(User).filter(
            (User.id == current_user.id) | (User.admin_id == current_user.id)
        ).order_by(User.id.asc()).all()
    else:
        admin_id = current_user.admin_id or current_user.id
        return db.query(User).filter(
            (User.id == admin_id) | (User.admin_id == admin_id)
        ).order_by(User.id.asc()).all()


@router.post("/create", response_model=UserResponse)
def create_user(
    data: UserCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        plan="Free",
        credits_limit=999999999,
        credits_used=0,
        role=data.role,
        admin_id=current_user.id,
        perm_collections=data.perm_collections,
        perm_warehouse=data.perm_warehouse,
        perm_stockbook=data.perm_stockbook,
        perm_clients=data.perm_clients,
        perm_quotations=data.perm_quotations
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/update/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot edit your own account here")

    # Security check: must be Admin of this staff user
    if user.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this user")

    # Check email conflict only if email changed
    if data.email.lower() != user.email.lower():
        conflict = db.query(User).filter(User.email == data.email.lower()).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already in use")

    user.name = data.name
    user.email = data.email.lower()
    user.role = data.role
    user.perm_collections = data.perm_collections if data.role != "Admin" else "edit"
    user.perm_warehouse = data.perm_warehouse if data.role != "Admin" else "edit"
    user.perm_stockbook = data.perm_stockbook if data.role != "Admin" else "edit"
    user.perm_clients = data.perm_clients if data.role != "Admin" else "edit"
    user.perm_quotations = data.perm_quotations if data.role != "Admin" else "edit"

    # Only update password if a new one is provided
    if data.password and data.password.strip():
        user.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/delete/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete currently logged-in user")

    # Security check: must be Admin of this staff user
    if user.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")

    # Delete related data from all public tables
    db.execute(text("DELETE FROM warehouse_assignments WHERE user_id = :user_id"), {"user_id": user_id})
    db.execute(text("DELETE FROM warehouse_slots WHERE user_id = :user_id"), {"user_id": user_id})
    db.execute(text("DELETE FROM warehouse_rows WHERE user_id = :user_id"), {"user_id": user_id})
    db.execute(text("DELETE FROM stock_entries WHERE user_id = :user_id"), {"user_id": user_id})
    db.execute(text("DELETE FROM products WHERE user_id = :user_id"), {"user_id": user_id})
    db.execute(text("DELETE FROM collections WHERE user_id = :user_id"), {"user_id": user_id})
    db.execute(text("DELETE FROM quotations WHERE user_id = :user_id"), {"user_id": user_id})
    db.execute(text("DELETE FROM clients WHERE user_id = :user_id_str"), {"user_id_str": str(user_id)})

    db.delete(user)
    db.commit()

    return {"message": "User and all associated data deleted successfully"}
