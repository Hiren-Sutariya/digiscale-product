from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    plan = Column(String, default="Free")  # Free, Pro, Enterprise
    credits_limit = Column(Integer, default=999999999)
    credits_used = Column(Integer, default=0)
    

    created_at = Column(DateTime, default=datetime.utcnow)
    deletion_scheduled_at = Column(DateTime, nullable=True)
    
    role = Column(String, default="Staff") # Admin, Staff
    admin_id = Column(Integer, nullable=True)
    perm_collections = Column(String, default="edit") # none, view, edit
    perm_warehouse = Column(String, default="edit")
    perm_stockbook = Column(String, default="edit")
    perm_clients = Column(String, default="edit")
    perm_quotations = Column(String, default="edit")

    settings = relationship("app.models.user_settings.UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

    @property
    def avatar_url(self):
        return self.settings.avatar_url if self.settings else None

