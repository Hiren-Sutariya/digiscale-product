from sqlalchemy import Column, String, Integer, DateTime
from datetime import datetime
from app.database import Base

class Collection(Base):
    __tablename__ = "collections"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
