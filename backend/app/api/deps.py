from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import decode_access_token
from app.models.user import User

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def _resolve_user_from_token(token: str, db: Session) -> Optional[User]:
    """Shared helper: decode JWT and return User or None."""
    payload = decode_access_token(token)
    if not payload:
        return None
    email = payload.get("sub")
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()


def _check_deletion(user: User, db: Session) -> None:
    """Raise 401 if the user's 7-day deletion grace period has passed."""
    if user.deletion_scheduled_at:
        elapsed = datetime.utcnow() - user.deletion_scheduled_at
        if elapsed.days >= 7:
            db.delete(user)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account has been permanently deleted.",
            )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Require a valid authenticated user. Raises 401 otherwise."""
    user = _resolve_user_from_token(credentials.credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _check_deletion(user, db)
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return the authenticated user if a valid token is present, else None."""
    if not credentials:
        return None
    return _resolve_user_from_token(credentials.credentials, db)

