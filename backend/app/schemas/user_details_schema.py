from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from decimal import Decimal

class UserDetailsBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: str
    contact_number: Optional[str] = None
    user_type: str
    address: Optional[str] = None
    type: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    is_active: bool = True

class UserDetailsCreate(UserDetailsBase):
    password: Optional[str] = None

class UserDetailsUpdate(UserDetailsBase):
    full_name: Optional[str] = None
    user_type: Optional[str] = None

class UserDetails(UserDetailsBase):
    id: int
    total_issues: int
    total_penalties: int
    total_penalty_amount: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
