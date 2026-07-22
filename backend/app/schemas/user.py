from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str
    plan: str
    credits_limit: int
    credits_used: int

class UserResponse(UserBase):
    id: int
    created_at: datetime
    deletion_scheduled_at: datetime | None = None

    class Config:
        from_attributes = True
        
class UserProfileUpdate(BaseModel):
    name: str
    email: str
