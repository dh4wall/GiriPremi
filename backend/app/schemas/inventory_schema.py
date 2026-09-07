from pydantic import BaseModel
from typing import Optional

class InventoryCreate(BaseModel):
    equipment_id: str
    store_id: int
    quantity: int
    curr_condition: str

class InventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    curr_condition: Optional[str] = None

class InventoryResponse(BaseModel):
    id: str
    equipment_id: str
    store_id: int
    quantity: int
    curr_condition: str

    class Config:
        from_attributes = True
