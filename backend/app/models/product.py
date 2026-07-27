from sqlalchemy import Column, String, Integer, DateTime, Text
from datetime import datetime
from app.database import Base

class Product(Base):
    __tablename__ = "products"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    collection_id = Column(String, index=True)
    name = Column(String, nullable=False)
    stock = Column(Integer, default=0)
    cartonQty = Column(Integer, default=1)
    rate = Column(String)
    length = Column(String)
    color = Column(String)
    unit_type = Column(String, default='pcs')
    description = Column(Text)
    photoUrl = Column(Text)
    warehouse = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
