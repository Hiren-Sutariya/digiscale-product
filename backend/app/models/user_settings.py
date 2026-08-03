from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)

    # Profile Settings
    phone = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    avatar_url = Column(Text, nullable=True)
    auto_remove_background = Column(Boolean, default=False, nullable=False)

    # Company Settings
    company_logo = Column(Text, nullable=True)
    company_name = Column(String, nullable=True)
    company_email = Column(String, nullable=True)
    company_primary_phone = Column(String, nullable=True)
    company_secondary_phone = Column(String, nullable=True)
    company_address = Column(Text, nullable=True)
    company_website = Column(String, nullable=True)
    company_gst = Column(String, nullable=True)
    
    # Bank Details
    company_bank_name = Column(String, nullable=True)
    company_account_number = Column(String, nullable=True)
    company_ifsc = Column(String, nullable=True)
    company_upi_id = Column(String, nullable=True)
    company_qr_code = Column(Text, nullable=True)
    
    # Terms
    company_terms = Column(Text, nullable=True)

    # Client Thresholds
    regular_client_threshold = Column(Integer, default=0, nullable=True)
    vip_client_threshold = Column(Integer, default=25, nullable=True)

    user = relationship("app.models.user.User", back_populates="settings")
