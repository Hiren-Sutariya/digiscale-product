from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.team_member import TeamMember
from app.schemas.team import TeamMemberCreate, TeamMemberResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TeamMemberResponse])
def get_team_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all team members for the current user's workspace.
    """
    members = db.query(TeamMember).filter(TeamMember.owner_id == current_user.id).all()
    return members

@router.post("/", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def invite_team_member(
    member_in: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Invite a new team member to the workspace.
    """
    # Check if a member with this email already exists for this owner
    existing_member = db.query(TeamMember).filter(
        TeamMember.owner_id == current_user.id,
        TeamMember.email == member_in.email
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="A member with this email is already in your team.")

    new_member = TeamMember(
        owner_id=current_user.id,
        name=member_in.name,
        email=member_in.email,
        role=member_in.role,
        status="Pending" # Hardcoded pending status
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a team member from the workspace.
    """
    member = db.query(TeamMember).filter(
        TeamMember.id == member_id,
        TeamMember.owner_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Team member not found.")

    db.delete(member)
    db.commit()
    return None
