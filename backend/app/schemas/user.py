from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str
    plan: str
    credits_limit: int
    credits_used: int
    role: str
    perm_collections: str
    perm_warehouse: str
    perm_stockbook: str
    perm_clients: str
    perm_quotations: str
    admin_id: int | None = None
    avatar_url: str | None = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    deletion_scheduled_at: datetime | None = None

    class Config:
        from_attributes = True
        
class UserProfileUpdate(BaseModel):
    name: str
    email: str

class UserCreateRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Staff"
    perm_collections: str = "edit"
    perm_warehouse: str = "edit"
    perm_stockbook: str = "edit"
    perm_clients: str = "edit"
    perm_quotations: str = "edit"
