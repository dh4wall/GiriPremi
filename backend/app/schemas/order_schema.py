from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class OrderItemBase(BaseModel):
    equipment_id: str
    store_id: int
    quantity_issued: int
    return_condition: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderReturnItem(BaseModel):
    order_item_id: int
    quantity_returned: int
    quantity_lost: int = 0
    return_condition: Optional[str] = None   # NEW / MODERATE / NEEDS_REPAIR / DISCARD

class OrderReturn(BaseModel):
    order_id: int
    items: List[OrderReturnItem]
    actual_return_date: Optional[date] = None
    status: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    equipment_id: str
    store_id: int
    quantity_issued: int
    quantity_returned: int
    quantity_pending: int
    quantity_lost: int

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: Optional[int]
    approved_by_user_id: Optional[int]
    issued_to_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    issued_to_id_proof: Optional[str] = None
    issue_date: date
    expected_return_date: Optional[date]
    actual_return_date: Optional[date]
    purpose: Optional[str]
    purpose_details: Optional[str]
    status: str
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    user_id: Optional[int] = None
    approved_by_user_id: Optional[int] = None
    issued_to_name: str
    issued_to_id_proof: Optional[str] = None
    approved_by_name: str
    issue_date: date
    expected_return_date: Optional[date] = None
    purpose: Optional[str] = None
    purpose_details: Optional[str] = None
    items: List[OrderItemBase]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    actual_return_date: Optional[date] = None
    remarks: Optional[str] = None
    approved_by_user_id: Optional[int] = None
