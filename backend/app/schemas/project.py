from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ProjectImageResponse(BaseModel):
    id: int
    project_id: int
    original_path: str
    processed_path: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    images: List[ProjectImageResponse] = []

    class Config:
        from_attributes = True
