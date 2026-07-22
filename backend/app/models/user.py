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
    
    plan = Column(String, default="Starter")  # Starter, Pro, Enterprise
    credits_limit = Column(Integer, default=30)
    credits_used = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    deletion_scheduled_at = Column(DateTime, nullable=True)
    
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
