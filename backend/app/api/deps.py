from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import decode_access_token
from app.models.user import User

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
        
    # Check if account is deleted past grace period
    if user.deletion_scheduled_at:
        from datetime import datetime
        time_elapsed = datetime.utcnow() - user.deletion_scheduled_at
        if time_elapsed.days >= 7:
            db.delete(user)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account has been permanently deleted.",
            )
            
    return user

def RoleChecker(allowed_roles: list[str]):
    def role_checker(
        project_id: int = None,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not project_id:
            # Global/Dashboard routes don't have project_id, allow if any role
            return current_user
            
        from app.models.project import Project
        from app.models.team_member import TeamMember
        
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        if project.user_id == current_user.id:
            return current_user # Owner has all permissions
            
        # Check team member role
        team_member = db.query(TeamMember).filter(
            TeamMember.owner_id == project.user_id,
            TeamMember.email == current_user.email,
            TeamMember.status == "Active"
        ).first()
        
        if not team_member:
            raise HTTPException(status_code=403, detail="Not a member of this project's team")
            
        if team_member.role not in allowed_roles and "Admin" not in allowed_roles:
            # Admin role overrides Editor/Viewer
            if team_member.role != "Admin":
                raise HTTPException(status_code=403, detail=f"Requires one of these roles: {', '.join(allowed_roles)}")
                
        return current_user
    return role_checker

from fastapi.security import APIKeyHeader
from app.models.api_key import APIKey
from datetime import datetime

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_user(
    api_key: str = Depends(api_key_header),
    db: Session = Depends(get_db)
) -> User:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )
        
    db_api_key = db.query(APIKey).filter(APIKey.api_key == api_key, APIKey.is_active == True).first()
    if not db_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key",
        )
        
    db_api_key.last_used_at = datetime.utcnow()
    db.commit()
    
    user = db_api_key.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this API key no longer exists",
        )
        
    return user
