from pydantic import BaseModel
from typing import Optional

class StoreCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    contact_number: Optional[str] = None

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_number: Optional[str] = None
    is_active: Optional[bool] = None

class StoreResponse(BaseModel):
    id: int
    name: str
    contact_person: Optional[str]
    contact_number: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True
