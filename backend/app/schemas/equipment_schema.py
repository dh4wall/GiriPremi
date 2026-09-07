"""
Pydantic schemas for equipment module.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import date


class EquipmentCreate(BaseModel):
    equipment_name: str
    category_id: int
    brand: Optional[str] = None
    description: Optional[str] = None
    purchase_date: Optional[date] = None
    date_of_expiry: Optional[date] = None
    date_of_manufacturing: Optional[date] = None
    current_store_id: Optional[int] = None
    general_remark: Optional[str] = None
    initial_quantity: Optional[int] = 1
    initial_condition: Optional[str] = "NEW"


class EquipmentUpdate(BaseModel):
    equipment_name: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    purchase_date: Optional[date] = None
    date_of_expiry: Optional[date] = None
    date_of_manufacturing: Optional[date] = None
    current_store_id: Optional[int] = None
    general_remark: Optional[str] = None


class EquipmentResponse(BaseModel):
    id: str
    equipment_name: str
    category_id: int
    quantity: Optional[int] = 0

    class Config:
        from_attributes = True