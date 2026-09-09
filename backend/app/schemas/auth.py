from pydantic import BaseModel
from typing import Optional

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    user_name: str
    user_email: str
    role: Optional[str] = "Admin"
    admin_id: Optional[int] = None
    plan: Optional[str] = "Starter"
    perm_collections: Optional[str] = "edit"
    perm_warehouse: Optional[str] = "edit"
    perm_stockbook: Optional[str] = "edit"
    perm_clients: Optional[str] = "edit"
    perm_quotations: Optional[str] = "edit"

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
