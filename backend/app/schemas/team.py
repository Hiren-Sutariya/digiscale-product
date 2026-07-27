from pydantic import BaseModel, EmailStr, constr, validator
from datetime import datetime
from typing import Literal

class TeamMemberBase(BaseModel):
    name: str
    email: EmailStr
    role: Literal["Admin", "Editor", "Viewer"]

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberResponse(TeamMemberBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
