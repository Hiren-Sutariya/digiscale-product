from pydantic import BaseModel
from typing import Optional

class UserSettingsBase(BaseModel):
    phone: Optional[str] = None
    gender: Optional[str] = None
    avatar_url: Optional[str] = None
    auto_remove_background: Optional[bool] = False

    company_logo: Optional[str] = None
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    company_primary_phone: Optional[str] = None
    company_secondary_phone: Optional[str] = None
    company_address: Optional[str] = None
    company_website: Optional[str] = None
    company_gst: Optional[str] = None

    company_bank_name: Optional[str] = None
    company_account_number: Optional[str] = None
    company_ifsc: Optional[str] = None
    company_upi_id: Optional[str] = None
    company_qr_code: Optional[str] = None

    company_terms: Optional[str] = None

    regular_client_threshold: Optional[int] = 0
    vip_client_threshold: Optional[int] = 25

class UserSettingsUpdate(UserSettingsBase):
    pass

class UserSettingsResponse(UserSettingsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
