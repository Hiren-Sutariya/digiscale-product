import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreate, APIKeyResponse, APIKeyListResponse

router = APIRouter()

def generate_api_key(prefix="sk_live_"):
    return f"{prefix}{secrets.token_urlsafe(32)}"

@router.post("/", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    key_in: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new API key for the current user.
    The full key is returned ONLY once in this response.
    """
    # Limit number of keys per user (optional, e.g., max 5)
    key_count = db.query(APIKey).filter(APIKey.user_id == current_user.id).count()
    if key_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum of 5 API keys allowed per user.")

    raw_key = generate_api_key()
    new_key = APIKey(
        user_id=current_user.id,
        name=key_in.name,
        api_key=raw_key,
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    return new_key

@router.get("/", response_model=List[APIKeyListResponse])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all API keys for the current user. 
    The raw API key is NOT returned, only a hint.
    """
    keys = db.query(APIKey).filter(APIKey.user_id == current_user.id).all()
    
    response = []
    for k in keys:
        # Create a hint: 'sk_live_...last4'
        prefix = "sk_live_"
        last4 = k.api_key[-4:] if len(k.api_key) > 12 else "****"
        hint = f"{prefix}...{last4}"
        
        response.append(
            APIKeyListResponse(
                id=k.id,
                name=k.name,
                api_key_hint=hint,
                is_active=k.is_active,
                created_at=k.created_at,
                last_used_at=k.last_used_at
            )
        )
    return response

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revoke (delete) an API key.
    """
    key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == current_user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
        
    db.delete(key)
    db.commit()
    return None
