from sqlalchemy import Column, String, Integer, DateTime, Text
from datetime import datetime
from app.database import Base

class StockEntry(Base):
    __tablename__ = "stock_entries"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    product_id = Column(String(100), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity_changed = Column(Integer, nullable=False)
    transaction_type = Column(String(50), nullable=False)
    reference_id = Column(String(255), nullable=True)
    reference_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
