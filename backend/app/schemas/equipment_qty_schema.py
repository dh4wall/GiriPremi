from pydantic import BaseModel
from typing import Optional

class EquipmentQtyBase(BaseModel):
    equipment_id: str
    quantity: int
    curr_condition: str

class EquipmentQtyCreate(EquipmentQtyBase):
    id: Optional[str] = None

class EquipmentQtyUpdate(BaseModel):
    quantity: Optional[int] = None
    curr_condition: Optional[str] = None

class EquipmentQty(EquipmentQtyBase):
    id: str

    class Config:
        from_attributes = True
