from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class APIKeyCreate(BaseModel):
    name: str

class APIKeyResponse(BaseModel):
    id: int
    name: str
    api_key: str  # Only returned once on creation or truncated otherwise
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class APIKeyListResponse(BaseModel):
    id: int
    name: str
    api_key_hint: str # E.g., 'sk_...1234'
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True
