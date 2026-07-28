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
    
    company_website = Column(String, nullable=True)
    company_gst = Column(String, nullable=True)
    company_bank_name = Column(String, nullable=True)
    company_account_number = Column(String, nullable=True)
    company_ifsc = Column(String, nullable=True)
    company_terms = Column(String, nullable=True)
    company_upi_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    deletion_scheduled_at = Column(DateTime, nullable=True)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
