from pydantic import BaseModel
from datetime import datetime

class TeamMemberBase(BaseModel):
    name: str
    email: str
    role: str

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberResponse(TeamMemberBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
